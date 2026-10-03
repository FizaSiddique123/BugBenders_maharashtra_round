"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Film,
  Upload,
  Search,
  Filter,
  Trash2,
  Sparkles,
  Play,
  FileVideo,
  FileImage,
  Clock,
  HardDrive,
  X,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

import { api, getMediaUrl } from "@/lib/api";
import { Asset, Project } from "@/lib/types";
import { formatDuration, formatBytes, formatDate } from "@/lib/utils";

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");

  // Upload State
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadProjectId, setUploadProjectId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview Modal State
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const [asData, prData] = await Promise.all([
        api.getAssets(),
        api.getProjects()
      ]);
      setAssets(asData);
      setProjects(prData);
    } catch (err) {
      console.error("Failed to load media assets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(20);
      await api.uploadAsset(file, uploadProjectId || undefined, true);
      setUploadProgress(100);
      await loadMedia();
    } catch (err: any) {
      alert(`Upload failed: ${err.message || err}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreateSample = async () => {
    try {
      setUploading(true);
      await api.createSampleAsset(uploadProjectId || undefined);
      await loadMedia();
    } catch (err: any) {
      alert(`Failed to create sample: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm("Are you sure you want to delete this media asset?")) return;
    try {
      await api.deleteAsset(assetId);
      setAssets(assets.filter(a => a.id !== assetId));
      if (previewAsset?.id === assetId) setPreviewAsset(null);
    } catch (err: any) {
      alert(`Delete failed: ${err.message || err}`);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === "all" ||
      (selectedType === "video" && asset.file_type.includes("video")) ||
      (selectedType === "image" && asset.file_type.includes("image"));
    const matchesProj = selectedProject === "all" || asset.project_id === selectedProject;
    return matchesSearch && matchesType && matchesProj;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Film className="w-7 h-7 text-indigo-400" />
            <span>Centralized Media Library</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage raw master videos, audio recordings, and visual assets for AI analysis.
          </p>
        </div>


        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateSample}
            disabled={uploading}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#151c28] hover:bg-[#1e2638] text-cyan-300 border border-cyan-500/30 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>+ Load Demo Master</span>
          </button>

          <label className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <span>Upload Media</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Uploading progress notification */}
      {uploading && (
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            <div>
              <p className="text-xs font-semibold text-slate-100">Uploading and probing media asset...</p>
              <p className="text-[11px] text-slate-400">Extracting audio stream & generating video thumbnail</p>
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-400">Processing</span>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="p-4 rounded-xl bg-[#0e131b] border border-[#1e2638] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search assets by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#121824] border border-[#1e2638] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#121824] border border-[#1e2638]">
            {["all", "video", "image"].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded text-xs font-medium capitalize transition ${
                  selectedType === type ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#121824] border border-[#1e2638] text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Media Assets Grid */}
      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading media library...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-[#0e131b] border border-dashed border-[#1e2638] space-y-3">
          <Film className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No media assets found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload your video recordings or click "Load Demo Master" to instantly create a test master video with timer and audio.
          </p>
          <button
            onClick={handleCreateSample}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition inline-flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Sample Master Video</span>
          </button>
        </div>
      ) : (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.map((asset) => {
            const isVideo = asset.file_type.includes("video");
            return (
              <div
                key={asset.id}
                className="group rounded-xl overflow-hidden bg-[#0e131b] border border-[#1e2638] hover:border-indigo-500/40 transition flex flex-col justify-between"
              >
                {/* Media Thumbnail / Preview Area */}
                <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                  {asset.thumbnail_path ? (
                    <img
                      src={getMediaUrl(asset.thumbnail_path)}
                      alt={asset.filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="text-slate-600 flex flex-col items-center gap-1">
                      {isVideo ? <FileVideo className="w-8 h-8" /> : <FileImage className="w-8 h-8" />}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70" />

                  {/* Duration Badge */}
                  {isVideo && asset.duration > 0 && (
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-black/70 text-slate-200">
                      {formatDuration(asset.duration)}
                    </span>
                  )}

                  {/* Play / Preview Trigger */}
                  <button
                    onClick={() => setPreviewAsset(asset)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                    </div>
                  </button>
                </div>

                {/* Metadata & Actions */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-100 truncate" title={asset.filename}>
                      {asset.filename}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {formatBytes(asset.size_bytes)} • {formatDate(asset.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1e2638]">
                    <Link
                      href={`/studio?assetId=${asset.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>AI Studio →</span>
                    </Link>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl rounded-2xl bg-[#0c1017] border border-[#1e2638] overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2638]">
              <div>
                <h3 className="text-sm font-bold text-white">{previewAsset.filename}</h3>
                <p className="text-xs text-slate-400">
                  {formatDuration(previewAsset.duration)} • {formatBytes(previewAsset.size_bytes)}
                </p>
              </div>
              <button
                onClick={() => setPreviewAsset(null)}
                className="p-1.5 rounded-lg bg-[#151c28] text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
              {previewAsset.file_type.includes("video") ? (
                <video
                  src={getMediaUrl(previewAsset.filepath)}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={getMediaUrl(previewAsset.filepath)}
                  alt={previewAsset.filename}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link
                href={`/studio?assetId=${previewAsset.id}`}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open in AI Studio</span>
              </Link>

              <button
                onClick={() => setPreviewAsset(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-[#151c28] text-slate-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
