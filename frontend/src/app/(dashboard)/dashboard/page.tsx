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
    <div>
      {/* KPI Stats Vertical Column */}
      <div className="fixed right-2 md:right-2 top-[55%] -translate-y-1/2 flex flex-col gap-3 w-full max-w-[200px] z-10">
        <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 flex flex-col justify-between h-28 relative group transition-all shadow-sm hover:bg-white/30">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-800 group-hover:text-black transition-colors drop-shadow-sm">Uploaded Videos</span>
            <span className="text-[10px] text-gray-700 font-mono font-bold">01</span>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-black tracking-tighter drop-shadow-md">
              {loading ? "..." : (prod?.total_videos_uploaded ?? recentAssets.length)}
            </p>
            <span className="text-[10px] text-gray-800 font-bold uppercase tracking-wider">Master Assets</span>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 flex flex-col justify-between h-28 relative group transition-all shadow-sm hover:bg-white/30">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-800 group-hover:text-black transition-colors drop-shadow-sm">Generated Clips</span>
            <span className="text-[10px] text-gray-700 font-mono font-bold">02</span>
          </div>
          <div>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-extrabold text-black tracking-tighter drop-shadow-md">
                {loading ? "..." : (prod?.total_clips_generated ?? recentClips.length)}
              </p>

            </div>
            <span className="text-[10px] text-gray-800 font-bold uppercase tracking-wider">9:16 Shorts & Reels</span>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 flex flex-col justify-between h-28 relative group transition-all shadow-sm hover:bg-white/30">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-800 group-hover:text-black transition-colors drop-shadow-sm">Active Projects</span>
            <span className="text-[10px] text-gray-700 font-mono font-bold">03</span>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-black tracking-tighter drop-shadow-md">
              {loading ? "..." : (prod?.total_projects ?? projects.length)}
            </p>
            <span className="text-[10px] text-gray-800 font-bold uppercase tracking-wider">Pipeline Stages</span>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 flex flex-col justify-between h-28 relative group transition-all shadow-sm hover:bg-white/30">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-800 group-hover:text-black transition-colors drop-shadow-sm">Time Saved</span>
            <span className="text-[10px] text-gray-700 font-mono font-bold">04</span>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-black tracking-tighter drop-shadow-md">
              {loading ? "..." : `${bench?.metrics?.hours_saved_this_week ?? 0}h`}
            </p>
            <span className="text-[10px] text-gray-800 font-bold uppercase tracking-wider">Estimated This Week</span>
          </div>
        </div>
      </div>

    </div>
  );
}
