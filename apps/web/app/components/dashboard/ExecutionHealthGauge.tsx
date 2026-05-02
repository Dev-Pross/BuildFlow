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
    { name: "Success", value: successRate, color: "#baf266" },
    { name: "Delayed", value: delayedRate, color: "#f59e0b" },
    { name: "Failed", value: failedRate || 0.5, color: "#f87171" },
  ], [successRate, failedRate, delayedRate]);

  return (
    <div className="rounded-2xl border border-[#2a3525]/60 bg-[#111611] p-5 flex min-h-[500px] flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#baf266]" />
          <h3 className="text-sm font-semibold text-[#e8e8d8]">Execution Health</h3>
        </div>
        <button className="p-1 rounded-md hover:bg-[#1a2118] text-[#5a6350] transition-colors" type="button">
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
          <span className="text-3xl font-bold text-[#f0f0e8]">{successRate.toFixed(1)}%</span>
          <span className="text-[10px] font-medium text-[#baf266] bg-[#baf266]/10 px-1.5 py-0.5 rounded mt-1">
            ▼ 0%
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#baf266]" />
          <span className="text-[11px] text-[#8a9178]">Success</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
          <span className="text-[11px] text-[#8a9178]">Delayed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#f87171]" />
          <span className="text-[11px] text-[#8a9178]">Failed</span>
        </div>
      </div>

      <p className="text-[10px] text-[#4a5440] text-center mt-2">
        Health is calculated based on the past 7 days execution
      </p>
    </div>
  );
}
