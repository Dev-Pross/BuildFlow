"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  border?: boolean;
  icon?: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  trend?: { value: string; positive: boolean };
  delay?: number;
  loading?: boolean;
}

export default function DashboardStatCard({
  label,
  value,
  hint,
  trend,
  icon,
  border = false,
  delay = 0,
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div
        className={`px-5 py-4 ${border ? "border-r border-[#222429]" : ""} flex flex-grow gap-4 items-center`}
      >
        <div className="h-12 w-12 rounded-2xl bg-[#1e2025] animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 rounded bg-[#1e2025] animate-pulse" />
          <div className="h-6 w-24 rounded bg-[#1e2025] animate-pulse" />
          <div className="h-2.5 w-16 rounded bg-[#1e2025] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`px-5 py-4 ${border ? "border-r border-[#222429]" : ""} flex flex-grow gap-3.5 items-center`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-fit p-3 bg-[#1e2025] border border-[#2a2c33] rounded-2xl shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-[#9ca3af] font-medium tracking-wide truncate">{label}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
          {trend && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                trend.positive
                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                  : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
              }`}
            >
              {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.value}
            </span>
          )}
        </div>
        {hint && <p className="mt-0.5 text-[11px] text-[#6b7280] truncate">{hint}</p>}
      </div>
    </div>
  );
}
