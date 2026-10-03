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
            <Layers className="w-7 h-7 text-white" />
            <span>Content Workflow & Pipeline</span>
          </h1>
          <p className="text-sm text-[#A1A1A1] mt-1">
            Track and progress content from initial concept to multi-platform publishing.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded text-xs font-semibold bg-white hover:bg-gray-200 text-black shadow-lg transition flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Kanban Board Columns */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-6">
          <h2 className="text-xl font-extrabold text-white tracking-tight">Loading Workflow Pipeline...</h2>
          <div className="w-full max-w-sm h-0.5 bg-[#151515] rounded-full overflow-hidden relative">
            <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-white rounded-full animate-[progress_2s_ease-in-out_infinite]" />
          </div>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x">
          {STAGES.map((stage) => {
            const stageProjects = projects.filter((p) => p.status === stage);
            return (
              <div
                key={stage}
                className="w-72 flex-shrink-0 rounded-xl bg-[#0F0F0F] border border-[#242424] p-4 flex flex-col justify-between space-y-4"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-[#242424] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{stage}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#0A0A0A] text-[10px] font-bold text-[#A1A1A1] border border-[#242424]">
                    {stageProjects.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 min-h-[300px]">
                  {stageProjects.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-[#0A0A0A] border border-dashed border-[#242424] text-[11px] text-[#6F6F6F]">
                      No projects in this stage
                    </div>
                  ) : (
                    stageProjects.map((p) => (
                      <div
                        key={p.id}
                        className="group p-4 rounded-xl bg-[#0A0A0A] border border-[#242424] hover:border-[#303030] transition space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-white leading-snug">{p.title}</h4>
                          <button
                            onClick={() => handleDeleteProject(p.id)}
                            className="text-[#6F6F6F] hover:text-white opacity-0 group-hover:opacity-100 transition p-1"
                            title="Delete project"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {p.description && (
                          <p className="text-[11px] text-[#A1A1A1] line-clamp-2">{p.description}</p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-[#6F6F6F] pt-1">
                          <span>{p.clip_count ?? 0} clips</span>
                          <span>{formatDate(p.created_at)}</span>
                        </div>

                        {/* Stage Selector Dropdown */}
                        <div className="pt-2 border-t border-[#242424] flex items-center justify-between">
                          <span className="text-[10px] text-[#6F6F6F]">Move to:</span>
                          <select
                            value={p.status}
                            onChange={(e) => handleUpdateStatus(p.id, e.target.value as Project["status"])}
                            className="px-2 py-1 rounded bg-[#050505] border border-[#242424] text-[10px] text-white font-semibold focus:outline-none"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateProject}
            className="w-full max-w-md rounded-xl bg-[#0F0F0F] border border-[#242424] p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-sm font-bold text-white">Create New Creator Project</h3>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#A1A1A1]">Project Title:</label>
              <input
                type="text"
                required
                placeholder="e.g. YouTube Podcast Episode #42"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0A0A0A] border border-[#242424] text-xs text-white focus:outline-none focus:border-[#303030]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#A1A1A1]">Description / Goal:</label>
              <textarea
                rows={3}
                placeholder="Brief summary of topic and platform repurposing strategy..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full p-3 rounded bg-[#0A0A0A] border border-[#242424] text-xs text-white focus:outline-none focus:border-[#303030] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#242424]">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-2 rounded text-xs font-medium bg-[#0A0A0A] border border-[#242424] text-[#A1A1A1] hover:text-white hover:bg-[#151515]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !newTitle.trim()}
                className="px-4 py-2 rounded text-xs font-semibold bg-white hover:bg-gray-200 text-black shadow transition flex items-center gap-1.5 disabled:opacity-50"
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
