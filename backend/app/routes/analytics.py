import json
import logging
from fastapi import APIRouter, Depends
from ..database import get_db_connection
from ..auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])
logger = logging.getLogger("backend.routes.analytics")

@router.get("/overview")
def get_analytics_overview(user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Real System Production Metrics
    video_count = cursor.execute("SELECT COUNT(*) FROM assets WHERE file_type LIKE '%video%' AND user_id = ?", (user_id,)).fetchone()[0]
    total_assets = cursor.execute("SELECT COUNT(*) FROM assets WHERE user_id = ?", (user_id,)).fetchone()[0]
    clips_count = cursor.execute("SELECT COUNT(*) FROM clips WHERE user_id = ?", (user_id,)).fetchone()[0]
    projects_count = cursor.execute("SELECT COUNT(*) FROM projects WHERE user_id = ?", (user_id,)).fetchone()[0]
    scripts_count = cursor.execute("SELECT COUNT(*) FROM scripts WHERE user_id = ?", (user_id,)).fetchone()[0]
    
    # Status distribution
    status_rows = cursor.execute("SELECT status, COUNT(*) as count FROM projects WHERE user_id = ? GROUP BY status", (user_id,)).fetchall()
    status_dist = {r["status"]: r["count"] for r in status_rows}
    
    # Recent activity logs
    act_rows = cursor.execute("SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 8", (user_id,)).fetchall()
    recent_activity = [
        {
            "id": r["id"],
            "project_id": r["project_id"],
            "action_type": r["action_type"],
            "description": r["description"],
            "created_at": r["created_at"]
        }
        for r in act_rows
    ]
    
    conn.close()
    
    sample_social_performance = {
        "is_sample_data": False,
        "metrics": {
            "estimated_impressions": 0,
            "avg_retention_rate": "0%",
            "top_performing_ratio": "N/A",
            "hours_saved_this_week": 0
        },
        "platform_distribution": [],
        "weekly_production_velocity": []
    }
    
    # 3. AI Content Strategy Recommendations
    recommendations = []
    
    return {
        "production_metrics": {
            "total_videos_uploaded": video_count,
            "total_assets": total_assets,
            "total_clips_generated": clips_count,
            "total_projects": projects_count,
            "total_scripts": scripts_count,
            "status_distribution": status_dist,
            "recent_activity": recent_activity
        },
        "benchmark_analytics": sample_social_performance,
        "ai_recommendations": recommendations
    }
