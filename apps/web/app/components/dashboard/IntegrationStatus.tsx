"use client";

import { MoreHorizontal } from "lucide-react";
import { DashboardOverview } from "@/app/types/dashboard.types";

interface IntegrationStatusProps {
  overview: DashboardOverview | null;
}

export default function IntegrationStatus({ overview }: IntegrationStatusProps) {
  const integrations = overview?.integrations ?? [];

  const iconMap: Record<string, { label: string; color: string; src: string }> = {
    gmail: { label: "Gmail", color: "#ef4444", src: "/gmail.svg" },
    googleSheets: { label: "Google Drive", color: "#10b981", src: "/google_sheet.svg" },
  };

  return (
    <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 flex flex-col shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-zinc-950">Integration Status</h3>
        <button className="p-1.5 rounded-xl hover:bg-zinc-200 text-zinc-400 transition-colors" type="button">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Bar visualization */}
      <div className="flex gap-3 mb-4 flex-1 min-h-[100px]">
        {integrations.length === 0 && (
          <div className="w-full flex items-center justify-center text-xs text-zinc-400">
            No integrations found.
          </div>
        )}
        {integrations.map((int) => {
          const info = iconMap[int.key] || { label: int.label, color: "#6366f1", src: "/globe.png" };
          return (
            <div key={int.key} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full rounded-xl overflow-hidden bg-zinc-200/60 flex-1 flex items-end relative">
                <div
                  className="w-full rounded-t-lg transition-all duration-500 absolute bottom-0"
                  style={{
                    height: int.connected ? "75%" : "25%",
                    backgroundColor: int.connected ? info.color : "#d4d4d8",
                    opacity: int.connected ? 0.9 : 0.6,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex gap-4 mt-2">
        {integrations.map((int) => {
          const info = iconMap[int.key] || { label: int.label, color: "#6366f1", src: "/globe.png" };
          return (
            <div key={int.key} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm p-1">
                <img src={info.src} alt={info.label} className="w-full h-full object-contain" />
              </div>
              <span className="text-xs font-semibold text-zinc-600">{info.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
