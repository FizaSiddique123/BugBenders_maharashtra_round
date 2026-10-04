import uuid
import json
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from ..database import get_db_connection
from ..schemas import ScriptGenerateRequest, ScriptCompareRequest, ScriptSaveRequest
from ..services.job_manager import log_activity
from ai_engine.script_generator import generate_script, compare_script_to_transcript

router = APIRouter(prefix="/api/scripts", tags=["Scripts"])
logger = logging.getLogger("backend.routes.scripts")

@router.post("/generate")
def create_script(req: ScriptGenerateRequest):
    content_to_use = req.transcript or ""
    
    if req.asset_id and not content_to_use:
        conn = get_db_connection()
        t_row = conn.execute("SELECT full_text FROM transcripts WHERE asset_id = ?", (req.asset_id,)).fetchone()
        conn.close()
        if t_row:
            content_to_use = t_row["full_text"]

    result = generate_script(
        topic=req.topic,
        transcript_context=content_to_use,
        target_audience=req.target_audience or "Content Creators & Digital Entrepreneurs",
        platform=req.platform or "youtube_shorts",
        tone=req.tone or "engaging",
        desired_duration=req.desired_duration or 60,
        content_category=req.content_category or "Tech & AI"
    )
    return result

@router.post("/compare")
def compare_script(req: ScriptCompareRequest):
    conn = get_db_connection()
    transcript_row = conn.execute("SELECT * FROM transcripts WHERE asset_id = ?", (req.asset_id,)).fetchone()
    conn.close()
    
    if not transcript_row:
        raise HTTPException(status_code=404, detail="Transcript for asset not found")
        
    segments_raw = json.loads(transcript_row["segments_json"]) if transcript_row["segments_json"] else []
    transcript_data = {
        "full_text": transcript_row["full_text"],
        "segments": segments_raw,
        "duration": transcript_row["duration"] or 60.0
    }
    
    return compare_script_to_transcript(req.script_text, transcript_data)

@router.post("/save")
def save_script(req: ScriptSaveRequest):
    script_id = f"script_{uuid.uuid4().hex[:8]}"
    conn = get_db_connection()
    conn.execute(
        """
        INSERT INTO scripts (id, project_id, topic, target_audience, platform, tone, title, hooks_json, main_content_json, full_script, caption, hashtags_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            script_id,
            req.project_id,
            req.topic,
            "General Audience",
            "Multi-platform",
            "Engaging",
            req.title,
            json.dumps(req.hooks),
            json.dumps(req.main_content),
            req.full_script,
            req.caption or "",
            json.dumps(req.hashtags or [])
        )
    )
    conn.commit()
    conn.close()
    
    log_activity("script_saved", f"Saved script '{req.title}'", project_id=req.project_id)
    return {"message": "Script saved successfully", "script_id": script_id}

@router.get("")
def get_scripts(project_id: Optional[str] = None):
    conn = get_db_connection()
    if project_id:
        rows = conn.execute("SELECT * FROM scripts WHERE project_id = ? ORDER BY created_at DESC", (project_id,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM scripts ORDER BY created_at DESC").fetchall()
    conn.close()
    
    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "project_id": r["project_id"],
            "topic": r["topic"],
            "title": r["title"],
            "hooks": json.loads(r["hooks_json"]) if r["hooks_json"] else [],
            "main_content": json.loads(r["main_content_json"]) if r["main_content_json"] else [],
            "full_script": r["full_script"],
            "caption": r["caption"],
            "hashtags": json.loads(r["hashtags_json"]) if r["hashtags_json"] else [],
            "created_at": r["created_at"]
        })
    return results
