export interface Asset {
  id: string;
  project_id?: string | null;
  filename: string;
  filepath: string;
  file_type: string;
  duration: number;
  size_bytes: number;
  status: 'uploaded' | 'processing' | 'ready' | 'failed';
  thumbnail_path?: string | null;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface Transcript {
  id: string;
  asset_id: string;
  full_text: string;
  segments: TranscriptSegment[];
  duration: number;
  source: string;
  created_at: string;
}

export interface HighlightItem {
  id?: string;
  start_time: number;
  end_time: number;
  duration?: number;
  hook: string;
  title: string;
  summary: string;
  reason: string;
  platforms: string[];
  virality_score?: number;
}

export interface HighlightsResponse {
  asset_id: string;
  summary: string;
  highlights: HighlightItem[];
  model?: string;
}

export interface Clip {
  id: string;
  project_id?: string | null;
  asset_id: string;
  highlight_id?: string | null;
  title: string;
  output_path: string;
  video_url: string;
  thumbnail_path?: string | null;
  thumbnail_url?: string | null;
  duration: number;
  aspect_ratio: string;
  captions_enabled: boolean;
  caption_style: string;
  status: 'rendering' | 'ready' | 'failed';
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  status: 'Idea' | 'Script' | 'Video Uploaded' | 'AI Analysis' | 'Clip Generated' | 'Review' | 'Ready to Publish' | 'Published';
  created_at: string;
  updated_at: string;
  asset_count?: number;
  clip_count?: number;
}

export interface ContentItem {
  id: string;
  title: string;
  description?: string | null;
  content_type?: string | null;
  platforms?: string[] | null;
  status: string;
  stage?: string | null;
  priority?: string | null;
  campaign?: string | null;
  tags?: string[] | null;
  assigned_to?: string | null;
  source_video_id?: string | null;
  script_id?: string | null;
  hook_id?: string | null;
  clip_id?: string | null;
  thumbnail_url?: string | null;
  caption?: string | null;
  cta?: string | null;
  due_date?: string | null;
  scheduled_at?: string | null;
  timezone?: string | null;
  created_at: string;
  updated_at: string;
  
  asset?: Asset | null;
  highlights_count?: number;
  ai_job_status?: string | null;
}

export interface ScriptSection {
  section: string;
  content: string;
  duration_sec: number;
}

export interface GeneratedScript {
  topic: string;
  platform?: string;
  tone?: string;
  title: string;
  hooks: string[];
  opening_statement: string;
  main_content: ScriptSection[];
  closing_statement: string;
  call_to_action: string;
  full_script: string;
  caption?: string;
  hashtags: string[];
}

export interface ScriptComparison {
  adherence_score: number;
  summary: string;
  matching_sections: Array<{
    script_part: string;
    spoken_at_time: number;
    transcript_match: string;
  }>;
  missing_sections: string[];
  additional_content: Array<{
    timestamp: number;
    note: string;
  }>;
  key_talking_points: Array<{
    topic: string;
    timestamp: number;
    covered: boolean;
  }>;
}

export interface PlatformPackage {
  instagram: {
    title: string;
    hook: string;
    caption: string;
    hashtags: string[];
  };
  youtube_shorts: {
    title: string;
    short_description: string;
    description: string;
    hashtags: string[];
  };
  linkedin: {
    opening_statement: string;
    caption: string;
    call_to_action: string;
    hashtags: string[];
  };
}

export interface Job {
  id: string;
  job_type: string;
  asset_id?: string | null;
  clip_id?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string | null;
  result?: any;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsOverview {
  production_metrics: {
    total_videos_uploaded: number;
    total_assets: number;
    total_clips_generated: number;
    total_projects: number;
    total_scripts: number;
    status_distribution: Record<string, number>;
    recent_activity: Array<{
      id: string;
      project_id?: string;
      action_type: string;
      description: string;
      created_at: string;
    }>;
  };
  benchmark_analytics: {
    is_sample_data: boolean;
    badge_label: string;
    description: string;
    metrics: {
      estimated_impressions: number;
      avg_retention_rate: string;
      top_performing_ratio: string;
      hours_saved_this_week: number;
    };
    platform_distribution: Array<{
      platform: string;
      clips_formatted: number;
      est_reach: number;
      color: string;
    }>;
    weekly_production_velocity: Array<{
      day: string;
      videos_processed: number;
      clips_created: number;
    }>;
  };
  ai_recommendations: Array<{
    id: string;
    type: string;
    title: string;
    detail: string;
    action_text: string;
  }>;
}
