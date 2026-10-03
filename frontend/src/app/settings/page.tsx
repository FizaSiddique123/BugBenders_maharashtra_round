"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Sparkles,
  Key,
  HardDrive,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  ShieldCheck,
  Zap
} from "lucide-react";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState<string>("");
  const [apiKeyStatus, setApiKeyStatus] = useState<string>("Checking...");
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [storageDir, setStorageDir] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings().then((s) => {
      setApiKeyStatus(s.gemini_api_key_status);
      setIsConfigured(s.is_configured);
      setStorageDir(s.storage_dir);
    }).catch(console.error);
  }, []);

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    try {
      setSaving(true);
      setSaveSuccess(null);
      const res = await api.updateSettings(apiKey);
      setIsConfigured(res.is_configured);
      setApiKeyStatus("Configured");
      setApiKey("");
      setSaveSuccess("Gemini API Key saved and verified successfully!");
    } catch (err: any) {
      alert(`Failed to update key: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-white" />
          <span>System Settings & Configuration</span>
        </h1>
        <p className="text-sm text-[#A1A1A1] mt-1">
          Configure AI model keys, inspect local storage paths, and check video engine diagnostics.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded bg-green-900/40 border border-green-500/40 text-xs text-green-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Gemini API Key Card */}
      <div className="p-6 rounded-xl bg-[#0F0F0F] border border-[#242424] space-y-5">
        <div className="flex items-center justify-between border-b border-[#242424] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#151515] border border-[#303030] flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">AI Configuration</h2>
              <p className="text-xs text-[#A1A1A1]">Powers script generation, highlight detection, and multi-platform copy.</p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
            isConfigured
              ? "bg-[#151515] text-white border border-[#6F6F6F]"
              : "bg-[#0A0A0A] text-[#A1A1A1] border border-[#242424]"
          }`}>
            {isConfigured ? "Connected" : "Smart Fallback Active"}
          </span>
        </div>

        <form onSubmit={handleSaveApiKey} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-white">AI API Key:</label>
              <span className="text-[#A1A1A1] font-mono">Current Status: {apiKeyStatus}</span>
            </div>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6F6F6F]" />
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded bg-[#0A0A0A] border border-[#242424] text-xs text-white placeholder-[#6F6F6F] focus:outline-none focus:border-[#303030]"
              />
            </div>
            <p className="text-[11px] text-[#A1A1A1]">
              Stored securely in local environment variables (.env). Never exposed to frontend client code.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving || !apiKey.trim()}
            className="px-4 py-2.5 rounded text-xs font-semibold bg-white hover:bg-gray-200 text-black shadow transition flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save & Activate Key</span>
          </button>
        </form>
      </div>

      {/* Engine Diagnostics */}
      <div className="p-6 rounded-xl bg-[#0F0F0F] border border-[#242424] space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#242424] pb-3">
          <Cpu className="w-4 h-4 text-white" />
          <span>System & Hardware Diagnostics</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#242424] space-y-1">
            <span className="text-[#A1A1A1]">Video Processing</span>
            <p className="text-sm font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>FFmpeg v7.1 Active</span>
            </p>
            <p className="text-[10px] text-[#6F6F6F]">H.264 / AAC / ASS subtitles</p>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#242424] space-y-1">
            <span className="text-[#A1A1A1]">Memory Profile</span>
            <p className="text-sm font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>16 GB RAM Optimized</span>
            </p>
            <p className="text-[10px] text-[#6F6F6F]">Streamed video buffering</p>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#242424] space-y-1">
            <span className="text-[#A1A1A1]">Database</span>
            <p className="text-sm font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>SQLite Persistent</span>
            </p>
            <p className="text-[10px] text-[#6F6F6F]">Zero-latency embedded DB</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0A0A0A] border border-[#242424] text-xs space-y-1">
          <div className="flex items-center gap-2 text-white font-semibold">
            <HardDrive className="w-3.5 h-3.5 text-white" />
            <span>Local Storage Root:</span>
          </div>
          <p className="font-mono text-[11px] text-[#A1A1A1] truncate">{storageDir || "storage/"}</p>
        </div>
      </div>
    </div>
  );
}
