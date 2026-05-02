"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  border: boolean;
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  trend?: { value: string; positive: boolean };
  delay?: number;
}

export default function DashboardStatCard({ label, value, hint, trend, icon, border, delay = 0 }: StatCardProps) {
  return (
    <div
      className={` px-4 py-2 ${border ? "border-r-2 border-r-[#2a3525]/60" : "border-r-0"} flex flex-grow gap-1 items-center`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-fit p-2 ml-4 mr-6 bg-[#2a3525]/60 rounded-lg">
        {icon}
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-[#6a7560] tracking-wide mr-2">{label}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-[#f0f0e8] tracking-tight">{value}</p>
          {trend && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${trend.positive
              ? "text-[#4dff7d] bg-[#4dff7d]/10"
              : "text-[#f87171] bg-[#f87171]/10"
              }`}>
              {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.value}
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-[#5a6350]">{hint}</p>
      </div>
    </div>
  );
}
