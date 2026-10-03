import json
import logging
import uuid
from typing import List
from fastapi import APIRouter, HTTPException
from ..database import get_db_connection
from ..schemas import HighlightsResponse, HighlightItem
from ai_engine.highlight_detector import detect_highlights

router = APIRouter(prefix="/api/highlights", tags=["Highlights"])
logger = logging.getLogger("backend.routes.highlights")

@router.get("/{asset_id}", response_model=HighlightsResponse)
def get_highlights(asset_id: str):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM highlights WHERE asset_id = ? ORDER BY start_time ASC", (asset_id,)).fetchall()
    conn.close()
    
    if not rows:
        raise HTTPException(status_code=404, detail="No highlights found for this asset. Run highlight detection first.")
        
    items = []
    for r in rows:
        platforms = json.loads(r["platforms_json"]) if r["platforms_json"] else ["instagram", "youtube", "linkedin"]
        items.append(HighlightItem(
            id=r["id"],
            start_time=r["start_time"],
            end_time=r["end_time"],
            duration=round(r["end_time"] - r["start_time"], 2),
            hook=r["hook"] or "",
            title=r["title"] or "",
            summary=r["summary"] or "",
            reason=r["reason"] or "",
            platforms=platforms,
            virality_score=r["virality_score"] or 88
        ))
        
    return HighlightsResponse(
        asset_id=asset_id,
        summary="High-retention short-form clip opportunities detected by AI.",
        highlights=items,
        model="gemini-1.5-flash"
    )

@router.post("/{asset_id}", response_model=HighlightsResponse)
def generate_highlights(asset_id: str):
    conn = get_db_connection()
    asset = conn.execute("SELECT * FROM assets WHERE id = ?", (asset_id,)).fetchone()
    transcript_row = conn.execute("SELECT * FROM transcripts WHERE asset_id = ?", (asset_id,)).fetchone()
    conn.close()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if not transcript_row:
        raise HTTPException(status_code=400, detail="Transcript required for highlight detection. Please transcribe first.")
        
    segments_raw = json.loads(transcript_row["segments_json"]) if transcript_row["segments_json"] else []
    transcript_data = {
        "full_text": transcript_row["full_text"],
        "segments": segments_raw,
        "duration": transcript_row["duration"] or asset["duration"] or 60.0
    }
    
    hls_result = detect_highlights(transcript_data, transcript_data["duration"])
    
    # Store in DB
    conn = get_db_connection()
    conn.execute("DELETE FROM highlights WHERE asset_id = ?", (asset_id,))
    
    items = []
    for h in hls_result.get("highlights", []):
        hl_id = f"hl_{uuid.uuid4().hex[:8]}"
        platforms = h.get("platforms", ["instagram", "youtube", "linkedin"])
        conn.execute(
            """
            INSERT INTO highlights (id, asset_id, start_time, end_time, hook, title, summary, reason, platforms_json, virality_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                hl_id,
                asset_id,
                h["start_time"],
                h["end_time"],
                h["hook"],
                h["title"],
                h["summary"],
                h["reason"],
                json.dumps(platforms),
                h.get("virality_score", 88)
            )
        )
        items.append(HighlightItem(
            id=hl_id,
            start_time=h["start_time"],
            end_time=h["end_time"],
            duration=round(h["end_time"] - h["start_time"], 2),
            hook=h["hook"],
            title=h["title"],
            summary=h["summary"],
            reason=h["reason"],
            platforms=platforms,
            virality_score=h.get("virality_score", 88)
        ))
        
    conn.commit()
    conn.close()
    
    return HighlightsResponse(
        asset_id=asset_id,
        summary=hls_result.get("summary", "Highlights detected successfully."),
        highlights=items,
        model=hls_result.get("model", "gemini-1.5-flash")
    )
