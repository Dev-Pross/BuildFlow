"use client";

import { CheckCircle2, Clock, Circle, XCircle, Loader2 } from "lucide-react";
import { DashboardOverview } from "@/app/types/dashboard.types";

interface RecentWorkflowsProps {
  overview: DashboardOverview | null;
}

const formatDate = (dateValue: string) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getTimeDuration = (dateValue: string) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

export default function RecentWorkflows({ overview }: RecentWorkflowsProps) {
  const workflows = overview?.recentWorkflows ?? [];

  const getStatusIcon = (status?: string | null) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "inprogress":
      case "running":
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case "pending":
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground/50" />;
    }
  };

  const getStatusDot = (status?: string | null) => {
    const s = status?.toLowerCase();
    if (s === "completed" || s === "active") {
      return (
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-xs text-foreground font-medium">Success</span>
        </span>
      );
    }
    if (s === "failed") {
      return (
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-destructive" />
          <span className="text-xs text-destructive font-medium">Failed</span>
        </span>
      );
    }
    if (s === "inprogress" || s === "running") {
      return (
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-primary font-medium">Running</span>
        </span>
      );
    }
    if (s === "pending") {
      return (
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-warning" />
          <span className="text-xs text-muted-foreground font-medium">Pending</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        <span className="text-xs text-muted-foreground">Never run</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">Recent Workflows</h3>
      </div>

      {workflows.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground min-h-[140px]">
          No workflows drafted yet
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2.5 pr-3 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Name</th>
                <th className="py-2.5 pr-3 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Created</th>
                <th className="py-2.5 pr-3 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Status</th>
                <th className="py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {workflows.slice(0, 5).map((wf) => (
                <tr key={wf.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2.5">
                      {getStatusIcon(wf.status)}
                      <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                        {wf.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-xs text-muted-foreground">{formatDate(wf.createdAt)}</td>
                  <td className="py-3 pr-3">{getStatusDot(wf.status)}</td>
                  <td className="py-3 text-xs text-muted-foreground">{getTimeDuration(wf.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
