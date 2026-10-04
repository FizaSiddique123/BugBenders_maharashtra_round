import uuid
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from ..database import get_db_connection
from pydantic import BaseModel, Field
import json
from datetime import datetime
from ..auth import get_current_user

router = APIRouter(prefix="/api/content", tags=["Content"])
logger = logging.getLogger("backend.routes.content")

# --- Schemas ---
class ContentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    content_type: Optional[str] = None
    platforms: Optional[List[str]] = []
    status: Optional[str] = "Idea"
    stage: Optional[str] = "Idea"
    priority: Optional[str] = None
    campaign: Optional[str] = None
    tags: Optional[List[str]] = []
    assigned_to: Optional[str] = None
    source_video_id: Optional[str] = None
    script_id: Optional[str] = None
    hook_id: Optional[str] = None
    clip_id: Optional[str] = None
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    cta: Optional[str] = None
    due_date: Optional[str] = None
    scheduled_at: Optional[str] = None
    timezone: Optional[str] = None

class ContentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content_type: Optional[str] = None
    platforms: Optional[List[str]] = None
    status: Optional[str] = None
    stage: Optional[str] = None
    priority: Optional[str] = None
    campaign: Optional[str] = None
    tags: Optional[List[str]] = None
    assigned_to: Optional[str] = None
    source_video_id: Optional[str] = None
    script_id: Optional[str] = None
    hook_id: Optional[str] = None
    clip_id: Optional[str] = None
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    cta: Optional[str] = None
    due_date: Optional[str] = None
    scheduled_at: Optional[str] = None
    timezone: Optional[str] = None

class ContentSchedule(BaseModel):
    scheduled_at: str
    timezone: Optional[str] = "UTC"

class ContentStatusUpdate(BaseModel):
    status: str

# Helper to log activity
def log_activity(conn, content_id: str, action: str, description: str, user_id: str):
    conn.execute(
        "INSERT INTO activity_logs (id, user_id, project_id, action_type, description) VALUES (?, ?, ?, ?, ?)",
        (f"act_{uuid.uuid4().hex[:8]}", user_id, content_id, action, description)
    )

def row_to_dict(row):
    d = dict(row)
    if d.get("platforms"):
        try:
            d["platforms"] = json.loads(d["platforms"])
        except:
            d["platforms"] = []
    else:
        d["platforms"] = []
        
    if d.get("tags"):
        try:
            d["tags"] = json.loads(d["tags"])
        except:
            d["tags"] = []
    else:
        d["tags"] = []
    return d

@router.get("")
def get_contents(user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC", (user_id,)).fetchall()
    
    results = []
    for row in rows:
        d = row_to_dict(row)
        
        # Fetch associated asset if any
        asset = conn.execute("SELECT * FROM assets WHERE project_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1", (row["id"], user_id)).fetchone()
        if asset:
            d["asset"] = dict(asset)
            d["asset"]["metadata_json"] = json.loads(d["asset"]["metadata_json"]) if d["asset"]["metadata_json"] else {}
            
            # Fetch highlights count
            hls = conn.execute("SELECT COUNT(*) as cnt FROM highlights WHERE asset_id = ?", (asset["id"],)).fetchone()
            d["highlights_count"] = hls["cnt"]
            
            # Check if there is an active job
            job = conn.execute("SELECT status FROM processing_jobs WHERE asset_id = ? ORDER BY created_at DESC LIMIT 1", (asset["id"],)).fetchone()
            d["ai_job_status"] = job["status"] if job else None
        else:
            d["asset"] = None
            d["highlights_count"] = 0
            d["ai_job_status"] = None
            
        results.append(d)
        
    conn.close()
    return results

@router.get("/calendar")
def get_calendar(user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM projects WHERE scheduled_at IS NOT NULL AND user_id = ? ORDER BY scheduled_at ASC", (user_id,)).fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]

@router.get("/{id}")
def get_content(id: str, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM projects WHERE id = ? AND user_id = ?", (id, user_id)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Content not found")
    return row_to_dict(row)

@router.post("")
def create_content(req: ContentCreate, user_id: str = Depends(get_current_user)):
    cid = f"proj_{uuid.uuid4().hex[:8]}"
    conn = get_db_connection()
    
    platforms_json = json.dumps(req.platforms) if req.platforms else "[]"
    tags_json = json.dumps(req.tags) if req.tags else "[]"
    
    conn.execute("""
        INSERT INTO projects (
            id, user_id, title, description, content_type, platforms, status, stage, priority, campaign, tags, 
            assigned_to, source_video_id, script_id, hook_id, clip_id, thumbnail_url, caption, cta, 
            due_date, scheduled_at, timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        cid, user_id, req.title, req.description, req.content_type, platforms_json, req.status, req.stage, req.priority, req.campaign, tags_json,
        req.assigned_to, req.source_video_id, req.script_id, req.hook_id, req.clip_id, req.thumbnail_url, req.caption, req.cta,
        req.due_date, req.scheduled_at, req.timezone
    ))
    log_activity(conn, cid, "created", "Created project", user_id)
    conn.commit()
    conn.close()
    return get_content(cid, user_id)

@router.patch("/{id}")
def update_content(id: str, req: ContentUpdate, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM projects WHERE id = ? AND user_id = ?", (id, user_id)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Content not found")
        
    update_fields = []
    params = []
    
    req_dict = req.dict(exclude_unset=True)
    for k, v in req_dict.items():
        if k in ["platforms", "tags"]:
            v = json.dumps(v)
        update_fields.append(f"{k} = ?")
        params.append(v)
        
    if update_fields:
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        query = f"UPDATE projects SET {', '.join(update_fields)} WHERE id = ? AND user_id = ?"
        params.append(id)
        params.append(user_id)
        conn.execute(query, params)
        log_activity(conn, id, "edited", "Edited project", user_id)
        conn.commit()
        
    conn.close()
    return get_content(id, user_id)

@router.delete("/{id}")
def delete_content(id: str, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    conn.execute("DELETE FROM projects WHERE id = ? AND user_id = ?", (id, user_id))
    conn.commit()
    conn.close()
    return {"message": "Project deleted"}

@router.post("/{id}/schedule")
def schedule_content(id: str, req: ContentSchedule, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    conn.execute("UPDATE projects SET scheduled_at = ?, timezone = ?, status = 'Scheduled', stage = 'Scheduled', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?", 
                 (req.scheduled_at, req.timezone, id, user_id))
    log_activity(conn, id, "scheduled", f"Scheduled for {req.scheduled_at}", user_id)
    conn.commit()
    conn.close()
    return get_content(id, user_id)

@router.post("/{id}/reschedule")
def reschedule_content(id: str, req: ContentSchedule, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    conn.execute("UPDATE projects SET scheduled_at = ?, timezone = ?, status = 'Scheduled', stage = 'Scheduled', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?", 
                 (req.scheduled_at, req.timezone, id, user_id))
    log_activity(conn, id, "rescheduled", f"Rescheduled for {req.scheduled_at}", user_id)
    conn.commit()
    conn.close()
    return get_content(id, user_id)

@router.post("/{id}/unschedule")
def unschedule_content(id: str, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    conn.execute("UPDATE projects SET scheduled_at = NULL, status = 'Ready', stage = 'Ready', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?", (id, user_id))
    log_activity(conn, id, "unscheduled", "Unscheduled content", user_id)
    conn.commit()
    conn.close()
    return get_content(id, user_id)

@router.post("/{id}/publish")
def publish_content(id: str, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    conn.execute("UPDATE projects SET status = 'Published', stage = 'Published', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?", (id, user_id))
    log_activity(conn, id, "published", "Published content", user_id)
    conn.commit()
    conn.close()
    return get_content(id, user_id)

@router.patch("/{id}/status")
def update_status(id: str, req: ContentStatusUpdate, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    conn.execute("UPDATE projects SET status = ?, stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?", (req.status, req.status, id, user_id))
    log_activity(conn, id, "moved", f"Moved to {req.status}", user_id)
    conn.commit()
    conn.close()
    return get_content(id, user_id)

@router.get("/{id}/activity")
def get_activity(id: str, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM activity_logs WHERE project_id = ? AND user_id = ? ORDER BY created_at DESC", (id, user_id)).fetchall()
    conn.close()
    return [dict(r) for r in rows]
