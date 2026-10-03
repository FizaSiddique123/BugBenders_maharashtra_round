import os
import uuid
import json
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from ..database import get_db_connection
from ..config import CLIPS_DIR
from ..schemas import GenerateClipRequest, RenderClipRequest, ClipResponse
from ..services.job_manager import start_clip_render_job, log_activity

router = APIRouter(prefix="/api/clips", tags=["Clips"])
logger = logging.getLogger("backend.routes.clips")

def row_to_clip_response(r) -> ClipResponse:
    # Build relative URLs for frontend static file serving
    out_path = r["output_path"]
    thumb_path = r["thumbnail_path"]
    
    # Extract filename relative to storage for direct HTTP streaming
    video_url = f"/storage/clips/{os.path.basename(out_path)}" if out_path else ""
    thumbnail_url = f"/storage/clips/{os.path.basename(thumb_path)}" if thumb_path else ""
    
    return ClipResponse(
        id=r["id"],
        project_id=r["project_id"],
        asset_id=r["asset_id"],
        highlight_id=r["highlight_id"],
        title=r["title"] or "Generated Short Clip",
        output_path=r["output_path"],
        video_url=video_url,
        thumbnail_path=r["thumbnail_path"],
        thumbnail_url=thumbnail_url,
        duration=r["duration"] or 0.0,
        aspect_ratio=r["aspect_ratio"] or "9:16",
        captions_enabled=bool(r["captions_enabled"]),
        caption_style=r["caption_style"] or "bold_yellow",
        status=r["status"] or "ready",
        created_at=r["created_at"]
    )

@router.get("", response_model=List[ClipResponse])
def get_clips(asset_id: Optional[str] = None, project_id: Optional[str] = None):
    conn = get_db_connection()
    if asset_id:
        rows = conn.execute("SELECT * FROM clips WHERE asset_id = ? ORDER BY created_at DESC", (asset_id,)).fetchall()
    elif project_id:
        rows = conn.execute("SELECT * FROM clips WHERE project_id = ? ORDER BY created_at DESC", (project_id,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM clips ORDER BY created_at DESC").fetchall()
    conn.close()
    
    return [row_to_clip_response(r) for r in rows]

@router.get("/{clip_id}", response_model=ClipResponse)
def get_clip(clip_id: str):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM clips WHERE id = ?", (clip_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Clip not found")
    return row_to_clip_response(row)

@router.post("/generate")
def generate_clip(req: GenerateClipRequest):
    conn = get_db_connection()
    asset = conn.execute("SELECT * FROM assets WHERE id = ?", (req.asset_id,)).fetchone()
    transcript_row = conn.execute("SELECT * FROM transcripts WHERE asset_id = ?", (req.asset_id,)).fetchone()
    conn.close()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Source video asset not found")
        
    clip_id = f"clip_{uuid.uuid4().hex[:8]}"
    output_filename = f"{clip_id}_{req.aspect_ratio.replace(':', '_')}.mp4"
    output_path = os.path.join(CLIPS_DIR, output_filename)
    thumbnail_path = os.path.join(CLIPS_DIR, f"{clip_id}_thumb.jpg")
    
    segments = []
    if transcript_row and transcript_row["segments_json"]:
        try:
            segments = json.loads(transcript_row["segments_json"])
        except Exception:
            pass
            
    spec = {
        "source_path": asset["filepath"],
        "output_path": output_path,
        "thumbnail_path": thumbnail_path,
        "start_time": req.start_time,
        "end_time": req.end_time,
        "aspect_ratio": req.aspect_ratio,
        "captions_enabled": req.captions_enabled,
        "caption_style": req.caption_style,
        "segments": segments
    }
    
    conn = get_db_connection()
    conn.execute(
        """
        INSERT INTO clips (id, project_id, asset_id, title, output_path, thumbnail_path, duration, aspect_ratio, captions_enabled, caption_style, edit_spec_json, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            clip_id,
            req.project_id or asset["project_id"],
            req.asset_id,
            req.title,
            output_path,
            thumbnail_path,
            round(req.end_time - req.start_time, 2),
            req.aspect_ratio,
            1 if req.captions_enabled else 0,
            req.caption_style,
            json.dumps(spec),
            "rendering"
        )
    )
    conn.commit()
    conn.close()
    
    job_id = start_clip_render_job(clip_id, spec)
    
    return {
        "message": "Clip rendering queued",
        "clip_id": clip_id,
        "job_id": job_id,
        "aspect_ratio": req.aspect_ratio
    }

@router.post("/{clip_id}/render")
def render_modified_clip(clip_id: str, req: RenderClipRequest):
    """
    Rerenders clip based on modified user edit specification (Module G: Editable AI Video Editor).
    """
    conn = get_db_connection()
    clip_row = conn.execute("SELECT * FROM clips WHERE id = ?", (clip_id,)).fetchone()
    if not clip_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Clip not found")
        
    asset = conn.execute("SELECT * FROM assets WHERE id = ?", (clip_row["asset_id"],)).fetchone()
    transcript_row = conn.execute("SELECT * FROM transcripts WHERE asset_id = ?", (clip_row["asset_id"],)).fetchone()
    conn.close()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Source asset not found")
        
    segments = []
    if req.custom_subtitles:
        segments = req.custom_subtitles
    elif transcript_row and transcript_row["segments_json"]:
        segments = json.loads(transcript_row["segments_json"])
        
    output_path = clip_row["output_path"]
    thumbnail_path = clip_row["thumbnail_path"]
    
    spec = {
        "source_path": asset["filepath"],
        "output_path": output_path,
        "thumbnail_path": thumbnail_path,
        "start_time": req.start_time,
        "end_time": req.end_time,
        "aspect_ratio": req.aspect_ratio,
        "captions_enabled": req.captions_enabled,
        "caption_style": req.caption_style,
        "segments": segments
    }
    
    conn = get_db_connection()
    conn.execute("UPDATE clips SET status = 'rendering', edit_spec_json = ? WHERE id = ?", (json.dumps(spec), clip_id))
    conn.commit()
    conn.close()
    
    job_id = start_clip_render_job(clip_id, spec)
    
    return {
        "message": "Re-rendering clip from custom edit specification",
        "clip_id": clip_id,
        "job_id": job_id
    }

@router.delete("/{clip_id}")
def delete_clip(clip_id: str):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM clips WHERE id = ?", (clip_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Clip not found")
        
    out_path = row["output_path"]
    thumb_path = row["thumbnail_path"]
    
    conn.execute("DELETE FROM clips WHERE id = ?", (clip_id,))
    conn.commit()
    conn.close()
    
    for p in [out_path, thumb_path]:
        if p and os.path.exists(p) and "demo_clip_highlight1" not in p:
            try:
                os.remove(p)
            except Exception:
                pass
                
    return {"message": "Clip deleted successfully", "id": clip_id}
