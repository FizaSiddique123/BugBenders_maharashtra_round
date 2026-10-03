"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Video,
  Film,
  Layers,
  Clock,
  Sparkles,
  Upload,
  PlusCircle,
  Play,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle,
  Loader2,
  FolderOpen,
  FileText,
  Zap
} from "lucide-react";
import { api, getMediaUrl } from "@/lib/api";
import { Asset, Clip, Project, Job, AnalyticsOverview } from "@/lib/types";
import { formatDuration, formatDate, formatBytes } from "@/lib/utils";

export default function OverviewDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [recentClips, setRecentClips] = useState<Clip[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creatingSample, setCreatingSample] = useState<boolean>(false);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [anData, asData, clData, prData, jbData] = await Promise.all([
        api.getAnalyticsOverview().catch(() => null),
        api.getAssets().catch(() => []),
        api.getClips().catch(() => []),
        api.getProjects().catch(() => []),
        api.getJobs("processing").catch(() => []),
      ]);

      if (anData) setAnalytics(anData);
      setRecentAssets(asData.slice(0, 4));
      setRecentClips(clData.slice(0, 4));
      setProjects(prData);
      setActiveJobs(jbData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleInstantDemo = async () => {
    try {
      setCreatingSample(true);
      await api.createSampleAsset();
      await loadDashboardData();
    } catch (err: any) {
      alert(`Demo generation notice: ${err.message || err}`);
    } finally {
      setCreatingSample(false);
    }
  };

  const prod = analytics?.production_metrics;
  const bench = analytics?.benchmark_analytics;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/20 p-6 md:p-8">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs font-semibold text-indigo-300">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>BitNBuild Hackathon MVP</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome to <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-white bg-clip-text text-transparent">CreatorAI OS</span>
            </h1>
            <p className="text-sm md:text-base text-slate-300">
              Transform master recordings into viral 9:16 short-form clips, generate scripts, and customize multi-platform content with Gemini AI.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleInstantDemo}
              disabled={creatingSample}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold bg-[#151c28] hover:bg-[#1f293d] text-cyan-300 border border-cyan-500/30 shadow-md transition disabled:opacity-50"
            >
              {creatingSample ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <Sparkles className="w-4 h-4 text-cyan-400" />}
              <span>Generate Demo Video</span>
            </button>

            <Link
              href="/media"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Video</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <div className="p-5 rounded-xl bg-[#0e131b] border border-[#1e2638] hover:border-indigo-500/40 transition flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Uploaded Videos</p>
            <p className="text-2xl font-bold text-white tracking-tight">
              {loading ? "..." : (prod?.total_videos_uploaded ?? recentAssets.length)}
            </p>
            <span className="text-[11px] text-indigo-400 font-medium">Master Assets</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0e131b] border border-[#1e2638] hover:border-cyan-500/40 transition flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Generated Clips</p>
            <p className="text-2xl font-bold text-white tracking-tight">
              {loading ? "..." : (prod?.total_clips_generated ?? recentClips.length)}
            </p>
            <span className="text-[11px] text-cyan-400 font-medium">9:16 Shorts & Reels</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0e131b] border border-[#1e2638] hover:border-emerald-500/40 transition flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Active Projects</p>
            <p className="text-2xl font-bold text-white tracking-tight">
              {loading ? "..." : (prod?.total_projects ?? projects.length)}
            </p>
            <span className="text-[11px] text-emerald-400 font-medium">Pipeline Stages</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0e131b] border border-[#1e2638] hover:border-purple-500/40 transition flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Time Saved</p>
            <p className="text-2xl font-bold text-white tracking-tight">
              {loading ? "..." : `${bench?.metrics?.hours_saved_this_week ?? 12.5} hrs`}
            </p>
            <span className="text-[11px] text-purple-400 font-medium">Estimated This Week</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section: Left (Recent Generated Clips & Assets), Right (Workflow & Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Generated Clips Showcase */}
          <div className="p-6 rounded-2xl bg-[#0e131b] border border-[#1e2638] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Film className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Generated Short-Form Clips</h2>
              </div>
              <Link
                href="/editor"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Video Editor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentClips.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[#121824] border border-dashed border-[#1e2638]">
                <Film className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-300">No short clips generated yet.</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Open AI Studio or run highlight extraction on any video to auto-render vertical clips.
                </p>
                <Link
                  href="/studio"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition inline-flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open AI Studio</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="group relative rounded-xl overflow-hidden bg-[#121824] border border-[#1e2638] hover:border-indigo-500/40 transition flex flex-col justify-between"
                  >
                    <div className="relative aspect-[9/16] max-h-56 bg-slate-950 flex items-center justify-center overflow-hidden">
                      {clip.thumbnail_path ? (
                        <img
                          src={getMediaUrl(clip.thumbnail_path)}
                          alt={clip.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <Film className="w-12 h-12 text-slate-700" />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600/90 text-white shadow">
                        {clip.aspect_ratio}
                      </div>

                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-black/60 text-slate-200">
                        {formatDuration(clip.duration)}
                      </div>

                      <Link
                        href={`/editor?clipId=${clip.id}`}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200"
                      >
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                          <Play className="w-5 h-5 ml-0.5 fill-current" />
                        </div>
                      </Link>
                    </div>

                    <div className="p-3.5 space-y-2">
                      <h3 className="text-xs font-semibold text-slate-100 line-clamp-1">{clip.title}</h3>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="capitalize">{clip.caption_style.replace("_", " ")} captions</span>
                        <Link
                          href={`/editor?clipId=${clip.id}`}
                          className="text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          Edit & Render →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Master Video Assets */}
          <div className="p-6 rounded-2xl bg-[#0e131b] border border-[#1e2638] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Master Media Assets</h2>
              </div>
              <Link href="/media" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                <span>View Library</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#1e2638]">
              {recentAssets.map((asset) => (
                <div key={asset.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-[#151c28] border border-[#1e2638] overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {asset.thumbnail_path ? (
                        <img src={getMediaUrl(asset.thumbnail_path)} alt={asset.filename} className="w-full h-full object-cover" />
                      ) : (
                        <Video className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{asset.filename}</p>
                      <p className="text-[11px] text-slate-400">
                        {formatDuration(asset.duration)} • {formatBytes(asset.size_bytes)} • {formatDate(asset.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/studio?assetId=${asset.id}`}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Analyze</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Workflow Stages & Activity) */}
        <div className="space-y-6">
          {/* Quick Launchpad Card */}
          <div className="p-5 rounded-2xl bg-[#0e131b] border border-[#1e2638] space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Creator Quick Actions</span>
            </h3>
            <div className="grid grid-cols-1 gap-2 pt-1">
              <Link
                href="/scripts"
                className="flex items-center justify-between p-3 rounded-xl bg-[#121824] hover:bg-[#192233] border border-[#1e2638] text-xs font-medium text-slate-200 transition"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Generate Script & Hooks</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>

              <Link
                href="/studio"
                className="flex items-center justify-between p-3 rounded-xl bg-[#121824] hover:bg-[#192233] border border-[#1e2638] text-xs font-medium text-slate-200 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Extract Video Highlights</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>

              <Link
                href="/calendar"
                className="flex items-center justify-between p-3 rounded-xl bg-[#121824] hover:bg-[#192233] border border-[#1e2638] text-xs font-medium text-slate-200 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Kanban Content Workflow</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
            </div>
          </div>

          {/* Content Workflow Status */}
          <div className="p-5 rounded-2xl bg-[#0e131b] border border-[#1e2638] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Workflow Pipeline</span>
              </h3>
              <Link href="/calendar" className="text-[11px] text-indigo-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-3 rounded-xl bg-[#121824] border border-[#1e2638] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-200 truncate">{proj.title}</p>
                    <p className="text-[11px] text-slate-400">{proj.clip_count ?? 0} clips generated</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    proj.status === "Published"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : proj.status === "Clip Generated"
                      ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                      : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                  }`}>
                    {proj.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="p-5 rounded-2xl bg-[#0e131b] border border-[#1e2638] space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Recent Activity</span>
            </h3>

            <div className="space-y-3 pt-1">
              {(prod?.recent_activity || []).slice(0, 5).map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-300 leading-snug">{act.description}</p>
                    <span className="text-[10px] text-slate-500">{formatDate(act.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
