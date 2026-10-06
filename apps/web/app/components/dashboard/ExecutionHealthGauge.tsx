"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { MoreHorizontal } from "lucide-react";
import { DashboardOverview } from "@/app/types/dashboard.types";

interface ExecutionHealthProps {
  overview: DashboardOverview | null;
}

export default function ExecutionHealthGauge({ overview }: ExecutionHealthProps) {
  const successRate = overview?.successRate ?? 0;
  const failedRate = overview?.failedRate ?? 0;
  const delayedRate = Math.max(0, 100 - successRate - failedRate);

  const gaugeData = useMemo(() => [
    { name: "Success", value: successRate, color: "#10b981" },
    { name: "Delayed", value: delayedRate, color: "#f59e0b" },
    { name: "Failed", value: failedRate || 0.5, color: "#ef4444" },
  ], [successRate, failedRate, delayedRate]);

  return (
    <div className="rounded-3xl border border-[#222429] bg-[#141518] p-6 flex min-h-[480px] flex-col shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <h3 className="text-sm font-bold text-white">Execution Health</h3>
        </div>
        <button className="p-1.5 rounded-xl hover:bg-[#1e2025] text-[#9ca3af] transition-colors" type="button">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Gauge */}
      <div className="flex-1 flex items-center justify-center relative min-h-20">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={gaugeData}
              dataKey="value"
              startAngle={220}
              endAngle={-40}
              cx="50%"
              cy="55%"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={2}
              cornerRadius={4}
            >
              {gaugeData.map((e) => (
                <Cell key={e.name} fill={e.color} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: '8%' }}>
          <span className="text-3xl font-extrabold text-white">{successRate.toFixed(1)}%</span>
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1 border border-emerald-500/20">
            System Healthy
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-[#9ca3af]">Success</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-xs text-[#9ca3af]">Delayed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-xs text-[#9ca3af]">Failed</span>
        </div>
      </div>

      <p className="text-[11px] text-[#6b7280] text-center mt-3">
        Health calculated across all runtime channels (Past 7 days)
      </p>
    </div>
  );
}
