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
        className={`px-5 py-4 ${border ? "border-r border-border" : ""} flex flex-grow gap-4 items-center bg-card`}
      >
        <div className="h-12 w-12 rounded-xl bg-muted border border-border/60 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 rounded bg-muted border border-border/60 animate-pulse" />
          <div className="h-6 w-24 rounded bg-muted border border-border/60 animate-pulse" />
          <div className="h-2.5 w-16 rounded bg-muted border border-border/60 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`px-5 py-4 ${border ? "border-r border-border" : ""} flex flex-grow gap-3.5 items-center bg-card`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-fit p-3 bg-secondary text-primary border border-border rounded-xl shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground font-medium tracking-wide truncate">{label}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
          {trend && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                trend.positive
                  ? "text-success bg-success/10 border-success/20"
                  : "text-destructive bg-destructive/10 border-destructive/20"
              }`}
            >
              {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.value}
            </span>
          )}
        </div>
        {hint && <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{hint}</p>}
      </div>
    </div>
  );
}
