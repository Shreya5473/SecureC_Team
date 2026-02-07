import logging
import json
from typing import List, Dict, Any
from app.models.schemas import AgentFinding
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)


def _safe_parse_score(score: Any) -> int:
    """Safely parse score to integer, clamping to 0-100 range."""
    try:
        if isinstance(score, (int, float)):
            return max(0, min(100, int(score)))
        if isinstance(score, str):
            return max(0, min(100, int(float(score))))
    except (ValueError, TypeError):
        pass
    return 50  # Default middle ground


def _safe_parse_status(status: Any) -> str:
    """Safely parse status, defaulting to NO-GO if invalid."""
    if isinstance(status, str):
        normalized = status.upper().strip()
        if normalized in ("GO", "NO-GO"):
            return normalized
    return "NO-GO"


class RiskAgent:
    """
    The Strategist (Risk Manager): Calculates overall risk.
    Aggregates all findings into a single 'Security Score' and risk narrative.
    """
    async def analyze(self, findings: List[AgentFinding]) -> Dict[str, Any]:
        if not findings:
            return {
                "overall_score": 100,
                "summary": "No findings detected. System appears secure.",
                "status": "GO"
            }
        
        # Convert findings to string for context
        try:
            findings_context = json.dumps(
                [f.model_dump() if hasattr(f, "model_dump") else f.dict() for f in findings],
                default=str
            )
        except Exception as e:
            logger.error(f"Failed to serialize findings: {e}")
            return {
                "overall_score": 0,
                "summary": "Risk analysis failed - unable to process findings.",
                "status": "NO-GO"
            }
        
        system_prompt = """
        You are an expert Risk Management Agent (the Strategist).
        Analyze the list of security findings to determine the overall security posture.
        
        1. Calculate a Security Score (0-100), where 100 is perfectly secure and 0 is compromised.
           - Critical severities reduce score significantly (-25 each).
           - High severities reduce score moderately (-15 each).
           - Medium severities reduce score slightly (-5 each).
        
        2. Provide a 2-3 sentence executive summary of the risk state.
        
        3. Determine a GO/NO-GO status for deployment.
        """
        
        response_schema = """
        {
            "overall_score": integer,
            "summary": "string",
            "status": "string (GO / NO-GO)"
        }
        """
        
        try:
            results = await ai_service.analyze_content(system_prompt, findings_context, response_schema)
            
            if results and isinstance(results, list) and len(results) > 0:
                result = results[0]
                if isinstance(result, dict):
                    return {
                        "overall_score": _safe_parse_score(result.get("overall_score")),
                        "summary": str(result.get("summary", "Risk assessment complete.")),
                        "status": _safe_parse_status(result.get("status"))
                    }
            
            # Fallback if parsing fails
            return {
                "overall_score": 50,
                "summary": "Automated risk assessment completed but failed to parse details.",
                "status": "NO-GO"
            }
            
        except Exception as e:
            logger.error(f"Risk analysis failed: {e}")
            return {
                "overall_score": 0,
                "summary": "Risk analysis failed due to error.",
                "status": "NO-GO"
            }
