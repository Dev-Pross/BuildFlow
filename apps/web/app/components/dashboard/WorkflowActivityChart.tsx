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
import { MoreHorizontal } from "lucide-react";
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
    <div className="rounded-2xl border border-[#2a3525]/60 bg-[#111611] p-5 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#baf266]" />
          <h3 className="text-sm font-semibold text-[#e8e8d8]">Workflow Activity Trend</h3>
        </div>
        <button className="p-1 rounded-md hover:bg-[#1a2118] text-[#5a6350] transition-colors" type="button">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Peak indicator */}
      {peakValue.value > 0 && (
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-[#5a6350]">CRM</span>
          <span className="text-lg font-bold text-[#f0f0e8]">{peakValue.value}</span>
          <span className="text-[10px] font-medium text-[#baf266] bg-[#baf266]/10 px-1.5 py-0.5 rounded">
            ▲ {((peakValue.value / (trend?.totals.total || 1)) * 100).toFixed(0)}%
          </span>
        </div>
      )}

      {/* Range toggles */}
      <div className="flex gap-1 mb-3">
        {RANGE_OPTIONS.map((r) => (
          <button
            key={r}
            onClick={() => onRangeChange(r)}
            className={`px-2.5 py-1 text-[10px] font-semibold uppercase rounded-md transition-all ${
              selectedRange === r
                ? "bg-[#baf266]/15 text-[#baf266] border border-[#baf266]/25"
                : "text-[#5a6350] hover:text-[#8a9178] border border-transparent"
            }`}
            type="button"
          >
            {r}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        {trendLoading ? (
          <div className="flex h-full items-center justify-center text-[#5a6350] text-sm">Loading...</div>
        ) : trendError ? (
          <div className="flex h-full items-center justify-center text-[#f87171] text-sm">{trendError}</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#baf266" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#baf266" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="grayGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5a6350" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#5a6350" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1a2118" vertical={false} />
              <XAxis dataKey="label" stroke="#4a5440" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis stroke="#4a5440" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#141a14",
                  border: "1px solid #2a3525",
                  borderRadius: "10px",
                  color: "#e8e8d8",
                  fontSize: "12px",
                }}
              />
              <Area type="monotone" dataKey="completed" stroke="#baf266" strokeWidth={2} fill="url(#greenGradient)" />
              <Area type="monotone" dataKey="failed" stroke="#5a6350" strokeWidth={1.5} fill="url(#grayGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
