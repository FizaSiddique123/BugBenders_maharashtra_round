"use client";

import React, { useState, useEffect } from "react";
import {
  MoreHorizontal,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  User,
  Search,
  Bell,
  Plus,
  Play,
  SkipBack,
  SkipForward,
  Video,
  FileText,
  Settings
} from "lucide-react";
import { api } from "@/lib/api";
import { AnalyticsOverview } from "@/lib/types";
import Link from "next/link";

// ============================================================================
// SVG LINE CHART
// ============================================================================
function SmoothLineChart({ lightOn, points }: { lightOn: boolean, points: number[] }) {
  const width = 600;
  const height = 100; // Reduced height
  
  const max = Math.max(...points, 10);
  const min = 0;
  const stepX = width / (points.length - 1);
  
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = height - ((p - min) / (max - min)) * height;
    return { x, y };
  });

  let path = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const cp1x = p1.x + (p2.x - p1.x) / 2;
    const cp1y = p1.y;
    const cp2x = p1.x + (p2.x - p1.x) / 2;
    const cp2y = p2.y;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  const areaPath = `${path} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="relative w-full h-full flex items-end">
      <svg viewBox={`0 -10 ${width} ${height + 20}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lightOn ? "rgba(255, 214, 107, 0.4)" : "rgba(255, 255, 255, 0.2)"} />
            <stop offset="100%" stopColor={lightOn ? "rgba(255, 214, 107, 0.0)" : "rgba(255, 255, 255, 0.0)"} />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={lightOn ? "#FFD66B" : "#FFFFFF"} />
            <stop offset="100%" stopColor={lightOn ? "#FFF1C7" : "#AAAAAA"} />
          </linearGradient>
        </defs>

        <path d={areaPath} fill="url(#areaGrad)" className="transition-all duration-700" />
        <path
          d={path}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          className="animate-[draw_1.5s_ease-out_forwards] transition-all duration-700"
          strokeDasharray="2000"
          strokeDashoffset="2000"
        />
        
        {coords.map((c, i) => (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r={3} fill={lightOn ? "#FFD66B" : "#FFF"} className="transition-all duration-700 opacity-50 hover:opacity-100 cursor-pointer" />
            <circle cx={c.x} cy={c.y} r={15} fill="transparent" className="cursor-pointer" />
          </g>
        ))}
      </svg>
      <style jsx>{`@keyframes draw { to { stroke-dashoffset: 0; } }`}</style>
    </div>
  );
}

// ============================================================================
// SVG BAR CHART
// ============================================================================
function BarChart({ lightOn }: { lightOn: boolean }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const values = [40, 60, 30, 80, 50, 90, 70];
  const max = 100;

  return (
    <div className="flex items-end justify-between w-full h-full pt-2">
      {values.map((val, i) => {
        const heightPct = (val / max) * 100;
        const isActive = i === 5; 
        
        return (
          <div key={days[i]} className="flex flex-col items-center gap-1.5 w-full">
            {/* Reduced h-16 to h-12 */}
            <div className="w-1.5 md:w-2 bg-white/10 rounded-full h-12 relative flex items-end">
              <div 
                className={`w-full rounded-full transition-all duration-700 ${
                  isActive ? (lightOn ? "bg-[#FFD66B] shadow-[0_0_10px_#FFD66B]" : "bg-white shadow-[0_0_10px_#FFF]") : "bg-white/30"
                }`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className={`text-[9px] font-semibold ${isActive ? "text-white" : "text-gray-500"}`}>
              {days[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [lightOn, setLightOn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    api.getAnalyticsOverview().then(setData).catch(console.error);
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const prod = data?.production_metrics;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black font-sans selection:bg-white/20">
      
      {/* 1. INTERIOR ROOM BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="/living-room.jpg" 
          alt="Interior Room" 
          className="absolute inset-0 w-full h-full object-cover grayscale-[70%] blur-[100px] opacity-70 scale-110"
        />
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Ambient Room Light (when lamp is ON) */}
        <div 
          className={`absolute top-[15vh] right-[2%] w-[800px] h-[800px] bg-[#FFD66B] rounded-full blur-[160px] transition-all duration-700 transform -translate-x-1/2 -translate-y-1/2 ${
            lightOn ? "opacity-[0.25] scale-100" : "opacity-0 scale-90"
          }`}
        />
      </div>

      {/* FOREGROUND HANGING LAMP */}
      <div 
        className="absolute top-0 right-[2%] hidden lg:flex flex-col items-center z-[60] cursor-pointer group"
        onClick={() => setLightOn(!lightOn)}
        title="Toggle physical room light"
      >
        <div className="w-[2px] h-[15vh] bg-gradient-to-b from-black to-[#222] transition-colors group-hover:from-black group-hover:to-[#444]" />
        <div className="w-20 h-10 bg-[#111] group-hover:bg-[#1a1a1a] transition-colors rounded-t-[40px] rounded-b-sm relative border-b-2 border-black/80 shadow-2xl">
           <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-2 bg-white/20 rounded-full" />
           <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-14 h-6 bg-[#FFD66B] rounded-full blur-[8px] transition-opacity duration-700 ${lightOn ? "opacity-100" : "opacity-0 group-hover:opacity-30"}`} />
        </div>
      </div>

      {/* 2. MAIN FLOATING DASHBOARD */}
      <div 
        className={`relative z-10 w-[82vw] h-[90vh] rounded-[28px] overflow-hidden flex flex-col md:flex-row shadow-[0_30px_100px_rgba(0,0,0,0.35)] transition-all duration-1000 transform ${
          isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        } ${
          lightOn 
            ? "bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.2)]" 
            : "bg-[rgba(255,255,255,0.10)] border-[rgba(255,255,255,0.20)]"
        }`}
        style={{ backdropFilter: "blur(25px)", WebkitBackdropFilter: "blur(25px)" }}
      >
        
        {/* Reflection on the glass from the external lamp */}
        <div className={`absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#FFD66B]/10 to-transparent transition-opacity duration-700 pointer-events-none ${lightOn ? "opacity-100" : "opacity-0"}`} />



        {/* RIGHT MAIN AREA */}
        <div className="flex-1 flex flex-col relative overflow-hidden z-20 hide-scrollbar">
          
          {/* TOP NAVIGATION & CONTROLS */}
          {/* Reduced py-6 to py-4 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 gap-4 shrink-0">
            
            {/* 4. SEARCH BAR */}
            <div className="flex items-center gap-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-full px-4 py-2 w-full sm:w-72 backdrop-blur-md">
               <Search className="w-4 h-4 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search assets, projects, clips..." 
                 className="bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-500 w-full"
               />
            </div>

            {/* 5. TOP NAVIGATION */}
            <div className="flex items-center gap-8 overflow-x-auto whitespace-nowrap hide-scrollbar w-full sm:w-auto">
              <Link href="/dashboard" className="text-sm font-medium text-gray-400 hover:text-gray-300 cursor-pointer tracking-wide">Overview</Link>
              <Link href="/media" className="text-sm font-medium text-gray-400 hover:text-gray-300 cursor-pointer tracking-wide">Media</Link>
              <Link href="/studio" className="text-sm font-medium text-gray-400 hover:text-gray-300 cursor-pointer tracking-wide">AI Studio</Link>
              
              <Link href="/analytics" className="flex flex-col items-center gap-1 cursor-pointer mt-1.5">
                <span className="text-sm font-bold text-white tracking-wide">Analytics</span>
                <div className="w-1 h-1 bg-white rounded-full" />
              </Link>
            </div>

            {/* 6. TOP RIGHT CONTROLS */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center cursor-pointer hover:bg-[rgba(255,255,255,0.15)] transition shadow-sm" title="Quick Create">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <div className="w-9 h-9 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center cursor-pointer hover:bg-[rgba(255,255,255,0.15)] transition shadow-sm">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div className="w-9 h-9 rounded-full bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)] flex items-center justify-center cursor-pointer overflow-hidden shadow-sm">
                <User className="w-5 h-5 text-white/80" />
              </div>
            </div>
          </div>

          {/* MAIN GRID */}
          {/* Reduced px-8 to px-6, pb-6 to pb-4, gap-4 to gap-3 */}
          <div className="px-6 pt-0 pb-4 grid grid-cols-1 lg:grid-cols-12 gap-3 relative flex-1 min-h-0">

            {/* --- COLUMN 1 (Left) --- */}
            <div className="lg:col-span-3 flex flex-col gap-3">
              
              {/* 8. CREATOR WORKSPACE */}
              <div className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] backdrop-blur-[15px] rounded-[20px] p-4 flex flex-col gap-3 relative overflow-hidden group shadow-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors">
                <div className="flex justify-between items-center relative z-10">
                  <span className="text-xs font-bold text-gray-400 tracking-wider">CREATOR WORKSPACE</span>
                  <Settings className="w-4 h-4 text-gray-500 cursor-pointer hover:text-white" />
                </div>
                <div className="flex -space-x-3 relative z-10">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#1E1E1E] bg-[#4A4A4A] flex items-center justify-center relative z-10 shadow-sm">
                      <User className="w-3 h-3 text-white/70" />
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-[#1E1E1E] bg-[#666] flex items-center justify-center text-[10px] text-white relative z-10 shadow-sm font-medium">
                    +8
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 mt-1 relative z-10">
                  <span className="text-[11px] font-medium text-gray-400">{prod?.total_projects ?? 12} Active Projects</span>
                  <span className="text-[11px] font-medium text-gray-400">{prod?.total_videos_uploaded ?? 24} Videos</span>
                  <span className="text-[11px] font-medium text-gray-400">{prod?.total_clips_generated ?? 67} Generated Clips</span>
                </div>
              </div>

              {/* 10. CONTENT COMPLETION */}
              <div className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] backdrop-blur-[15px] rounded-[20px] p-4 flex flex-col items-center justify-center flex-1 relative group shadow-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors">
                <div className="absolute top-4 left-4 right-4 flex flex-col items-start gap-1">
                  <div className="flex w-full justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider">CONTENT COMPLETION</span>
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="px-1 py-0.5 rounded text-[7px] bg-white/10 text-gray-300 font-bold border border-white/10 tracking-widest uppercase">SAMPLE DATA</span>
                </div>
                
                <div className="relative w-16 h-16 mt-3 mb-1">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      stroke={lightOn ? "#FFD66B" : "#FFFFFF"} 
                      strokeWidth="6" 
                      fill="none" 
                      strokeDasharray="282.7" 
                      strokeDashoffset="70" 
                      strokeLinecap="round"
                      className="transition-all duration-700" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-0.5">
                    <span className="text-xl font-light text-white tracking-tighter leading-none">75<span className="text-xs">%</span></span>
                    <span className="text-[7px] text-gray-400 font-medium tracking-wide mt-0.5">Generated</span>
                  </div>
                </div>
              </div>

              {/* 15. CONTENT WORKFLOW */}
              <div className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] backdrop-blur-[15px] rounded-[20px] p-4 flex flex-col gap-2 relative shadow-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors">
                <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1">CONTENT WORKFLOW</span>
                
                <div className="flex items-center justify-between text-[11px] font-medium">
                  <span className="text-white">Idea</span> <ArrowRight className="w-3 h-3 text-gray-600" />
                  <span className="text-white">Script</span> <ArrowRight className="w-3 h-3 text-gray-600" />
                  <span className="text-white">Video</span> <ArrowRight className="w-3 h-3 text-gray-600" />
                  <span className="text-gray-500">Clip</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                  <div className="w-[75%] h-full bg-white rounded-full opacity-50" />
                </div>
              </div>



            </div>

            {/* --- COLUMN 2 (Middle - Large) --- */}
            <div className="lg:col-span-6 flex flex-col gap-3">
              
              {/* 9. MAIN CONTENT ACTIVITY PANEL */}
              <div className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] backdrop-blur-[15px] rounded-[24px] p-5 flex flex-col relative overflow-hidden shadow-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors">
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="space-y-1">
                    <h3 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">CONTENT ACTIVITY</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-light text-white tracking-tighter">{prod?.total_clips_generated ?? 67}</span>
                      <span className="text-[13px] text-gray-400 font-medium">Clips</span>
                    </div>
                  </div>
                  <div className="flex gap-4 text-[11px] font-semibold mt-1">
                    <span className="text-white border-b border-white pb-1 cursor-pointer">Clips</span>
                    <span className="text-gray-500 hover:text-gray-300 cursor-pointer">Videos</span>
                    <span className="text-gray-500 hover:text-gray-300 cursor-pointer">Scripts</span>
                  </div>
                </div>

                <div className="flex-1 w-full relative z-10 min-h-[100px]">
                  <SmoothLineChart 
                    lightOn={lightOn} 
                    points={[20, 35, 25, 60, 45, 80, 70, 95, 85, 110]} 
                  />
                </div>
              </div>

              {/* 14. RECENT ACTIVITY */}
              <div className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] backdrop-blur-[15px] rounded-[24px] p-4 flex flex-col relative overflow-hidden shadow-lg flex-1">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">RECENT ACTIVITY</span>
                  <span className="text-[9px] text-gray-500 cursor-pointer hover:text-white">View All</span>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0"><CheckCircle2 className="w-3.5 h-3.5 text-white" /></div>
                    <div className="flex-1 min-w-0"><div className="text-[13px] text-white font-medium truncate">AI highlight detection completed</div><div className="text-[9px] text-gray-500 truncate">Project: React Tutorial • 10 min ago</div></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0"><Video className="w-3.5 h-3.5 text-white" /></div>
                    <div className="flex-1 min-w-0"><div className="text-[13px] text-white font-medium truncate">3 clips generated</div><div className="text-[9px] text-gray-500 truncate">Project: UI Design • 1 hr ago</div></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0"><FileText className="w-3.5 h-3.5 text-white" /></div>
                    <div className="flex-1 min-w-0"><div className="text-[13px] text-white font-medium truncate">Script generated</div><div className="text-[9px] text-gray-500 truncate">Project: Onboarding • 3 hrs ago</div></div>
                  </div>
                </div>
              </div>

            </div>

            {/* --- COLUMN 3 (Right) --- */}
            <div className="lg:col-span-3 flex flex-col gap-3">
              
              {/* 11. CONTENT OUTPUT CARD */}
              <div className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] backdrop-blur-[15px] rounded-[20px] p-4 flex flex-col flex-1 relative group overflow-hidden shadow-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors">
                <div className="flex justify-between items-center mb-1 relative z-10">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">CONTENT OUTPUT</span>
                  <MoreHorizontal className="w-4 h-4 text-gray-500" />
                </div>
                
                <div className="text-3xl font-light text-white mb-1 relative z-10">80<span className="text-lg text-gray-400">%</span></div>
                
                <div className="flex-1 w-full relative z-10">
                  <BarChart lightOn={lightOn} />
                </div>
              </div>

              {/* 12. PLATFORM DISTRIBUTION */}
              <div className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] backdrop-blur-[15px] rounded-[20px] p-4 flex flex-col relative group shadow-lg">
                <div className="flex flex-col gap-1 mb-3">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">PLATFORM DISTRIBUTION</span>
                  </div>
                  <span className="self-start px-1 py-0.5 rounded text-[7px] bg-white/10 text-gray-300 font-bold border border-white/10 tracking-widest uppercase">SAMPLE DATA</span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1"><span className="text-white">YouTube</span><span className="text-gray-400">45%</span></div>
                    <div className="w-full h-1 bg-white/10 rounded-full"><div className="w-[45%] h-full bg-white rounded-full opacity-70" /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1"><span className="text-white">Instagram</span><span className="text-gray-400">35%</span></div>
                    <div className="w-full h-1 bg-white/10 rounded-full"><div className="w-[35%] h-full bg-white rounded-full opacity-50" /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1"><span className="text-white">LinkedIn</span><span className="text-gray-400">20%</span></div>
                    <div className="w-full h-1 bg-white/10 rounded-full"><div className="w-[20%] h-full bg-white rounded-full opacity-30" /></div>
                  </div>
                </div>
              </div>

              {/* 13. LATEST CLIP CARD */}
              <div className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] backdrop-blur-[15px] rounded-[20px] p-3 flex flex-col relative group shadow-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors">
                <div className="flex flex-col gap-1 mb-2">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">LATEST CLIP</span>
                  </div>
                  <span className="self-start px-1 py-0.5 rounded text-[7px] bg-white/10 text-gray-300 font-bold border border-white/10 tracking-widest uppercase">SAMPLE DATA</span>
                </div>

                <div className="w-full h-[60px] bg-[rgba(255,255,255,0.05)] rounded-lg mb-2 relative overflow-hidden flex items-center justify-center border border-[rgba(255,255,255,0.1)]">
                  <Play className="w-6 h-6 text-white/30" />
                  <div className="absolute bottom-1.5 left-1.5 text-[8px] bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-white font-mono">00:15</div>
                </div>

                <div className="text-[11px] font-semibold text-white tracking-wide truncate">AI React Tutorial Highlight</div>
                <div className="text-[8px] text-gray-400 mt-0.5 mb-2 font-medium">Generated 2 hours ago</div>

                <div className="flex items-center justify-center gap-4">
                  <SkipBack className="w-3 h-3 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                  <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-lg">
                    <Play className="w-2.5 h-2.5 ml-0.5" fill="currentColor" />
                  </div>
                  <SkipForward className="w-3 h-3 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
