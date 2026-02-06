"""
Slack service - sends SOC alert messages only.
No business logic or agent logic.
"""
import os
import logging
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")
except ImportError:
    pass

from slack_sdk import WebClient

logger = logging.getLogger(__name__)

def _get_client():
    from app.core.config import settings
    t = settings.SLACK_BOT_TOKEN or os.getenv("SLACK_BOT_TOKEN")
    return WebClient(token=t) if t else None


_client = None


def send_soc_alert(message: dict) -> bool:
    """Send a SOC alert to Slack. Handles failures safely (log, don't crash)."""
    global _client
    if _client is None:
        _client = _get_client()
    if not _client:
        logger.warning("SLACK_BOT_TOKEN not set. Slack notifications disabled.")
        return False

    from app.core.config import settings
    channel = settings.SLACK_CHANNEL_ID or os.getenv("SLACK_CHANNEL_ID")
    if not channel:
        logger.warning("SLACK_CHANNEL_ID not set. Slack notifications disabled.")
        return False

    try:
        _client.chat_postMessage(
            channel=channel,
            text=message.get("text", "Security alert"),
            blocks=message.get("blocks", []),
        )
        return True
    except Exception as e:
        logger.error(f"Slack error: {e}", exc_info=True)
        return False


def send_dm_alert(message: dict, user_id: str = None) -> bool:
    """Send a DM alert to a specific Slack user. Handles failures safely (log, don't crash)."""
    global _client
    if _client is None:
        _client = _get_client()
    if not _client:
        logger.warning("SLACK_BOT_TOKEN not set. Slack DM notifications disabled.")
        return False

    from app.core.config import settings
    target_user = user_id or settings.SLACK_USER_ID or os.getenv("SLACK_USER_ID")
    if not target_user:
        logger.warning("SLACK_USER_ID not set. Slack DM notifications disabled.")
        return False

    try:
        _client.chat_postMessage(
            channel=target_user,  # For DMs, use user ID as channel
            text=message.get("text", "Security ticket"),
            blocks=message.get("blocks", []),
        )
        logger.info(f"Slack DM sent successfully to user {target_user}")
        return True
    except Exception as e:
        logger.error(f"Slack DM error: {e}", exc_info=True)
        return False
