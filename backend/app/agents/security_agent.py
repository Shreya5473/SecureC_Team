import logging
from typing import List
from app.models.schemas import AgentFinding, VulnerabilitySeverity
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

# Valid severity values for safe parsing
VALID_SEVERITIES = {"critical", "high", "medium", "low", "info"}


def _safe_parse_severity(severity_str: str) -> VulnerabilitySeverity:
    """Safely parse severity string, defaulting to 'medium' if invalid."""
    normalized = (severity_str or "medium").lower().strip()
    if normalized not in VALID_SEVERITIES:
        logger.warning(f"Invalid severity '{severity_str}', defaulting to 'medium'")
        normalized = "medium"
    return VulnerabilitySeverity(normalized)


class SecurityAgent:
    """
    The Logic Auditor (The Pentester): The 'Specialist'.
    Looks for vulnerabilities in code (SQLi, XSS, Logic bugs).
    """
    async def analyze(self, content: str) -> List[AgentFinding]:
        if not content or not content.strip():
            logger.warning("SecurityAgent received empty content")
            return []
            
        system_prompt = """
        You are an expert Security Audit Agent (The Logic Auditor).
        Your goal is to analyze code snippets and identify security vulnerabilities.
        Focus on:
        - Injection attacks (SQLi, NoSQLi, Command Injection)
        - Broken Access Control
        - Business Logic Flaws (e.g. race conditions, price manipulation)
        - Hardcoded secrets
        - Insecure configuration

        For each finding, provide:
        - finding_type: Short descriptive title
        - description: Technical explanation of the vulnerability
        - severity: "critical", "high", "medium", "low", or "info"
        - location: Specific function or line of code
        - suggestion: Concrete code fix or logical remediation
        """
        
        response_schema = """
        {
            "findings": [
                {
                    "finding_type": "string",
                    "description": "string",
                    "severity": "string",
                    "location": "string",
                    "suggestion": "string"
                }
            ]
        }
        """
        
        try:
            results = await ai_service.analyze_content(system_prompt, content, response_schema)
            
            findings = []
            if results and isinstance(results, list) and len(results) > 0:
                items = results
                if isinstance(results[0], dict) and "findings" in results[0]:
                    items = results[0]["findings"]
                
                # Validate items is a list
                if not isinstance(items, list):
                    logger.error(f"Expected list of findings, got {type(items)}")
                    return []
                    
                for item in items:
                    if not isinstance(item, dict):
                        logger.warning(f"Skipping non-dict finding: {type(item)}")
                        continue
                        
                    findings.append(AgentFinding(
                        agent_name="Logic Auditor",
                        finding_type=str(item.get("finding_type", "Security Vulnerability")),
                        description=str(item.get("description", "")),
                        severity=_safe_parse_severity(item.get("severity")),
                        location=str(item.get("location", "Codebase")),
                        suggestion=str(item.get("suggestion", ""))
                    ))
            
            return findings
        except Exception as e:
            logger.error(f"Security analysis failed: {e}")
            return []
