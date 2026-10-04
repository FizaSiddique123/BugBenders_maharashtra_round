import os
import uuid
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
import google.oauth2.credentials
import google_auth_oauthlib.flow
from googleapiclient.discovery import build

from ..database import get_db_connection
from ..auth import get_current_user
from ..utils.encryption import encrypt, decrypt

router = APIRouter(prefix="/api/integrations/youtube", tags=["YouTube Integration"])
logger = logging.getLogger("backend.routes.youtube")

# Note: In production, these should be securely stored in .env
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/dashboard/integrations/youtube/callback")
# Because we are using client secret without a client_secret.json file directly:
CLIENT_CONFIG = {
    "web": {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": [REDIRECT_URI]
    }
}

SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly"
]

@router.get("/connect")
def connect_youtube(user_id: str = Depends(get_current_user)):
    """Initiates the OAuth flow and returns the Google Auth URL"""
    if not CLIENT_ID or not CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="YouTube OAuth credentials not configured on the server")
        
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        CLIENT_CONFIG,
        scopes=SCOPES
    )
    flow.redirect_uri = REDIRECT_URI
    
    # We use state to pass the user_id securely to the callback
    state = f"{user_id}::{uuid.uuid4().hex}"
    
    auth_url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',
        state=state
    )
    return {"url": auth_url}

@router.post("/callback")
def youtube_callback(request_body: dict):
    """Exchanges auth code for tokens and stores connection"""
    code = request_body.get("code")
    state = request_body.get("state")
    
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")
        
    parts = state.split("::")
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
        
    user_id = parts[0]
    
    try:
        flow = google_auth_oauthlib.flow.Flow.from_client_config(
            CLIENT_CONFIG,
            scopes=SCOPES,
            state=state
        )
        flow.redirect_uri = REDIRECT_URI
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Build YouTube service to get channel info
        youtube = build('youtube', 'v3', credentials=credentials)
        request = youtube.channels().list(
            part="snippet",
            mine=True
        )
        response = request.execute()
        
        if not response.get('items'):
            raise HTTPException(status_code=404, detail="No YouTube channel found for this Google account")
            
        channel = response['items'][0]
        channel_id = channel['id']
        channel_name = channel['snippet']['title']
        channel_thumbnail = channel['snippet']['thumbnails']['default']['url']
        
        # Calculate expiry
        expiry = None
        if credentials.expiry:
            expiry = credentials.expiry.isoformat()
            
        # Store in database
        conn = get_db_connection()
        conn.execute("""
            INSERT INTO platform_connections 
            (id, user_id, platform, channel_id, channel_name, channel_thumbnail, access_token, refresh_token, token_expiry, scopes, status, last_synced_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, platform) DO UPDATE SET
                channel_id=excluded.channel_id,
                channel_name=excluded.channel_name,
                channel_thumbnail=excluded.channel_thumbnail,
                access_token=excluded.access_token,
                refresh_token=excluded.refresh_token,
                token_expiry=excluded.token_expiry,
                status='connected',
                last_synced_at=CURRENT_TIMESTAMP,
                updated_at=CURRENT_TIMESTAMP
        """, (
            f"conn_{uuid.uuid4().hex[:8]}",
            user_id,
            "youtube",
            channel_id,
            channel_name,
            channel_thumbnail,
            encrypt(credentials.token),
            encrypt(credentials.refresh_token) if credentials.refresh_token else None,
            expiry,
            json.dumps(SCOPES),
            "connected"
        ))
        conn.commit()
        conn.close()
        
        return {"success": True, "channel_name": channel_name}
        
    except Exception as e:
        logger.error(f"YouTube callback failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to connect YouTube account")

@router.get("/status")
def get_youtube_status(user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM platform_connections WHERE user_id = ? AND platform = 'youtube'", (user_id,)).fetchone()
    conn.close()
    
    if not row or row["status"] != "connected":
        return {"connected": False}
        
    return {
        "connected": True,
        "channel_id": row["channel_id"],
        "channel_name": row["channel_name"],
        "channel_thumbnail": row["channel_thumbnail"],
        "last_synced_at": row["last_synced_at"]
    }

@router.post("/disconnect")
def disconnect_youtube(user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    conn.execute("DELETE FROM platform_connections WHERE user_id = ? AND platform = 'youtube'", (user_id,))
    conn.commit()
    conn.close()
    return {"success": True}

def get_valid_youtube_service(user_id: str):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM platform_connections WHERE user_id = ? AND platform = 'youtube'", (user_id,)).fetchone()
    conn.close()
    
    if not row or row["status"] != "connected":
        raise HTTPException(status_code=400, detail="YouTube not connected")
        
    token = decrypt(row["access_token"])
    refresh_token = decrypt(row["refresh_token"]) if row["refresh_token"] else None
    
    creds = google.oauth2.credentials.Credentials(
        token=token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET
    )
    
    if creds.expired and creds.refresh_token:
        try:
            import google.auth.transport.requests
            request = google.auth.transport.requests.Request()
            creds.refresh(request)
            
            # Update DB with new token
            new_expiry = creds.expiry.isoformat() if creds.expiry else None
            conn = get_db_connection()
            conn.execute("UPDATE platform_connections SET access_token = ?, token_expiry = ? WHERE id = ?", 
                         (encrypt(creds.token), new_expiry, row["id"]))
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Failed to refresh YouTube token: {e}")
            conn = get_db_connection()
            conn.execute("UPDATE platform_connections SET status = 'reauth_required' WHERE id = ?", (row["id"],))
            conn.commit()
            conn.close()
            raise HTTPException(status_code=401, detail="YouTube connection expired. Please reconnect.")
            
    return build('youtubeAnalytics', 'v2', credentials=creds)

@router.post("/sync")
def sync_youtube_analytics(days: int = 28, user_id: str = Depends(get_current_user)):
    try:
        # Get DB row
        conn = get_db_connection()
        row = conn.execute("SELECT * FROM platform_connections WHERE user_id = ? AND platform = 'youtube'", (user_id,)).fetchone()
        conn.close()
        
        if not row or row["status"] != "connected":
            raise HTTPException(status_code=400, detail="YouTube not connected")
            
        channel_id = row["channel_id"]
        analytics_service = get_valid_youtube_service(user_id)
        
        # Calculate dates
        end_date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        start_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime('%Y-%m-%d')
        
        response = analytics_service.reports().query(
            ids=f"channel==MINE",
            startDate=start_date,
            endDate=end_date,
            metrics="views,estimatedMinutesWatched,averageViewDuration,likes,comments,subscribersGained,subscribersLost"
        ).execute()
        
        # Update last synced
        conn = get_db_connection()
        conn.execute("UPDATE platform_connections SET last_synced_at = CURRENT_TIMESTAMP WHERE id = ?", (row["id"],))
        conn.commit()
        conn.close()
        
        rows = response.get("rows", [])
        if not rows:
            return {
                "views": 0, "watch_time_minutes": 0, "avg_view_duration_seconds": 0,
                "likes": 0, "comments": 0, "net_subscribers": 0
            }
            
        data = rows[0]
        return {
            "views": data[0],
            "watch_time_minutes": data[1],
            "avg_view_duration_seconds": data[2],
            "likes": data[3],
            "comments": data[4],
            "net_subscribers": data[5] - data[6]
        }
        
    except Exception as e:
        logger.error(f"YouTube analytics sync failed: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to fetch YouTube analytics")
