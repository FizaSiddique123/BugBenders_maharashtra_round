"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Video,
  Film,
  Layers,
  Clock,
  Sparkles,
  Info,
  CheckCircle,
  Share2,
  Globe,
  Loader2,
  ArrowRight
} from "lucide-react";

import { api } from "@/lib/api";
import { AnalyticsOverview } from "@/lib/types";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getAnalyticsOverview()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const prod = data?.production_metrics;
  const bench = data?.benchmark_analytics;
  const recs = data?.ai_recommendations || [];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <BarChart3 className="w-7 h-7 text-indigo-400" />
          <span>Creator Intelligence & Analytics</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Production velocity, multi-platform audience benchmarks, and AI content optimization tips.
        </p>
      </div>

      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading intelligence data...</p>
        </div>
      ) : (
        <>
          {/* SECTION 1: Actual Production Metrics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Verified Local Production Output</span>
              </h2>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Live SQLite Stats
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#0e131b] border border-[#1e2638] space-y-1">
                <p className="text-xs text-slate-400">Master Videos</p>
                <p className="text-3xl font-extrabold text-white">{prod?.total_videos_uploaded ?? 0}</p>
                <p className="text-[11px] text-indigo-400">Uploaded & Analyzed</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0e131b] border border-[#1e2638] space-y-1">
                <p className="text-xs text-slate-400">Short-Form Clips</p>
                <p className="text-3xl font-extrabold text-white">{prod?.total_clips_generated ?? 0}</p>
                <p className="text-[11px] text-cyan-400">Rendered via FFmpeg</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0e131b] border border-[#1e2638] space-y-1">
                <p className="text-xs text-slate-400">Active Projects</p>
                <p className="text-3xl font-extrabold text-white">{prod?.total_projects ?? 0}</p>
                <p className="text-[11px] text-emerald-400">In Pipeline</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0e131b] border border-[#1e2638] space-y-1">
                <p className="text-xs text-slate-400">AI Scripts Created</p>
                <p className="text-3xl font-extrabold text-white">{prod?.total_scripts ?? 0}</p>
                <p className="text-[11px] text-purple-400">Generated & Saved</p>
              </div>
            </div>
          </div>

          {/* SECTION 2: Sample Benchmark Social Metrics (with required clear SAMPLE DATA labeling) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-slate-300">
                  Social metrics below represent <strong className="text-amber-300">Sample Benchmark Data</strong> for demonstration purposes.
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 self-start sm:self-auto">
                SAMPLE BENCHMARK DATA
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Reach Breakdown */}
              <div className="p-6 rounded-2xl bg-[#0e131b] border border-[#1e2638] space-y-5">
                <h3 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>Estimated Reach by Platform</span>
                  <span className="text-[10px] text-amber-400 uppercase font-semibold">Sample Benchmarks</span>
                </h3>

                <div className="space-y-4">
                  {(bench?.platform_distribution || []).map((p) => (
                    <div key={p.platform} className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{p.platform}</span>
                        <span className="text-slate-400 font-mono font-bold">~{p.est_reach.toLocaleString()} views</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#121824] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(20, (p.est_reach / 70000) * 100))}%`,
                            backgroundColor: p.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Production Velocity Chart */}
              <div className="p-6 rounded-2xl bg-[#0e131b] border border-[#1e2638] space-y-5">
                <h3 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>Weekly Clip Output Cadence</span>
                  <span className="text-[10px] text-cyan-400 font-semibold font-mono">Velocity Tracker</span>
                </h3>

                <div className="flex items-end justify-between h-40 pt-4 px-2">
                  {(bench?.weekly_production_velocity || []).map((v) => (
                    <div key={v.day} className="flex flex-col items-center gap-2">
                      <div className="w-8 bg-[#121824] rounded-t-lg relative flex items-end justify-center h-28 overflow-hidden">
                        <div
                          className="w-full bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t-lg transition-all duration-300"
                          style={{ height: `${Math.min(100, Math.max(10, v.clips_created * 11))}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">{v.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: AI Strategy Recommendations */}
          <div className="p-6 rounded-2xl bg-[#0e131b] border border-[#1e2638] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI Content Strategy Recommendations</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recs.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl bg-[#121824] border border-[#1e2638] hover:border-indigo-500/40 transition space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      {rec.type.replace("_", " ")}
                    </span>
                    <h4 className="text-xs font-bold text-slate-100">{rec.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{rec.detail}</p>
                  </div>

                  <Link
                    href={rec.type === "retention" ? "/scripts" : rec.type === "format" ? "/editor" : "/studio"}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 pt-2"
                  >
                    <span>{rec.action_text}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
