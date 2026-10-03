import logging
from fastapi import APIRouter
from ..schemas import AdaptRequest
from ai_engine.platform_adapter import adapt_content_for_platforms

router = APIRouter(prefix="/api/platform", tags=["Platform Adaptation"])
logger = logging.getLogger("backend.routes.platform")

@router.post("/adapt")
def adapt_content(req: AdaptRequest):
    return adapt_content_for_platforms(
        title=req.title,
        summary=req.summary,
        hook=req.hook or "",
        transcript_text=req.transcript_text or ""
    )
