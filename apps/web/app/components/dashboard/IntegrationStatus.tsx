"use client";

import { DashboardOverview } from "@/app/types/dashboard.types";

interface IntegrationStatusProps {
  overview: DashboardOverview | null;
}

export default function IntegrationStatus({ overview }: IntegrationStatusProps) {
  const integrations = overview?.integrations ?? [];

  const iconMap: Record<string, { label: string; color: string; src: string }> = {
    gmail: { label: "Gmail", color: "var(--destructive)", src: "/gmail.svg" },
    googleSheets: { label: "Google Sheets", color: "var(--success)", src: "/google_sheet.svg" },
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col shadow-card h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">Integration Status</h3>
      </div>

      {/* Bar visualization */}
      <div className="flex gap-3 mb-4 flex-1 min-h-[100px]">
        {integrations.length === 0 && (
          <div className="w-full flex items-center justify-center text-xs text-muted-foreground">
            No integrations found.
          </div>
        )}
        {integrations.map((int) => {
          const info = iconMap[int.key] || { label: int.label, color: "var(--primary)", src: "/globe.png" };
          return (
            <div key={int.key} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full rounded-xl overflow-hidden bg-secondary flex-1 flex items-end relative border border-border/50">
                <div
                  className="w-full rounded-t-lg transition-all duration-500 absolute bottom-0"
                  style={{
                    height: int.connected ? "75%" : "25%",
                    backgroundColor: int.connected ? info.color : "var(--muted-foreground)",
                    opacity: int.connected ? 0.9 : 0.4,
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
          const info = iconMap[int.key] || { label: int.label, color: "var(--primary)", src: "/globe.png" };
          return (
            <div key={int.key} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-secondary border border-border flex items-center justify-center shadow-xs p-1.5">
                <img src={info.src} alt={info.label} className="w-full h-full object-contain" />
              </div>
              <span className="text-xs font-semibold text-foreground">{info.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
