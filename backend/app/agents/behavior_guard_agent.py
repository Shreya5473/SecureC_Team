from app.services.ai_service import ai_service
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

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
            # Prepare analysis content
            agent_name = agent_action.get('agent_name', 'Unknown')
            action_type = agent_action.get('action_type', 'unknown')
            action_details = agent_action.get('action_details', 'No details provided')
            resource_requested = agent_action.get('resource_requested', 'None')
            
            analysis_content = f"""AGENT BEHAVIOR TO ANALYZE:

Agent Name: {agent_name}
Action Type: {action_type}
Action Details: {action_details}
Resource Requested: {resource_requested}

POLICY CONTEXT:
{policy_context if policy_context else 'Standard security policies apply'}

Analyze this agent behavior for policy violations and provide your assessment."""

            results = await ai_service.analyze_content(
                system_prompt=system_prompt,
                user_content=analysis_content,
                response_schema=response_schema
            )
            
            if not results or len(results) == 0:
                logger.warning("Behavior Guard Agent returned no results")
                # Default to allowing
                return {
                    "violationType": "Analysis Failed",
                    "confidence": 0.5,
                    "action": "Allowed",
                    "severity": "low",
                    "reason": "Unable to analyze behavior - defaulting to allow",
                    "policyViolated": ""
                }
            
            result = results[0]
            
            # Ensure all required fields exist
            waf_event = {
                "timestamp": agent_action.get('timestamp'),
                "agentName": agent_name,
                "actionType": action_type,
                "violationType": result.get("violationType", "Unknown"),
                "confidence": float(result.get("confidence", 0.5)),
                "action": result.get("action", "Allowed"),
                "severity": result.get("severity", "low"),
                "reason": result.get("reason", "No reason provided"),
                "policyViolated": result.get("policyViolated", "")
            }
            
            logger.info(f"Behavior Guard: {waf_event['action']} - {waf_event['violationType']} for {agent_name} (confidence: {waf_event['confidence']})")
            
            return waf_event
            
        except Exception as e:
            logger.error(f"Behavior Guard Agent error: {e}")
            # Fail open with warning
            return {
                "violationType": "Error",
                "confidence": 0.3,
                "action": "Allowed",
                "severity": "medium",
                "reason": f"Analysis error: {str(e)}",
                "policyViolated": ""
            }
