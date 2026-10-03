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
  Volume2,
  Settings
} from "lucide-react";
import { api, getMediaUrl } from "@/lib/api";
import { Asset, Transcript, HighlightItem, Clip } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

type CreationMode = "best_moments" | "clips" | "hooks" | "script" | "repurpose";

function AIStudioContent() {
  const searchParams = useSearchParams();
  const initialAssetId = searchParams.get("assetId");

  // Global State
  const [activeMenu, setActiveMenu] = useState<CreationMode>("best_moments");

  // Content State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [pastedText, setPastedText] = useState<string>("");
  const [inputType, setInputType] = useState<"video" | "image" | "audio" | "text" | null>(null);

  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Result State
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [generatedHooks, setGeneratedHooks] = useState<string[]>([]);
  const [generatedScript, setGeneratedScript] = useState<any>(null);
  const [repurposedContent, setRepurposedContent] = useState<any>(null);
  const [existingClips, setExistingClips] = useState<Clip[]>([]);

  // Processing State for specific tasks
  const [isProcessingHooks, setIsProcessingHooks] = useState(false);
  const [isProcessingScript, setIsProcessingScript] = useState(false);
  const [isProcessingRepurpose, setIsProcessingRepurpose] = useState(false);
  const [isAnalyzingMoments, setIsAnalyzingMoments] = useState(false);

  // Clip Generation State
  const [generatingClipId, setGeneratingClipId] = useState<string | null>(null);
  const [renderedClips, setRenderedClips] = useState<Record<string, any>>({});
  const [activeClipEditor, setActiveClipEditor] = useState<HighlightItem | null>(null);
  const [clipSettings, setClipSettings] = useState({ aspectRatio: "9:16", captionStyle: "bold_yellow", captionsEnabled: true });

  // Load Initial Assets
  useEffect(() => {
    fetchAssets();
  }, [initialAssetId]);

  const fetchAssets = async () => {
    try {
      const data = await api.getAssets();
      setAssets(data);
      if (initialAssetId && !selectedAsset) {
        const target = data.find(a => a.id === initialAssetId);
        if (target) {
          setSelectedAsset(target);
          setInputType(target.file_type.includes("video") ? "video" : target.file_type.includes("audio") ? "audio" : "image");
        }
      }
    } catch (err) { }
  };

  // Load Transcript and Highlights when Asset Changes
  useEffect(() => {
    if (selectedAsset && (inputType === "video" || inputType === "audio")) {
      loadAssetData(selectedAsset.id);
    }
  }, [selectedAsset, inputType]);

  const loadAssetData = async (assetId: string) => {
    try {
      let t = await api.getTranscription(assetId).catch(() => null);
      setTranscript(t);
      let h = await api.getHighlights(assetId).catch(() => null);
      if (h) setHighlights(h.highlights);
      let c = await api.getClips(assetId).catch(() => []);
      setExistingClips(c);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const newAsset = await api.uploadAsset(file);
      setAssets(prev => [newAsset, ...prev]);
      setSelectedAsset(newAsset);

      if (file.type.startsWith("video/")) setInputType("video");
      else if (file.type.startsWith("audio/")) setInputType("audio");
      else if (file.type.startsWith("image/")) setInputType("image");

      // Auto trigger transcription fetch polling if it's media
      if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
        pollForTranscription(newAsset.id);
      }
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const pollForTranscription = (assetId: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const t = await api.getTranscription(assetId);
        if (t && t.segments.length > 0) {
          setTranscript(t);
          clearInterval(interval);
        }
      } catch (e) {
        if (attempts > 30) clearInterval(interval); // Give up after a while
      }
    }, 2000);
  };

  const getContentSource = () => {
    if (inputType === "text") return pastedText;
    if (transcript) return transcript.full_text;
    if (selectedAsset) return `Analyze this asset: ${selectedAsset.filename}`;
    return "";
  };

  const handleGenerateHooks = async () => {
    const content = getContentSource();
    if (!content) return alert("Please provide some content first.");

    setIsProcessingHooks(true);
    try {
      const res = await api.generateHooks(content);
      if (res.hooks) setGeneratedHooks(res.hooks);
    } catch (e: any) {
      alert("Failed to generate hooks: " + e.message);
    } finally {
      setIsProcessingHooks(false);
    }
  };

  const handleGenerateScript = async () => {
    const content = getContentSource();
    if (!content) return alert("Please provide some content first.");

    setIsProcessingScript(true);
    try {
      const res = await api.generateScript({
        topic: content.substring(0, 1000),
        platform: "youtube_shorts"
      });
      if (res) setGeneratedScript({
        title: res.title,
        hook: res.hooks[0],
        body: res.full_script,
        cta: res.call_to_action
      });
    } catch (e: any) {
      alert("Failed to generate script: " + e.message);
    } finally {
      setIsProcessingScript(false);
    }
  };

  const handleRepurposeContent = async () => {
    const content = getContentSource();
    if (!content) return alert("Please provide some content first.");

    setIsProcessingRepurpose(true);
    try {
      const res = await api.adaptContent({
        title: selectedAsset?.filename || "Repurposed Content",
        summary: content.substring(0, 500),
        transcript_text: content
      });
      if (res) {
        setRepurposedContent({
          instagram: res.instagram?.caption || "",
          youtube: res.youtube_shorts?.description || "",
          linkedin: res.linkedin?.caption || ""
        });
      }
    } catch (e: any) {
      alert("Failed to repurpose content: " + e.message);
    } finally {
      setIsProcessingRepurpose(false);
    }
  };

  const handleAnalyzeMoments = async () => {
    if (!selectedAsset) return;
    setIsAnalyzingMoments(true);
    try {
      const res = await api.generateHighlights(selectedAsset.id);
      if (res.highlights) setHighlights(res.highlights);
    } catch (e: any) {
      alert("Failed to analyze moments: " + e.message);
    } finally {
      setIsAnalyzingMoments(false);
    }
  };

  const handleGenerateClip = async (hl: HighlightItem) => {
    if (!selectedAsset) return;
    const clipKey = hl.id || hl.title;
    try {
      setGeneratingClipId(clipKey);
      await api.generateClip({
        asset_id: selectedAsset.id,
        start_time: hl.start_time,
        end_time: hl.end_time,
        title: hl.title,
        aspect_ratio: clipSettings.aspectRatio,
        captions_enabled: clipSettings.captionsEnabled,
        caption_style: clipSettings.captionStyle,
      });

      const poll = setInterval(async () => {
        try {
          const clips = await api.getClips(selectedAsset.id);
          const found = clips.find(c => c.title === hl.title && c.status === "ready");
          if (found) {
            clearInterval(poll);
            setRenderedClips(prev => ({ ...prev, [clipKey]: found }));
            setGeneratingClipId(null);
          }
          const failed = clips.find(c => c.title === hl.title && c.status === "failed");
          if (failed) {
            clearInterval(poll);
            setGeneratingClipId(null);
            alert("Clip generation failed on the backend.");
          }
        } catch (e) { }
      }, 3000);

    } catch (err: any) {
      alert(`Clip generation failed: ${err.message}`);
      setGeneratingClipId(null);
    }
  };

  const triggerFileUpload = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const hasActiveContent = selectedAsset !== null || pastedText !== "";

  return (
    <div className="flex min-h-[calc(100vh-80px)] -m-6 md:-m-10">

      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-[var(--color-border)] bg-[var(--color-background)] hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-xs font-bold text-[var(--color-muted)] tracking-wider uppercase mb-4">Create</h2>
          <nav className="space-y-1">
            {[
              { id: "best_moments", icon: Scissors, label: "Best Moments" },
              { id: "clips", icon: Play, label: "Short Clips" },
              { id: "hooks", icon: Sparkles, label: "Hooks" },
              { id: "script", icon: FileText, label: "Script" },
              { id: "repurpose", icon: Layers, label: "Repurpose" }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id as CreationMode)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeMenu === item.id
                    ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30"
                    : "text-[var(--color-foreground-secondary)] hover:text-white hover:bg-[var(--color-surface)] border border-transparent"
                  }`}
              >
                <item.icon className={`w-4 h-4 ${activeMenu === item.id ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"}`} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto">
        <div className="w-full max-w-5xl mx-auto space-y-8">

          <header className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white">AI Studio</h1>
            <p className="text-sm text-[var(--color-foreground-secondary)]">Turn your content into publish-ready ideas, scripts, clips and more.</p>
          </header>

          {/* ACTIVE CONTENT SELECTOR */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider">ACTIVE CONTEXT</h3>
              {hasActiveContent && (
                <button onClick={() => { setSelectedAsset(null); setPastedText(""); setInputType(null); }} className="text-xs text-[var(--color-primary)] hover:text-white transition-colors">
                  Clear Context
                </button>
              )}
            </div>

            {!hasActiveContent && !inputType ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in">
                <button onClick={() => triggerFileUpload("video/*")} className="flex flex-col items-center justify-center p-6 bg-[var(--color-background)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 rounded-xl transition gap-3 group">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] group-hover:bg-[var(--color-primary)]/20 border border-[var(--color-border)] group-hover:border-[var(--color-primary)]/50 flex items-center justify-center text-[var(--color-muted)] group-hover:text-[var(--color-primary)] transition"><Video className="w-5 h-5" /></div>
                  <span className="text-sm font-semibold text-[var(--color-foreground-secondary)] group-hover:text-white transition-colors">Upload Video</span>
                </button>
                <button onClick={() => triggerFileUpload("image/*")} className="flex flex-col items-center justify-center p-6 bg-[var(--color-background)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 rounded-xl transition gap-3 group">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] group-hover:bg-[var(--color-primary)]/20 border border-[var(--color-border)] group-hover:border-[var(--color-primary)]/50 flex items-center justify-center text-[var(--color-muted)] group-hover:text-[var(--color-primary)] transition"><ImageIcon className="w-5 h-5" /></div>
                  <span className="text-sm font-semibold text-[var(--color-foreground-secondary)] group-hover:text-white transition-colors">Upload Image</span>
                </button>
                <button onClick={() => triggerFileUpload("audio/*")} className="flex flex-col items-center justify-center p-6 bg-[var(--color-background)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 rounded-xl transition gap-3 group">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] group-hover:bg-[var(--color-primary)]/20 border border-[var(--color-border)] group-hover:border-[var(--color-primary)]/50 flex items-center justify-center text-[var(--color-muted)] group-hover:text-[var(--color-primary)] transition"><Headphones className="w-5 h-5" /></div>
                  <span className="text-sm font-semibold text-[var(--color-foreground-secondary)] group-hover:text-white transition-colors">Upload Audio</span>
                </button>
                <button onClick={() => setInputType("text")} className="flex flex-col items-center justify-center p-6 bg-[var(--color-background)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 rounded-xl transition gap-3 group">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] group-hover:bg-[var(--color-primary)]/20 border border-[var(--color-border)] group-hover:border-[var(--color-primary)]/50 flex items-center justify-center text-[var(--color-muted)] group-hover:text-[var(--color-primary)] transition"><Type className="w-5 h-5" /></div>
                  <span className="text-sm font-semibold text-[var(--color-foreground-secondary)] group-hover:text-white transition-colors">Paste Text</span>
                </button>
              </div>
            ) : isUploading ? (
              <div className="flex flex-col items-center justify-center p-8 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)] mb-4" />
                <p className="text-sm font-bold text-white">Uploading your asset...</p>
                <p className="text-xs text-[var(--color-muted)] mt-2">Please do not close this window.</p>
              </div>
            ) : uploadError ? (
              <div className="p-4 bg-[var(--color-error)]/20 border border-[var(--color-error)]/50 rounded-xl text-white text-sm flex items-center justify-between">
                <span>{uploadError}</span>
                <button onClick={() => { setUploadError(null); setInputType(null); }} className="underline text-xs">Try again</button>
              </div>
            ) : inputType === "text" && !pastedText ? (
              <div className="space-y-4">
                <textarea
                  placeholder="Paste your script, article, or notes here..."
                  rows={6}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full p-4 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-white placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] resize-none transition"
                />
                <button onClick={() => setInputType(null)} className="text-xs text-[var(--color-muted)] hover:text-white transition-colors">Cancel</button>
              </div>
            ) : hasActiveContent && (
              <div className="flex items-center gap-4 bg-[var(--color-background)] p-4 rounded-xl border border-[var(--color-border)]">
                {inputType === "text" ? (
                  <div className="w-12 h-12 rounded bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center"><Type className="w-5 h-5 text-[var(--color-muted)]" /></div>
                ) : selectedAsset ? (
                  selectedAsset.thumbnail_path ? (
                    <img src={getMediaUrl(selectedAsset.thumbnail_path)} alt="Thumb" className="w-12 h-12 rounded object-cover border border-[var(--color-border)]" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
                      {inputType === "audio" ? <Headphones className="w-5 h-5 text-[var(--color-muted)]" /> : <Video className="w-5 h-5 text-[var(--color-muted)]" />}
                    </div>
                  )
                ) : null}
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm truncate group-hover:text-[var(--color-primary)] transition-colors">
                    {inputType === "text" ? "Pasted Text Content" : selectedAsset?.filename}
                  </h4>
                  {selectedAsset && (
                    <p className="text-xs text-[var(--color-muted)] font-mono mt-1">
                      {formatDuration(selectedAsset.duration)} • {(selectedAsset.size_bytes / 1024 / 1024).toFixed(1)} MB
                    </p>
                  )}
                  {inputType === "text" && (
                    <p className="text-xs text-[var(--color-muted)] font-mono mt-1">{pastedText.length} characters</p>
                  )}
                </div>
                {selectedAsset && (inputType === "video" || inputType === "audio") && (
                  <div className="text-right">
                    {transcript ? (
                      <span className="text-xs text-green-400 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Transcript Ready</span>
                    ) : (
                      <span className="text-xs text-[var(--color-primary)] font-semibold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Transcribing...</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* WORKSPACE AREA */}
          {hasActiveContent && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* BEST MOMENTS WORKSPACE */}
              {activeMenu === "best_moments" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Scissors className="w-5 h-5 text-white" /> AI Highlights
                    </h2>
                    {(inputType === "video" || inputType === "audio") && (
                      <button
                        onClick={handleAnalyzeMoments}
                        disabled={isAnalyzingMoments || !transcript}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-secondary)] text-white shadow hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all flex items-center gap-2 disabled:opacity-50 hover:-translate-y-[1px]"
                      >
                        {isAnalyzingMoments ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Find Best Moments
                      </button>
                    )}
                  </div>

                  {inputType !== "video" && inputType !== "audio" ? (
                    <p className="text-sm text-[var(--color-muted)] p-8 border border-[var(--color-border)] rounded-xl text-center bg-[var(--color-background)]">Best Moments requires Video or Audio content with speech.</p>
                  ) : highlights.length === 0 ? (
                    <div className="p-16 border border-dashed border-[var(--color-border)] rounded-xl text-center bg-[var(--color-surface)] shadow-sm">
                      <Flame className="w-8 h-8 text-[var(--color-muted)] mx-auto mb-4" />
                      <p className="text-sm text-[var(--color-foreground-secondary)]">No highlights detected yet.</p>
                      {transcript ? (
                        <p className="text-xs text-[var(--color-muted)] mt-2">Click 'Find Best Moments' to analyze the transcript.</p>
                      ) : (
                        <p className="text-xs text-[var(--color-muted)] mt-2">Waiting for transcription to finish...</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {highlights.map((hl, i) => {
                        const clipKey = hl.id || hl.title;
                        const isRendering = generatingClipId === clipKey;
                        const completedClip = renderedClips[clipKey];
                        return (
                          <div key={clipKey || i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 space-y-4 hover:border-[var(--color-primary)]/50 transition shadow-md flex flex-col justify-between">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-black text-[var(--color-border)]">{(i + 1).toString().padStart(2, '0')}</span>
                                <span className="font-mono text-xs font-bold text-[var(--color-muted)] bg-[var(--color-background)] px-2 py-1 rounded border border-[var(--color-border)]">
                                  {formatDuration(hl.start_time)} — {formatDuration(hl.end_time)}
                                </span>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm text-white font-bold italic group-hover:text-[var(--color-primary)] transition-colors">"{hl.hook}"</p>
                                <h4 className="text-lg font-bold text-[var(--color-ai)]">{hl.title}</h4>
                              </div>
                              <div className="p-3 bg-[var(--color-background)] rounded-lg border border-[var(--color-border)] space-y-1">
                                <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider">Why this works</p>
                                <p className="text-xs text-[var(--color-foreground-secondary)] leading-relaxed">{hl.reason || hl.summary}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 pt-4 border-t border-[var(--color-border)]">
                              {!completedClip && inputType === "video" && (
                                <button
                                  onClick={() => handleGenerateClip(hl)}
                                  disabled={isRendering}
                                  className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--color-background)] border border-[var(--color-border)] text-white hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition shadow-sm flex justify-center items-center gap-2"
                                >
                                  {isRendering ? <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" /> : <Play className="w-4 h-4 text-[var(--color-primary)]" />}
                                  {isRendering ? "Rendering..." : "Generate Clip"}
                                </button>
                              )}
                            </div>
                            {completedClip && (
                              <div className="mt-2 p-3 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-center space-y-3">
                                <p className="text-sm font-bold text-[var(--color-primary)] flex items-center justify-center gap-2">
                                  <CheckCircle className="w-4 h-4" /> Clip Ready
                                </p>
                                <div className="flex items-center justify-center gap-2">
                                  <a href={getMediaUrl(completedClip.filepath)} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded text-xs font-semibold bg-white text-black transition hover:bg-gray-200">
                                    Preview
                                  </a>
                                  <a href={getMediaUrl(completedClip.filepath)} download className="px-3 py-1.5 rounded text-xs font-semibold bg-[var(--color-background)] border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-white transition">
                                    Download
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* CLIPS WORKSPACE */}
              {activeMenu === "clips" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Play className="w-5 h-5 text-white" /> Generated Clips
                    </h2>
                  </div>

                  {existingClips.length === 0 ? (
                    <div className="p-16 border border-dashed border-[var(--color-border)] rounded-xl text-center bg-[var(--color-surface)]">
                      <Play className="w-8 h-8 text-[var(--color-muted)] mx-auto mb-4" />
                      <p className="text-sm text-[var(--color-foreground-secondary)]">No clips generated yet.</p>
                      <p className="text-xs text-[var(--color-muted)] mt-2">Go to 'Best Moments' to generate clips from your video.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {existingClips.map((clip) => (
                        <div key={clip.id} className="group relative rounded-xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition shadow-sm hover:shadow-md flex flex-col justify-between">
                          <div className="relative aspect-[9/16] bg-black flex items-center justify-center overflow-hidden border-b border-[var(--color-border)]">
                            {clip.thumbnail_path ? (
                              <img src={getMediaUrl(clip.thumbnail_path)} alt={clip.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                            ) : (
                              <Video className="w-8 h-8 text-[var(--color-muted)]" />
                            )}
                            <a href={getMediaUrl(clip.output_path)} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition z-10">
                              <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.6)] transform group-hover:scale-110 transition"><Play className="w-5 h-5 ml-0.5 fill-current" /></div>
                            </a>
                          </div>
                          <div className="p-3 space-y-1 bg-[var(--color-background)]">
                            <h4 className="text-xs font-bold text-white truncate group-hover:text-[var(--color-primary)] transition-colors" title={clip.title}>{clip.title}</h4>
                            <p className="text-[10px] text-[var(--color-muted)] font-mono">{formatDuration(clip.duration)} • {clip.aspect_ratio}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* HOOKS WORKSPACE */}
              {activeMenu === "hooks" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-white" /> Viral Hooks
                    </h2>
                    <button
                      onClick={handleGenerateHooks}
                      disabled={isProcessingHooks}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-secondary)] text-white text-xs font-bold hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:-translate-y-[1px] transition-all disabled:opacity-50 flex items-center gap-2 shadow"
                    >
                      {isProcessingHooks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Generate Hooks
                    </button>
                  </div>

                  {generatedHooks.length === 0 ? (
                    <div className="p-16 border border-dashed border-[var(--color-border)] rounded-xl text-center bg-[var(--color-surface)] shadow-sm">
                      <Sparkles className="w-8 h-8 text-[var(--color-muted)] mx-auto mb-4" />
                      <p className="text-sm text-[var(--color-foreground-secondary)]">No hooks generated yet.</p>
                      <p className="text-xs text-[var(--color-muted)] mt-2">Click generate to let AI write scroll-stopping hooks.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {generatedHooks.map((hook, i) => (
                        <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 flex items-center justify-between gap-4 group hover:border-[var(--color-primary)]/50 transition shadow-sm">
                          <div className="flex gap-4 items-center w-full">
                            <span className="text-xl font-bold text-[var(--color-border)]">{(i + 1).toString().padStart(2, '0')}</span>
                            <input type="text" defaultValue={hook} className="bg-transparent border-none outline-none text-sm font-medium text-white w-full group-hover:text-[var(--color-primary)] transition-colors" />
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="text-[10px] font-bold bg-[var(--color-background)] hover:bg-[var(--color-primary)]/10 hover:text-white border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 px-2 py-1 rounded text-[var(--color-muted)] transition-colors" onClick={() => navigator.clipboard.writeText(hook)}>Copy</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SCRIPT WORKSPACE */}
              {activeMenu === "script" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-white" /> Script Generator
                    </h2>
                    <button
                      onClick={handleGenerateScript}
                      disabled={isProcessingScript}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-secondary)] text-white text-xs font-bold hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:-translate-y-[1px] transition-all disabled:opacity-50 flex items-center gap-2 shadow"
                    >
                      {isProcessingScript ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      Generate Script
                    </button>
                  </div>

                  {generatedScript ? (
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-xl">
                      <div className="bg-[var(--color-background)] px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
                        <input defaultValue={generatedScript.title} className="font-bold text-sm text-[var(--color-primary)] bg-transparent border-none outline-none w-full max-w-md" />
                      </div>
                      <div className="p-6 space-y-5 text-sm">
                        <div>
                          <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider block mb-2">Hook</span>
                          <textarea defaultValue={generatedScript.hook} rows={2} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 text-white font-medium outline-none resize-none focus:border-[var(--color-primary)] transition" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider block mb-2">Main Content</span>
                          <textarea defaultValue={generatedScript.body} rows={8} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 text-[var(--color-foreground-secondary)] leading-relaxed outline-none resize-none focus:border-[var(--color-primary)] transition" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider block mb-2">Call to action</span>
                          <textarea defaultValue={generatedScript.cta} rows={2} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 text-white font-medium outline-none resize-none focus:border-[var(--color-primary)] transition" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-16 border border-dashed border-[var(--color-border)] rounded-xl text-center bg-[var(--color-surface)] shadow-sm">
                      <FileText className="w-8 h-8 text-[var(--color-muted)] mx-auto mb-4" />
                      <p className="text-sm text-[var(--color-foreground-secondary)]">No script generated yet.</p>
                      <p className="text-xs text-[var(--color-muted)] mt-2">Generate a structured script based on your active content.</p>
                    </div>
                  )}
                </div>
              )}

              {/* REPURPOSE WORKSPACE */}
              {activeMenu === "repurpose" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-white" /> Platform Repurpose
                    </h2>
                    <button
                      onClick={handleRepurposeContent}
                      disabled={isProcessingRepurpose}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-secondary)] text-white text-xs font-bold hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:-translate-y-[1px] transition-all disabled:opacity-50 flex items-center gap-2 shadow"
                    >
                      {isProcessingRepurpose ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                      Adapt for Socials
                    </button>
                  </div>

                  {repurposedContent ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(repurposedContent).map(([platform, text]) => (
                        <div key={platform} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 space-y-3 shadow-md hover:border-[var(--color-primary)]/50 transition-colors">
                          <h4 className="text-xs font-bold text-white uppercase flex items-center justify-between">
                            {platform}
                            <button className="text-[10px] text-[var(--color-muted)] hover:text-white bg-[var(--color-background)] px-2 py-1 rounded border border-[var(--color-border)] transition-colors" onClick={() => navigator.clipboard.writeText(text as string)}>Copy</button>
                          </h4>
                          <textarea
                            defaultValue={text as string}
                            rows={12}
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3 text-xs text-[var(--color-foreground-secondary)] focus:outline-none focus:border-[var(--color-primary)] resize-none transition"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-16 border border-dashed border-[var(--color-border)] rounded-xl text-center bg-[var(--color-surface)] shadow-sm">
                      <Layers className="w-8 h-8 text-[var(--color-muted)] mx-auto mb-4" />
                      <p className="text-sm text-[var(--color-foreground-secondary)]">No platform content generated yet.</p>
                      <p className="text-xs text-[var(--color-muted)] mt-2">Adapt your content for Instagram, YouTube, and LinkedIn instantly.</p>
                    </div>
                  )}
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
