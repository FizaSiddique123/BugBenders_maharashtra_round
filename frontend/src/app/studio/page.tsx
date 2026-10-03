"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Video,
  Play,
  Pause,
  Clock,
  Scissors,
  CheckCircle,
  TrendingUp,
  FileText,
  Layers,
  ChevronRight,
  Loader2,
  AlertCircle,
  Share2,
  Volume2,
  Sliders,
  Flame,
  ArrowUpRight
} from "lucide-react";
import { api, getMediaUrl } from "@/lib/api";
import { Asset, Transcript, HighlightItem, ScriptComparison } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

function AIStudioContent() {

  const searchParams = useSearchParams();
  const initialAssetId = searchParams.get("assetId");

  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  
  // Loading & Job states
  const [loadingMedia, setLoadingMedia] = useState<boolean>(true);
  const [transcribing, setTranscribing] = useState<boolean>(false);
  const [detecting, setDetecting] = useState<boolean>(false);
  const [generatingClipId, setGeneratingClipId] = useState<string | null>(null);
  const [generatedSuccessMsg, setGeneratedSuccessMsg] = useState<string | null>(null);

  // Tabs: 'highlights' | 'script_compare'
  const [activeTab, setActiveTab] = useState<"highlights" | "script_compare">("highlights");
  
  // Script Comparison State
  const [scriptInput, setScriptInput] = useState<string>("");
  const [comparing, setComparing] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<ScriptComparison | null>(null);

  // Video Player Ref & Time
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Selected Highlight Clip Settings
  const [clipSettings, setClipSettings] = useState<{
    aspectRatio: string;
    captionStyle: string;
    captionsEnabled: boolean;
  }>({
    aspectRatio: "9:16",
    captionStyle: "bold_yellow",
    captionsEnabled: true,
  });

  // Load all assets on mount
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoadingMedia(true);
        const data = await api.getAssets();
        setAssets(data);
        if (data.length > 0) {
          const target = initialAssetId ? data.find(a => a.id === initialAssetId) : data[0];
          if (target) selectAsset(target);
        }
      } catch (err) {
        console.error("Failed to fetch assets:", err);
      } finally {
        setLoadingMedia(false);
      }
    };
    fetchAssets();
  }, [initialAssetId]);

  const selectAsset = async (asset: Asset) => {
    setSelectedAsset(asset);
    setTranscript(null);
    setHighlights([]);
    setComparisonResult(null);

    // Fetch existing transcript & highlights
    try {
      const t = await api.getTranscription(asset.id).catch(() => null);
      if (t) setTranscript(t);

      const h = await api.getHighlights(asset.id).catch(() => null);
      if (h && h.highlights) setHighlights(h.highlights);
    } catch (err) {
      // Not yet generated
    }
  };

  const handleTranscribe = async () => {
    if (!selectedAsset) return;
    try {
      setTranscribing(true);
      await api.triggerTranscription(selectedAsset.id);
      
      // Poll for transcript completion
      let tries = 0;
      const poll = setInterval(async () => {
        tries++;
        try {
          const t = await api.getTranscription(selectedAsset.id);
          if (t && t.segments.length > 0) {
            setTranscript(t);
            clearInterval(poll);
            setTranscribing(false);
            // Fetch highlights
            const h = await api.getHighlights(selectedAsset.id).catch(() => null);
            if (h) setHighlights(h.highlights);
          }
        } catch {}
        if (tries > 30) {
          clearInterval(poll);
          setTranscribing(false);
        }
      }, 1500);
    } catch (err: any) {
      alert(`Transcription error: ${err.message || err}`);
      setTranscribing(false);
    }
  };

  const handleDetectHighlights = async () => {
    if (!selectedAsset) return;
    try {
      setDetecting(true);
      const res = await api.generateHighlights(selectedAsset.id);
      if (res && res.highlights) {
        setHighlights(res.highlights);
      }
    } catch (err: any) {
      alert(`Highlight detection failed: ${err.message || err}`);
    } finally {
      setDetecting(false);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleGenerateClip = async (hl: HighlightItem) => {
    if (!selectedAsset) return;
    try {
      setGeneratingClipId(hl.id || hl.title);
      setGeneratedSuccessMsg(null);
      const res = await api.generateClip({
        asset_id: selectedAsset.id,
        project_id: selectedAsset.project_id || undefined,
        start_time: hl.start_time,
        end_time: hl.end_time,
        title: hl.title,
        aspect_ratio: clipSettings.aspectRatio,
        captions_enabled: clipSettings.captionsEnabled,
        caption_style: clipSettings.captionStyle,
      });

      setGeneratedSuccessMsg(`Short clip '${hl.title}' queued for rendering in ${clipSettings.aspectRatio} format!`);
    } catch (err: any) {
      alert(`Clip generation failed: ${err.message || err}`);
    } finally {
      setGeneratingClipId(null);
    }
  };

  const handleCompareScript = async () => {
    if (!selectedAsset || !scriptInput.trim()) return;
    try {
      setComparing(true);
      const res = await api.compareScript(scriptInput, selectedAsset.id);
      setComparisonResult(res);
    } catch (err: any) {
      alert(`Script comparison failed: ${err.message || err}`);
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Controls Bar */}
      <div className="p-4 rounded-2xl bg-[#0e131b] border border-[#1e2638] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              <span>AI Video Studio & Highlights</span>
            </h1>
            <p className="text-xs text-slate-400">
              Analyze transcripts, pinpoint high-retention opportunities, and render vertical shorts.
            </p>
          </div>
        </div>

        {/* Asset Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-400">Master Video:</label>
          <select
            value={selectedAsset?.id || ""}
            onChange={(e) => {
              const a = assets.find(item => item.id === e.target.value);
              if (a) selectAsset(a);
            }}
            className="px-3 py-2 rounded-xl bg-[#121824] border border-[#1e2638] text-xs text-slate-200 font-semibold focus:outline-none focus:border-indigo-500"
          >
            {assets.map(a => (
              <option key={a.id} value={a.id}>
                {a.filename} ({formatDuration(a.duration)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {generatedSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{generatedSuccessMsg}</span>
          </div>
          <Link href="/editor" className="font-bold underline text-emerald-200 hover:text-white">
            View in Editor →
          </Link>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Video Player & Transcript Sync */}
        <div className="lg:col-span-6 space-y-6">
          {/* Synchronized Video Player */}
          <div className="p-5 rounded-2xl bg-[#0e131b] border border-[#1e2638] space-y-3">
            <div className="relative aspect-video rounded-xl bg-black overflow-hidden flex items-center justify-center shadow-2xl">
              {selectedAsset ? (
                <video
                  ref={videoRef}
                  src={getMediaUrl(selectedAsset.filepath)}
                  controls
                  onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-500 p-8">
                  <Video className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-xs">Select a video asset to begin</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>{selectedAsset?.filename}</span>
              <span className="font-mono text-cyan-400 font-semibold">
                {formatDuration(currentTime)} / {formatDuration(selectedAsset?.duration || 0)}
              </span>
            </div>
          </div>

          {/* Transcript & Script Analysis Tabs */}
          <div className="p-5 rounded-2xl bg-[#0e131b] border border-[#1e2638] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2638] pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("highlights")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === "highlights" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Transcript & Sync
                </button>
                <button
                  onClick={() => setActiveTab("script_compare")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === "script_compare" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Script Comparison
                </button>
              </div>

              {!transcript && (
                <button
                  onClick={handleTranscribe}
                  disabled={transcribing || !selectedAsset}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {transcribing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{transcribing ? "Transcribing..." : "Transcribe Video"}</span>
                </button>
              )}
            </div>

            {/* TAB 1: Synchronized Timestamped Transcript */}
            {activeTab === "highlights" && (
              <div className="space-y-3">
                {transcribing ? (
                  <div className="p-8 text-center space-y-2">
                    <Loader2 className="w-7 h-7 animate-spin text-cyan-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-200">Extracting audio & speech timestamps...</p>
                    <p className="text-[11px] text-slate-500">Gemini AI / Whisper audio segmenting</p>
                  </div>
                ) : transcript?.segments && transcript.segments.length > 0 ? (
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {transcript.segments.map((seg) => {
                      const isCurrent = currentTime >= seg.start && currentTime <= seg.end;
                      return (
                        <div
                          key={seg.id}
                          onClick={() => handleSeek(seg.start)}
                          className={`p-2.5 rounded-xl cursor-pointer transition text-xs flex items-start gap-3 ${
                            isCurrent
                              ? "bg-indigo-600/20 border border-indigo-500/50 text-white shadow-sm"
                              : "bg-[#121824] hover:bg-[#182030] text-slate-300 border border-transparent"
                          }`}
                        >
                          <span className="font-mono text-[10px] font-bold text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20 flex-shrink-0 mt-0.5">
                            {formatDuration(seg.start)}
                          </span>
                          <p className="leading-relaxed flex-1">{seg.text}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <Volume2 className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs font-medium">No transcript generated yet for this asset.</p>
                    <button
                      onClick={handleTranscribe}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white shadow"
                    >
                      Run Audio Transcription
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Script-to-Video Understanding */}
            {activeTab === "script_compare" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Planned Script / Outline:</label>
                  <textarea
                    rows={3}
                    placeholder="Paste the planned video script here to compare with actual spoken performance..."
                    value={scriptInput}
                    onChange={(e) => setScriptInput(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#121824] border border-[#1e2638] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                  <button
                    onClick={handleCompareScript}
                    disabled={comparing || !scriptInput.trim()}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {comparing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Compare Script vs Video</span>
                  </button>
                </div>

                {comparisonResult && (
                  <div className="p-4 rounded-xl bg-[#121824] border border-[#1e2638] space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">Delivery Adherence</span>
                      <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {comparisonResult.adherence_score}% Matched
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{comparisonResult.summary}</p>

                    <div className="space-y-1.5 pt-1">
                      <p className="font-semibold text-indigo-300 text-[11px]">Covered Talking Points:</p>
                      {comparisonResult.matching_sections.map((m, i) => (
                        <div key={i} className="p-2 rounded-lg bg-[#0c1017] border border-[#1e2638] flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-200 font-medium">{m.script_part}</span>
                            <span className="block text-[10px] text-slate-400">Spoken at {formatDuration(m.spoken_at_time)}: "{m.transcript_match}"</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 Cols): AI Highlight Opportunities & Auto-Generation */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0e131b] border border-[#1e2638] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e2638] pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <span>AI Highlight Opportunities</span>
                </h2>
                <p className="text-xs text-slate-400">
                  3-5 high retention clips identified with start/end timestamps & virality score.
                </p>
              </div>

              <button
                onClick={handleDetectHighlights}
                disabled={detecting || !selectedAsset}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 transition flex items-center gap-1.5 self-start disabled:opacity-50"
              >
                {detecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{detecting ? "Analyzing..." : "Re-Detect"}</span>
              </button>
            </div>

            {/* Global Clip Formatting Controls */}
            <div className="p-3.5 rounded-xl bg-[#121824] border border-[#1e2638] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Aspect Ratio:</span>
                <select
                  value={clipSettings.aspectRatio}
                  onChange={(e) => setClipSettings({ ...clipSettings, aspectRatio: e.target.value })}
                  className="px-2.5 py-1 rounded bg-[#0c1017] border border-[#1e2638] text-slate-200 font-semibold focus:outline-none"
                >
                  <option value="9:16">9:16 Vertical (Reels / Shorts)</option>
                  <option value="16:9">16:9 Landscape</option>
                  <option value="1:1">1:1 Square</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Captions:</span>
                <select
                  value={clipSettings.captionStyle}
                  onChange={(e) => setClipSettings({ ...clipSettings, captionStyle: e.target.value })}
                  className="px-2.5 py-1 rounded bg-[#0c1017] border border-[#1e2638] text-slate-200 font-semibold focus:outline-none"
                >
                  <option value="bold_yellow">Bold Yellow (Creator)</option>
                  <option value="neon_cyan">Neon Cyan (TikTok)</option>
                  <option value="clean_white">Clean White (Minimal)</option>
                </select>
              </div>
            </div>

            {/* Highlight Cards List */}
            {highlights.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-[#121824] border border-dashed border-[#1e2638] space-y-2">
                <Scissors className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">No highlights detected yet.</p>
                <p className="text-[11px] text-slate-500">
                  Click "Re-Detect" to run Gemini highlight extraction across this video.
                </p>
                <button
                  onClick={handleDetectHighlights}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white transition inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Extract Highlights</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {highlights.map((hl, index) => {
                  const isRendering = generatingClipId === (hl.id || hl.title);
                  return (
                    <div
                      key={hl.id || index}
                      className="p-4 rounded-xl bg-[#121824] border border-[#1e2638] hover:border-indigo-500/40 transition space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Highlight #{index + 1}
                            </span>
                            <span className="font-mono text-xs text-cyan-400 font-bold">
                              {formatDuration(hl.start_time)} - {formatDuration(hl.end_time)} ({Math.round(hl.end_time - hl.start_time)}s)
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white mt-1">{hl.title}</h3>
                        </div>

                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>{hl.virality_score ?? 88}%</span>
                        </div>
                      </div>

                      {/* Hook & Summary */}
                      <div className="space-y-1 text-xs">
                        <p className="text-indigo-200 font-medium">⚡ Hook: "{hl.hook}"</p>
                        <p className="text-slate-400 text-[11px] leading-relaxed">{hl.summary}</p>
                        <p className="text-slate-500 text-[10px] italic">Why: {hl.reason}</p>
                      </div>

                      {/* Platforms & Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1e2638]">
                        <div className="flex items-center gap-1.5">
                          {hl.platforms.map(p => (
                            <span key={p} className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#0c1017] text-slate-400 border border-[#1e2638]">
                              {p}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSeek(hl.start_time)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#151c28] hover:bg-[#1e2638] text-slate-300 transition flex items-center gap-1"
                          >
                            <Play className="w-3 h-3 text-cyan-400" />
                            <span>Preview</span>
                          </button>

                          <button
                            onClick={() => handleGenerateClip(hl)}
                            disabled={isRendering}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isRendering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scissors className="w-3.5 h-3.5" />}
                            <span>{isRendering ? "Rendering..." : "Generate MP4 Clip"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIStudioPage() {
  return (
    <Suspense fallback={
      <div className="p-16 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-2" />
        <p className="text-xs">Loading AI Studio...</p>
      </div>
    }>
      <AIStudioContent />
    </Suspense>
  );
}

