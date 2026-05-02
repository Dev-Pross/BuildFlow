"use client";

import { MoreHorizontal, CheckCircle2, Clock, Circle } from "lucide-react";
import { DashboardOverview } from "@/app/types/dashboard.types";

interface RecentWorkflowsProps {
  overview: DashboardOverview | null;
}

const formatDate = (dateValue: string) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const getTimeDuration = (dateValue: string) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} month ago`;
};

export default function RecentWorkflows({ overview }: RecentWorkflowsProps) {
  const workflows = overview?.recentWorkflows ?? [];

  const getStatusIcon = (status?: string | null) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "completed":
        return <CheckCircle2 className="h-3.5 w-3.5 text-[#baf266]" />;
      case "pending":
      case "draft":
        return <Clock className="h-3.5 w-3.5 text-[#f59e0b]" />;
      default:
        return <Circle className="h-3.5 w-3.5 text-[#5a6350]" />;
    }
  };

  const getStatusDot = (status?: string | null) => {
    const colors: Record<string, string> = {
      active: "#baf266",
      completed: "#baf266",
      pending: "#f59e0b",
      draft: "#5a6350",
    };
    const c = colors[status?.toLowerCase() || ""] || "#5a6350";
    return (
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
        <span className="text-xs text-[#8a9178]">{status || "Draft"}</span>
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-[#2a3525]/60 bg-[#111611] p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#e8e8d8]">Recent Workflows</h3>
        <button className="p-1 rounded-md hover:bg-[#1a2118] text-[#5a6350] transition-colors" type="button">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {workflows.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-[#5a6350]">
          No workflows yet
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#2a3525]/40">
                <th className="py-2 pr-3 text-[10px] uppercase tracking-wider text-[#4a5440] font-semibold">Name</th>
                <th className="py-2 pr-3 text-[10px] uppercase tracking-wider text-[#4a5440] font-semibold">Triggered at</th>
                <th className="py-2 pr-3 text-[10px] uppercase tracking-wider text-[#4a5440] font-semibold">Status</th>
                <th className="py-2 text-[10px] uppercase tracking-wider text-[#4a5440] font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody>
              {workflows.slice(0, 5).map((wf) => (
                <tr key={wf.id} className="border-b border-[#1a2118]/60 hover:bg-[#141a14] transition-colors">
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(wf.status)}
                      <span className="text-xs font-medium text-[#c8d4a8] truncate max-w-[120px]">
                        {wf.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-[#6a7560]">{formatDate(wf.createdAt)}</td>
                  <td className="py-2.5 pr-3">{getStatusDot(wf.status)}</td>
                  <td className="py-2.5 text-xs text-[#5a6350]">{getTimeDuration(wf.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
