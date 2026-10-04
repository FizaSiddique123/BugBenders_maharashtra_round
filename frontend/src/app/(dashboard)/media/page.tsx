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
          <h1 className="text-2xl font-bold text-[#18181B] tracking-tight flex items-center gap-2.5 drop-shadow-sm">
            <Film className="w-7 h-7 text-[#18181B]" />
            <span>Centralized Media Library</span>
          </h1>
          <p className="text-sm text-[#18181B] font-semibold mt-1">
            Manage raw master videos, audio recordings, and visual assets for AI analysis.
          </p>
        </div>


        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateSample}
            disabled={uploading}
            className="px-3.5 py-2 rounded text-xs font-semibold bg-[#0A0A0A] hover:bg-[#151515] text-white border border-[#242424] hover:border-[#303030] transition flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>+ Load Demo Master</span>
          </button>

          <label className="cursor-pointer px-4 py-2 rounded text-xs font-semibold bg-white hover:bg-gray-200 text-black shadow-lg transition flex items-center gap-2">
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
        <div className="p-4 rounded bg-[#0A0A0A] border border-[#242424] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-white" />
            <div>
              <p className="text-xs font-semibold text-white">Uploading and probing media asset...</p>
              <p className="text-[11px] text-[#A1A1A1]">Extracting audio stream & generating video thumbnail</p>
            </div>
          </div>
          <span className="text-xs font-mono text-[#A1A1A1]">Processing</span>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="p-4 rounded-xl bg-[#0F0F0F] border border-[#242424] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6F6F6F]" />
          <input
            type="text"
            placeholder="Search assets by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded bg-[#0A0A0A] border border-[#242424] text-xs text-[#F5F5F5] placeholder-[#6F6F6F] focus:outline-none focus:border-[#303030]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded bg-[#0A0A0A] border border-[#242424]">
            {["all", "video", "image"].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded text-xs font-medium capitalize transition ${selectedType === type ? "bg-white text-black shadow" : "text-[#A1A1A1] hover:text-white"
                  }`}
              >
                {type}
              </button>
            ))}
          </div>

          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 rounded bg-[#0A0A0A] border border-[#242424] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#303030]"
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
        <div className="p-16 text-center bg-white/20 backdrop-blur-md rounded-xl border border-white/30 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#18181B] mx-auto mb-3" />
          <p className="text-xs font-bold text-[#18181B]">Loading media library...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="py-16 text-center rounded-xl border-2 border-dashed border-[#18181B]/20 bg-white/20 backdrop-blur-md flex flex-col items-center justify-center shadow-sm">
          <Film className="w-8 h-8 text-[#18181B] mx-auto mb-4" />
          <span className="premium-label text-[#18181B] mb-2 drop-shadow-sm">NO VIDEOS YET</span>
          <p className="text-sm font-bold text-[#18181B] max-w-sm mb-6 drop-shadow-sm">
            Your workspace starts with a recording. Upload a long-form video and CreatorAI will identify the moments worth turning into shorts.
          </p>
          <button
            onClick={handleCreateSample}
            className="px-6 py-2.5 rounded bg-white text-black text-xs font-bold hover:bg-[#E8E8E8] transition-colors inline-flex items-center gap-2"
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
                className="group rounded-xl overflow-hidden bg-[#0F0F0F] border border-[#242424] hover:border-[#303030] transition flex flex-col justify-between"
              >
                {/* Media Thumbnail / Preview Area */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  {asset.thumbnail_path ? (
                    <img
                      src={getMediaUrl(asset.thumbnail_path)}
                      alt={asset.filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="text-[#6F6F6F] flex flex-col items-center gap-1">
                      {isVideo ? <FileVideo className="w-8 h-8" /> : <FileImage className="w-8 h-8" />}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70" />

                  {/* Duration Badge */}
                  {isVideo && asset.duration > 0 && (
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0A0A0A]/70 text-[#F5F5F5] border border-[#242424]/50">
                      {formatDuration(asset.duration)}
                    </span>
                  )}

                  {/* Play / Preview Trigger */}
                  <button
                    onClick={() => setPreviewAsset(asset)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200"
                  >
                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                    </div>
                  </button>
                </div>

                {/* Metadata & Actions */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-xs font-semibold text-white truncate" title={asset.filename}>
                      {asset.filename}
                    </h3>
                    <p className="text-[11px] text-[#A1A1A1] mt-0.5">
                      {formatBytes(asset.size_bytes)} • {formatDate(asset.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#242424]">
                    <Link
                      href={`/studio?assetId=${asset.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-white hover:text-gray-300"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                      <span>AI Studio →</span>
                    </Link>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="p-1.5 rounded text-[#6F6F6F] hover:text-white hover:bg-[#242424] transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl rounded-xl bg-[#0F0F0F] border border-[#242424] overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
              <div>
                <h3 className="text-sm font-bold text-white">{previewAsset.filename}</h3>
                <p className="text-xs text-[#A1A1A1]">
                  {formatDuration(previewAsset.duration)} • {formatBytes(previewAsset.size_bytes)}
                </p>
              </div>
              <button
                onClick={() => setPreviewAsset(null)}
                className="p-1.5 rounded bg-[#0A0A0A] border border-[#242424] text-[#A1A1A1] hover:text-white hover:bg-[#151515]"
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
                className="px-4 py-2 rounded text-xs font-semibold bg-white hover:bg-gray-200 text-black flex items-center gap-2 shadow"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open in AI Studio</span>
              </Link>

              <button
                onClick={() => setPreviewAsset(null)}
                className="px-4 py-2 rounded text-xs font-medium bg-[#0A0A0A] border border-[#242424] text-[#A1A1A1] hover:text-white hover:bg-[#151515]"
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
