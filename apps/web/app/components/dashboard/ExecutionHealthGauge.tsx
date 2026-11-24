"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { DashboardOverview } from "@/app/types/dashboard.types";

interface ExecutionHealthProps {
  overview: DashboardOverview | null;
}

export default function ExecutionHealthGauge({ overview }: ExecutionHealthProps) {
  const successRate = overview?.successRate ?? 0;
  const failedRate = overview?.failedRate ?? 0;
  const delayedRate = Math.max(0, 100 - successRate - failedRate);

  const gaugeData = useMemo(() => [
    { name: "Success", value: successRate, color: "var(--success)" },
    { name: "Delayed", value: delayedRate, color: "var(--warning)" },
    { name: "Failed", value: failedRate || 0.5, color: "var(--destructive)" },
  ], [successRate, failedRate, delayedRate]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 flex min-h-[440px] flex-col shadow-card">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-2.5 h-2.5 rounded-full bg-success" />
        <h3 className="text-sm font-bold text-foreground">Execution Health</h3>
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
          <span className="text-3xl font-extrabold text-foreground">{successRate.toFixed(1)}%</span>
          <span className="text-[10px] font-semibold text-success bg-success/10 px-2.5 py-0.5 rounded-full mt-1 border border-success/20">
            System Healthy
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-xs text-muted-foreground">Success</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-warning" />
          <span className="text-xs text-muted-foreground">Delayed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-destructive" />
          <span className="text-xs text-muted-foreground">Failed</span>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground text-center mt-3">
        Health calculated across all runtime channels (Past 7 days)
      </p>
    </div>
  );
}
