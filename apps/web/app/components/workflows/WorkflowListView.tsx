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
            <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {data.length} {data.length === 1 ? "workflow" : "workflows"} configured
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all font-medium"
            />
          </div>

          {/* New Workflow button */}
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold transition-colors shadow-card shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
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
              className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between h-48 animate-pulse shadow-card"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-muted border border-border/60" />
                  <div className="h-4 w-16 rounded-full bg-muted border border-border/60" />
                </div>
                <div className="h-4 w-3/4 rounded-lg bg-muted border border-border/60" />
                <div className="h-3 w-1/2 rounded-lg bg-muted border border-border/60" />
              </div>
              <div className="h-9 w-full rounded-xl bg-muted border border-border/60" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchWorkflows}
            className="px-4 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : filteredWorkflows.length === 0 ? (
        /* Empty State */
        <div className="py-20 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-card border border-dashed border-border shadow-card">
          <div className="h-14 w-14 rounded-2xl bg-secondary border border-border text-primary flex items-center justify-center shadow-xs mb-4">
            <Workflow className="h-7 w-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            {searchQuery ? "No matching workflows found" : "No workflows configured yet"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1.5 mb-6 leading-relaxed">
            {searchQuery
              ? `No workflows matched "${searchQuery}". Try a different keyword.`
              : "Design your first visual pipeline to connect webhooks, Google Sheets, and Gmail automatically."}
          </p>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold shadow-card transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Workflow</span>
          </button>
        </div>
      ) : (
        /* Workflows Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorkflows.map((workflow: any) => {
            const workflowId = workflow.id || workflow.ID;
            const workflowName = workflow.name || workflow.Name || "Untitled Automation";
            const nodeCount =
              ((Array.isArray(workflow.nodes) ? workflow.nodes.length : 0) + (workflow.Trigger ? 1 : 0)) ||
              (Array.isArray(workflow.config?.nodes) ? workflow.config.nodes.length : 0) ||
              0;
            const latestExecution = workflow.executions?.[0];
            const rawStatus = latestExecution?.status || workflow.status;
            const status = rawStatus?.toLowerCase();

            return (
              <div
                key={workflowId}
                onClick={() => router.push(`/workflows/${workflowId}`)}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-card"
              >
                <div>
                  {/* Top Bar: Icon + Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-secondary border border-border text-primary flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                      <Workflow className="h-5 w-5" />
                    </div>
                    {status === "completed" || status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        Success
                      </span>
                    ) : status === "failed" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                        Failed
                      </span>
                    ) : status === "inprogress" || status === "running" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        Running
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/60 text-muted-foreground border border-border/50">
                        Never run
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
                    {workflowName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {workflow.description || "Visual node automation pipeline."}
                  </p>
                </div>

                {/* Bottom Row */}
                <div className="mt-5 pt-3.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    <span>{nodeCount} {nodeCount === 1 ? "step" : "steps"}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 font-semibold text-primary group-hover:underline">
                    <span>Open Editor</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Create Button for mobile */}
      {showCreateButton && (
        <div className="fixed bottom-6 right-6 z-40 sm:hidden">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-xs shadow-xl active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Workflow</span>
          </button>
        </div>
      )}

      {/* Create Modal */}
      {createModalOpen && <CardDemo onClose={() => setCreateModalOpen(false)} />}
    </div>
  );
}
