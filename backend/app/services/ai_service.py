from openai import AsyncOpenAI
import json
import logging
import asyncio
from typing import List, Dict, Any, Optional
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIService:
    """
    Shared service for interacting with AI models via OpenRouter (OpenAI-compatible API).
    Handles configuration, prompting, and response parsing.
    """
    
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.base_url = settings.OPENROUTER_BASE_URL
        self.model_name = settings.MODEL_NAME
        
        if not self.api_key:
            logger.warning("OPENROUTER_API_KEY is not set. AI agents will fail.")
        
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
        )
        
    async def analyze_content(self, 
                             system_prompt: str, 
                             user_content: str, 
                             response_schema: str = "JSON") -> List[Dict[str, Any]]:
        """
        Sends content to OpenRouter and returns structured JSON analysis.
        """
        try:
            # Construct the messages
            messages = [
                {"role": "system", "content": f"{system_prompt}\n\nOUTPUT FORMAT:\nThe output must be valid JSON matching this schema:\n{response_schema}\n\nProvide ONLY the JSON output. Do not include markdown formatting."},
                {"role": "user", "content": f"CONTENT TO ANALYZE:\n{user_content}"}
            ]
            
            # Generate response with retry logic
            response = None
            max_retries = 3
            base_delay = 2
            
            for attempt in range(max_retries):
                try:
                    chat_completion = await self.client.chat.completions.create(
                        model=self.model_name,
                        messages=messages,
                        temperature=0,  # Ensure deterministic results
                    )
                    response = chat_completion
                    break
                except Exception as e:
                    logger.warning(f"Attempt {attempt+1} failed: {e}")
                    if "429" in str(e) or "rate limit" in str(e).lower():
                        if attempt < max_retries - 1:
                            delay = base_delay * (2 ** attempt)
                            logger.warning(f"Rate limit hit. Retrying in {delay}s...")
                            await asyncio.sleep(delay)
                            continue
                    
                    if attempt == max_retries - 1:
                        logger.error(f"OpenAI API error after retries: {e}")
                        raise e
            
            if not response or not response.choices:
                logger.error("Failed to generate content or empty response")
                return []

            response_text = response.choices[0].message.content
            
            # Clean up response if it contains markdown code blocks
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
                
            response_text = response_text.strip()
            
            # Parse JSON
            try:
                data = json.loads(response_text)
                # Ensure it's a list
                if isinstance(data, dict):
                    return [data]
                elif isinstance(data, list):
                    return data
                else:
                    logger.error(f"Unexpected JSON format: {type(data)}")
                    # Try to see if it's wrapped in a key like 'findings'
                    # But the caller usually expects a list or dict they can parse
                    return [data] # Wrap dict in list if expected
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}")
                logger.error(f"Raw response: {response_text}")
                return []
                
        except Exception as e:
            logger.error(f"AI Analysis failed: {e}")
            return []

# Singleton instance
ai_service = AIService()
