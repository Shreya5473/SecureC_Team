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


class ThreatAgent:
    """
    The Architect (Threat Modeler): Analyzes system designs.
    Identifies 'Trust Boundaries'—wherever user data meets a sensitive trading engine.
    """
    async def analyze(self, content: str) -> List[AgentFinding]:
        if not content or not content.strip():
            logger.warning("ThreatAgent received empty content")
            return []
            
        system_prompt = """
        You are an expert Threat Modeling Agent (The Architect).
        Your goal is to analyze system architecture descriptions and identify security design flaws.
        Focus on:
        - Trust Boundaries: Where data moves between trusted and untrusted zones.
        - Data Flow: Unvalidated data entering sensitive components.
        - Authentication/Authorization gaps.
        - Lack of encryption or security controls.

        For each finding, provide:
        - finding_type: Short descriptive title (e.g. "Trust Boundary Violation")
        - description: Explanation of the risk
        - severity: "critical", "high", "medium", "low", or "info"
        - location: The component or flow involved
        - suggestion: Architectural recommendation to fix it
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
                # Handle root object being the list or wrapped in "findings" key
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
                        agent_name="Threat Modeler",
                        finding_type=str(item.get("finding_type", "Unknown Threat")),
                        description=str(item.get("description", "")),
                        severity=_safe_parse_severity(item.get("severity")),
                        location=str(item.get("location", "Architecture")),
                        suggestion=str(item.get("suggestion", ""))
                    ))
            
            return findings
        except Exception as e:
            logger.error(f"Threat analysis failed: {e}")
            return []
