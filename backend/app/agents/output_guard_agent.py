from app.services.ai_service import ai_service
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

# Valid actions for output guard
VALID_ACTIONS = {"Redacted", "Modified", "Allowed"}
VALID_SEVERITIES = {"critical", "high", "medium", "low"}


def _safe_parse_confidence(confidence: Any) -> float:
    """Safely parse confidence to float, clamping to 0-1 range."""
    try:
        if isinstance(confidence, (int, float)):
            return max(0.0, min(1.0, float(confidence)))
        if isinstance(confidence, str):
            return max(0.0, min(1.0, float(confidence)))
    except (ValueError, TypeError):
        pass
    return 0.5  # Default middle ground


def _safe_parse_action(action: Any) -> str:
    """Safely parse action, defaulting to 'Allowed' if invalid."""
    if isinstance(action, str):
        # Normalize case for matching
        for valid in VALID_ACTIONS:
            if action.lower() == valid.lower():
                return valid
    return "Allowed"


def _safe_parse_severity(severity: Any) -> str:
    """Safely parse severity, defaulting to 'low' if invalid."""
    if isinstance(severity, str):
        normalized = severity.lower().strip()
        if normalized in VALID_SEVERITIES:
            return normalized
    return "low"


def _safe_parse_redacted_items(items: Any) -> List[str]:
    """Safely parse redacted items list."""
    if isinstance(items, list):
        return [str(item) for item in items if item]
    return []


class OutputGuardAgent:
    """
    Output Guard Agent - Sanitizes AI-generated outputs before delivery to users.
    
    Protects against:
    - PII (Personally Identifiable Information) leakage
    - API keys and credentials exposure
    - Sensitive infrastructure details
    - Harmful or inappropriate content
    - Confidential business information
    """
    
    def __init__(self):
        self.agent_name = "Output Guard"
        
    async def analyze(self, ai_output: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Analyze AI-generated output for sensitive data and sanitize if needed.
        
        Args:
            ai_output: The AI-generated response to analyze
            context: Optional context about the analysis (agent name, query, etc.)
        
        Returns:
            Dict containing:
            - timestamp: ISO timestamp
            - originalOutput: The AI's original output (truncated)
            - detectionType: Type of sensitive data detected
            - confidence: 0-1 confidence score
            - action: "Redacted" | "Modified" | "Allowed"
            - severity: "critical" | "high" | "medium" | "low"
            - reason: Explanation of the decision
            - modificationSummary: What was redacted/modified
            - sanitizedOutput: The cleaned output
            - redactedItems: List of what was redacted
        """
        # Handle empty/None output
        if not ai_output:
            return {
                "timestamp": context.get('timestamp') if context else None,
                "originalOutput": "",
                "detectionType": "Empty Output",
                "confidence": 1.0,
                "action": "Allowed",
                "severity": "low",
                "reason": "Empty output received - nothing to analyze",
                "modificationSummary": "",
                "sanitizedOutput": "",
                "redactedItems": []
            }
        
        context = context or {}
        
        system_prompt = """You are an AI Web Application Firewall (WAF) Output Guard Agent.

Your role is to scan AI-generated outputs for sensitive information before delivery to users.

DETECTION CATEGORIES:
1. **PII (Personally Identifiable Information)**:
   - Names, email addresses, phone numbers
   - Social Security Numbers, passport numbers
   - Home addresses, IP addresses
   - Credit card numbers, bank account details
   
2. **Credentials & API Keys**:
   - API keys (OpenAI, AWS, Google, etc.)
   - Passwords, tokens, secrets
   - Database connection strings
   - OAuth tokens, JWT tokens
   
3. **Infrastructure Details**:
   - Internal server names, IP addresses
   - Database schemas, table names
   - File paths, directory structures
   - Network topology information
   
4. **Harmful Content**:
   - Malicious code or exploits
   - Instructions for illegal activities
   - Hate speech or discriminatory content
   - Self-harm or violence promotion
   
5. **Confidential Business Information**:
   - Proprietary algorithms or trade secrets
   - Unreleased product details
   - Financial projections or sensitive metrics
   - Internal policies or procedures

REDACTION STRATEGY:
- Replace API keys with: [REDACTED_API_KEY]
- Replace emails with: [REDACTED_EMAIL]
- Replace names with: [REDACTED_NAME]
- Replace IPs with: [REDACTED_IP]
- Replace sensitive paths with: [REDACTED_PATH]
- For harmful content: Remove entirely or replace with safety message

ANALYSIS PROCESS:
1. Scan the output for sensitive patterns
2. Assess severity and confidence
3. Decide: REDACT (remove), MODIFY (replace), or ALLOW (safe)
4. Provide clear reasoning and list what was redacted

OUTPUT REQUIREMENTS:
- Be thorough in detecting sensitive data
- Preserve the utility of the output while ensuring safety
- Clearly document all redactions"""

        response_schema = """{
  "detectionType": "string (e.g., 'PII Detected', 'API Key Exposure', 'Safe Output', 'Harmful Content')",
  "confidence": "number between 0 and 1",
  "action": "string: 'Redacted' | 'Modified' | 'Allowed'",
  "severity": "string: 'critical' | 'high' | 'medium' | 'low'",
  "reason": "string explaining why this decision was made",
  "modificationSummary": "string describing what was redacted/modified",
  "sanitizedOutput": "string with cleaned output",
  "redactedItems": ["array of strings describing what was redacted, e.g., '1 API key', '2 email addresses'"]
}"""

        try:
            # Prepare analysis content
            analysis_content = f"""AI OUTPUT TO ANALYZE:
---
{ai_output}
---

CONTEXT:
- Generated by: {context.get('agent_name', 'Unknown Agent')}
- Query type: {context.get('query_type', 'general')}

Analyze this AI-generated output for sensitive information and provide your assessment."""

            results = await ai_service.analyze_content(
                system_prompt=system_prompt,
                user_content=analysis_content,
                response_schema=response_schema
            )
            
            if not results or not isinstance(results, list) or len(results) == 0:
                logger.warning("Output Guard Agent returned no results")
                # Default to allowing
                return {
                    "timestamp": context.get('timestamp'),
                    "originalOutput": ai_output[:500],
                    "detectionType": "Analysis Failed",
                    "confidence": 0.5,
                    "action": "Allowed",
                    "severity": "low",
                    "reason": "Unable to analyze output - defaulting to allow",
                    "modificationSummary": "",
                    "sanitizedOutput": ai_output,
                    "redactedItems": []
                }
            
            result = results[0]
            
            if not isinstance(result, dict):
                logger.error(f"Expected dict result, got {type(result)}")
                return {
                    "timestamp": context.get('timestamp'),
                    "originalOutput": ai_output[:500],
                    "detectionType": "Parse Error",
                    "confidence": 0.5,
                    "action": "Allowed",
                    "severity": "low",
                    "reason": "Failed to parse AI response - defaulting to allow",
                    "modificationSummary": "",
                    "sanitizedOutput": ai_output,
                    "redactedItems": []
                }
            
            # Ensure all required fields exist with safe parsing
            waf_event = {
                "timestamp": context.get('timestamp'),
                "originalOutput": ai_output[:500],  # Truncate for display
                "detectionType": str(result.get("detectionType", "Unknown")),
                "confidence": _safe_parse_confidence(result.get("confidence")),
                "action": _safe_parse_action(result.get("action")),
                "severity": _safe_parse_severity(result.get("severity")),
                "reason": str(result.get("reason", "No reason provided")),
                "modificationSummary": str(result.get("modificationSummary", "")),
                "sanitizedOutput": str(result.get("sanitizedOutput", ai_output)),
                "redactedItems": _safe_parse_redacted_items(result.get("redactedItems"))
            }
            
            logger.info(f"Output Guard: {waf_event['action']} - {waf_event['detectionType']} (confidence: {waf_event['confidence']})")
            
            return waf_event
            
        except Exception as e:
            logger.error(f"Output Guard Agent error: {e}")
            # Fail open with warning
            return {
                "timestamp": context.get('timestamp') if context else None,
                "originalOutput": ai_output[:500] if ai_output else "",
                "detectionType": "Error",
                "confidence": 0.3,
                "action": "Allowed",
                "severity": "medium",
                "reason": f"Analysis error: {str(e)}",
                "modificationSummary": "",
                "sanitizedOutput": ai_output or "",
                "redactedItems": []
            }
