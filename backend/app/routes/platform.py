import logging
from fastapi import APIRouter, Depends
from ..schemas import AdaptRequest
from ai_engine.platform_adapter import adapt_content_for_platforms
from ..auth import get_current_user

router = APIRouter(prefix="/api/platform", tags=["Platform Adaptation"])
logger = logging.getLogger("backend.routes.platform")

@router.post("/adapt")
def adapt_content(req: AdaptRequest, user_id: str = Depends(get_current_user)):
    return adapt_content_for_platforms(
        title=req.title,
        summary=req.summary,
        hook=req.hook or "",
        transcript_text=req.transcript_text or ""
    )
