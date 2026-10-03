"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Video,
  Play,
  Scissors,
  CheckCircle,
  TrendingUp,
  FileText,
  Loader2,
  Image as ImageIcon,
  Headphones,
  Type,
  UploadCloud,
  Layers,
  ChevronRight,
  Flame,
  Volume2
} from "lucide-react";
import { api, getMediaUrl } from "@/lib/api";
import { Asset, Transcript, HighlightItem } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

type CreationMode = "best_moments" | "clips" | "hooks" | "script" | "caption" | "repurpose";

function AIStudioContent() {
  const searchParams = useSearchParams();
  const initialAssetId = searchParams.get("assetId");

  // Global State
  const [activeMenu, setActiveMenu] = useState<CreationMode>("best_moments");
  const [selectedModes, setSelectedModes] = useState<CreationMode[]>(["best_moments"]);
  const [step, setStep] = useState<"input" | "processing" | "results">("input");
  
  // Content State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [pastedText, setPastedText] = useState<string>("");
  const [inputType, setInputType] = useState<"video" | "text" | null>(null);

  // Result State
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [generatedHooks, setGeneratedHooks] = useState<string[]>([]);
  const [generatedScript, setGeneratedScript] = useState<any>(null);
  const [repurposedContent, setRepurposedContent] = useState<any>(null);
  const [renderedClips, setRenderedClips] = useState<Record<string, any>>({});

  // Processing & Video State
  const [processingStage, setProcessingStage] = useState<string>("");
  const [generatingClipId, setGeneratingClipId] = useState<string | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [clipSettings, setClipSettings] = useState({ aspectRatio: "9:16", captionStyle: "bold_yellow", captionsEnabled: true });

  // Initial Load
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const data = await api.getAssets();
        setAssets(data);
        if (initialAssetId) {
          const target = data.find(a => a.id === initialAssetId);
          if (target) {
            setSelectedAsset(target);
            setInputType("video");
          }
        }
      } catch (err) {}
    };
    fetchAssets();
  }, [initialAssetId]);

  // Mode Selection Helper
  const toggleMode = (mode: CreationMode) => {
    if (selectedModes.includes(mode)) {
      setSelectedModes(selectedModes.filter(m => m !== mode));
    } else {
      setSelectedModes([...selectedModes, mode]);
    }
  };

  // Main Pipeline Runner
  const handleCreateForMe = async () => {
    if (!selectedAsset && !pastedText) return;
    setStep("processing");

    try {
      // 1. Process Video / Text
      if (inputType === "video" && selectedAsset) {
        setProcessingStage("Preparing your video...");
        await new Promise(r => setTimeout(r, 800)); // Smooth UX transition

        // Ensure transcription exists
        let t = await api.getTranscription(selectedAsset.id).catch(() => null);
        if (!t || t.segments.length === 0) {
          setProcessingStage("Analyzing speech & understanding your content...");
          await api.triggerTranscription(selectedAsset.id);
          // Wait for transcription (simplified for hackathon UX)
          while (!t || t.segments.length === 0) {
            await new Promise(r => setTimeout(r, 1500));
            t = await api.getTranscription(selectedAsset.id).catch(() => null);
          }
        }
        setTranscript(t);

        // Run Selected Tasks
        if (selectedModes.includes("best_moments") || selectedModes.includes("clips")) {
          setProcessingStage("Finding strong moments & preparing recommendations...");
          let h = await api.getHighlights(selectedAsset.id).catch(() => null);
          if (!h || h.highlights.length === 0) {
             h = await api.generateHighlights(selectedAsset.id);
          }
          if (h) setHighlights(h.highlights);
        }
      }

      if (selectedModes.includes("hooks")) {
        setProcessingStage("Finding the strongest angles & generating hooks...");
        const contentForHooks = inputType === "video" && transcript ? transcript.full_text : pastedText;
        const res = await api.generateHooks(contentForHooks || "Content creation tips");
        if (res.hooks) setGeneratedHooks(res.hooks);
      }

      if (selectedModes.includes("script")) {
        setProcessingStage("Developing structure & writing your first draft...");
        const topicSource = inputType === "video" && selectedAsset ? selectedAsset.filename : pastedText.slice(0, 100);
        const res = await api.generateScript({ topic: topicSource || "Creator Tips", platform: "youtube_shorts" });
        if (res) setGeneratedScript({
          title: res.title,
          hook: res.hooks[0],
          body: res.full_script,
          cta: res.call_to_action
        });
      }

      if (selectedModes.includes("repurpose")) {
        setProcessingStage("Adapting content for multiple platforms...");
        const titleSource = inputType === "video" && selectedAsset ? selectedAsset.filename : "Content Repurpose";
        const contentSource = inputType === "video" && transcript ? transcript.full_text : pastedText;
        const res = await api.adaptContent({
          title: titleSource,
          summary: contentSource.slice(0, 500),
          transcript_text: contentSource
        });
        if (res) {
          setRepurposedContent({
            instagram: res.instagram.caption,
            youtube: res.youtube_shorts.description,
            linkedin: res.linkedin.caption
          });
        }
      }

      setStep("results");
    } catch (err: any) {
      alert(`CreatorAI couldn't process this request right now: ${err.message}`);
      setStep("input");
    }
  };

  const handleGenerateClip = async (hl: HighlightItem) => {
    if (!selectedAsset) return;
    const clipKey = hl.id || hl.title;
    try {
      setGeneratingClipId(clipKey);
      await api.generateClip({
        asset_id: selectedAsset.id,
        project_id: selectedAsset.project_id || undefined,
        start_time: hl.start_time,
        end_time: hl.end_time,
        title: hl.title,
        aspect_ratio: clipSettings.aspectRatio,
        captions_enabled: clipSettings.captionsEnabled,
        caption_style: clipSettings.captionStyle,
      });
      
      // Poll for the completed clip
      const poll = setInterval(async () => {
        try {
          const clips = await api.getClips(selectedAsset.id);
          const found = clips.find(c => c.title === hl.title && c.status === "ready");
          if (found) {
            clearInterval(poll);
            setRenderedClips(prev => ({ ...prev, [clipKey]: found }));
            setGeneratingClipId(null);
          }
        } catch (e) {}
      }, 3000);

    } catch (err: any) {
      alert(`Clip generation failed: ${err.message}`);
      setGeneratingClipId(null);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-[#050505] text-[#F5F5F5]">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-[#242424] bg-[#050505] hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-xs font-bold text-[#A1A1A1] tracking-wider uppercase mb-4">Create</h2>
          <nav className="space-y-1">
            {[
              { id: "hooks", icon: Sparkles, label: "Hooks" },
              { id: "script", icon: FileText, label: "Script" },
              { id: "clips", icon: Play, label: "Short Clips" },
              { id: "best_moments", icon: Scissors, label: "Best Moments" },
              { id: "repurpose", icon: Layers, label: "Repurpose" }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id as CreationMode)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-sm font-semibold transition-colors ${
                  activeMenu === item.id 
                    ? "bg-[#151515] text-white border border-[#303030]" 
                    : "text-[#A1A1A1] hover:text-white hover:bg-[#0A0A0A]"
                }`}
              >
                <item.icon className={`w-4 h-4 ${activeMenu === item.id ? "text-white" : "text-[#A1A1A1]"}`} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col items-center p-6 md:p-10 overflow-y-auto">
        <div className="w-full max-w-4xl space-y-8">
          
          {/* Header */}
          <header className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white">AI Studio</h1>
            <p className="text-sm text-[#A1A1A1]">Turn your content into publish-ready ideas, scripts, clips and more.</p>
          </header>

          {/* STEP 1: INPUT */}
          {step === "input" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <div className="bg-[#0F0F0F] border border-[#242424] rounded-xl p-6 md:p-10 shadow-2xl space-y-6">
                <h3 className="text-base font-bold text-white text-center">Upload your content</h3>
                
                {/* Input Selector */}
                {!inputType ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button onClick={() => setInputType("video")} className="flex flex-col items-center justify-center p-6 bg-[#0A0A0A] hover:bg-[#151515] border border-[#242424] hover:border-[#303030] rounded-xl transition gap-3 group">
                      <div className="w-12 h-12 rounded-full bg-[#151515] group-hover:bg-white flex items-center justify-center text-[#A1A1A1] group-hover:text-black transition">
                        <Video className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-[#A1A1A1] group-hover:text-white">Upload Video</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-6 bg-[#0A0A0A] border border-[#242424] rounded-xl opacity-50 cursor-not-allowed gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#151515] flex items-center justify-center text-[#6F6F6F]"><ImageIcon className="w-5 h-5" /></div>
                      <span className="text-sm font-semibold text-[#6F6F6F]">Upload Image</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-6 bg-[#0A0A0A] border border-[#242424] rounded-xl opacity-50 cursor-not-allowed gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#151515] flex items-center justify-center text-[#6F6F6F]"><Headphones className="w-5 h-5" /></div>
                      <span className="text-sm font-semibold text-[#6F6F6F]">Upload Audio</span>
                    </button>
                    <button onClick={() => setInputType("text")} className="flex flex-col items-center justify-center p-6 bg-[#0A0A0A] hover:bg-[#151515] border border-[#242424] hover:border-[#303030] rounded-xl transition gap-3 group">
                      <div className="w-12 h-12 rounded-full bg-[#151515] group-hover:bg-white flex items-center justify-center text-[#A1A1A1] group-hover:text-black transition">
                        <Type className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-[#A1A1A1] group-hover:text-white">Paste Text</span>
                    </button>
                  </div>
                ) : inputType === "video" ? (
                  <div className="space-y-4">
                    {selectedAsset ? (
                      <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#242424] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {selectedAsset.thumbnail_path ? (
                            <img src={getMediaUrl(selectedAsset.thumbnail_path)} alt="Thumb" className="w-16 h-16 rounded object-cover border border-[#242424] grayscale" />
                          ) : (
                            <div className="w-16 h-16 rounded bg-[#151515] flex items-center justify-center"><Video className="w-6 h-6 text-[#6F6F6F]" /></div>
                          )}
                          <div>
                            <h4 className="font-bold text-white text-sm">{selectedAsset.filename}</h4>
                            <p className="text-xs text-[#A1A1A1] font-mono mt-1">{formatDuration(selectedAsset.duration)} • {(selectedAsset.size_bytes / 1024 / 1024).toFixed(1)} MB</p>
                            <p className="text-xs text-white font-semibold mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Video ready</p>
                          </div>
                        </div>
                        <button onClick={() => {setSelectedAsset(null); setInputType(null);}} className="text-xs text-[#A1A1A1] hover:text-white underline">Change</button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-[#A1A1A1]">Select an existing asset to analyze:</label>
                        <select
                          onChange={(e) => setSelectedAsset(assets.find(a => a.id === e.target.value) || null)}
                          className="w-full p-4 rounded bg-[#0A0A0A] border border-[#242424] text-sm text-[#F5F5F5] focus:outline-none focus:border-[#303030]"
                          defaultValue=""
                        >
                          <option value="" disabled>Select a video...</option>
                          {assets.map(a => <option key={a.id} value={a.id}>{a.filename} ({formatDuration(a.duration)})</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <textarea 
                      placeholder="Paste your script, article, or notes here..."
                      rows={6}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      className="w-full p-4 rounded bg-[#0A0A0A] border border-[#242424] text-sm text-[#F5F5F5] placeholder-[#6F6F6F] focus:outline-none focus:border-[#303030] resize-none"
                    />
                    <button onClick={() => setInputType(null)} className="text-xs text-[#A1A1A1] hover:text-white underline">Change Input Type</button>
                  </div>
                )}
              </div>

              {(selectedAsset || pastedText) && (
                <div className="bg-[#0F0F0F] border border-[#242424] rounded-xl p-6 md:p-10 shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <h3 className="text-base font-bold text-white text-center">What would you like to create?</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { id: "best_moments", label: "Best short moments" },
                      { id: "hooks", label: "Hooks" },
                      { id: "clips", label: "Short clips" },
                      { id: "caption", label: "Instagram caption" },
                      { id: "script", label: "New Script" },
                      { id: "repurpose", label: "Platform Repurpose" }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => toggleMode(opt.id as CreationMode)}
                        className={`p-4 rounded-xl border text-sm font-semibold transition-all flex items-center gap-3 ${
                          selectedModes.includes(opt.id as CreationMode)
                            ? "bg-[#151515] border-white text-white"
                            : "bg-[#0A0A0A] border-[#242424] text-[#A1A1A1] hover:bg-[#151515] hover:text-[#F5F5F5]"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedModes.includes(opt.id as CreationMode) ? "bg-white border-white text-black" : "border-[#6F6F6F]"}`}>
                          {selectedModes.includes(opt.id as CreationMode) && <CheckCircle className="w-3 h-3" />}
                        </div>
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 flex justify-end border-t border-[#242424]">
                    <button
                      onClick={handleCreateForMe}
                      disabled={selectedModes.length === 0}
                      className="px-6 py-3 rounded bg-white text-black hover:bg-slate-200 font-bold shadow-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Create for me</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PROCESSING */}
          {step === "processing" && (
            <div className="min-h-[400px] flex flex-col items-center justify-center space-y-8 animate-in fade-in">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">{processingStage}</h2>
                <p className="text-sm font-medium text-[#888888]">CreatorAI is analyzing your content...</p>
              </div>
              <div className="w-full max-w-md h-0.5 bg-[#151515] rounded-full overflow-hidden relative">
                <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-white rounded-full animate-[progress_2s_ease-in-out_infinite]" />
              </div>
            </div>
          )}

          {/* STEP 3: RESULTS */}
          {step === "results" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8">
              <div className="flex items-center justify-between pb-4 border-b border-[#242424]">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-white" />
                  Your Results
                </h2>
                <button onClick={() => {setStep("input"); setGeneratedHooks([]); setGeneratedScript(null); setRepurposedContent(null);}} className="text-xs font-semibold text-[#A1A1A1] hover:text-white px-3 py-1.5 rounded bg-[#0A0A0A] border border-[#242424]">
                  Start New Session
                </button>
              </div>

              {/* HIGHLIGHTS / CLIPS RESULT */}
              {(selectedModes.includes("best_moments") || selectedModes.includes("clips")) && highlights.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[#A1A1A1] uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-4 h-4 text-white" /> BEST MOMENTS
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {highlights.map((hl, i) => {
                      const clipKey = hl.id || hl.title;
                      const isRendering = generatingClipId === clipKey;
                      const completedClip = renderedClips[clipKey];
                      return (
                        <div key={clipKey || i} className="bg-[#0F0F0F] border border-[#242424] rounded-xl p-5 space-y-4 hover:border-[#303030] transition shadow-xl flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-3xl font-black text-[#A1A1A1]">{(i+1).toString().padStart(2, '0')}</span>
                              <span className="font-mono text-xs font-bold text-[#A1A1A1] bg-[#151515] px-2 py-1 rounded border border-[#242424]">
                                {formatDuration(hl.start_time)} — {formatDuration(hl.end_time)}
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-sm text-white font-bold italic">"{hl.hook}"</p>
                              <h4 className="text-lg font-bold text-white">{hl.title}</h4>
                            </div>

                            <div className="p-3 bg-[#0A0A0A] rounded border border-[#242424] space-y-1">
                              <p className="text-[10px] font-bold text-[#6F6F6F] uppercase tracking-wider">Why this works</p>
                              <p className="text-xs text-[#A1A1A1] leading-relaxed">{hl.reason || hl.summary}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-4">
                            <button className="flex-1 px-3 py-2 rounded text-xs font-semibold bg-[#151515] hover:bg-[#242424] text-white transition">
                              Preview Original
                            </button>
                            {selectedModes.includes("clips") && !completedClip && (
                              <button 
                                onClick={() => handleGenerateClip(hl)}
                                disabled={isRendering}
                                className="flex-1 px-3 py-2 rounded text-xs font-semibold bg-white hover:bg-gray-200 text-black transition shadow-lg flex justify-center items-center gap-2"
                              >
                                {isRendering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
                                {isRendering ? "Rendering..." : "Create Clip"}
                              </button>
                            )}
                          </div>
                          
                          {completedClip && (
                            <div className="mt-4 p-4 rounded bg-[#151515] border border-[#303030] text-center space-y-3">
                              <p className="text-sm font-bold text-white flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Your clip is ready!
                              </p>
                              <div className="flex items-center justify-center gap-2">
                                <a href={getMediaUrl(completedClip.filepath)} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded text-xs font-semibold bg-[#0A0A0A] hover:bg-[#242424] text-white transition border border-[#242424]">
                                  ▶ Preview
                                </a>
                                <Link href="/editor" className="px-3 py-1.5 rounded text-xs font-semibold bg-[#0A0A0A] hover:bg-[#242424] text-white transition border border-[#242424]">
                                  Edit
                                </Link>
                                <a href={getMediaUrl(completedClip.filepath)} download className="px-3 py-1.5 rounded text-xs font-semibold bg-white hover:bg-gray-200 text-black transition">
                                  Download
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* HOOKS RESULT */}
              {selectedModes.includes("hooks") && generatedHooks.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-bold text-[#A1A1A1] uppercase tracking-wider">GENERATED HOOKS</h3>
                  <div className="space-y-3">
                    {generatedHooks.map((hook, i) => (
                      <div key={i} className="bg-[#0F0F0F] border border-[#242424] rounded-xl p-4 flex items-center justify-between gap-4 group hover:border-[#303030] transition">
                        <div className="flex gap-4 items-center">
                          <span className="text-xl font-bold text-[#6F6F6F]">{(i+1).toString().padStart(2, '0')}</span>
                          <input type="text" defaultValue={hook} className="bg-transparent border-none outline-none text-sm font-medium text-white w-[400px]" />
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                          <button className="text-[10px] font-bold bg-[#0A0A0A] hover:bg-[#151515] border border-[#242424] px-2 py-1 rounded text-[#A1A1A1]">Copy</button>
                          <button className="text-[10px] font-bold bg-white hover:bg-gray-200 text-black px-2 py-1 rounded">Use this hook</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SCRIPT RESULT */}
              {selectedModes.includes("script") && generatedScript && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-bold text-[#A1A1A1] uppercase tracking-wider">GENERATED SCRIPT</h3>
                  <div className="bg-[#0F0F0F] border border-[#242424] rounded-xl overflow-hidden shadow-xl">
                    <div className="bg-[#0A0A0A] px-5 py-3 border-b border-[#242424] flex items-center justify-between">
                      <input defaultValue={generatedScript.title} className="font-bold text-sm text-white bg-transparent border-none outline-none w-64" />
                      <div className="flex items-center gap-2">
                        <button className="text-[11px] font-bold text-[#A1A1A1] hover:text-white">Copy</button>
                        <button className="text-[11px] font-bold text-white hover:text-gray-300">Regenerate</button>
                      </div>
                    </div>
                    <div className="p-6 space-y-5 text-sm">
                      <div>
                        <span className="text-[10px] font-bold text-[#6F6F6F] uppercase tracking-wider block mb-1">Hook</span>
                        <textarea defaultValue={generatedScript.hook} rows={2} className="w-full bg-transparent text-white font-medium border-none outline-none resize-none" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#6F6F6F] uppercase tracking-wider block mb-1">Main Content</span>
                        <textarea defaultValue={generatedScript.body} rows={4} className="w-full bg-transparent text-[#A1A1A1] leading-relaxed border-none outline-none resize-none" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#6F6F6F] uppercase tracking-wider block mb-1">Call to action</span>
                        <textarea defaultValue={generatedScript.cta} rows={1} className="w-full bg-transparent text-white font-medium border-none outline-none resize-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* REPURPOSE RESULT */}
              {selectedModes.includes("repurpose") && repurposedContent && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-bold text-[#A1A1A1] uppercase tracking-wider">PLATFORM CONTENT</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(repurposedContent).map(([platform, text]) => (
                      <div key={platform} className="bg-[#0F0F0F] border border-[#242424] rounded-xl p-5 space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase flex items-center justify-between">
                          {platform}
                          <button className="text-[10px] text-white">Copy</button>
                        </h4>
                        <textarea 
                          defaultValue={text as string} 
                          rows={6}
                          className="w-full bg-[#0A0A0A] border border-[#242424] rounded p-3 text-xs text-[#A1A1A1] focus:outline-none focus:border-[#303030] resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AIStudioPage() {
  return (
    <Suspense fallback={
      <div className="p-16 text-center text-[#A1A1A1]">
        <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-2" />
        <p className="text-xs">Loading Workspace...</p>
      </div>
    }>
      <AIStudioContent />
    </Suspense>
  );
}
