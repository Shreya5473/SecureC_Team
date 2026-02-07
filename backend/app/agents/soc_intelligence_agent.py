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


class SOCIntelligenceAgent:
    """
    The Detective (SOC Analyst): Analyzes logs and traffic.
    Correlates disparate events to find complex attack patterns.
    """
    async def analyze(self, content: str) -> List[AgentFinding]:
        if not content or not content.strip():
            logger.warning("SOCIntelligenceAgent received empty content")
            return []
            
        system_prompt = """
        You are an expert SOC Analyst Agent (The Detective).
        Your goal is to analyze logs, alert streams, and network traffic data to identify security incidents.
        Focus on:
        - Anomalous patterns (spikes in traffic, timing anomalies).
        - Attack signatures (Brute force, DDoS, Port scanning).
        - Correlation between seemingly unrelated events.
        - Indicators of Compromise (IoCs).

        For each finding, provide:
        - finding_type: Short descriptive title (e.g. "Brute Force Attack Detected")
        - description: Explanation of the evidence found in logs
        - severity: "critical", "high", "medium", "low", or "info"
        - location: The log source or service affected
        - suggestion: Immediate response action (e.g. block IP, rotate credentials)
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
                        agent_name="SOC Intelligence",
                        finding_type=str(item.get("finding_type", "Security Incident")),
                        description=str(item.get("description", "")),
                        severity=_safe_parse_severity(item.get("severity")),
                        location=str(item.get("location", "Logs")),
                        suggestion=str(item.get("suggestion", ""))
                    ))
            
            return findings
        except Exception as e:
            logger.error(f"SOC analysis failed: {e}")
            return []
