import logging
import json
from typing import List
from app.models.schemas import AgentFinding, VulnerabilitySeverity
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

# Valid severity values for safe parsing
VALID_SEVERITIES = {"critical", "high", "medium", "low", "info"}


def _safe_parse_severity(severity_str: str) -> VulnerabilitySeverity:
    """Safely parse severity string, defaulting to 'info' if invalid."""
    normalized = (severity_str or "info").lower().strip()
    if normalized not in VALID_SEVERITIES:
        logger.warning(f"Invalid severity '{severity_str}', defaulting to 'info'")
        normalized = "info"
    return VulnerabilitySeverity(normalized)


class RemediationAgent:
    """
    The Engineer (Remediation): Suggests fixes.
    Takes findings from other agents and generates concrete code patches or config changes.
    """
    async def analyze(self, findings: List[AgentFinding]) -> List[AgentFinding]:
        if not findings:
            return []
        
        # Convert findings to string for context
        try:
            findings_context = json.dumps(
                [f.model_dump() if hasattr(f, "model_dump") else f.dict() for f in findings],
                default=str
            )
        except Exception as e:
            logger.error(f"Failed to serialize findings: {e}")
            return []
        
        system_prompt = """
        You are an expert Security Engineer Agent (The Fixer).
        Your goal is to review security findings and generate concrete, actionable remediation plans.
        Focus on:
        - Root cause analysis.
        - Code-level fixes (provide sanitized code examples).
        - Configuration hardening.
        - Prioritization of fixes based on impact/effort.

        For each finding provided, generate a detailed remediation entry.
        """
        
        response_schema = """
        {
            "findings": [
                {
                    "finding_type": "string (Remediation Plan: [Original Finding Name])",
                    "description": "string (Actionable steps to fix)",
                    "severity": "string (Same as original)",
                    "location": "string (Same as original)",
                    "suggestion": "string (Code snippet or configuration block)"
                }
            ]
        }
        """
        
        try:
            results = await ai_service.analyze_content(system_prompt, findings_context, response_schema)
            
            remediation_findings = []
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
                        
                    remediation_findings.append(AgentFinding(
                        agent_name="Remediation Engineer",
                        finding_type=str(item.get("finding_type", "Remediation Plan")),
                        description=str(item.get("description", "")),
                        severity=_safe_parse_severity(item.get("severity")),
                        location=str(item.get("location", "System")),
                        suggestion=str(item.get("suggestion", ""))
                    ))
            
            return remediation_findings
        except Exception as e:
            logger.error(f"Remediation analysis failed: {e}")
            return []
