"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  Save,
  Share2,
  RefreshCw,
  Layers,
  ChevronRight,
  Loader2,
  Sliders,
  Send,
  Globe,
  Video,
  Bookmark
} from "lucide-react";

import { api } from "@/lib/api";
import { GeneratedScript, PlatformPackage, Project } from "@/lib/types";

export default function ScriptGeneratorPage() {
  const [topic, setTopic] = useState<string>("How to Automate Short-Form Video Repurposing in 2026");
  const [audience, setAudience] = useState<string>("Content Creators & Entrepreneurs");
  const [platform, setPlatform] = useState<string>("youtube_shorts");
  const [tone, setTone] = useState<string>("engaging");
  const [duration, setDuration] = useState<number>(60);
  const [category, setCategory] = useState<string>("Tech & AI");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [generating, setGenerating] = useState<boolean>(false);
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [selectedHookIndex, setSelectedHookIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Multi-Platform Adaptation State
  const [platformPackage, setPlatformPackage] = useState<PlatformPackage | null>(null);
  const [adapting, setAdapting] = useState<boolean>(false);
  const [activePlatformTab, setActivePlatformTab] = useState<"instagram" | "youtube" | "linkedin">("instagram");

  useEffect(() => {
    api.getProjects().then(setProjects).catch(() => {});
  }, []);

  const handleGenerateScript = async () => {
    if (!topic.trim()) return;
    try {
      setGenerating(true);
      setSavedMsg(null);
      const res = await api.generateScript({
        topic,
        target_audience: audience,
        platform,
        tone,
        desired_duration: duration,
        content_category: category,
        project_id: selectedProjectId || undefined,
      });
      setScript(res);
      setSelectedHookIndex(0);

      // Auto-generate platform packages
      handleAdaptPlatforms(res);
    } catch (err: any) {
      alert(`Script generation error: ${err.message || err}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleAdaptPlatforms = async (currentScript: GeneratedScript) => {
    try {
      setAdapting(true);
      const res = await api.adaptContent({
        title: currentScript.title,
        summary: currentScript.full_script,
        hook: currentScript.hooks[selectedHookIndex] || currentScript.hooks[0],
        transcript_text: currentScript.full_script,
      });
      setPlatformPackage(res);
    } catch (err) {
      console.error("Platform adaptation failed:", err);
    } finally {
      setAdapting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToProject = async () => {
    if (!script) return;
    try {
      await api.saveScript({
        project_id: selectedProjectId || undefined,
        topic: script.topic || topic,
        title: script.title,
        hooks: script.hooks,
        main_content: script.main_content,
        full_script: script.full_script,
        caption: script.caption,
        hashtags: script.hashtags,
      });
      setSavedMsg("Script saved successfully to project!");
      setTimeout(() => setSavedMsg(null), 3000);
    } catch (err: any) {
      alert(`Save failed: ${err.message || err}`);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <FileText className="w-7 h-7 text-indigo-400" />
          <span>AI Script & Hook Generator</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Create structured viral scripts, 3 alternative hook variations, and multi-platform packages with Gemini AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form (4 Cols): Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0e131b] border border-[#1e2638] space-y-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Script Configuration</span>
            </h2>

            {/* Topic Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Topic or Concept:</label>
              <textarea
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. 3 AI tools every creator needs to 10x their workflow..."
                className="w-full p-3 rounded-xl bg-[#121824] border border-[#1e2638] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Audience:</label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. Content Creators, Solopreneurs"
                className="w-full px-3 py-2 rounded-xl bg-[#121824] border border-[#1e2638] text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Grid 2-col settings */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Platform:</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#121824] border border-[#1e2638] text-slate-200 focus:outline-none"
                >
                  <option value="youtube_shorts">YouTube Shorts</option>
                  <option value="instagram_reels">Instagram Reels</option>
                  <option value="tiktok">TikTok</option>
                  <option value="linkedin">LinkedIn Video</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Tone:</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#121824] border border-[#1e2638] text-slate-200 focus:outline-none"
                >
                  <option value="engaging">Engaging & Fast</option>
                  <option value="contrarian">Contrarian / Bold</option>
                  <option value="educational">Step-by-Step Educational</option>
                  <option value="inspiring">Inspirational / Story</option>
                </select>
              </div>
            </div>

            {/* Duration Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Target Duration:</span>
                <span className="text-cyan-400 font-mono">{duration} seconds</span>
              </div>
              <input
                type="range"
                min="15"
                max="120"
                step="5"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Project Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Assign to Project (Optional):</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121824] border border-[#1e2638] text-xs text-slate-200 focus:outline-none"
              >
                <option value="">No Project Assigned</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateScript}
              disabled={generating || !topic.trim()}
              className="w-full py-3 rounded-xl text-xs md:text-sm font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{generating ? "Generating Script..." : "Generate with Gemini AI"}</span>
            </button>
          </div>
        </div>

        {/* Right Pane (7 Cols): Output Script & Platform Packages */}
        <div className="lg:col-span-7 space-y-6">
          {savedMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{savedMsg}</span>
            </div>
          )}

          {!script && !generating && (
            <div className="p-16 text-center rounded-2xl bg-[#0e131b] border border-dashed border-[#1e2638] space-y-3">
              <FileText className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-300">Ready to Generate Your Script</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Configure your video topic and audience on the left, then click "Generate with Gemini AI" to produce hooks, sections, and multi-platform text.
              </p>
            </div>
          )}

          {generating && (
            <div className="p-16 text-center rounded-2xl bg-[#0e131b] border border-[#1e2638] space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-200">Writing High-Retention Script...</h3>
              <p className="text-xs text-slate-500">Gemini 1.5 is crafting 3 hooks and pacing the outline.</p>
            </div>
          )}

          {script && !generating && (
            <div className="p-6 rounded-2xl bg-[#0e131b] border border-[#1e2638] space-y-6">
              {/* Title & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e2638] pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Generated Script</span>
                  <h2 className="text-lg font-bold text-white mt-0.5">{script.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(script.full_script)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#151c28] hover:bg-[#1e2638] text-slate-200 border border-[#1e2638] transition flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    onClick={handleSaveToProject}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              {/* 3 Alternative Hooks */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-indigo-300">Choose Your Opening Hook (3 Alternatives):</span>
                <div className="space-y-2">
                  {script.hooks.map((h, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedHookIndex(i)}
                      className={`p-3 rounded-xl cursor-pointer transition text-xs flex items-start gap-3 ${
                        selectedHookIndex === i
                          ? "bg-indigo-600/20 border border-indigo-500 text-white shadow-sm"
                          : "bg-[#121824] hover:bg-[#182030] text-slate-300 border border-transparent"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                        selectedHookIndex === i ? "bg-indigo-600 text-white" : "bg-[#1e2638] text-slate-400"
                      }`}>
                        {i + 1}
                      </span>
                      <p className="leading-snug font-medium flex-1">"{h}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Script Outline Sections */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-200">Script Timeline Breakdown:</span>
                <div className="space-y-2">
                  {script.main_content.map((sec, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#121824] border border-[#1e2638] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-cyan-400">{sec.section}</span>
                        <span className="text-[10px] font-mono text-slate-400">{sec.duration_sec}s</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{sec.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Closing & Call to Action */}
              <div className="p-4 rounded-xl bg-[#121824] border border-[#1e2638] space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <span>Call to Action:</span>
                </div>
                <p className="text-slate-300 italic">"{script.call_to_action}"</p>
              </div>

              {/* Multi-Platform Adapted Content Tabs */}
              {platformPackage && (
                <div className="space-y-3 pt-4 border-t border-[#1e2638]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Multi-Platform Ready Packages:</span>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-[#121824] border border-[#1e2638]">
                      <button
                        onClick={() => setActivePlatformTab("instagram")}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                          activePlatformTab === "instagram" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : "text-slate-400"
                        }`}
                      >
                        <Globe className="w-3 h-3" />
                        <span>Instagram</span>
                      </button>

                      <button
                        onClick={() => setActivePlatformTab("youtube")}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                          activePlatformTab === "youtube" ? "bg-red-600 text-white" : "text-slate-400"
                        }`}
                      >
                        <Video className="w-3 h-3" />
                        <span>Shorts</span>
                      </button>

                      <button
                        onClick={() => setActivePlatformTab("linkedin")}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                          activePlatformTab === "linkedin" ? "bg-blue-600 text-white" : "text-slate-400"
                        }`}
                      >
                        <Share2 className="w-3 h-3" />
                        <span>LinkedIn</span>
                      </button>

                    </div>
                  </div>

                  {/* Platform Tab Content */}
                  <div className="p-4 rounded-xl bg-[#121824] border border-[#1e2638] space-y-3 text-xs">
                    {activePlatformTab === "instagram" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-pink-400">Reels Caption & Hashtags</span>
                          <button
                            onClick={() => handleCopy(`${platformPackage.instagram.caption}\n\n${platformPackage.instagram.hashtags.join(" ")}`)}
                            className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                        <p className="text-slate-200 whitespace-pre-line leading-relaxed bg-[#0c1017] p-3 rounded-lg border border-[#1e2638]">
                          {platformPackage.instagram.caption}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {platformPackage.instagram.hashtags.map(tag => (
                            <span key={tag} className="text-[10px] text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {activePlatformTab === "youtube" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-red-400">YouTube Shorts Title & Description</span>
                          <button
                            onClick={() => handleCopy(`${platformPackage.youtube_shorts.title}\n\n${platformPackage.youtube_shorts.description}`)}
                            className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                        <p className="font-bold text-slate-100">{platformPackage.youtube_shorts.title}</p>
                        <p className="text-slate-300 whitespace-pre-line leading-relaxed bg-[#0c1017] p-3 rounded-lg border border-[#1e2638]">
                          {platformPackage.youtube_shorts.description}
                        </p>
                      </div>
                    )}

                    {activePlatformTab === "linkedin" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-400">LinkedIn Thought Leadership Post</span>
                          <button
                            onClick={() => handleCopy(platformPackage.linkedin.caption)}
                            className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                        <p className="text-slate-200 whitespace-pre-line leading-relaxed bg-[#0c1017] p-3 rounded-lg border border-[#1e2638]">
                          {platformPackage.linkedin.caption}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
