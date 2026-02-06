import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sentinel Backend"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost/dbname")
    
    # AI Configuration
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_BASE_URL: str = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    MODEL_NAME: str = "google/gemini-2.0-flash-001"
    
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:8000", "https://localhost:8000", "http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174"]

    # Slack (SOC alerts)
    SLACK_BOT_TOKEN: str = ""
    SLACK_CHANNEL_ID: str = ""
    SLACK_USER_ID: str = ""  # User ID for DM notifications
    
    # Supabase (Database)
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
