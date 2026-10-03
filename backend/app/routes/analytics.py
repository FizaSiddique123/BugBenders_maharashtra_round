import json
import logging
from fastapi import APIRouter
from ..database import get_db_connection

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])
logger = logging.getLogger("backend.routes.analytics")

@router.get("/overview")
def get_analytics_overview():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Real System Production Metrics
    video_count = cursor.execute("SELECT COUNT(*) FROM assets WHERE file_type LIKE '%video%'").fetchone()[0]
    total_assets = cursor.execute("SELECT COUNT(*) FROM assets").fetchone()[0]
    clips_count = cursor.execute("SELECT COUNT(*) FROM clips").fetchone()[0]
    projects_count = cursor.execute("SELECT COUNT(*) FROM projects").fetchone()[0]
    scripts_count = cursor.execute("SELECT COUNT(*) FROM scripts").fetchone()[0]
    
    # Status distribution
    status_rows = cursor.execute("SELECT status, COUNT(*) as count FROM projects GROUP BY status").fetchall()
    status_dist = {r["status"]: r["count"] for r in status_rows}
    
    # Recent activity logs
    act_rows = cursor.execute("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 8").fetchall()
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
    
    # 2. Clearly labeled Sample Benchmark Data (as explicitly required by prompt)
    sample_social_performance = {
        "is_sample_data": True,
        "badge_label": "SAMPLE BENCHMARK DATA",
        "description": "Projected social performance benchmarks for short-form clips across platforms.",
        "metrics": {
            "estimated_impressions": 142500,
            "avg_retention_rate": "68.4%",
            "top_performing_ratio": "9:16 Vertical",
            "hours_saved_this_week": round(clips_count * 2.5 + 4.0, 1)
        },
        "platform_distribution": [
            {"platform": "Instagram Reels", "clips_formatted": max(1, clips_count), "est_reach": 48200, "color": "#E1306C"},
            {"platform": "YouTube Shorts", "clips_formatted": max(1, clips_count), "est_reach": 64100, "color": "#FF0000"},
            {"platform": "LinkedIn Video", "clips_formatted": max(1, clips_count), "est_reach": 19800, "color": "#0A66C2"},
            {"platform": "TikTok", "clips_formatted": max(1, clips_count), "est_reach": 10400, "color": "#00F2FE"}
        ],
        "weekly_production_velocity": [
            {"day": "Mon", "videos_processed": 2, "clips_created": 6},
            {"day": "Tue", "videos_processed": 1, "clips_created": 4},
            {"day": "Wed", "videos_processed": 3, "clips_created": 9},
            {"day": "Thu", "videos_processed": 1, "clips_created": 3},
            {"day": "Fri", "videos_processed": max(1, video_count), "clips_created": max(1, clips_count)},
            {"day": "Sat", "videos_processed": 0, "clips_created": 0},
            {"day": "Sun", "videos_processed": 0, "clips_created": 0}
        ]
    }
    
    # 3. AI Content Strategy Recommendations
    recommendations = [
        {
            "id": "rec_01",
            "type": "retention",
            "title": "Front-load Stronger Questions in Hooks",
            "detail": "Videos opening with a direct question or contrarian statement achieve 22% higher 3-second retention.",
            "action_text": "Generate Hook Variations"
        },
        {
            "id": "rec_02",
            "type": "format",
            "title": "Adopt Bold Yellow Captions for Shorts",
            "detail": "9:16 vertical videos with high-contrast highlighted subtitles retain mobile viewers without sound.",
            "action_text": "Apply Subtitle Style"
        },
        {
            "id": "rec_03",
            "type": "multi_channel",
            "title": "Expand LinkedIn Repurposing",
            "detail": "B2B and tech insights perform exceptionally well when adapted into professional bulleted posts.",
            "action_text": "Adapt for LinkedIn"
        }
    ]
    
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
