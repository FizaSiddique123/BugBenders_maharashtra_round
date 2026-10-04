import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from ai_engine.gemini_client import get_gemini_model, is_gemini_configured, extract_json_from_response
from backend.app.database import get_db_connection
from fastapi import Depends
from ..auth import get_current_user

router = APIRouter(prefix="/api/hooks", tags=["Hooks"])
logger = logging.getLogger("backend.routes.hooks")

class HookRequest(BaseModel):
    asset_id: Optional[str] = None
    transcript: Optional[str] = None
    content: Optional[str] = None  # Legacy / fallback

@router.post("")
def generate_hooks(req: HookRequest, user_id: str = Depends(get_current_user)):
    content_to_use = req.transcript or req.content or ""
    
    if req.asset_id and not content_to_use:
        # Fetch transcript from DB
        conn = get_db_connection()
        # Verify asset ownership
        asset = conn.execute("SELECT * FROM assets WHERE id = ? AND user_id = ?", (req.asset_id, user_id)).fetchone()
        if asset:
            t_row = conn.execute("SELECT full_text FROM transcripts WHERE asset_id = ?", (req.asset_id,)).fetchone()
            if t_row:
                content_to_use = t_row["full_text"]
        conn.close()

    if not content_to_use:
        content_to_use = "General content creation topic"

    if is_gemini_configured():
        try:
            model = get_gemini_model("gemini-1.5-flash")
            prompt = f"""
You are an expert viral content strategist. You are analyzing the provided creator video transcript. 
Generate output ONLY from the supplied content. Do not invent facts. 
Understand the topic, audience, key points, tone and important moments before generating the requested content.

Identify the video's core topic and audience first internally, then generate 5-10 highly engaging, scroll-stopping hooks specifically targeted to THAT actual video content.
Make them meaningfully different (e.g., Curiosity, Problem/Solution, Bold statement, Question, Story, Contrarian, Educational, Emotional).
Do NOT generate generic hooks like "Here's something you need to know" unless it genuinely fits the video.

CONTENT:
{content_to_use[:5000]}

Output MUST be a valid JSON object strictly matching this schema:
{{
  "hooks": [
    {{
      "hook": "The actual hook text derived from the video...",
      "type": "Curiosity",
      "reason": "Why this hook works for this specific video...",
      "score": 95
    }}
  ]
}}
"""
            response = model.generate_content(prompt)
            result = extract_json_from_response(response.text)
            return result
        except Exception as e:
            logger.warning(f"Gemini hook generation failed: {e}")
    
    # Fallback if Gemini fails or is not configured
    words = content_to_use.split()
    context_snippet = " ".join(words[:5]) if words else "this topic"
    
    return {
        "hooks": [
            {
                "hook": f"You're probably making this exact mistake when dealing with {context_snippet}...",
                "type": "Problem/Solution",
                "reason": "Addresses a common pain point based on the video context.",
                "score": 85
            },
            {
                "hook": f"Nobody tells you this simple trick about {context_snippet}...",
                "type": "Curiosity",
                "reason": "Builds intrigue using the core topic.",
                "score": 92
            }
        ]
    }
