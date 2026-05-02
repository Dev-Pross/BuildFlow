"use client";

import { MoreHorizontal } from "lucide-react";
import { DashboardOverview } from "@/app/types/dashboard.types";

interface IntegrationStatusProps {
  overview: DashboardOverview | null;
}

export default function IntegrationStatus({ overview }: IntegrationStatusProps) {
  const integrations = overview?.integrations ?? [];

  // Integration icon mapping
  const iconMap: Record<string, { label: string; color: string }> = {
    gmail: { label: "Gmail", color: "#f87171" },
    googleSheets: { label: "Google Drive", color: "#baf266" },
  };

  return (
    <div className="rounded-2xl border border-[#2a3525]/60 bg-[#111611] p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#e8e8d8]">Integration Status</h3>
        <button className="p-1 rounded-md hover:bg-[#1a2118] text-[#5a6350] transition-colors" type="button">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Bar visualization */}
      <div className="flex gap-2 mb-4 flex-1">
        {integrations.map((int) => {
          const info = iconMap[int.key] || { label: int.label, color: "#5a6350" };
          return (
            <div key={int.key} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full rounded-lg overflow-hidden bg-[#1a2118] flex-1 flex items-end">
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: int.connected ? "75%" : "25%",
                    backgroundColor: int.connected ? info.color : "#2a3525",
                    opacity: int.connected ? 0.7 : 0.3,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex gap-3">
        {integrations.map((int) => {
          const info = iconMap[int.key] || { label: int.label, color: "#5a6350" };
          return (
            <div key={int.key} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: info.color + "20", color: info.color }}
              >
                {info.label[0]}
              </div>
              <span className="text-xs text-[#8a9178]">{info.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
