import {
  Asset,
  Transcript,
  HighlightsResponse,
  Clip,
  Project,
  GeneratedScript,
  ScriptComparison,
  PlatformPackage,
  Job,
  AnalyticsOverview,
  ContentItem
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export function getMediaUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  // If it's a backend storage route like /storage/clips/...
  if (pathOrUrl.startsWith("/storage")) {
    return `${API_BASE}${pathOrUrl}`;
  }
  // If it's a local relative file path like storage/uploads/xyz.mp4
  const normalized = pathOrUrl.replace(/\\/g, "/");
  const storageIndex = normalized.indexOf("storage/");
  if (storageIndex !== -1) {
    return `${API_BASE}/${normalized.substring(storageIndex)}`;
  }
  return `${API_BASE}/${pathOrUrl}`;
}

let _getToken: (() => Promise<string | null>) | null = null;
export function setAuthTokenProvider(provider: () => Promise<string | null>) {
  _getToken = provider;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const headers: Record<string, string> = {
      ...options.headers as Record<string, string>,
    };

    if (_getToken) {
      const token = await _getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errData.detail || `Request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    // Error is thrown to the caller; do not console.error here to prevent Next.js dev overlay from showing expected 404s
    throw err;
  }
}

export const api = {
  // Health & Settings
  getHealth: () => request<{ status: string; gemini_configured: boolean; storage_path: string }>("/api/health"),
  getSettings: () => request<{ gemini_api_key_status: string; is_configured: boolean; storage_dir: string; ffmpeg_available: boolean }>("/api/settings"),
  updateSettings: (gemini_api_key: string) => request<{ message: string; is_configured: boolean }>("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gemini_api_key }),
  }),

  // Assets
  getAssets: (projectId?: string) => {
    const query = projectId ? `?project_id=${projectId}` : "";
    return request<Asset[]>(`/api/assets${query}`);
  },
  getAsset: (assetId: string) => request<Asset>(`/api/assets/${assetId}`),
  uploadAsset: async (file: File, projectId?: string, autoTranscribe: boolean = true) => {
    const formData = new FormData();
    formData.append("file", file);
    if (projectId) formData.append("project_id", projectId);
    formData.append("auto_transcribe", String(autoTranscribe));

    const headers: Record<string, string> = {};
    if (_getToken) {
      const token = await _getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const res = await fetch(`${API_BASE}/api/assets/upload`, {
      method: "POST",
      body: formData,
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Upload failed");
    }
    return (await res.json()) as Asset;
  },

  deleteAsset: (assetId: string) => request<{ message: string; id: string }>(`/api/assets/${assetId}`, { method: "DELETE" }),

  // Transcription
  getTranscription: (assetId: string) => request<Transcript>(`/api/transcription/${assetId}`),
  triggerTranscription: (assetId: string) => request<{ message: string; job_id: string; asset_id: string }>(`/api/transcription/${assetId}`, { method: "POST" }),

  // Highlights
  getHighlights: (assetId: string) => request<HighlightsResponse>(`/api/highlights/${assetId}`),
  generateHighlights: (assetId: string) => request<HighlightsResponse>(`/api/highlights/${assetId}`, { method: "POST" }),

  // Clips
  getClips: (assetId?: string, projectId?: string) => {
    const params = new URLSearchParams();
    if (assetId) params.append("asset_id", assetId);
    if (projectId) params.append("project_id", projectId);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<Clip[]>(`/api/clips${qs}`);
  },
  getClip: (clipId: string) => request<Clip>(`/api/clips/${clipId}`),
  generateClip: (params: {
    asset_id: string;
    project_id?: string;
    start_time: number;
    end_time: number;
    title?: string;
    aspect_ratio?: string;
    captions_enabled?: boolean;
    caption_style?: string;
  }) => request<{ message: string; clip_id: string; job_id: string; aspect_ratio: string }>("/api/clips/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  }),
  renderModifiedClip: (clipId: string, params: {
    start_time: number;
    end_time: number;
    aspect_ratio?: string;
    captions_enabled?: boolean;
    caption_style?: string;
    custom_subtitles?: any[];
  }) => request<{ message: string; clip_id: string; job_id: string }>(`/api/clips/${clipId}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clip_id: clipId, ...params }),
  }),
  deleteClip: (clipId: string) => request<{ message: string; id: string }>(`/api/clips/${clipId}`, { method: "DELETE" }),

  // Projects
  getProjects: () => request<Project[]>("/api/projects"),
  getProject: (projectId: string) => request<Project>(`/api/projects/${projectId}`),
  createProject: (title: string, description?: string, status: string = "Idea") => request<Project>("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, status }),
  }),
  updateProject: (projectId: string, updates: Partial<Project>) => request<Project>(`/api/projects/${projectId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  }),
  deleteProject: (projectId: string) => request<{ message: string; id: string }>(`/api/projects/${projectId}`, { method: "DELETE" }),

  // Scripts
  generateScript: (params: {
    topic: string;
    target_audience?: string;
    platform?: string;
    tone?: string;
    desired_duration?: number;
    content_category?: string;
    project_id?: string;
    asset_id?: string;
    transcript?: string;
  }) => request<GeneratedScript>("/api/scripts/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  }),
  compareScript: (script_text: string, asset_id: string) => request<ScriptComparison>("/api/scripts/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ script_text, asset_id }),
  }),
  saveScript: (scriptData: any) => request<{ message: string; script_id: string }>("/api/scripts/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scriptData),
  }),
  getScripts: (projectId?: string) => {
    const qs = projectId ? `?project_id=${projectId}` : "";
    return request<any[]>(`/api/scripts${qs}`);
  },
  generateHooks: (content: string, asset_id?: string, transcript?: string) => request<{ hooks: Array<{hook: string, type: string, reason: string, score: number}> }>("/api/hooks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, asset_id, transcript }),
  }),

  // Platform Adaptation
  adaptContent: (params: {
    title: string;
    summary: string;
    hook?: string;
    transcript_text?: string;
  }) => request<PlatformPackage>("/api/platform/adapt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  }),

  // Content Calendar / Management
  getContents: () => request<ContentItem[]>("/api/content"),
  getContent: (id: string) => request<ContentItem>(`/api/content/${id}`),
  getCalendar: () => request<ContentItem[]>("/api/content/calendar"),
  createContent: (data: Partial<ContentItem>) => request<ContentItem>("/api/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }),
  updateContent: (id: string, data: Partial<ContentItem>) => request<ContentItem>(`/api/content/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }),
  deleteContent: (id: string) => request<{ message: string }>(`/api/content/${id}`, { method: "DELETE" }),
  scheduleContent: (id: string, scheduled_at: string, timezone: string = "UTC") => request<ContentItem>(`/api/content/${id}/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduled_at, timezone }),
  }),
  rescheduleContent: (id: string, scheduled_at: string, timezone: string = "UTC") => request<ContentItem>(`/api/content/${id}/reschedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduled_at, timezone }),
  }),
  unscheduleContent: (id: string) => request<ContentItem>(`/api/content/${id}/unschedule`, { method: "POST" }),
  publishContent: (id: string) => request<ContentItem>(`/api/content/${id}/publish`, { method: "POST" }),
  updateContentStatus: (id: string, status: string) => request<ContentItem>(`/api/content/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }),
  getContentActivity: (id: string) => request<any[]>(`/api/content/${id}/activity`),

  // Analytics
  getAnalyticsOverview: () => request<AnalyticsOverview>("/api/analytics/overview"),

  // Jobs
  getJobs: (status?: string) => {
    const qs = status ? `?status=${status}` : "";
    return request<Job[]>(`/api/jobs${qs}`);
  },
  getJob: (jobId: string) => request<Job>(`/api/jobs/${jobId}`),
};
