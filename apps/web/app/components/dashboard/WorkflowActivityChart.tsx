"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity } from "lucide-react";
import { DashboardExecutionTrend, DashboardRange } from "@/app/types/dashboard.types";

const RANGE_OPTIONS: DashboardRange[] = ["7d", "30d", "90d"];

interface WorkflowChartProps {
  trend: DashboardExecutionTrend | null;
  trendLoading: boolean;
  trendError: string | null;
  selectedRange: DashboardRange;
  onRangeChange: (range: DashboardRange) => void;
}

export default function WorkflowActivityChart({
  trend,
  trendLoading,
  trendError,
  selectedRange,
  onRangeChange,
}: WorkflowChartProps) {
  const chartData = useMemo(() => {
    if (!trend?.points) return [];
    return trend.points.map((p) => ({
      ...p,
      label: new Date(p.date).toLocaleDateString("en-US", { weekday: "short" }).charAt(0),
    }));
  }, [trend]);

  const peakValue = useMemo(() => {
    if (!chartData.length) return { value: 0, label: "" };
    const max = chartData.reduce((a, b) => (b.completed > a.completed ? b : a), chartData[0]!);
    return { value: max.completed, label: max.label };
  }, [chartData]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col shadow-card">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
        <h3 className="text-sm font-bold text-foreground">Workflow Activity Trend</h3>
      </div>

      {/* Peak indicator */}
      {peakValue.value > 0 ? (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-muted-foreground">Peak Executions</span>
          <span className="text-xl font-bold text-foreground">{peakValue.value}</span>
          <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            ▲ {((peakValue.value / (trend?.totals.total || 1)) * 100).toFixed(0)}%
          </span>
        </div>
      ) : (
        <div className="h-6 mb-4" />
      )}

      {/* Range toggles */}
      <div className="flex gap-1.5 mb-4">
        {RANGE_OPTIONS.map((r) => (
          <button
            key={r}
            onClick={() => onRangeChange(r)}
            className={`px-3 py-1.5 text-xs font-semibold uppercase rounded-xl transition-all cursor-pointer ${
              selectedRange === r
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
            type="button"
          >
            {r}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="flex-1 min-h-[220px]">
        {trendLoading ? (
          <div className="flex flex-col h-full justify-end gap-3 p-4 animate-pulse">
            <div className="flex items-end gap-3 h-40">
              {[40, 65, 30, 85, 55, 90, 70].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-xl bg-muted border-t border-x border-border/60"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="h-3 w-full rounded bg-muted border border-border/60" />
          </div>
        ) : trendError ? (
          <div className="flex h-full items-center justify-center text-destructive text-sm">{trendError}</div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col h-full items-center justify-center text-muted-foreground gap-2">
            <Activity className="h-8 w-8 text-muted-foreground/40" />
            <span className="text-xs">No activity recorded for this period</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="mutedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  color: "var(--foreground)",
                  fontSize: "12px",
                }}
              />
              <Area type="monotone" dataKey="completed" stroke="var(--primary)" strokeWidth={2.5} fill="url(#primaryGradient)" />
              <Area type="monotone" dataKey="failed" stroke="var(--destructive)" strokeWidth={1.5} fill="url(#mutedGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
