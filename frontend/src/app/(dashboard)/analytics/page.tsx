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
          <BarChart3 className="w-7 h-7 text-white" />
          <span>Creator Intelligence & Analytics</span>
        </h1>
        <p className="text-sm text-[#A1A1A1] mt-1">
          Production velocity, multi-platform audience benchmarks, and AI content optimization tips.
        </p>
      </div>

      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-2" />
          <p className="text-xs text-[#A1A1A1]">Loading intelligence data...</p>
        </div>
      ) : (
        <>
          {/* SECTION 1: Actual Production Metrics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span>Verified Local Production Output</span>
              </h2>
              <span className="text-[11px] font-semibold text-white bg-[#151515] px-2.5 py-0.5 rounded border border-[#242424]">
                Live SQLite Stats
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-[#0F0F0F] border border-[#242424] space-y-1">
                <p className="text-xs text-[#A1A1A1]">Master Videos</p>
                <p className="text-3xl font-extrabold text-white">{prod?.total_videos_uploaded ?? 0}</p>
                <p className="text-[11px] text-[#6F6F6F]">Uploaded & Analyzed</p>
              </div>

              <div className="p-5 rounded-xl bg-[#0F0F0F] border border-[#242424] space-y-1">
                <p className="text-xs text-[#A1A1A1]">Short-Form Clips</p>
                <p className="text-3xl font-extrabold text-white">{prod?.total_clips_generated ?? 0}</p>
                <p className="text-[11px] text-[#6F6F6F]">Rendered via FFmpeg</p>
              </div>

              <div className="p-5 rounded-xl bg-[#0F0F0F] border border-[#242424] space-y-1">
                <p className="text-xs text-[#A1A1A1]">Active Projects</p>
                <p className="text-3xl font-extrabold text-white">{prod?.total_projects ?? 0}</p>
                <p className="text-[11px] text-[#6F6F6F]">In Pipeline</p>
              </div>

              <div className="p-5 rounded-xl bg-[#0F0F0F] border border-[#242424] space-y-1">
                <p className="text-xs text-[#A1A1A1]">AI Scripts Created</p>
                <p className="text-3xl font-extrabold text-white">{prod?.total_scripts ?? 0}</p>
                <p className="text-[11px] text-[#6F6F6F]">Generated & Saved</p>
              </div>
            </div>
          </div>

          {/* SECTION 2: Sample Benchmark Social Metrics (with required clear SAMPLE DATA labeling) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl bg-[#0A0A0A] border border-[#242424] text-xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#A1A1A1] flex-shrink-0" />
                <span className="text-[#A1A1A1]">
                  Social metrics below represent <strong className="text-white">Sample Benchmark Data</strong> for demonstration purposes.
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#151515] text-[#A1A1A1] border border-[#303030] self-start sm:self-auto">
                SAMPLE BENCHMARK DATA
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Reach Breakdown */}
              <div className="p-6 rounded-xl bg-[#0F0F0F] border border-[#242424] space-y-5">
                <h3 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>Estimated Reach by Platform</span>
                  <span className="text-[10px] text-[#6F6F6F] uppercase font-semibold">Sample Benchmarks</span>
                </h3>

                <div className="space-y-4">
                  {(bench?.platform_distribution || []).map((p) => (
                    <div key={p.platform} className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{p.platform}</span>
                        <span className="text-[#A1A1A1] font-mono font-bold">~{p.est_reach.toLocaleString()} views</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#151515] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-white"
                          style={{
                            width: `${Math.min(100, Math.max(20, (p.est_reach / 70000) * 100))}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Production Velocity Chart */}
              <div className="p-6 rounded-xl bg-[#0F0F0F] border border-[#242424] space-y-5">
                <h3 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>Weekly Clip Output Cadence</span>
                  <span className="text-[10px] text-[#6F6F6F] font-semibold font-mono">Velocity Tracker</span>
                </h3>

                <div className="flex items-end justify-between h-40 pt-4 px-2">
                  {(bench?.weekly_production_velocity || []).map((v) => (
                    <div key={v.day} className="flex flex-col items-center gap-2">
                      <div className="w-8 bg-[#151515] rounded-t-lg relative flex items-end justify-center h-28 overflow-hidden">
                        <div
                          className="w-full bg-white rounded-t-lg transition-all duration-300"
                          style={{ height: `${Math.min(100, Math.max(10, v.clips_created * 11))}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-[#A1A1A1]">{v.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: AI Strategy Recommendations */}
          <div className="p-6 rounded-xl bg-[#0F0F0F] border border-[#242424] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              <span>AI Content Strategy Recommendations</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recs.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl bg-[#0A0A0A] border border-[#242424] hover:border-[#303030] transition space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                      {rec.type.replace("_", " ")}
                    </span>
                    <h4 className="text-xs font-bold text-[#F5F5F5]">{rec.title}</h4>
                    <p className="text-[11px] text-[#A1A1A1] leading-relaxed">{rec.detail}</p>
                  </div>

                  <Link
                    href={rec.type === "retention" ? "/scripts" : rec.type === "format" ? "/editor" : "/studio"}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-white hover:text-gray-200 pt-2"
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
