from app.services.ai_service import ai_service
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

# Valid actions for behavior guard
VALID_ACTIONS = {"Blocked", "Contained", "Allowed"}
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


class BehaviorGuardAgent:
    """
    Behavior Guard Agent - Monitors AI agent behavior for policy violations.
    
    Detects:
    - Agents exceeding their designated scope
    - Unauthorized data access attempts
    - Policy violations (rate limits, resource usage)
    - Anomalous behavior patterns
    - Cross-agent boundary violations
    """
    
    def __init__(self):
        self.agent_name = "Behavior Guard"
        
    async def analyze(self, agent_action: Dict[str, Any], policy_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Analyze AI agent behavior for policy violations.
        
        Args:
            agent_action: Dict containing:
                - agent_name: Name of the agent
                - action_type: Type of action (e.g., "data_access", "api_call", "analysis")
                - action_details: Details of what the agent is trying to do
                - resource_requested: What resource is being accessed
            policy_context: Optional policy rules and constraints
        
        Returns:
            Dict containing:
            - timestamp: ISO timestamp
            - agentName: Name of the agent
            - actionType: Type of action attempted
            - violationType: Type of violation detected
            - confidence: 0-1 confidence score
            - action: "Blocked" | "Contained" | "Allowed"
            - severity: "critical" | "high" | "medium" | "low"
            - reason: Explanation of the decision
            - policyViolated: Which policy was violated
        """
        # Handle empty/None agent_action
        if not agent_action or not isinstance(agent_action, dict):
            return {
                "timestamp": None,
                "agentName": "Unknown",
                "actionType": "unknown",
                "violationType": "Invalid Input",
                "confidence": 1.0,
                "action": "Blocked",
                "severity": "high",
                "reason": "No valid agent action provided",
                "policyViolated": "Input validation failed"
            }
        
        system_prompt = """You are an AI Web Application Firewall (WAF) Behavior Guard Agent.

Your role is to monitor AI agent behavior and detect policy violations.

AGENT SCOPE POLICIES:
1. **Threat Modeler Agent**:
   - Scope: Analyze architecture, identify attack surfaces, model threats
   - Boundaries: Cannot access production data, cannot execute code
   
2. **Security Agent (Logic Auditor)**:
   - Scope: Review code logic, identify vulnerabilities
   - Boundaries: Cannot modify code, cannot access credentials
   
3. **SOC Intelligence Agent**:
   - Scope: Analyze logs, cross-reference alerts
   - Boundaries: Cannot modify logs, cannot access user data
   
4. **Risk Agent (Supervisor)**:
   - Scope: Synthesize findings, calculate risk scores
   - Boundaries: Cannot override other agents, cannot access raw data
   
5. **Remediation Agent**:
   - Scope: Suggest fixes, provide recommendations
   - Boundaries: Cannot auto-apply fixes, cannot access production

VIOLATION CATEGORIES:
1. **Scope Violation**: Agent attempting actions outside its designated role
2. **Data Access Violation**: Unauthorized data access attempts
3. **Resource Abuse**: Excessive API calls, memory usage, or processing time
4. **Cross-Agent Violation**: Agent interfering with another agent's work
5. **Policy Override**: Attempting to bypass security policies
6. **Rate Limit Violation**: Exceeding allowed request rates

ANALYSIS PROCESS:
1. Identify which agent is acting
2. Check if action is within agent's scope
3. Verify resource access is authorized
4. Assess severity of any violations
5. Decide: BLOCK (violation), CONTAIN (suspicious), or ALLOW (compliant)

OUTPUT REQUIREMENTS:
- Be strict about scope boundaries
- Clearly identify which policy was violated
- Provide actionable reasoning"""

        response_schema = """{
  "violationType": "string (e.g., 'Scope Violation', 'Data Access Violation', 'Compliant Behavior', 'Resource Abuse')",
  "confidence": "number between 0 and 1",
  "action": "string: 'Blocked' | 'Contained' | 'Allowed'",
  "severity": "string: 'critical' | 'high' | 'medium' | 'low'",
  "reason": "string explaining why this decision was made",
  "policyViolated": "string describing which policy was violated (empty if Allowed)"
}"""

        try:
            # Prepare analysis content with safe extraction
            agent_name = str(agent_action.get('agent_name', 'Unknown'))
            action_type = str(agent_action.get('action_type', 'unknown'))
            action_details = str(agent_action.get('action_details', 'No details provided'))
            resource_requested = str(agent_action.get('resource_requested', 'None'))
            
            # Format policy context
            policy_context_str = 'Standard security policies apply'
            if policy_context and isinstance(policy_context, dict):
                policy_context_str = str(policy_context.get('context', policy_context))
            elif policy_context:
                policy_context_str = str(policy_context)
            
            analysis_content = f"""AGENT BEHAVIOR TO ANALYZE:

Agent Name: {agent_name}
Action Type: {action_type}
Action Details: {action_details}
Resource Requested: {resource_requested}

POLICY CONTEXT:
{policy_context_str}

Analyze this agent behavior for policy violations and provide your assessment."""

            results = await ai_service.analyze_content(
                system_prompt=system_prompt,
                user_content=analysis_content,
                response_schema=response_schema
            )
            
            if not results or not isinstance(results, list) or len(results) == 0:
                logger.warning("Behavior Guard Agent returned no results")
                # Default to allowing
                return {
                    "timestamp": agent_action.get('timestamp'),
                    "agentName": agent_name,
                    "actionType": action_type,
                    "violationType": "Analysis Failed",
                    "confidence": 0.5,
                    "action": "Allowed",
                    "severity": "low",
                    "reason": "Unable to analyze behavior - defaulting to allow",
                    "policyViolated": ""
                }
            
            result = results[0]
            
            if not isinstance(result, dict):
                logger.error(f"Expected dict result, got {type(result)}")
                return {
                    "timestamp": agent_action.get('timestamp'),
                    "agentName": agent_name,
                    "actionType": action_type,
                    "violationType": "Parse Error",
                    "confidence": 0.5,
                    "action": "Allowed",
                    "severity": "low",
                    "reason": "Failed to parse AI response - defaulting to allow",
                    "policyViolated": ""
                }
            
            # Ensure all required fields exist with safe parsing
            waf_event = {
                "timestamp": agent_action.get('timestamp'),
                "agentName": agent_name,
                "actionType": action_type,
                "violationType": str(result.get("violationType", "Unknown")),
                "confidence": _safe_parse_confidence(result.get("confidence")),
                "action": _safe_parse_action(result.get("action")),
                "severity": _safe_parse_severity(result.get("severity")),
                "reason": str(result.get("reason", "No reason provided")),
                "policyViolated": str(result.get("policyViolated", ""))
            }
            
            logger.info(f"Behavior Guard: {waf_event['action']} - {waf_event['violationType']} for {agent_name} (confidence: {waf_event['confidence']})")
            
            return waf_event
            
        except Exception as e:
            logger.error(f"Behavior Guard Agent error: {e}")
            # Fail open with warning
            return {
                "timestamp": agent_action.get('timestamp') if agent_action else None,
                "agentName": str(agent_action.get('agent_name', 'Unknown')) if agent_action else "Unknown",
                "actionType": str(agent_action.get('action_type', 'unknown')) if agent_action else "unknown",
                "violationType": "Error",
                "confidence": 0.3,
                "action": "Allowed",
                "severity": "medium",
                "reason": f"Analysis error: {str(e)}",
                "policyViolated": ""
            }
