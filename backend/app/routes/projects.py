import uuid
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from ..database import get_db_connection
from ..schemas import ProjectCreate, ProjectUpdate, ProjectResponse
from ..services.job_manager import log_activity

router = APIRouter(prefix="/api/projects", tags=["Projects"])
logger = logging.getLogger("backend.routes.projects")

@router.get("", response_model=List[ProjectResponse])
def get_projects():
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT p.*,
            (SELECT COUNT(*) FROM assets WHERE project_id = p.id) as asset_count,
            (SELECT COUNT(*) FROM clips WHERE project_id = p.id) as clip_count
        FROM projects p
        ORDER BY p.updated_at DESC
    """).fetchall()
    conn.close()
    
    return [
        ProjectResponse(
            id=r["id"],
            title=r["title"],
            description=r["description"],
            status=r["status"],
            created_at=r["created_at"],
            updated_at=r["updated_at"],
            asset_count=r["asset_count"] or 0,
            clip_count=r["clip_count"] or 0
        )
        for r in rows
    ]

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str):
    conn = get_db_connection()
    row = conn.execute("""
        SELECT p.*,
            (SELECT COUNT(*) FROM assets WHERE project_id = p.id) as asset_count,
            (SELECT COUNT(*) FROM clips WHERE project_id = p.id) as clip_count
        FROM projects p
        WHERE p.id = ?
    """, (project_id,)).fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return ProjectResponse(
        id=row["id"],
        title=row["title"],
        description=row["description"],
        status=row["status"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        asset_count=row["asset_count"] or 0,
        clip_count=row["clip_count"] or 0
    )

@router.post("", response_model=ProjectResponse)
def create_project(req: ProjectCreate):
    project_id = f"proj_{uuid.uuid4().hex[:8]}"
    conn = get_db_connection()
    conn.execute(
        "INSERT INTO projects (id, title, description, status) VALUES (?, ?, ?, ?)",
        (project_id, req.title, req.description, req.status or "Idea")
    )
    conn.commit()
    conn.close()
    
    log_activity("project_created", f"Created new project '{req.title}'", project_id=project_id)
    
    return ProjectResponse(
        id=project_id,
        title=req.title,
        description=req.description,
        status=req.status or "Idea",
        created_at="Just now",
        updated_at="Just now",
        asset_count=0,
        clip_count=0
    )

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: str, req: ProjectUpdate):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")
        
    title = req.title if req.title is not None else row["title"]
    desc = req.description if req.description is not None else row["description"]
    status = req.status if req.status is not None else row["status"]
    
    conn.execute(
        "UPDATE projects SET title = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (title, desc, status, project_id)
    )
    conn.commit()
    conn.close()
    
    log_activity("project_updated", f"Updated project '{title}' status to '{status}'", project_id=project_id)
    return get_project(project_id)

@router.delete("/{project_id}")
def delete_project(project_id: str):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")
        
    conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()
    
    return {"message": "Project deleted successfully", "id": project_id}
