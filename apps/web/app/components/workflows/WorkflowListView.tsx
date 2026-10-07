"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/lib/api";
import { CardDemo } from "@/app/components/ui/Design/WorkflowCard";
import {
  Workflow,
  Plus,
  Search,
  ExternalLink,
  Layers,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2
} from "lucide-react";

interface WorkflowListViewProps {
  title?: string;
  showTitle?: boolean;
  showCreateButton?: boolean;
}

export default function WorkflowListView({
  title = "Your Automation Workflows",
  showTitle = true,
  showCreateButton = true,
}: WorkflowListViewProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const router = useRouter();

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.user.get();
      const workflows = response.data?.Data || response.data || [];
      setData(Array.isArray(workflows) ? workflows : []);
    } catch (fetchError: any) {
      setError("Failed to fetch workflows. Please verify your connection.");
      console.error("Failed to fetch workflows:", fetchError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const filteredWorkflows = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((w) => {
      const name = (w.name || w.Name || "").toLowerCase();
      const desc = (w.description || "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [data, searchQuery]);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {showTitle && (
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
            <p className="text-xs text-[#9ca3af] mt-1">
              {data.length} {data.length === 1 ? "workflow" : "workflows"} configured
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
            <input
              type="text"
              placeholder="Search flows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-[#1e2025] border border-[#2a2c33] text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* New Workflow button */}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-black text-xs font-bold hover:bg-gray-100 transition-all shadow-md shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4 text-black" />
            <span>New Flow</span>
          </button>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        /* Loading Skeletons */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-[#141518] border border-[#222429] flex flex-col justify-between h-48 animate-pulse shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-2xl bg-[#1e2025]" />
                  <div className="h-4 w-16 rounded-full bg-[#1e2025]" />
                </div>
                <div className="h-4 w-3/4 rounded bg-[#1e2025]" />
                <div className="h-3 w-1/2 rounded bg-[#1e2025]" />
              </div>
              <div className="h-9 w-full rounded-2xl bg-[#1e2025]" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-800/40 text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchWorkflows}
            className="px-4 py-1.5 rounded-xl bg-rose-900/40 text-xs font-semibold hover:bg-rose-900/60 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredWorkflows.length === 0 ? (
        /* Empty State */
        <div className="py-20 flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-[#141518] border border-[#222429] shadow-sm">
          <div className="h-16 w-16 rounded-3xl bg-white text-black flex items-center justify-center shadow-md mb-4">
            <Workflow className="h-8 w-8 text-black" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {searchQuery ? "No matching workflows found" : "No workflows yet"}
          </h3>
          <p className="text-xs text-[#9ca3af] max-w-sm mt-1.5 mb-6">
            {searchQuery
              ? `No workflows matched "${searchQuery}". Try a different keyword.`
              : "Create your first visual flow to start automating tasks across your apps."}
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-black text-xs font-bold hover:bg-gray-100 transition-all shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4 text-black" />
            <span>Create First Workflow</span>
          </button>
        </div>
      ) : (
        /* Workflows Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorkflows.map((workflow: any) => {
            const workflowId = workflow.id || workflow.ID;
            const workflowName = workflow.name || workflow.Name || "Untitled Automation";
            const nodeCount = Array.isArray(workflow.nodes)
              ? workflow.nodes.length
              : typeof workflow.config === "object" && workflow.config?.nodes
              ? workflow.config.nodes.length
              : 0;

            return (
              <div
                key={workflowId}
                onClick={() => router.push(`/workflows/${workflowId}`)}
                className="group p-6 rounded-3xl bg-[#141518] border border-[#222429] hover:border-gray-500/50 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-sm"
              >
                <div>
                  {/* Top Bar: Icon + Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="h-11 w-11 rounded-2xl bg-[#1e2025] border border-[#2a2c33] flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-sm">
                      <Workflow className="h-5 w-5 text-indigo-400" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition-colors truncate">
                    {workflowName}
                  </h3>
                  <p className="text-xs text-[#9ca3af] mt-1 line-clamp-2 leading-relaxed">
                    {workflow.description || "Visual node automation pipeline."}
                  </p>
                </div>

                {/* Bottom Row */}
                <div className="mt-5 pt-3.5 border-t border-[#222429] flex items-center justify-between text-xs text-[#6b7280]">
                  <span className="inline-flex items-center gap-1.5 text-[#9ca3af]">
                    <Layers className="h-3.5 w-3.5 text-gray-400" />
                    <span>{nodeCount} {nodeCount === 1 ? "step" : "steps"}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 font-bold text-white group-hover:text-indigo-400 transition-colors">
                    <span>Open Editor</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Create Button */}
      {showCreateButton && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-black font-bold text-sm shadow-2xl hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-5 w-5 text-black" />
            <span>Create Workflow</span>
          </button>
        </div>
      )}

      {/* Create Modal */}
      {createModalOpen && <CardDemo onClose={() => setCreateModalOpen(false)} />}
    </div>
  );
}
