"use client";

import { MoreHorizontal, CheckCircle2, Clock, Circle } from "lucide-react";
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
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "pending":
      case "draft":
        return <Clock className="h-4 w-4 text-amber-400" />;
      default:
        return <Circle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusDot = (status?: string | null) => {
    const isSuccess = status?.toLowerCase() === "active" || status?.toLowerCase() === "completed";
    return (
      <span className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${isSuccess ? "bg-emerald-400" : "bg-amber-400"}`} />
        <span className="text-xs text-[#9ca3af] capitalize">{status || "Draft"}</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-zinc-950">Recent Workflows</h3>
        <button className="p-1.5 rounded-xl hover:bg-zinc-200 text-zinc-400 transition-colors" type="button">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {workflows.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-zinc-400">
          No workflows drafted yet
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="py-2.5 pr-3 text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Name</th>
                <th className="py-2.5 pr-3 text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Triggered</th>
                <th className="py-2.5 pr-3 text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Status</th>
                <th className="py-2.5 text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {workflows.slice(0, 5).map((wf) => (
                <tr key={wf.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2.5">
                      {getStatusIcon(wf.status)}
                      <span className="text-xs font-semibold text-zinc-900 truncate max-w-[140px]">
                        {wf.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-xs text-zinc-500">{formatDate(wf.createdAt)}</td>
                  <td className="py-3 pr-3">{getStatusDot(wf.status)}</td>
                  <td className="py-3 text-xs text-zinc-400">{getTimeDuration(wf.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
