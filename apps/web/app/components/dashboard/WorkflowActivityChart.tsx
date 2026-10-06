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
import { MoreHorizontal, Activity } from "lucide-react";
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
    <div className="rounded-3xl border border-[#222429] bg-[#141518] p-6 flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <h3 className="text-sm font-bold text-white">Workflow Activity Trend</h3>
        </div>
        <button className="p-1.5 rounded-xl hover:bg-[#1e2025] text-[#9ca3af] transition-colors" type="button">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Peak indicator */}
      {peakValue.value > 0 ? (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-[#9ca3af]">Peak Executions</span>
          <span className="text-xl font-bold text-white">{peakValue.value}</span>
          <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
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
                ? "bg-white text-black shadow-sm font-bold"
                : "text-[#9ca3af] hover:text-white hover:bg-[#1e2025]"
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
                  className="flex-1 rounded-t-xl bg-[#1e2025]"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="h-3 w-full rounded bg-[#1e2025]" />
          </div>
        ) : trendError ? (
          <div className="flex h-full items-center justify-center text-rose-400 text-sm">{trendError}</div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col h-full items-center justify-center text-[#6b7280] gap-2">
            <Activity className="h-8 w-8 text-[#2a2c33]" />
            <span className="text-xs">No activity recorded for this period</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="grayGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4b5563" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#4b5563" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e2025" vertical={false} />
              <XAxis dataKey="label" stroke="#6b7280" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18191c",
                  border: "1px solid #2a2c33",
                  borderRadius: "12px",
                  color: "#f9fafb",
                  fontSize: "12px",
                }}
              />
              <Area type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2.5} fill="url(#indigoGradient)" />
              <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={1.5} fill="url(#grayGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
