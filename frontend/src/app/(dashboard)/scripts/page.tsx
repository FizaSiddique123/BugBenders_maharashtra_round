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
    api.getProjects().then(setProjects).catch(() => { });
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
          <FileText className="w-7 h-7 text-white" />
          <span>AI Script & Hook Generator</span>
        </h1>
        <p className="text-sm text-[#A1A1A1] mt-1">
          Create structured viral scripts, 3 alternative hook variations, and multi-platform packages with AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form (4 Cols): Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-xl bg-[#0F0F0F] border border-[#242424] space-y-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-white" />
              <span>Script Configuration</span>
            </h2>

            {/* Topic Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A1A1A1]">Topic or Concept:</label>
              <textarea
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. 3 AI tools every creator needs to 10x their workflow..."
                className="w-full p-3 rounded bg-[#0A0A0A] border border-[#242424] text-xs text-[#F5F5F5] placeholder-[#6F6F6F] focus:outline-none focus:border-[#303030] resize-none"
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A1A1A1]">Target Audience:</label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. Content Creators, Solopreneurs"
                className="w-full px-3 py-2 rounded bg-[#0A0A0A] border border-[#242424] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#303030]"
              />
            </div>

            {/* Grid 2-col settings */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#A1A1A1]">Platform:</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#0A0A0A] border border-[#242424] text-[#F5F5F5] focus:outline-none focus:border-[#303030]"
                >
                  <option value="youtube_shorts">YouTube Shorts</option>
                  <option value="instagram_reels">Instagram Reels</option>
                  <option value="tiktok">TikTok</option>
                  <option value="linkedin">LinkedIn Video</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#A1A1A1]">Tone:</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#0A0A0A] border border-[#242424] text-[#F5F5F5] focus:outline-none focus:border-[#303030]"
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
                <span className="text-[#A1A1A1]">Target Duration:</span>
                <span className="text-white font-mono">{duration} seconds</span>
              </div>
              <input
                type="range"
                min="15"
                max="120"
                step="5"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-white"
              />
            </div>

            {/* Project Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A1A1A1]">Assign to Project (Optional):</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0A0A0A] border border-[#242424] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#303030]"
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
              className="w-full py-3 rounded text-xs md:text-sm font-bold bg-white hover:bg-gray-200 text-black shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{generating ? "Generating Script..." : "Generate AI Script"}</span>
            </button>
          </div>
        </div>

        {/* Right Pane (7 Cols): Output Script & Platform Packages */}
        <div className="lg:col-span-7 space-y-6">
          {savedMsg && (
            <div className="p-3 rounded bg-green-900/40 border border-green-500/40 text-xs text-green-400 flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>{savedMsg}</span>
            </div>
          )}

          {!script && !generating && (
            <div className="py-16 text-center rounded border border-dashed border-[#222222] flex flex-col items-center justify-center">
              <FileText className="w-8 h-8 text-[#444444] mx-auto mb-4" />
              <span className="premium-label mb-2">WRITERS ROOM</span>
              <p className="text-sm font-medium text-[#888888] max-w-sm mb-6">
                Configure your video topic and audience on the left, then generate an AI script to produce hooks, sections, and multi-platform text.
              </p>
            </div>
          )}

          {generating && (
            <div className="py-16 flex flex-col items-center justify-center space-y-8 animate-in fade-in rounded border border-[#222222] bg-[#0A0A0A]">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-extrabold text-white tracking-tight">Writing High-Retention Script...</h2>
                <p className="text-sm font-medium text-[#888888]">Crafting 3 hooks and pacing the outline.</p>
              </div>
              <div className="w-full max-w-md h-0.5 bg-[#151515] rounded-full overflow-hidden relative">
                <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-white rounded-full animate-[progress_2s_ease-in-out_infinite]" />
              </div>
            </div>
          )}

          {script && !generating && (
            <div className="p-6 rounded-xl bg-[#0F0F0F] border border-[#242424] space-y-6">
              {/* Title & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424] pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#A1A1A1] tracking-wider">Generated Script</span>
                  <h2 className="text-lg font-bold text-white mt-0.5">{script.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(script.full_script)}
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-[#0A0A0A] hover:bg-[#151515] text-[#A1A1A1] hover:text-white border border-[#242424] transition flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    onClick={handleSaveToProject}
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-white hover:bg-gray-200 text-black shadow transition flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              {/* 3 Alternative Hooks */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white">Choose Your Opening Hook (3 Alternatives):</span>
                <div className="space-y-2">
                  {script.hooks.map((h, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedHookIndex(i)}
                      className={`p-3 rounded-xl cursor-pointer transition text-xs flex items-start gap-3 ${selectedHookIndex === i
                          ? "bg-[#151515] border border-[#6F6F6F] text-white shadow-sm"
                          : "bg-[#0A0A0A] hover:bg-[#151515] text-[#A1A1A1] border border-transparent"
                        }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${selectedHookIndex === i ? "bg-white text-black" : "bg-[#242424] text-[#A1A1A1]"
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
                <span className="text-xs font-bold text-white">Script Timeline Breakdown:</span>
                <div className="space-y-2">
                  {script.main_content.map((sec, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#0A0A0A] border border-[#242424] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{sec.section}</span>
                        <span className="text-[10px] font-mono text-[#A1A1A1]">{sec.duration_sec}s</span>
                      </div>
                      <p className="text-xs text-[#A1A1A1] leading-relaxed">{sec.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Closing & Call to Action */}
              <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#242424] space-y-2 text-xs">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <span>Call to Action:</span>
                </div>
                <p className="text-[#A1A1A1] italic">"{script.call_to_action}"</p>
              </div>

              {/* Multi-Platform Adapted Content Tabs */}
              {platformPackage && (
                <div className="space-y-3 pt-4 border-t border-[#242424]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Multi-Platform Ready Packages:</span>
                    <div className="flex items-center gap-1 p-1 rounded bg-[#0A0A0A] border border-[#242424]">
                      <button
                        onClick={() => setActivePlatformTab("instagram")}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${activePlatformTab === "instagram" ? "bg-white text-black" : "text-[#A1A1A1] hover:text-white"
                          }`}
                      >
                        <Globe className="w-3 h-3" />
                        <span>Instagram</span>
                      </button>

                      <button
                        onClick={() => setActivePlatformTab("youtube")}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${activePlatformTab === "youtube" ? "bg-white text-black" : "text-[#A1A1A1] hover:text-white"
                          }`}
                      >
                        <Video className="w-3 h-3" />
                        <span>Shorts</span>
                      </button>

                      <button
                        onClick={() => setActivePlatformTab("linkedin")}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${activePlatformTab === "linkedin" ? "bg-white text-black" : "text-[#A1A1A1] hover:text-white"
                          }`}
                      >
                        <Share2 className="w-3 h-3" />
                        <span>LinkedIn</span>
                      </button>

                    </div>
                  </div>

                  {/* Platform Tab Content */}
                  <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#242424] space-y-3 text-xs">
                    {activePlatformTab === "instagram" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">Reels Caption & Hashtags</span>
                          <button
                            onClick={() => handleCopy(`${platformPackage.instagram.caption}\n\n${platformPackage.instagram.hashtags.join(" ")}`)}
                            className="text-[#A1A1A1] hover:text-white flex items-center gap-1 text-[11px]"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                        <p className="text-[#A1A1A1] whitespace-pre-line leading-relaxed bg-[#050505] p-3 rounded-lg border border-[#242424]">
                          {platformPackage.instagram.caption}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {platformPackage.instagram.hashtags.map(tag => (
                            <span key={tag} className="text-[10px] text-white bg-[#151515] px-2 py-0.5 rounded border border-[#242424]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {activePlatformTab === "youtube" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">YouTube Shorts Title & Description</span>
                          <button
                            onClick={() => handleCopy(`${platformPackage.youtube_shorts.title}\n\n${platformPackage.youtube_shorts.description}`)}
                            className="text-[#A1A1A1] hover:text-white flex items-center gap-1 text-[11px]"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                        <p className="font-bold text-white">{platformPackage.youtube_shorts.title}</p>
                        <p className="text-[#A1A1A1] whitespace-pre-line leading-relaxed bg-[#050505] p-3 rounded-lg border border-[#242424]">
                          {platformPackage.youtube_shorts.description}
                        </p>
                      </div>
                    )}

                    {activePlatformTab === "linkedin" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">LinkedIn Thought Leadership Post</span>
                          <button
                            onClick={() => handleCopy(platformPackage.linkedin.caption)}
                            className="text-[#A1A1A1] hover:text-white flex items-center gap-1 text-[11px]"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                        <p className="text-[#A1A1A1] whitespace-pre-line leading-relaxed bg-[#050505] p-3 rounded-lg border border-[#242424]">
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
