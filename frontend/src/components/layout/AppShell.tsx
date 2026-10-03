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

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { name: "Overview", href: "/", icon: LayoutDashboard },
      { name: "Media Library", href: "/media", icon: Film },
      { name: "AI Studio", href: "/studio", icon: Sparkles },
    ],
  },
  {
    label: "Production",
    items: [
      { name: "Script Generator", href: "/scripts", icon: FileText },
      { name: "Video Editor", href: "/editor", icon: Video },
      { name: "Content Calendar", href: "/calendar", icon: Calendar },
    ],
  },
  {
    label: "Insights",
    items: [
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  }
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
    <div className="flex min-h-screen bg-[#050505] text-[#F5F5F5]">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#151515] bg-[#070707] p-4 sticky top-0 h-screen z-30 justify-between">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-between px-2 py-1 pb-4 border-b border-[#242424]">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-black" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-white">
                  CreatorAI
                </span>
                <span className="block text-[10px] font-medium tracking-wider uppercase text-[#6F6F6F]">
                  Creator Operating System
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="space-y-6 pt-2">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="space-y-1">
                <h3 className="px-3 text-[10px] uppercase tracking-[0.08em] font-semibold text-[#666666] mb-2">
                  {group.label}
                </h3>
                <nav className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center justify-between px-3 py-2 rounded text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? "bg-[#111111] text-white relative"
                            : "text-[#888888] hover:text-[#EEEEEE] hover:bg-[#0A0A0A]"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[60%] bg-[#EEEEEE] rounded-r-full" />
                        )}
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-white" : "text-[#666666] group-hover:text-[#AAAAAA]"}`} />
                          <span>{item.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Workspace & Job Status */}
        <div className="space-y-3 pt-4 border-t border-[#242424]">
          {/* Active Job Tracker */}
          {activeJobs.length > 0 ? (
            <div className="p-3 rounded-lg bg-[#0F0F0F] border border-[#242424]">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F5F5F5] mb-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F5F5F5]" />
                <span>Processing ({activeJobs.length})</span>
              </div>
              <p className="text-[11px] text-[#A1A1A1] truncate">
                {activeJobs[0].job_type.replace("_", " ")}...
              </p>
              <div className="w-full bg-[#050505] h-1.5 rounded-full mt-2 overflow-hidden border border-[#242424]">
                <div
                  className="bg-white h-full transition-all duration-300"
                  style={{ width: `${Math.max(15, activeJobs[0].progress)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 rounded-lg bg-[#0F0F0F] border border-[#242424] flex items-center justify-between text-xs text-[#A1A1A1]">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#6F6F6F]"></span>
                Ready
              </span>
              <span className="text-[10px] text-[#6F6F6F] font-mono">OK</span>
            </div>
          )}

          {/* AI Connection Pill */}
          <Link
            href="/settings"
            className="flex items-center justify-between p-2 rounded-lg bg-[#0F0F0F] border border-[#242424] hover:border-[#303030] transition text-xs"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-[#A1A1A1]" />
              <span className="text-[#A1A1A1] text-[12px]">System</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              geminiConfigured
                ? "bg-[#151515] text-[#F5F5F5] border border-[#242424]"
                : "bg-[#151515] text-[#A1A1A1] border border-[#242424]"
            }`}>
              {geminiConfigured ? "Connected" : "Fallback"}
            </span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col min-w-0 bg-[#080808]" 
        style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #111111 0%, #080808 60%)' }}
      >
        {/* Top Header */}
        <header className="h-16 border-b border-[#151515] bg-[#080808]/80 backdrop-blur-md sticky top-0 z-20 px-6 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded bg-[#0A0A0A] text-[#888888] border border-[#222222]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-3">
              <span className="premium-label tracking-[0.1em]">Creator Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/media"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-transparent hover:bg-[#141414] text-[#F5F5F5] border border-[#303030] transition"
            >
              <span>+ Upload</span>
            </Link>

            <Link
              href="/studio"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold bg-white hover:bg-slate-200 text-black transition"
            >
              <span>AI Studio</span>
            </Link>
            
            <div className="w-7 h-7 rounded-full bg-[#141414] border border-[#303030] ml-2 flex items-center justify-center text-[10px] font-bold text-white">
              C
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#070707] border-b border-[#151515] p-4 space-y-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-2 text-[10px] uppercase tracking-[0.08em] font-semibold text-[#666666] mb-1">{group.label}</div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded text-sm ${
                        isActive ? "bg-[#111111] text-[#F5F5F5] font-semibold border-l-2 border-[#EEEEEE]" : "text-[#888888]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
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
