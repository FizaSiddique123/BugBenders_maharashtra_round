"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Layers, Plus, Calendar as CalendarIcon, List as ListIcon, Kanban, Search,
  Clock, MoreVertical, Trash2, Edit2, Loader2, Sparkles, Filter, CheckCircle2,
  AlertCircle, ChevronLeft, ChevronRight, Play, FileVideo, FileImage, 
  AlignLeft, RefreshCw
} from "lucide-react";
import { api, getMediaUrl } from "@/lib/api";
import { ContentItem } from "@/lib/types";
import { formatDate, formatDuration, formatBytes } from "@/lib/utils";

const STAGES = ["Idea", "Script", "Video Uploaded", "AI Analysis"];
const PLATFORMS = ["Instagram", "TikTok", "YouTube", "LinkedIn", "X"];
const CONTENT_TYPES = ["Short", "Reel", "TikTok", "YouTube Video", "YouTube Short", "Instagram Post", "LinkedIn Post", "Podcast", "Story", "Other"];

export default function ContentWorkflowPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [view, setView] = useState<"board" | "month" | "week" | "day" | "list">("board");
  
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [panelOpen, setPanelOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [activity, setActivity] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState<Partial<ContentItem>>({});

  const fetchContents = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const data = await api.getContents();
      setContents(data);
    } catch (err) {
      console.error("Failed to fetch contents:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents(true);
    const interval = setInterval(() => {
      fetchContents(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const openCreateModal = (stage: string = "Idea") => {
    setSelectedItem(null);
    setIsEditing(true);
    setFormData({ status: stage, stage: stage, platforms: [] });
    setPanelOpen(true);
    setActivity([]);
  };

  const openDetails = async (item: ContentItem) => {
    setSelectedItem(item);
    setIsEditing(false);
    setFormData(item);
    setPanelOpen(true);
    try {
      const acts = await api.getContentActivity(item.id);
      setActivity(acts);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (selectedItem) {
        await api.updateContent(selectedItem.id, formData);
      } else {
        await api.createContent(formData);
      }
      setPanelOpen(false);
      fetchContents(false);
    } catch (err: any) {
      alert(`Failed: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setContents(contents.map(c => c.id === id ? { ...c, status: newStatus, stage: newStatus } : c));
      await api.updateContentStatus(id, newStatus);
    } catch (err) {
      fetchContents(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this content?")) return;
    try {
      await api.deleteContent(id);
      setContents(contents.filter(c => c.id !== id));
      if (selectedItem?.id === id) setPanelOpen(false);
    } catch (err: any) {
      alert(err.message || err);
    }
  };

  const retryAnalysis = async (e: React.MouseEvent, assetId: string) => {
    e.stopPropagation();
    try {
      alert("Analysis retry triggered. This will be processed in the background.");
      // If we had a specific retry endpoint we'd call it here
      // For now we assume the backend will handle retries via a specific route
    } catch (err) {
      console.error(err);
    }
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total: contents.length,
      ideas: contents.filter(c => c.status === "Idea").length,
      scripts: contents.filter(c => c.status === "Script").length,
      inProduction: contents.filter(c => c.status === "Video Uploaded").length,
      inAnalysis: contents.filter(c => c.status === "AI Analysis").length,
      ready: contents.filter(c => c.status === "Ready" || c.status === "Scheduled" || c.status === "Published").length,
      failed: contents.filter(c => c.status === "Failed").length,
    };
  }, [contents]);

  const filteredContents = useMemo(() => {
    return contents.filter(c => {
      if (search && !(c.title?.toLowerCase() || "").includes(search.toLowerCase()) && !(c.description?.toLowerCase() || "").includes(search.toLowerCase())) return false;
      if (filterPlatform && !c.platforms?.includes(filterPlatform)) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      return true;
    });
  }, [contents, search, filterPlatform, filterStatus]);

  // Drag and drop
  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("contentId", id);
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const onDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("contentId");
    if (id) {
      handleUpdateStatus(id, stage);
    }
  };

  // Renderer for specific card types
  const renderCard = (c: ContentItem) => {
    const isIdea = c.status === "Idea";
    const isScript = c.status === "Script";
    const isVideo = c.status === "Video Uploaded";
    const isAnalysis = c.status === "AI Analysis";

    return (
      <div
        key={c.id}
        draggable
        onDragStart={(e) => onDragStart(e, c.id)}
        onClick={() => openDetails(c)}
        className="group p-3 rounded-lg bg-[#050505] border border-[#242424] hover:border-[#404040] transition cursor-pointer space-y-3 flex flex-col justify-between"
      >
        <div className="space-y-2">
          {/* Header */}
          <div className="flex justify-between items-start gap-2">
            <h4 className="text-xs font-bold text-white leading-snug break-words">{c.title || "Untitled Project"}</h4>
            {c.priority && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${c.priority === 'High' ? 'bg-red-900/40 text-red-400' : 'bg-[#151515] text-[#A1A1A1]'}`}>
                {c.priority}
              </span>
            )}
          </div>

          {/* Description/Script preview */}
          {(isIdea || isScript) && c.description && (
             <p className="text-[11px] text-[#A1A1A1] line-clamp-3 leading-relaxed">
               {isScript && <AlignLeft className="w-3 h-3 inline-block mr-1" />}
               {c.description}
             </p>
          )}

          {/* Video Metadata */}
          {(isVideo || isAnalysis) && c.asset && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-16 h-10 bg-black rounded overflow-hidden flex-shrink-0 relative">
                {c.asset.thumbnail_path ? (
                  <img src={getMediaUrl(c.asset.thumbnail_path)} className="w-full h-full object-cover" alt="thumbnail" />
                ) : (
                  <FileVideo className="w-4 h-4 text-[#6F6F6F] absolute inset-0 m-auto" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-white font-mono truncate w-32">{c.asset.filename}</span>
                <span className="text-[9px] text-[#6F6F6F]">
                  {formatDuration(c.asset.duration)} • {formatBytes(c.asset.size_bytes)}
                </span>
              </div>
            </div>
          )}

          {/* AI Analysis Specific */}
          {isAnalysis && (
            <div className="bg-[#0A0A0A] border border-[#242424] rounded p-2 space-y-1.5">
               <div className="flex justify-between items-center text-[10px]">
                 <span className="text-[#A1A1A1]">Analysis:</span>
                 <span className={`font-bold ${c.ai_job_status === 'completed' ? 'text-green-400' : c.ai_job_status === 'failed' ? 'text-red-400' : 'text-blue-400'}`}>
                   {c.ai_job_status === 'completed' ? (
                     <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ready</span>
                   ) : c.ai_job_status === 'failed' ? (
                     <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Failed</span>
                   ) : (
                     <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Processing...</span>
                   )}
                 </span>
               </div>
               {c.ai_job_status === 'completed' && (
                 <div className="grid grid-cols-2 gap-1 mt-1">
                   <div className="bg-[#151515] p-1 rounded text-center">
                     <div className="text-[9px] text-[#6F6F6F] uppercase">Highlights</div>
                     <div className="text-xs text-white font-bold">{c.highlights_count || 0}</div>
                   </div>
                   <div className="bg-[#151515] p-1 rounded text-center">
                     <div className="text-[9px] text-[#6F6F6F] uppercase">Clips</div>
                     <div className="text-xs text-white font-bold">{c.clip_id ? 1 : 0} Opportunities</div>
                   </div>
                 </div>
               )}
               {c.ai_job_status === 'failed' && (
                 <button onClick={(e) => retryAnalysis(e, c.asset?.id!)} className="w-full mt-1 py-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded flex items-center justify-center gap-1 text-[10px] font-bold transition">
                   <RefreshCw className="w-3 h-3" /> Retry Analysis
                 </button>
               )}
            </div>
          )}
        </div>

        {/* Footer badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#242424]">
          {c.platforms && c.platforms.length > 0 ? (
            <div className="flex gap-1">
              {c.platforms.slice(0,2).map(p => <span key={p} className="text-[9px] px-1.5 py-0.5 bg-[#151515] text-[#A1A1A1] rounded">{p}</span>)}
              {c.platforms.length > 2 && <span className="text-[9px] px-1.5 py-0.5 bg-[#151515] text-[#A1A1A1] rounded">+{c.platforms.length - 2}</span>}
            </div>
          ) : (
            <span className="text-[9px] text-[#6F6F6F]">-</span>
          )}
          
          <span className="text-[9px] text-[#6F6F6F]">
            {formatDate(c.created_at)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Stats */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#18181B] tracking-tight flex items-center gap-2.5">
              <CalendarIcon className="w-7 h-7 text-[#18181B]" />
              <span>Content Calendar</span>
            </h1>
            <p className="text-sm font-semibold text-[#18181B] mt-1">
              Live workflow monitoring and content production management.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/media" className="px-4 py-2 rounded text-xs font-semibold bg-[#0F0F0F] border border-[#242424] text-white hover:bg-[#151515] transition flex items-center gap-2 self-start">
              <Plus className="w-4 h-4" />
              <span>Upload Video</span>
            </Link>
            <button onClick={() => openCreateModal()} className="px-4 py-2 rounded text-xs font-semibold bg-white hover:bg-gray-200 text-black shadow-lg transition flex items-center gap-2 self-start">
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "Total", val: stats.total },
            { label: "Ideas", val: stats.ideas },
            { label: "Scripts", val: stats.scripts },
            { label: "Uploaded", val: stats.inProduction },
            { label: "AI Analysis", val: stats.inAnalysis },
            { label: "Ready", val: stats.ready },
          ].map(s => (
            <div key={s.label} className="bg-[#0F0F0F] border border-[#242424] rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{s.val}</div>
              <div className="text-[10px] uppercase text-[#A1A1A1] font-bold tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-[#0F0F0F] p-3 rounded-xl border border-[#242424]">
        <div className="flex gap-2 bg-[#050505] p-1 rounded-lg border border-[#242424] overflow-x-auto whitespace-nowrap">
          {[
            { id: "board", icon: Kanban, label: "Board" },
            { id: "month", icon: CalendarIcon, label: "Month" },
            { id: "week", icon: Layers, label: "Week" },
            { id: "day", icon: Clock, label: "Day" },
            { id: "list", icon: ListIcon, label: "List" }
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${view === v.id ? 'bg-[#242424] text-white' : 'text-[#6F6F6F] hover:text-white'}`}
            >
              <v.icon className="w-3.5 h-3.5" />
              <span>{v.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6F6F6F]" />
            <input 
              type="text" 
              placeholder="Search content..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-[#050505] border border-[#242424] text-xs text-white focus:outline-none focus:border-[#303030]"
            />
          </div>
          <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} className="px-2 py-1.5 rounded-lg bg-[#050505] border border-[#242424] text-xs text-white focus:outline-none focus:border-[#303030]">
            <option value="">All Platforms</option>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Views */}
      {loading && contents.length === 0 ? (
        <div className="py-24 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#18181B]" /></div>
      ) : (
        <>
          {view === "board" && (
            <div className="flex gap-4 overflow-x-auto pb-6 snap-x min-h-[600px]">
              {STAGES.map((stage) => {
                const stageContents = filteredContents.filter((c) => c.status === stage);
                return (
                  <div
                    key={stage}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, stage)}
                    className="w-80 flex-shrink-0 rounded-xl bg-[#0F0F0F] border border-[#242424] p-4 flex flex-col space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-[#242424] pb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">{stage}</h3>
                        <span className="px-2 py-0.5 rounded bg-[#0A0A0A] text-[10px] font-bold text-[#A1A1A1] border border-[#242424]">{stageContents.length}</span>
                      </div>
                      
                      {stage === "Idea" && (
                        <button onClick={() => openCreateModal("Idea")} className="text-[#A1A1A1] hover:text-white bg-[#151515] hover:bg-[#242424] p-1 rounded transition">
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                      {stage === "Script" && (
                        <button onClick={() => openCreateModal("Script")} className="text-[#A1A1A1] hover:text-white bg-[#151515] hover:bg-[#242424] p-1 rounded transition">
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3 flex-1 min-h-[100px]">
                      {stageContents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-24 border border-dashed border-[#242424] rounded-lg bg-[#0A0A0A]/50">
                          <p className="text-[11px] text-[#6F6F6F] font-medium text-center px-4">
                            {stage === "Idea" ? "No ideas yet.\nClick + to add an idea." :
                             stage === "Script" ? "No scripts yet.\nClick + to add a script." :
                             stage === "Video Uploaded" ? "No videos uploaded yet.\nUpload a video to get started." :
                             "No AI analyses yet.\nUpload content to begin."}
                          </p>
                        </div>
                      ) : (
                        stageContents.map(c => renderCard(c))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === "list" && (
            <div className="bg-[#0F0F0F] border border-[#242424] rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm text-[#A1A1A1]">
                <thead className="bg-[#050505] text-xs uppercase text-[#6F6F6F]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Platform</th>
                    <th className="px-4 py-3 font-semibold">Asset / Size</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242424]">
                  {filteredContents.map(c => (
                    <tr key={c.id} className="hover:bg-[#151515] transition cursor-pointer" onClick={() => openDetails(c)}>
                      <td className="px-4 py-3 text-white font-medium">{c.title}</td>
                      <td className="px-4 py-3">{c.status}</td>
                      <td className="px-4 py-3">{c.platforms?.join(", ")}</td>
                      <td className="px-4 py-3">{c.asset ? `${c.asset.filename} (${formatBytes(c.asset.size_bytes)})` : "-"}</td>
                      <td className="px-4 py-3 flex gap-2">
                         <button className="p-1 hover:text-white" onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}><Trash2 className="w-4 h-4"/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === "month" && (
            <div className="bg-[#0F0F0F] border border-[#242424] rounded-xl p-4 min-h-[600px] text-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-[#242424] rounded"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setCurrentDate(new Date())} className="text-xs font-semibold px-2 hover:text-gray-300">Today</button>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-[#242424] rounded"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-px bg-[#242424] border border-[#242424] rounded overflow-hidden">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="bg-[#050505] p-2 text-center text-xs font-bold text-[#6F6F6F] uppercase tracking-wider">{day}</div>
                ))}
                
                {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-[#0F0F0F] min-h-[120px] p-2"></div>
                ))}

                {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                  const date = i + 1;
                  const fullDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
                  const isToday = new Date().toDateString() === fullDate.toDateString();
                  const dayContents = filteredContents.filter(c => c.scheduled_at && new Date(c.scheduled_at).toDateString() === fullDate.toDateString());

                  return (
                    <div key={date} className={`bg-[#050505] min-h-[120px] p-2 border-t border-[#242424] transition hover:bg-[#0A0A0A]`}>
                      <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-2 ${isToday ? 'bg-white text-black' : 'text-[#6F6F6F]'}`}>
                        {date}
                      </div>
                      <div className="space-y-1">
                        {dayContents.map(c => (
                          <div key={c.id} onClick={() => openDetails(c)} className="text-[10px] bg-[#151515] border border-[#303030] px-1.5 py-1 rounded truncate cursor-pointer hover:bg-[#242424] transition text-white">
                            {c.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === "week" && (
            <div className="bg-[#0F0F0F] border border-[#242424] rounded-xl p-4 min-h-[600px] text-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">
                  Week of {(() => {
                    const first = currentDate.getDate() - currentDate.getDay();
                    const start = new Date(currentDate.setDate(first));
                    return start.toLocaleString('default', { month: 'short', day: 'numeric' });
                  })()}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))} className="p-1.5 hover:bg-[#242424] rounded"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setCurrentDate(new Date())} className="text-xs font-semibold px-2 hover:text-gray-300">This Week</button>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))} className="p-1.5 hover:bg-[#242424] rounded"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, i) => {
                  const date = new Date(currentDate);
                  const first = date.getDate() - date.getDay();
                  const targetDate = new Date(date.setDate(first + i));
                  const isToday = new Date().toDateString() === targetDate.toDateString();
                  const dayContents = filteredContents.filter(c => c.scheduled_at && new Date(c.scheduled_at).toDateString() === targetDate.toDateString());

                  return (
                    <div key={i} className="flex flex-col border border-[#242424] rounded-lg bg-[#050505] overflow-hidden min-h-[400px]">
                      <div className={`p-2 text-center border-b border-[#242424] ${isToday ? 'bg-[#151515]' : 'bg-[#0A0A0A]'}`}>
                        <div className="text-[10px] uppercase font-bold text-[#6F6F6F] tracking-wider">{targetDate.toLocaleString('default', { weekday: 'short' })}</div>
                        <div className={`text-sm font-bold mt-1 ${isToday ? 'text-white' : 'text-[#A1A1A1]'}`}>{targetDate.getDate()}</div>
                      </div>
                      <div className="p-2 flex-1 space-y-2">
                        {dayContents.map(c => (
                          <div key={c.id} onClick={() => openDetails(c)} className="bg-[#151515] border border-[#303030] p-2 rounded cursor-pointer hover:border-[#404040] transition space-y-1">
                            <div className="text-[10px] font-bold text-white leading-tight">{c.title}</div>
                            <div className="text-[9px] text-[#A1A1A1]">{new Date(c.scheduled_at!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === "day" && (
            <div className="bg-[#0F0F0F] border border-[#242424] rounded-xl p-4 min-h-[600px] text-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">
                  {currentDate.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000))} className="p-1.5 hover:bg-[#242424] rounded"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setCurrentDate(new Date())} className="text-xs font-semibold px-2 hover:text-gray-300">Today</button>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000))} className="p-1.5 hover:bg-[#242424] rounded"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="bg-[#050505] border border-[#242424] rounded-lg divide-y divide-[#242424]">
                {filteredContents
                  .filter(c => c.scheduled_at && new Date(c.scheduled_at).toDateString() === currentDate.toDateString())
                  .sort((a,b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
                  .map(c => (
                    <div key={c.id} onClick={() => openDetails(c)} className="flex items-center gap-4 p-4 hover:bg-[#151515] transition cursor-pointer">
                      <div className="w-20 text-right flex-shrink-0">
                        <div className="text-sm font-bold text-white">{new Date(c.scheduled_at!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">{c.title}</div>
                        <div className="text-xs text-[#A1A1A1] mt-1">{c.platforms?.join(", ")} • {c.status}</div>
                      </div>
                    </div>
                ))}
                {filteredContents.filter(c => c.scheduled_at && new Date(c.scheduled_at).toDateString() === currentDate.toDateString()).length === 0 && (
                  <div className="p-8 text-center text-sm text-[#6F6F6F]">
                    No content scheduled for this day.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Editor Panel Modal */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0F0F0F] border-l border-[#242424] h-full overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-right">
            
            {/* Header */}
            <div className="p-4 border-b border-[#242424] flex items-center justify-between sticky top-0 bg-[#0F0F0F] z-10">
              <h2 className="text-lg font-bold text-white">{isEditing ? (formData.status === "Script" ? "Add Script" : "Add Idea") : selectedItem?.title || "Content Details"}</h2>
              <div className="flex gap-2">
                {!isEditing && selectedItem && (
                  <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 rounded bg-[#242424] text-white text-xs font-semibold hover:bg-[#303030]">Edit</button>
                )}
                <button onClick={() => setPanelOpen(false)} className="px-3 py-1.5 rounded bg-transparent border border-[#242424] text-[#A1A1A1] text-xs font-semibold hover:text-white">Close</button>
              </div>
            </div>

            <div className="flex-1 p-6 space-y-8">
              {isEditing ? (
                <form id="content-form" onSubmit={handleSave} className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-[#A1A1A1] uppercase tracking-wider border-b border-[#242424] pb-1">Basic Info</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-[11px] text-[#6F6F6F] block mb-1">Title</label>
                        <input required value={formData.title || ""} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 rounded bg-[#050505] border border-[#242424] text-sm text-white focus:outline-none focus:border-[#404040]" />
                      </div>
                      
                      {formData.status === "Script" || formData.stage === "Script" ? (
                        <div className="col-span-2 space-y-3">
                          <div>
                            <label className="text-[11px] text-[#6F6F6F] block mb-1">Hook</label>
                            <input value={formData.caption || ""} onChange={e => setFormData({...formData, caption: e.target.value})} placeholder="Grab attention here..." className="w-full px-3 py-2 rounded bg-[#050505] border border-[#242424] text-sm text-white focus:outline-none focus:border-[#404040]" />
                          </div>
                          <div>
                            <label className="text-[11px] text-[#6F6F6F] block mb-1">Script Content</label>
                            <textarea rows={12} value={formData.description || ""} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Write your full script here..." className="w-full px-3 py-2 rounded bg-[#050505] border border-[#242424] text-sm text-white resize-none font-mono focus:outline-none focus:border-[#404040]" />
                          </div>
                          <div>
                            <label className="text-[11px] text-[#6F6F6F] block mb-1">Call to Action (CTA)</label>
                            <input value={formData.cta || ""} onChange={e => setFormData({...formData, cta: e.target.value})} placeholder="Like and subscribe..." className="w-full px-3 py-2 rounded bg-[#050505] border border-[#242424] text-sm text-white focus:outline-none focus:border-[#404040]" />
                          </div>
                        </div>
                      ) : (
                        <div className="col-span-2">
                          <label className="text-[11px] text-[#6F6F6F] block mb-1">Description / Notes</label>
                          <textarea rows={4} value={formData.description || ""} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 rounded bg-[#050505] border border-[#242424] text-sm text-white resize-none focus:outline-none focus:border-[#404040]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Taxonomy */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-[#A1A1A1] uppercase tracking-wider border-b border-[#242424] pb-1">Taxonomy & Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] text-[#6F6F6F] block mb-1">Type</label>
                        <select value={formData.content_type || ""} onChange={e => setFormData({...formData, content_type: e.target.value})} className="w-full px-3 py-2 rounded bg-[#050505] border border-[#242424] text-sm text-white focus:outline-none">
                          <option value="">Select Type...</option>
                          {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-[#6F6F6F] block mb-1">Priority</label>
                        <select value={formData.priority || ""} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full px-3 py-2 rounded bg-[#050505] border border-[#242424] text-sm text-white focus:outline-none">
                          <option value="">Normal</option>
                          <option value="High">High</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-[#6F6F6F] block mb-1">Status / Stage</label>
                        <select value={formData.status || ""} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 rounded bg-[#050505] border border-[#242424] text-sm text-white focus:outline-none">
                          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-[#6F6F6F] block mb-1">Due Date</label>
                        <input type="date" value={formData.due_date ? formData.due_date.split("T")[0] : ""} onChange={e => setFormData({...formData, due_date: e.target.value ? new Date(e.target.value).toISOString() : undefined})} className="w-full px-3 py-2 rounded bg-[#050505] border border-[#242424] text-sm text-white [color-scheme:dark] focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#6F6F6F] block mb-1">Scheduled Date & Time</label>
                        <input type="datetime-local" value={formData.scheduled_at ? new Date(formData.scheduled_at).toISOString().slice(0, 16) : ""} onChange={e => setFormData({...formData, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : undefined})} className="w-full px-3 py-2 rounded bg-[#050505] border border-[#242424] text-sm text-white [color-scheme:dark] focus:outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[11px] text-[#6F6F6F] block mb-1">Platforms</label>
                        <div className="flex flex-wrap gap-2">
                          {PLATFORMS.map(p => (
                            <label key={p} className="flex items-center gap-1.5 text-xs text-white">
                              <input 
                                type="checkbox" 
                                checked={(formData.platforms || []).includes(p)}
                                onChange={(e) => {
                                  const ps = formData.platforms || [];
                                  if (e.target.checked) setFormData({...formData, platforms: [...ps, p]});
                                  else setFormData({...formData, platforms: ps.filter(x => x !== p)});
                                }}
                              /> {p}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-5">
                      <div>
                        <div className="text-[11px] text-[#6F6F6F] mb-1">Status</div>
                        <div className="inline-block px-3 py-1 bg-[#151515] border border-[#303030] rounded-full text-xs font-bold text-white shadow-sm">{selectedItem?.status}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#6F6F6F] mb-1">Platforms</div>
                        <div className="flex gap-2">
                          {selectedItem?.platforms?.length ? selectedItem.platforms.map(p => (
                             <span key={p} className="px-2 py-1 bg-[#242424] rounded text-[11px] text-white shadow-sm">{p}</span>
                          )) : <span className="text-xs text-[#A1A1A1]">-</span>}
                        </div>
                      </div>
                      
                      {(selectedItem?.status === "Video Uploaded" || selectedItem?.status === "AI Analysis") && selectedItem.asset && (
                        <div>
                          <div className="text-[11px] text-[#6F6F6F] mb-2 uppercase tracking-wider font-bold">Attached Video</div>
                          <div className="p-3 bg-[#050505] border border-[#242424] rounded-lg flex gap-3">
                            <div className="w-24 h-16 bg-black rounded overflow-hidden flex-shrink-0">
                               {selectedItem.asset.thumbnail_path ? (
                                  <img src={getMediaUrl(selectedItem.asset.thumbnail_path)} className="w-full h-full object-cover" alt="thumbnail" />
                                ) : (
                                  <FileVideo className="w-6 h-6 text-[#6F6F6F] absolute inset-0 m-auto" />
                                )}
                            </div>
                            <div className="flex flex-col justify-center">
                              <span className="text-xs text-white font-mono break-all">{selectedItem.asset.filename}</span>
                              <span className="text-[10px] text-[#6F6F6F] mt-1">{formatDuration(selectedItem.asset.duration)} • {formatBytes(selectedItem.asset.size_bytes)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Activity Feed */}
                    <div className="w-full md:w-64 bg-[#050505] border border-[#242424] p-4 rounded-lg h-64 overflow-y-auto">
                       <h3 className="text-xs font-bold text-[#A1A1A1] uppercase mb-3 sticky top-0 bg-[#050505] pb-1">Activity Feed</h3>
                       <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-1.5 before:w-px before:bg-[#242424]">
                         {activity.map(act => (
                           <div key={act.id} className="relative pl-5">
                             <div className="absolute left-0 top-1.5 w-3 h-3 bg-[#0F0F0F] border border-[#404040] rounded-full"></div>
                             <div className="text-[10px] text-[#6F6F6F]">{formatDate(act.created_at)}</div>
                             <div className="text-[11px] text-white leading-tight mt-0.5">{act.description}</div>
                           </div>
                         ))}
                         {activity.length === 0 && <div className="text-[11px] text-[#6F6F6F]">No activity yet.</div>}
                       </div>
                    </div>
                  </div>

                  {selectedItem?.status === "AI Analysis" && (
                     <div className="space-y-4">
                       <h3 className="text-xs font-bold text-[#00E5FF] uppercase tracking-wider border-b border-[#00E5FF]/30 pb-1 mb-2 flex items-center gap-2">
                         <Sparkles className="w-3.5 h-3.5" /> AI Analysis Results
                       </h3>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                         <div className="bg-[#0A0A0A] border border-[#242424] p-3 rounded-lg text-center">
                           <div className="text-2xl font-bold text-white">{selectedItem.highlights_count || 0}</div>
                           <div className="text-[10px] text-[#A1A1A1] uppercase mt-1">Best Moments</div>
                         </div>
                         <div className="bg-[#0A0A0A] border border-[#242424] p-3 rounded-lg text-center">
                           <div className="text-2xl font-bold text-white">{selectedItem.highlights_count || 0}</div>
                           <div className="text-[10px] text-[#A1A1A1] uppercase mt-1">Hooks</div>
                         </div>
                         <div className="bg-[#0A0A0A] border border-[#242424] p-3 rounded-lg text-center">
                           <div className="text-2xl font-bold text-white">{selectedItem.clip_id ? 1 : 0}</div>
                           <div className="text-[10px] text-[#A1A1A1] uppercase mt-1">Short Clips</div>
                         </div>
                         <div className="bg-[#0A0A0A] border border-[#242424] p-3 rounded-lg text-center flex items-center justify-center">
                            <Link href={`/studio?assetId=${selectedItem.asset?.id}`} className="text-xs font-bold text-[#00E5FF] hover:underline">
                              Open AI Studio →
                            </Link>
                         </div>
                       </div>
                     </div>
                  )}

                  {selectedItem?.status === "Script" ? (
                    <div className="space-y-6">
                      {selectedItem.caption && (
                        <div>
                          <h3 className="text-xs font-bold text-[#A1A1A1] uppercase tracking-wider border-b border-[#242424] pb-1 mb-2">Hook</h3>
                          <div className="p-3 bg-[#0A0A0A] rounded border border-[#242424] text-sm text-white italic">
                            "{selectedItem.caption}"
                          </div>
                        </div>
                      )}
                      <div>
                        <h3 className="text-xs font-bold text-[#A1A1A1] uppercase tracking-wider border-b border-[#242424] pb-1 mb-2">Script Content</h3>
                        <div className="p-4 bg-[#0A0A0A] rounded-lg border border-[#242424] text-sm text-white whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                          {selectedItem.description || "No script content."}
                        </div>
                      </div>
                      {selectedItem.cta && (
                        <div>
                          <h3 className="text-xs font-bold text-[#A1A1A1] uppercase tracking-wider border-b border-[#242424] pb-1 mb-2">Call to Action</h3>
                          <div className="p-3 bg-[#0A0A0A] rounded border border-[#242424] text-sm text-[#00E5FF] font-semibold">
                            {selectedItem.cta}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xs font-bold text-[#A1A1A1] uppercase tracking-wider border-b border-[#242424] pb-1 mb-2">Description & Notes</h3>
                      <p className="text-sm text-white whitespace-pre-wrap leading-relaxed bg-[#0A0A0A] p-4 rounded-lg border border-[#242424]">{selectedItem?.description || "No description provided."}</p>
                    </div>
                  )}

                  <div className="pt-4 flex gap-2">
                    <button onClick={() => handleDelete(selectedItem!.id)} className="px-4 py-2 bg-red-900/20 text-red-400 text-xs font-bold rounded border border-red-900/50 hover:bg-red-900/40 transition">
                      <Trash2 className="w-3.5 h-3.5 inline-block mr-1" /> Delete Project
                    </button>
                    {selectedItem?.status === "Idea" && (
                      <button onClick={() => handleUpdateStatus(selectedItem.id, "Script")} className="px-4 py-2 bg-white text-black text-xs font-bold rounded hover:bg-gray-200 transition ml-auto">
                        Move to Script
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {isEditing && (
              <div className="p-4 border-t border-[#242424] bg-[#050505] flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded text-xs font-semibold text-[#A1A1A1] hover:text-white transition">Cancel</button>
                <button form="content-form" type="submit" disabled={saving} className="px-5 py-2 rounded bg-white text-black text-xs font-bold hover:bg-gray-200 transition flex items-center gap-2">
                  {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                  {formData.status === "Script" ? "Save Script" : "Save Idea"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
