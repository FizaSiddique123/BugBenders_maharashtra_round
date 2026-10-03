import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from ai_engine.gemini_client import get_gemini_model, is_gemini_configured, extract_json_from_response

router = APIRouter(prefix="/api/hooks", tags=["Hooks"])
logger = logging.getLogger("backend.routes.hooks")

class HookRequest(BaseModel):
    content: str

@router.post("")
def generate_hooks(req: HookRequest):
    if is_gemini_configured():
        try:
            model = get_gemini_model("gemini-1.5-flash")
            prompt = f"""
You are an expert viral content strategist. Generate 3 highly engaging, scroll-stopping hooks based on this content:
{req.content[:2000]}

Output MUST be a valid JSON object strictly matching this schema:
{{
  "hooks": ["hook 1", "hook 2", "hook 3"]
}}
"""
            response = model.generate_content(prompt)
            result = extract_json_from_response(response.text)
            return result
        except Exception as e:
            logger.warning(f"Gemini hook generation failed: {e}")
    
    return {
        "hooks": [
            "You're probably making this exact mistake...",
            "Nobody tells creators this simple trick...",
            "Here is what I wish I knew before starting..."
        ]
    }
