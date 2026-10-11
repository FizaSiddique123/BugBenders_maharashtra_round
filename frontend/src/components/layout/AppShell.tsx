"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Folder,
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
import { UserButton, SignInButton, useAuth } from "@clerk/nextjs";

import { api, setAuthTokenProvider } from "@/lib/api";
import { Job } from "@/lib/types";

const NAV_GROUPS = [
  {
    label: "WORKSPACE",
    items: [
      { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { name: "Media Library", href: "/media", icon: Folder },
      { name: "AI Studio", href: "/studio", icon: Sparkles },
    ],
  },
  {
    label: "PRODUCTION",
    items: [
      { name: "Script Generator", href: "/scripts", icon: FileText },
      { name: "Video Editor", href: "/editor", icon: Video },
      { name: "Content Calendar", href: "/calendar", icon: Calendar },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "SYSTEM",
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
  const { isLoaded, userId, getToken } = useAuth();

  if (typeof window !== "undefined") {
    setAuthTokenProvider(getToken);
  }

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

  const isBlurredBackground = pathname !== "/dashboard" && pathname !== "/analytics" && pathname !== "/";

  return (
    <div className="flex min-h-screen text-[#18181B] bg-[#E9E9E9] relative">
      {/* Dedicated Background Layer */}
      <div
        className={`fixed inset-0 z-0 transition-all duration-300 ${isBlurredBackground ? 'blur-[20px] scale-[1.05]' : ''}`}
        style={{
          backgroundImage: 'url("/bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Subtle Overlay for Blurred Pages */}
      <div
        className={`fixed inset-0 z-0 transition-opacity duration-300 pointer-events-none ${isBlurredBackground ? 'opacity-100 bg-[#E9E9E9]/50' : 'opacity-0'}`}
      />

      {/* Main Foreground Container */}
      <div className="relative z-10 flex w-full">
        {/* Sidebar Desktop */}
        <aside className="hidden md:flex flex-col w-64 bg-transparent py-8 pl-6 pr-5 sticky top-0 h-screen z-30">
          <div className="space-y-8">
            {/* Logo */}
            <div className="flex items-center px-1">
              <Link href="/dashboard" className="flex items-center gap-3.5">
                <div className="w-[34px] h-[34px] rounded-[10px] bg-[#18181B] flex items-center justify-center shadow-sm">
                  <LayoutDashboard className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-[22px] tracking-tight text-[#18181B]">
                  CreatorAI
                </span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="space-y-5">
              {NAV_GROUPS.map((group, index) => (
                <React.Fragment key={group.label}>
                  <div className="space-y-1.5">
                    <h3 className="px-1 text-[11px] uppercase tracking-wider font-bold text-[#6B7280] mb-3">
                      {group.label}
                    </h3>
                    <nav className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`group relative flex items-center gap-3.5 px-1 py-2 text-[15px] transition-all duration-150 ${isActive
                              ? "text-[#18181B] font-bold"
                              : "text-[#4B5563] font-medium hover:text-[#18181B]"
                              }`}
                          >
                            {isActive && (
                              <div className="absolute -left-7 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#9BF044] rounded-r-md" />
                            )}
                            <Icon className={`w-[20px] h-[20px] ${isActive ? "text-[#18181B]" : "text-[#4B5563] group-hover:text-[#18181B]"}`} strokeWidth={isActive ? 2.5 : 2} />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                  {index < NAV_GROUPS.length - 1 && (
                    <div className="h-px bg-[#C4C4C4] w-full opacity-70 my-2" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-transparent">
          {/* Top Header */}
          <header className="h-20 sticky top-0 z-20 px-6 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-full bg-black/80 backdrop-blur-md text-white border border-white/10 hover:bg-black transition-colors shadow-lg"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <Link href="/dashboard" className="md:hidden flex items-center gap-2">
                <div className="w-[28px] h-[28px] rounded-[8px] bg-[#18181B] flex items-center justify-center shadow-sm">
                  <LayoutDashboard className="w-[14px] h-[14px] text-white" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-[17px] tracking-tight text-[#18181B]">
                  CreatorAI
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/media"
                className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-black/80 backdrop-blur-md border border-white/10 hover:bg-black shadow-lg transition cursor-pointer"
              >
                <span>+ Upload</span>
              </Link>

              <Link
                href="/studio"
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-semibold text-white bg-black/80 backdrop-blur-md border border-white/10 hover:bg-black shadow-lg transition cursor-pointer"
              >
                <span>AI Studio</span>
              </Link>

              <div className="ml-1 sm:ml-2 flex items-center min-w-[28px]">
                {isLoaded && userId && (
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-[34px] h-[34px] rounded-full flex items-center justify-center text-xs font-semibold text-white bg-black/80 backdrop-blur-md border border-white/10 shadow-lg",
                      userButtonTrigger: "hover:bg-black transition cursor-pointer rounded-full",
                      avatarImage: "w-[34px] h-[34px] rounded-full"
                    }
                  }}
                />
                )}
                {isLoaded && !userId && (
                  <SignInButton mode="modal">
                    <button className="text-xs font-semibold text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 hover:bg-black transition cursor-pointer shadow-lg">
                      Sign In
                    </button>
                  </SignInButton>
                )}
              </div>
            </div>
          </header>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden mx-4 mb-4 bg-white/95 backdrop-blur-xl border border-black/10 rounded-2xl p-4 space-y-4 shadow-2xl z-30">
              {NAV_GROUPS.map((group) => (
                <div key={group.label} className="space-y-1">
                  <div className="px-2 text-[10px] uppercase tracking-wider font-bold text-[#6B7280] mb-1">{group.label}</div>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${isActive ? "bg-[#18181B] text-white font-semibold" : "text-[#4B5563] hover:bg-black/5 hover:text-[#18181B]"
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
            {!isLoaded ? (
              <div className="w-full h-full flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#18181B]/50" />
              </div>
            ) : children}
          </main>
        </div>
      </div>
    </div>
  );
}
