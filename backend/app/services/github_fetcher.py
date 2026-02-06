"""
GitHub Artifact Fetcher
Fetches content from GitHub (repos, files, commits) via API. Read-only, no secrets.
"""
import re
import uuid
import logging
from typing import Dict, Any, List, Optional
import os
import httpx

logger = logging.getLogger(__name__)

# Limits
MAX_FILES = 50
MAX_FILE_SIZE = 500_000  # bytes per file
LANGUAGE_WHITELIST = {"python", "javascript", "typescript", "go", "rust", "java", "kotlin", "ruby", "php", "c", "cpp", "csharp", "json", "yaml", "yml", "md", "txt", "sh", "sql"}
SUPPORTED_EXTENSIONS = {".py", ".js", ".ts", ".jsx", ".tsx", ".go", ".rs", ".java", ".kt", ".rb", ".php", ".c", ".cpp", ".h", ".cs", ".json", ".yaml", ".yml", ".md", ".txt", ".sh", ".sql", ".html", ".css"}
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")


def _parse_github_url(url: str) -> Optional[Dict[str, str]]:
    """Parse GitHub URL into repo, path, type."""
    url = url.strip().rstrip("/")
    # https://github.com/org/repo
    # https://github.com/org/repo/blob/main/path/to/file.py
    # https://github.com/org/repo/commit/sha
    # https://github.com/org/repo/pull/123
    patterns = [
        (r"(?:https?://)?(?:www\.)?github\.com/([^/]+)/([^/]+)/blob/([^/]+)/(.+)$", "file"),
        (r"(?:https?://)?(?:www\.)?github\.com/([^/]+)/([^/]+)/tree/([^/]+)/(.*)$", "tree"),
        (r"(?:https?://)?(?:www\.)?github\.com/([^/]+)/([^/]+)/commit/([a-f0-9]+)", "commit"),
        (r"(?:https?://)?(?:www\.)?github\.com/([^/]+)/([^/]+)/pull/(\d+)", "pull"),
        (r"(?:https?://)?(?:www\.)?github\.com/([^/]+)/([^/]+)/?$", "repo"),
    ]
    for pat, kind in patterns:
        m = re.match(pat, url, re.I)
        if m:
            g = m.groups()
            if kind == "file":
                return {"org": g[0], "repo": g[1], "branch": g[2], "path": g[3], "type": kind}
            if kind == "tree":
                return {"org": g[0], "repo": g[1], "branch": g[2], "path": g[3] or "", "type": kind}
            if kind == "commit":
                return {"org": g[0], "repo": g[1], "sha": g[2], "type": kind}
            if kind == "pull":
                return {"org": g[0], "repo": g[1], "pr_id": g[2], "type": kind}
            if kind == "repo":
                return {"org": g[0], "repo": g[1], "type": kind}
    return None


def _get_file_extension(path: str) -> str:
    if "." in path:
        return "." + path.rsplit(".", 1)[-1].lower()
    return ""


def _fetch_file_content(org: str, repo: str, branch: str, path: str) -> Optional[str]:
    """Fetch raw file content from GitHub."""
    url = f"https://raw.githubusercontent.com/{org}/{repo}/{branch}/{path}"
    headers = {"User-Agent": "ProjectSentinel-AI/1.0"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    try:
        with httpx.Client(headers=headers, timeout=30, follow_redirects=True) as client:
            r = client.get(url)
            if r.status_code != 200:
                return None
            content = r.text
            if len(content.encode("utf-8")) > MAX_FILE_SIZE:
                return content[:MAX_FILE_SIZE] + "\n\n[TRUNCATED - file too large]"
            return content
    except Exception as e:
        logger.error(f"Fetch file failed: {e}")
        return None


def _fetch_repo_tree(org: str, repo: str, branch: str = "main") -> List[Dict[str, str]]:
    """Fetch repo file list via GitHub API (no auth for public repos)."""
    url = f"https://api.github.com/repos/{org}/{repo}/git/trees/{branch}?recursive=1"
    headers = {"User-Agent": "ProjectSentinel-AI/1.0", "Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    try:
        with httpx.Client(headers=headers, timeout=30) as client:
            r = client.get(url)
            if r.status_code != 200:
                # try master
                url = f"https://api.github.com/repos/{org}/{repo}/git/trees/master?recursive=1"
                r = client.get(url)
            if r.status_code != 200:
                return []
            data = r.json()
            tree = data.get("tree", [])
            files = [
                t for t in tree
                if t.get("type") == "blob"
                and _get_file_extension(t.get("path", "")) in SUPPORTED_EXTENSIONS
            ]
            return files[:MAX_FILES]
    except Exception as e:
        logger.error(f"Fetch tree failed: {e}")
        return []


def fetch_github_artifact(url: str) -> Dict[str, Any]:
    """Fetch and normalize GitHub content into standard artifact format."""
    parsed = _parse_github_url(url)
    if not parsed:
        raise ValueError(f"Invalid GitHub URL: {url}")

    org, repo = parsed["org"], parsed["repo"]
    if repo.endswith(".git"):
        repo = repo[:-4]
    repo_slug = f"{org}/{repo}"
    files: List[Dict[str, Any]] = []
    branch = "main"

    if parsed["type"] == "file":
        branch = parsed.get("branch", "main")
        path = parsed["path"]
        content = _fetch_file_content(org, repo, branch, path)
        if content:
            ext = _get_file_extension(path)
            lang = ext[1:] if ext else "plain"
            files.append({"path": path, "language": lang, "content": content})
    elif parsed["type"] in ("repo", "tree", "commit", "pull"):
        branch = parsed.get("branch") or parsed.get("sha") or "main"
        tree_files = _fetch_repo_tree(org, repo, branch)
        for t in tree_files:
            path = t.get("path", "")
            content = _fetch_file_content(org, repo, branch, path)
            if content:
                ext = _get_file_extension(path)
                lang = ext[1:] if ext else "plain"
                files.append({"path": path, "language": lang, "content": content})

    if not files:
        raise ValueError(f"No content fetched from {url}")

    return {
        "artifact_id": str(uuid.uuid4()),
        "artifact_type": "CODE_REPOSITORY",
        "origin": "github",
        "source": "github",
        "content": {"files": files},
        "metadata": {
            "repo": repo_slug,
            "commit": parsed.get("sha") or branch,
            "file_count": len(files),
        },
    }


def github_to_agent_content(normalized: Dict[str, Any]) -> str:
    """Convert normalized GitHub artifact to string for agents."""
    files = normalized.get("content", {}).get("files", [])
    meta = normalized.get("metadata", {})
    parts = [f"[GitHub Repository: {meta.get('repo', '')}]"]
    for f in files:
        parts.append(f"\n--- FILE: {f.get('path', '')} ({f.get('language', '')}) ---\n")
        parts.append(f.get("content", "")[:8000])
    return "\n".join(parts) + "\n\n[Derived from GitHub Artifact]"
