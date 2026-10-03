import sqlite3
import json
import logging
from typing import Dict, Any, List, Optional
from .config import DB_PATH

logger = logging.getLogger("backend.database")

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes SQLite database schema with indexes."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Projects table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'Idea', -- 'Idea', 'Script', 'Video Uploaded', 'AI Analysis', 'Clip Generated', 'Review', 'Ready to Publish', 'Published'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Assets table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        file_type TEXT NOT NULL,
        duration REAL DEFAULT 0.0,
        size_bytes INTEGER DEFAULT 0,
        status TEXT DEFAULT 'ready', -- 'uploaded', 'processing', 'ready', 'failed'
        thumbnail_path TEXT,
        metadata_json TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL
    )
    """)
    
    # Transcripts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transcripts (
        id TEXT PRIMARY KEY,
        asset_id TEXT NOT NULL UNIQUE,
        full_text TEXT,
        segments_json TEXT,
        source TEXT,
        duration REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE
    )
    """)
    
    # Highlights table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS highlights (
        id TEXT PRIMARY KEY,
        asset_id TEXT NOT NULL,
        start_time REAL NOT NULL,
        end_time REAL NOT NULL,
        hook TEXT,
        title TEXT,
        summary TEXT,
        reason TEXT,
        platforms_json TEXT,
        virality_score INTEGER DEFAULT 85,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE
    )
    """)
    
    # Clips table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS clips (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        asset_id TEXT NOT NULL,
        highlight_id TEXT,
        title TEXT,
        output_path TEXT NOT NULL,
        thumbnail_path TEXT,
        duration REAL DEFAULT 0.0,
        aspect_ratio TEXT DEFAULT '9:16',
        captions_enabled INTEGER DEFAULT 1,
        caption_style TEXT DEFAULT 'bold_yellow',
        edit_spec_json TEXT,
        status TEXT DEFAULT 'ready', -- 'rendering', 'ready', 'failed'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL,
        FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE
    )
    """)
    
    # Scripts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scripts (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        topic TEXT NOT NULL,
        target_audience TEXT,
        platform TEXT,
        tone TEXT,
        title TEXT,
        hooks_json TEXT,
        main_content_json TEXT,
        full_script TEXT,
        caption TEXT,
        hashtags_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL
    )
    """)
    
    # Processing Jobs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS processing_jobs (
        id TEXT PRIMARY KEY,
        job_type TEXT NOT NULL, -- 'transcription', 'highlight_detection', 'clip_render', 'sample_generation'
        asset_id TEXT,
        clip_id TEXT,
        status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
        progress INTEGER DEFAULT 0,
        error TEXT,
        result_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Activity logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        action_type TEXT NOT NULL,
        description TEXT NOT NULL,
        metadata_json TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Create indexes for performance
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_assets_project ON assets(project_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_clips_asset ON clips(asset_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_highlights_asset ON highlights(asset_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_transcripts_asset ON transcripts(asset_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_jobs_status ON processing_jobs(status);")
    
    conn.commit()
    conn.close()
    logger.info("SQLite database schema initialized successfully.")
