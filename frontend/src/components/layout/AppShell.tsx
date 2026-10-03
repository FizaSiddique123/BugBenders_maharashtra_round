"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Sparkles,
  FileText,
  Video,
  Calendar,
  BarChart3,
  Settings,
  Flame,
  PlusCircle,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  ChevronRight,
  Menu,
  X
} from "lucide-react";

import { api } from "@/lib/api";
import { Job } from "@/lib/types";

const NAV_ITEMS = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Media Library", href: "/media", icon: Film },
  { name: "AI Studio", href: "/studio", icon: Sparkles, badge: "AI" },
  { name: "Script Generator", href: "/scripts", icon: FileText },
  { name: "Video Editor", href: "/editor", icon: Video },
  { name: "Content Calendar", href: "/calendar", icon: Calendar },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Poll for background jobs every 4 seconds
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const jobs = await api.getJobs("processing");
        setActiveJobs(jobs || []);
        const health = await api.getHealth();
        setGeminiConfigured(health.gemini_configured);
      } catch (err) {
        // Backend not yet reachable or polling silently
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#090c10] text-[#f0f6fc]">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#1e2638] bg-[#0c1017] p-4 sticky top-0 h-screen z-30 justify-between">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-between px-2 py-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                  CreatorAI
                </span>
                <span className="block text-[10px] font-medium tracking-wider uppercase text-cyan-400">
                  OS v1.0 • Hackathon
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#151c28]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Workspace & Job Status */}
        <div className="space-y-3 pt-4 border-t border-[#1e2638]">
          {/* Active Job Tracker */}
          {activeJobs.length > 0 ? (
            <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 mb-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>AI Processing ({activeJobs.length})</span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                {activeJobs[0].job_type.replace("_", " ")}...
              </p>
              <div className="w-full bg-[#151c28] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${Math.max(15, activeJobs[0].progress)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 rounded-lg bg-[#121824] border border-[#1e2638] flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Engine Ready
              </span>
              <span className="text-[10px] text-slate-500 font-mono">16GB RAM OK</span>
            </div>
          )}

          {/* AI Connection Pill */}
          <Link
            href="/settings"
            className="flex items-center justify-between p-2 rounded-lg bg-[#121824] border border-[#1e2638] hover:border-slate-600 transition text-xs"
          >
            <div className="flex items-center gap-2">
              <Sparkles className={`w-3.5 h-3.5 ${geminiConfigured ? "text-cyan-400" : "text-amber-400"}`} />
              <span className="text-slate-300 text-[12px]">Gemini 1.5</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              geminiConfigured
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}>
              {geminiConfigured ? "Connected" : "Smart Fallback"}
            </span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-[#1e2638] bg-[#0c1017]/80 backdrop-blur-md sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-[#151c28] text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-sm md:text-base font-semibold text-slate-100 flex items-center gap-2">
                <span>Creator Operating System</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  MVP Active
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/media"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#151c28] hover:bg-[#1e2638] text-slate-200 border border-[#1e2638] transition"
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Upload Video</span>
            </Link>

            <Link
              href="/studio"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-md shadow-indigo-600/20 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Studio</span>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0c1017] border-b border-[#1e2638] p-4 space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                    isActive ? "bg-indigo-600/20 text-indigo-300 font-semibold" : "text-slate-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Page Content View */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
