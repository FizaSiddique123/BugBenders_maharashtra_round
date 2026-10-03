"""
CreatorAI AI Engine
Provides Gemini AI integration, audio transcription, highlight detection,
script & hook generation, and multi-platform content adaptation.
"""

from .gemini_client import get_gemini_model, is_gemini_configured
from .transcription_service import transcribe_video
from .highlight_detector import detect_highlights
from .script_generator import generate_script, compare_script_to_transcript
from .platform_adapter import adapt_content_for_platforms

__all__ = [
    "get_gemini_model",
    "is_gemini_configured",
    "transcribe_video",
    "detect_highlights",
    "generate_script",
    "compare_script_to_transcript",
    "adapt_content_for_platforms"
]
