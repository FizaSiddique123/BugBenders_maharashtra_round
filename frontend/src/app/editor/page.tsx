"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Video,
  Film,
  Play,
  Pause,
  Download,
  RotateCcw,
  Sliders,
  Type,
  Sparkles,
  Layers,
  CheckCircle,
  Loader2,
  Trash2,
  Plus,
  Scissors
} from "lucide-react";
import { api, getMediaUrl } from "@/lib/api";
import { Clip, Asset, TranscriptSegment } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

function VideoEditorContent() {


  const searchParams = useSearchParams();
  const initialClipId = searchParams.get("clipId");

  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [rendering, setRendering] = useState<boolean>(false);
  const [renderSuccessMsg, setRenderSuccessMsg] = useState<string | null>(null);

  // Editable Specification Form State
  const [startTime, setStartTime] = useState<number>(0.0);
  const [endTime, setEndTime] = useState<number>(10.0);
  const [aspectRatio, setAspectRatio] = useState<string>("9:16");
  const [captionsEnabled, setCaptionsEnabled] = useState<boolean>(true);
  const [captionStyle, setCaptionStyle] = useState<string>("bold_yellow");
  
  // Custom Editable Subtitle Segments
  const [subtitles, setSubtitles] = useState<TranscriptSegment[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoKey, setVideoKey] = useState<number>(0);

  const fetchClips = async () => {
    try {
      setLoading(true);
      const data = await api.getClips();
      setClips(data);
      if (data.length > 0) {
        const target = initialClipId ? data.find(c => c.id === initialClipId) : data[0];
        if (target) selectClip(target);
      }
    } catch (err) {
      console.error("Failed to load clips:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClips();
  }, [initialClipId]);

  const selectClip = (clip: Clip) => {
    setSelectedClip(clip);
    setAspectRatio(clip.aspect_ratio || "9:16");
    setCaptionsEnabled(clip.captions_enabled);
    setCaptionStyle(clip.caption_style || "bold_yellow");
    setStartTime(0.0);
    setEndTime(clip.duration || 10.0);
    setRenderSuccessMsg(null);
    setVideoKey(prev => prev + 1);
  };

  const handleRerender = async () => {
    if (!selectedClip) return;
    try {
      setRendering(true);
      setRenderSuccessMsg(null);

      const res = await api.renderModifiedClip(selectedClip.id, {
        start_time: startTime,
        end_time: endTime,
        aspect_ratio: aspectRatio,
        captions_enabled: captionsEnabled,
        caption_style: captionStyle,
        custom_subtitles: subtitles.length > 0 ? subtitles : undefined,
      });

      // Poll until render is complete
      let tries = 0;
      const poll = setInterval(async () => {
        tries++;
        try {
          const updated = await api.getClip(selectedClip.id);
          if (updated.status === "ready") {
            clearInterval(poll);
            setSelectedClip(updated);
            setRendering(false);
            setRenderSuccessMsg("Clip re-rendered successfully with your custom specifications!");
            setVideoKey(prev => prev + 1);
          } else if (updated.status === "failed") {
            clearInterval(poll);
            setRendering(false);
            alert("Clip rendering failed in video engine.");
          }
        } catch {}

        if (tries > 25) {
          clearInterval(poll);
          setRendering(false);
        }
      }, 1500);

    } catch (err: any) {
      alert(`Render error: ${err.message || err}`);
      setRendering(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Video className="w-7 h-7 text-indigo-400" />
            <span>Editable AI Video Editor</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Adjust clip start/end timestamps, swap aspect ratios, and customize caption typography.
          </p>
        </div>

        {/* Clip Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-400">Select Clip:</label>
          <select
            value={selectedClip?.id || ""}
            onChange={(e) => {
              const c = clips.find(item => item.id === e.target.value);
              if (c) selectClip(c);
            }}
            className="px-3 py-2 rounded-xl bg-[#121824] border border-[#1e2638] text-xs text-slate-200 font-semibold focus:outline-none focus:border-indigo-500"
          >
            {clips.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.aspect_ratio}, {formatDuration(c.duration)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {renderSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{renderSuccessMsg}</span>
        </div>
      )}

      {/* Editor Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left (5 Cols): Video Preview & Download */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-[#0e131b] border border-[#1e2638] flex flex-col items-center justify-center space-y-4">
            <div className={`relative bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center border border-[#1e2638] ${
              aspectRatio === "9:16"
                ? "w-64 aspect-[9/16]"
                : aspectRatio === "1:1"
                ? "w-80 aspect-square"
                : "w-full aspect-video"
            }`}>
              {selectedClip ? (
                <video
                  key={`${selectedClip.id}_${videoKey}`}
                  ref={videoRef}
                  src={getMediaUrl(selectedClip.output_path)}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-600 p-8">
                  <Film className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-xs">No clip selected</p>
                </div>
              )}

              {rendering && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-xs text-slate-200">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                  <span className="font-semibold">Rendering via FFmpeg...</span>
                </div>
              )}
            </div>

            {selectedClip && (
              <div className="w-full flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  Duration: <strong className="text-slate-200">{formatDuration(selectedClip.duration)}</strong>
                </span>

                <a
                  href={getMediaUrl(selectedClip.output_path)}
                  download={`${selectedClip.title.replace(/\s+/g, '_')}.mp4`}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP4</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right (7 Cols): Edit Spec Controls & Subtitles */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0e131b] border border-[#1e2638] space-y-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#1e2638] pb-3">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>JSON Edit Specification</span>
            </h2>

            {/* Time Trimming Controls */}
            <div className="p-4 rounded-xl bg-[#121824] border border-[#1e2638] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Clip Time Boundaries (seconds)</span>
                </span>
                <span className="font-mono text-cyan-400 font-bold">
                  {startTime}s — {endTime}s ({Math.max(1, Math.round(endTime - startTime))}s total)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Start Time (s):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={startTime}
                    onChange={(e) => setStartTime(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0c1017] border border-[#1e2638] text-slate-200 font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">End Time (s):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={endTime}
                    onChange={(e) => setEndTime(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0c1017] border border-[#1e2638] text-slate-200 font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Aspect Ratio Picker */}
            <div className="p-4 rounded-xl bg-[#121824] border border-[#1e2638] space-y-2">
              <label className="text-xs font-semibold text-slate-200">Target Aspect Ratio:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { ratio: "9:16", label: "9:16 Vertical", desc: "TikTok / Reels / Shorts" },
                  { ratio: "16:9", label: "16:9 Horizontal", desc: "YouTube / Master" },
                  { ratio: "1:1", label: "1:1 Square", desc: "Instagram Feed" },
                ].map((item) => (
                  <button
                    key={item.ratio}
                    type="button"
                    onClick={() => setAspectRatio(item.ratio)}
                    className={`p-3 rounded-xl text-left border transition ${
                      aspectRatio === item.ratio
                        ? "bg-indigo-600/20 border-indigo-500 text-white"
                        : "bg-[#0c1017] border-[#1e2638] text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className="block text-xs font-bold">{item.label}</span>
                    <span className="block text-[10px] text-slate-500">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subtitles & Typography */}
            <div className="p-4 rounded-xl bg-[#121824] border border-[#1e2638] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Burned-in Captions & Subtitles</span>
                </label>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={captionsEnabled}
                    onChange={(e) => setCaptionsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#1e2638] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {captionsEnabled && (
                <div className="space-y-2 pt-1">
                  <label className="text-[11px] text-slate-400">Caption Typography Style:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "bold_yellow", name: "Bold Yellow", color: "text-yellow-400" },
                      { id: "neon_cyan", name: "Neon Cyan", color: "text-cyan-400" },
                      { id: "clean_white", name: "Clean White", color: "text-white" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setCaptionStyle(st.id)}
                        className={`p-2.5 rounded-lg text-center border text-xs font-bold transition ${
                          captionStyle === st.id
                            ? `bg-indigo-600/20 border-indigo-500 ${st.color}`
                            : "bg-[#0c1017] border-[#1e2638] text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {st.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Re-render Action Button */}
            <button
              onClick={handleRerender}
              disabled={rendering || !selectedClip}
              className="w-full py-3.5 rounded-xl text-xs md:text-sm font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {rendering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{rendering ? "Rendering Modified Video..." : "Render Final Video (FFmpeg)"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VideoEditorPage() {
  return (
    <Suspense fallback={
      <div className="p-16 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-2" />
        <p className="text-xs">Loading Video Editor...</p>
      </div>
    }>
      <VideoEditorContent />
    </Suspense>
  );
}

