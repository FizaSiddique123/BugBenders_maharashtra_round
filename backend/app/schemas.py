from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# --- Project Schemas ---
class ProjectCreate(BaseModel):
    title: str = Field(..., example="YouTube AI Workflow 2026")
    description: Optional[str] = Field(None, example="Automated pipeline for repurposing podcasts")
    status: Optional[str] = Field("Idea", example="Idea")

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: str
    created_at: str
    updated_at: str
    asset_count: Optional[int] = 0
    clip_count: Optional[int] = 0

# --- Asset Schemas ---
class AssetResponse(BaseModel):
    id: str
    project_id: Optional[str] = None
    filename: str
    filepath: str
    file_type: str
    duration: float
    size_bytes: int
    status: str
    thumbnail_path: Optional[str] = None
    created_at: str
    metadata: Optional[Dict[str, Any]] = None

# --- Transcription Schemas ---
class TranscriptSegment(BaseModel):
    id: int
    start: float
    end: float
    text: str

class TranscriptResponse(BaseModel):
    id: str
    asset_id: str
    full_text: str
    segments: List[TranscriptSegment]
    duration: float
    source: Optional[str] = "gemini"
    created_at: str

# --- Highlight Schemas ---
class HighlightItem(BaseModel):
    id: Optional[str] = None
    start_time: float
    end_time: float
    duration: Optional[float] = None
    hook: str
    title: str
    summary: str
    reason: str
    platforms: List[str]
    virality_score: Optional[int] = 88

class HighlightsResponse(BaseModel):
    asset_id: str
    summary: str
    highlights: List[HighlightItem]
    model: Optional[str] = "gemini-1.5-flash"

# --- Clip Generation & Edit Schemas ---
class GenerateClipRequest(BaseModel):
    asset_id: str
    project_id: Optional[str] = None
    start_time: float
    end_time: float
    title: Optional[str] = "Untitled Highlight Clip"
    aspect_ratio: Optional[str] = "9:16"  # '9:16', '16:9', '1:1'
    captions_enabled: Optional[bool] = True
    caption_style: Optional[str] = "bold_yellow"  # 'bold_yellow', 'neon_cyan', 'clean_white'

class RenderClipRequest(BaseModel):
    clip_id: str
    start_time: float
    end_time: float
    aspect_ratio: Optional[str] = "9:16"
    captions_enabled: Optional[bool] = True
    caption_style: Optional[str] = "bold_yellow"
    custom_subtitles: Optional[List[Dict[str, Any]]] = None

class ClipResponse(BaseModel):
    id: str
    project_id: Optional[str] = None
    asset_id: str
    highlight_id: Optional[str] = None
    title: str
    output_path: str
    video_url: str
    thumbnail_path: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: float
    aspect_ratio: str
    captions_enabled: bool
    caption_style: str
    status: str
    created_at: str

# --- Script Schemas ---
class ScriptGenerateRequest(BaseModel):
    asset_id: Optional[str] = None
    transcript: Optional[str] = None
    topic: str
    target_audience: Optional[str] = "Content Creators & Digital Entrepreneurs"
    platform: Optional[str] = "youtube_shorts"
    tone: Optional[str] = "engaging"
    desired_duration: Optional[int] = 60
    content_category: Optional[str] = "Tech & AI"
    project_id: Optional[str] = None

class ScriptCompareRequest(BaseModel):
    script_text: str
    asset_id: str

class ScriptSaveRequest(BaseModel):
    project_id: Optional[str] = None
    topic: str
    title: str
    hooks: List[str]
    main_content: List[Dict[str, Any]]
    full_script: str
    caption: Optional[str] = None
    hashtags: Optional[List[str]] = None

# --- Platform Adaptation Schemas ---
class AdaptRequest(BaseModel):
    title: str
    summary: str
    hook: Optional[str] = ""
    transcript_text: Optional[str] = ""

# --- Job & Activity Schemas ---
class JobResponse(BaseModel):
    id: str
    job_type: str
    asset_id: Optional[str] = None
    clip_id: Optional[str] = None
    status: str
    progress: int
    error: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    created_at: str
    updated_at: str

class ActivityResponse(BaseModel):
    id: str
    project_id: Optional[str] = None
    action_type: str
    description: str
    created_at: str
