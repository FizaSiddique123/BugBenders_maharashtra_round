import os
import json
import logging
import re
from typing import Dict, Any, Optional

logger = logging.getLogger("ai_engine.gemini_client")

def get_api_key() -> Optional[str]:
    """Retrieves Gemini API Key from environment or .env file."""
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key and os.path.exists(".env"):
        try:
            with open(".env", "r") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        api_key = line.strip().split("=", 1)[1].strip('"\'')
                        break
        except Exception:
            pass
    return api_key

def is_gemini_configured() -> bool:
    """Checks if a valid-looking Gemini API key is configured."""
    key = get_api_key()
    return bool(key and len(key) > 10 and not key.startswith("your_"))

def get_gemini_model(model_name: str = "gemini-1.5-flash"):
    """Initializes and returns a configured Gemini model instance."""
    api_key = get_api_key()
    if not api_key:
        return None
        
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        return genai.GenerativeModel(model_name)
    except Exception as e:
        logger.error(f"Failed to initialize Gemini model: {e}")
        return None

def extract_json_from_response(text: str) -> Dict[str, Any]:
    """Safely parses JSON from model output even if wrapped in markdown codeblocks."""
    cleaned = text.strip()
    # Remove ```json ... ``` blocks
    if "```json" in cleaned:
        cleaned = re.search(r"```json\s*(.*?)\s*```", cleaned, re.DOTALL)
        if cleaned:
            cleaned = cleaned.group(1).strip()
    elif "```" in cleaned:
        cleaned = re.search(r"```\s*(.*?)\s*```", cleaned, re.DOTALL)
        if cleaned:
            cleaned = cleaned.group(1).strip()
            
    try:
        return json.loads(cleaned)
    except Exception as e:
        logger.warning(f"Direct JSON parse failed: {e}. Attempting substring extraction.")
        # Try finding outermost { ... }
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(cleaned[start:end+1])
            except Exception:
                pass
        raise ValueError(f"Could not parse valid JSON from AI response: {text[:200]}")
