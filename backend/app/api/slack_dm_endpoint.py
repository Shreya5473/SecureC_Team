"""Slack DM endpoint for sending security ticket notifications."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.slack_service import send_dm_alert
import logging

router = APIRouter(prefix="/slack", tags=["slack"])
logger = logging.getLogger(__name__)


class SlackTicketPayload(BaseModel):
    finding_type: str
    severity: str
    description: str
    location: Optional[str] = None
    suggestion: Optional[str] = None
    agent_name: Optional[str] = None
    derived_from: Optional[str] = None


def build_ticket_message(payload: SlackTicketPayload) -> dict:
    """Build a Slack Block Kit message for security ticket."""
    severity = payload.severity.upper()
    severity_emoji = "🚨" if severity in ["CRITICAL", "HIGH"] else "⚠️" if severity == "MEDIUM" else "ℹ️"
    
    # Build fields for the message
    fields = [
        {"type": "mrkdwn", "text": f"*Finding Type*\n{payload.finding_type}"},
        {"type": "mrkdwn", "text": f"*Severity*\n{severity_emoji} {severity}"},
    ]
    
    if payload.location:
        fields.append({"type": "mrkdwn", "text": f"*Component*\n{payload.location}"})
    
    if payload.agent_name:
        fields.append({"type": "mrkdwn", "text": f"*Agent*\n{payload.agent_name}"})
    
    blocks = [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": f"{severity_emoji} Security Finding Alert", "emoji": True},
        },
        {
            "type": "section",
            "fields": fields
        },
        {"type": "divider"},
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"*Description*\n{payload.description}"},
        },
    ]
    
    # Add suggestion if available
    if payload.suggestion:
        blocks.append({
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"*Suggested Fix*\n```{payload.suggestion[:500]}```"},
        })
    
    # Add source info if available
    if payload.derived_from:
        blocks.append({
            "type": "context",
            "elements": [
                {"type": "mrkdwn", "text": f"Source: {payload.derived_from}"}
            ]
        })
    
    return {
        "text": f"{severity_emoji} {severity} Security Finding: {payload.finding_type}",
        "blocks": blocks
    }


@router.post("/send-ticket")
async def send_slack_ticket(payload: SlackTicketPayload):
    """Send a security finding ticket to Slack DM."""
    try:
        message = build_ticket_message(payload)
        success = send_dm_alert(message)
        
        if success:
            return {"success": True, "message": "Slack ticket sent successfully"}
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to send Slack ticket. Check server logs for details."
            )
    except Exception as e:
        logger.error(f"Error sending Slack ticket: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error sending Slack ticket: {str(e)}"
        )
