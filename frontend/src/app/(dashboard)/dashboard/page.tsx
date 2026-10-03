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
  Zap,
  Trash2
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

  const handleDeleteClip = async (clipId: string) => {
    if (!confirm("Are you sure you want to delete this clip?")) return;
    try {
      await api.deleteClip(clipId);
      setRecentClips(prev => prev.filter(c => c.id !== clipId));
      // Optionally reload all stats
      loadDashboardData();
    } catch (err: any) {
      alert(`Failed to delete clip: ${err.message}`);
    }
  };

  const prod = analytics?.production_metrics;
  const bench = analytics?.benchmark_analytics;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded border border-[#222222] bg-[#0A0A0A] p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          <span className="text-[15rem] font-bold text-white opacity-[0.02] select-none tracking-tighter">
            STUDIO
          </span>
        </div>

        <div className="relative z-10 space-y-4 max-w-3xl">
          <span className="premium-label tracking-[0.2em] block mb-2">Creator Workspace</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Creator Operating System
          </h1>
          <p className="text-sm md:text-base text-[#888888] font-medium max-w-xl mx-auto">
            Turn long-form content into publish-ready assets. Upload master recordings, extract highlights, generate scripts, and automate distribution.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/media"
              className="inline-flex items-center justify-center px-6 py-3 rounded bg-white text-black text-sm font-bold shadow-lg hover:bg-[#E8E8E8] transition-colors"
            >
              + New Project
            </Link>

            <button
              onClick={handleInstantDemo}
              disabled={creatingSample}
              className="inline-flex items-center justify-center px-6 py-3 rounded bg-[#0A0A0A] text-white text-sm font-bold border border-[#303030] hover:bg-[#151515] hover:border-[#444444] transition-all disabled:opacity-50 group"
            >
              {creatingSample ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2 text-[#888888] group-hover:text-white transition-colors" />}
              <span>Generate Demo</span>
            </button>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-md mt-6 group">
          <hr className="border-t border-[#303030] transition-colors duration-500 group-hover:border-white" />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <div className="card-monochrome p-5 rounded border-t-2 border-t-[#303030] hover:border-t-white flex flex-col justify-between h-32 relative group">
          <div className="flex justify-between items-start">
            <span className="premium-label group-hover:text-white transition-colors">Uploaded Videos</span>
            <span className="text-[10px] text-[#444444] font-mono">01</span>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white tracking-tighter">
              {loading ? "..." : (prod?.total_videos_uploaded ?? recentAssets.length)}
            </p>
            <span className="text-[10px] text-[#666666] font-medium uppercase tracking-wider">Master Assets</span>
          </div>
        </div>

        <div className="card-monochrome p-5 rounded border-t-2 border-t-[#303030] hover:border-t-white flex flex-col justify-between h-32 relative group">
          <div className="flex justify-between items-start">
            <span className="premium-label group-hover:text-white transition-colors">Generated Clips</span>
            <span className="text-[10px] text-[#444444] font-mono">02</span>
          </div>
          <div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-extrabold text-white tracking-tighter">
                {loading ? "..." : (prod?.total_clips_generated ?? recentClips.length)}
              </p>
              {!loading && (prod?.total_clips_generated ?? recentClips.length) > 0 && (
                <span className="text-[10px] text-white font-bold mb-1 flex items-center">↑ 12%</span>
              )}
            </div>
            <span className="text-[10px] text-[#666666] font-medium uppercase tracking-wider">9:16 Shorts & Reels</span>
          </div>
        </div>

        <div className="card-monochrome p-5 rounded border-t-2 border-t-[#303030] hover:border-t-white flex flex-col justify-between h-32 relative group">
          <div className="flex justify-between items-start">
            <span className="premium-label group-hover:text-white transition-colors">Active Projects</span>
            <span className="text-[10px] text-[#444444] font-mono">03</span>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white tracking-tighter">
              {loading ? "..." : (prod?.total_projects ?? projects.length)}
            </p>
            <span className="text-[10px] text-[#666666] font-medium uppercase tracking-wider">Pipeline Stages</span>
          </div>
        </div>

        <div className="card-monochrome p-5 rounded border-t-2 border-t-[#303030] hover:border-t-white flex flex-col justify-between h-32 relative group">
          <div className="flex justify-between items-start">
            <span className="premium-label group-hover:text-white transition-colors">Time Saved</span>
            <span className="text-[10px] text-[#444444] font-mono">04</span>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white tracking-tighter">
              {loading ? "..." : `${bench?.metrics?.hours_saved_this_week ?? 12.5}h`}
            </p>
            <span className="text-[10px] text-[#666666] font-medium uppercase tracking-wider">Estimated This Week</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section: Left (Recent Generated Clips & Assets), Right (Workflow & Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Generated Clips Showcase */}
          <div className="p-6 rounded-xl bg-[#0F0F0F] border border-[#242424] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Film className="w-5 h-5 text-white" />
                <h2 className="text-base font-bold text-white">Generated Short-Form Clips</h2>
              </div>
              <Link
                href="/editor"
                className="text-xs font-semibold text-[#A1A1A1] hover:text-white flex items-center gap-1"
              >
                <span>Video Editor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentClips.length === 0 ? (
              <div className="py-16 text-center rounded border border-dashed border-[#222222] flex flex-col items-center justify-center">
                <Film className="w-8 h-8 text-[#444444] mx-auto mb-4" />
                <span className="premium-label mb-2">YOUR EDITING SPACE</span>
                <p className="text-sm font-medium text-[#888888] max-w-sm mb-6">
                  Generated clips will appear here once CreatorAI finds the strongest moments in your recordings.
                </p>
                <Link
                  href="/studio"
                  className="px-6 py-2.5 rounded bg-white text-black text-xs font-bold hover:bg-[#E8E8E8] transition-colors mb-8"
                >
                  Open AI Studio
                </Link>

                <div className="flex items-center text-[10px] font-semibold tracking-wider text-[#555555] uppercase w-full max-w-md justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#555555]"></span>
                    <span>Upload</span>
                  </div>
                  <div className="h-px bg-[#333333] flex-1 mx-3"></div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#333333]"></span>
                    <span>Analyze</span>
                  </div>
                  <div className="h-px bg-[#333333] flex-1 mx-3"></div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#333333]"></span>
                    <span>Select</span>
                  </div>
                  <div className="h-px bg-[#333333] flex-1 mx-3"></div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#333333]"></span>
                    <span>Create</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="group relative rounded-xl overflow-hidden bg-[#0A0A0A] border border-[#242424] hover:border-[#303030] transition flex flex-col justify-between"
                  >
                    <div className="relative aspect-[9/16] max-h-56 bg-black flex items-center justify-center overflow-hidden">
                      {clip.thumbnail_path ? (
                        <img
                          src={getMediaUrl(clip.thumbnail_path)}
                          alt={clip.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90 group-hover:opacity-100"
                        />
                      ) : (
                        <Film className="w-12 h-12 text-[#242424]" />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-white text-black shadow">
                        {clip.aspect_ratio}
                      </div>

                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-black/60 text-white backdrop-blur-sm border border-white/10">
                        {formatDuration(clip.duration)}
                      </div>

                      <Link
                        href={`/editor?clipId=${clip.id}`}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200 z-10"
                      >
                        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                          <Play className="w-5 h-5 ml-0.5 fill-current" />
                        </div>
                      </Link>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteClip(clip.id);
                        }}
                        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 hover:bg-[#242424] text-white opacity-0 group-hover:opacity-100 transition-all z-20 shadow-md transform hover:scale-110"
                        title="Delete Clip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-3.5 space-y-2 border-t border-[#242424]">
                      <h3 className="text-xs font-semibold text-white line-clamp-1">{clip.title}</h3>
                      <div className="flex items-center justify-between text-[11px] text-[#A1A1A1]">
                        <span className="capitalize">{clip.caption_style.replace("_", " ")} captions</span>
                        <Link
                          href={`/editor?clipId=${clip.id}`}
                          className="text-white font-medium"
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
          <div className="p-6 rounded-xl bg-[#0F0F0F] border border-[#242424] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-5 h-5 text-white" />
                <h2 className="text-base font-bold text-white">Master Media Assets</h2>
              </div>
              <Link href="/media" className="text-xs font-semibold text-[#A1A1A1] hover:text-white flex items-center gap-1">
                <span>View Library</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#242424]">
              {recentAssets.map((asset) => (
                <div key={asset.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded bg-[#151515] border border-[#303030] overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {asset.thumbnail_path ? (
                        <img src={getMediaUrl(asset.thumbnail_path)} alt={asset.filename} className="w-full h-full object-cover" />
                      ) : (
                        <Video className="w-5 h-5 text-[#6F6F6F]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#F5F5F5] truncate">{asset.filename}</p>
                      <p className="text-[11px] text-[#A1A1A1]">
                        {formatDuration(asset.duration)} • {formatBytes(asset.size_bytes)} • {formatDate(asset.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/studio?assetId=${asset.id}`}
                      className="px-2.5 py-1.5 rounded text-xs font-medium bg-[#151515] hover:bg-[#1F1F1F] text-[#F5F5F5] border border-[#303030] transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-white" />
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
          <div className="space-y-3">
            <h3 className="premium-label ml-1">Creator Command Center</h3>
            <div className="grid grid-cols-1 gap-2">
              <Link
                href="/scripts"
                className="btn-primary-arrow group flex items-start justify-between p-4 rounded bg-[#0A0A0A] border border-[#222222] hover:bg-[#111111] hover:border-[#333333] transition-all"
              >
                <div className="flex gap-3">
                  <span className="text-[10px] text-[#555555] font-mono mt-0.5">01</span>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Generate Script & Hooks</h4>
                    <p className="text-[11px] text-[#888888] mt-0.5">Turn an idea into a structured script.</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#666666] group-hover:text-white arrow-icon mt-0.5" />
              </Link>

              <Link
                href="/studio"
                className="btn-primary-arrow group flex items-start justify-between p-4 rounded bg-[#0A0A0A] border border-[#222222] hover:bg-[#111111] hover:border-[#333333] transition-all"
              >
                <div className="flex gap-3">
                  <span className="text-[10px] text-[#555555] font-mono mt-0.5">02</span>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Extract Video Highlights</h4>
                    <p className="text-[11px] text-[#888888] mt-0.5">Find moments worth turning into shorts.</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#666666] group-hover:text-white arrow-icon mt-0.5" />
              </Link>

              <Link
                href="/calendar"
                className="btn-primary-arrow group flex items-start justify-between p-4 rounded bg-[#0A0A0A] border border-[#222222] hover:bg-[#111111] hover:border-[#333333] transition-all"
              >
                <div className="flex gap-3">
                  <span className="text-[10px] text-[#555555] font-mono mt-0.5">03</span>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Content Workflow</h4>
                    <p className="text-[11px] text-[#888888] mt-0.5">Track every project from idea to publish.</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#666666] group-hover:text-white arrow-icon mt-0.5" />
              </Link>
            </div>
          </div>

          {/* Content Workflow Timeline */}
          <div className="pt-6 space-y-4">
            <h3 className="premium-label ml-1">Pipeline Timeline</h3>
            <div className="p-5 rounded bg-[#0D0D0D] border border-[#222222] overflow-x-auto">
              <div className="flex items-center text-[10px] font-bold tracking-widest uppercase min-w-max">
                <span className="text-white">01 IDEA</span>
                <span className="mx-2 text-[#444]">—</span>
                <span className="text-white">02 SCRIPT</span>
                <span className="mx-2 text-[#444]">—</span>
                <span className="text-white">03 RECORD</span>
                <span className="mx-2 text-[#444]">—</span>
                <span className="text-[#666]">04 ANALYZE</span>
                <span className="mx-2 text-[#333]">—</span>
                <span className="text-[#444]">05 EDIT</span>
                <span className="mx-2 text-[#333]">—</span>
                <span className="text-[#333]">06 PUBLISH</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="pt-6 space-y-3">
            <h3 className="premium-label ml-1">Recent Activity</h3>

            <div className="relative pl-3 space-y-6 border-l border-[#222222] ml-2">
              {(prod?.recent_activity?.length ?? 0) > 0 ? (
                (prod?.recent_activity || []).slice(0, 5).map((act, i) => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-white border-2 border-[#080808]" />
                    <div className="pl-4">
                      <p className="text-xs font-semibold text-white">{act.description.split('\n')[0] || act.description}</p>
                      {act.description.split('\n')[1] && (
                        <p className="text-[11px] text-[#888888] mt-0.5">{act.description.split('\n')[1]}</p>
                      )}
                      <span className="text-[10px] text-[#555555] font-mono mt-1 block">{formatDate(act.created_at)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="relative">
                  <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-[#333333] border-2 border-[#080808]" />
                  <div className="pl-4">
                    <p className="text-xs text-[#666666]">No activity yet.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
