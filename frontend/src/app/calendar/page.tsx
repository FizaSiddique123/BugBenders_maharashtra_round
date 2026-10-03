"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  ArrowRight,
  Sparkles,
  Video,
  Film,
  CheckCircle2,
  Clock,
  MoreVertical,
  Trash2,
  Edit2,
  Loader2,
  FolderOpen
} from "lucide-react";
import { api } from "@/lib/api";
import { Project, Asset, Clip } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const STAGES: Array<Project["status"]> = [
  "Idea",
  "Script",
  "Video Uploaded",
  "AI Analysis",
  "Clip Generated",
  "Ready to Publish",
  "Published",
];

export default function ContentWorkflowPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // New Project Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDesc, setNewDesc] = useState<string>("");
  const [creating, setCreating] = useState<boolean>(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      setCreating(true);
      await api.createProject(newTitle, newDesc, "Idea");
      setNewTitle("");
      setNewDesc("");
      setModalOpen(false);
      await fetchProjects();
    } catch (err: any) {
      alert(`Failed to create project: ${err.message || err}`);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (projectId: string, newStatus: Project["status"]) => {
    try {
      // Optimistic update
      setProjects(projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
      await api.updateProject(projectId, { status: newStatus });
    } catch (err) {
      await fetchProjects();
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err: any) {
      alert(`Delete error: ${err.message || err}`);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-indigo-400" />
            <span>Content Workflow & Pipeline</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track and progress content from initial concept to multi-platform publishing.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Kanban Board Columns */}
      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading workflow stages...</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x">
          {STAGES.map((stage) => {
            const stageProjects = projects.filter((p) => p.status === stage);
            return (
              <div
                key={stage}
                className="w-72 flex-shrink-0 rounded-2xl bg-[#0e131b] border border-[#1e2638] p-4 flex flex-col justify-between space-y-4"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-[#1e2638] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{stage}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#121824] text-[10px] font-bold text-slate-400 border border-[#1e2638]">
                    {stageProjects.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 min-h-[300px]">
                  {stageProjects.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-[#090c10]/40 border border-dashed border-[#1e2638] text-[11px] text-slate-600">
                      No projects in this stage
                    </div>
                  ) : (
                    stageProjects.map((p) => (
                      <div
                        key={p.id}
                        className="group p-4 rounded-xl bg-[#121824] border border-[#1e2638] hover:border-indigo-500/40 transition space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-100 leading-snug">{p.title}</h4>
                          <button
                            onClick={() => handleDeleteProject(p.id)}
                            className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition p-1"
                            title="Delete project"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {p.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2">{p.description}</p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                          <span>{p.clip_count ?? 0} clips</span>
                          <span>{formatDate(p.created_at)}</span>
                        </div>

                        {/* Stage Selector Dropdown */}
                        <div className="pt-2 border-t border-[#1e2638] flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">Move to:</span>
                          <select
                            value={p.status}
                            onChange={(e) => handleUpdateStatus(p.id, e.target.value as Project["status"])}
                            className="px-2 py-1 rounded bg-[#0c1017] border border-[#1e2638] text-[10px] text-slate-200 font-semibold focus:outline-none"
                          >
                            {STAGES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateProject}
            className="w-full max-w-md rounded-2xl bg-[#0c1017] border border-[#1e2638] p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-sm font-bold text-white">Create New Creator Project</h3>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Project Title:</label>
              <input
                type="text"
                required
                placeholder="e.g. YouTube Podcast Episode #42"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121824] border border-[#1e2638] text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Description / Goal:</label>
              <textarea
                rows={3}
                placeholder="Brief summary of topic and platform repurposing strategy..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#121824] border border-[#1e2638] text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e2638]">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-[#151c28] text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !newTitle.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Create Project</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
