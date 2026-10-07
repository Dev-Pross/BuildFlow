"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutGrid,
  Workflow,
  BarChart2,
  Boxes,
  Settings
} from "lucide-react";
import { DashboardTab } from "@/app/types/dashboard.types";

interface SidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onRefresh?: () => void;
}

const NAV_ITEMS: { id: DashboardTab; label: string; icon: any }[] = [
  { id: "dashboard", label: "Home", icon: LayoutGrid },
  { id: "automations", label: "Workflows", icon: Workflow },
  { id: "executions", label: "Progress", icon: BarChart2 },
  { id: "integrations", label: "Integrations", icon: Boxes },
  { id: "profile", label: "Settings", icon: Settings },
];

export default function DashboardSidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-60 min-w-[240px] max-w-[240px] shrink-0 flex-shrink-0 h-full flex flex-col justify-between pt-6 pb-5 bg-[#0c0d0e] relative z-20 select-none overflow-hidden">
      <div>
        {/* Brand Header matching photo: Green/emerald rounded square with letter + name */}
        <div className="px-5 mb-7 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-[#22c55e] text-white font-black text-xl flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:scale-105 transition-transform shrink-0">
              E
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xl font-bold tracking-tight text-white font-sans leading-tight">
                EduTer
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation List with blended active tab */}
        <nav className="space-y-1 relative">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <div key={item.id} className="relative">
                <button
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 text-sm transition-all duration-150 ${
                    isActive
                      ? "bg-white text-zinc-950 font-bold ml-4 pl-4 pr-3 py-3 rounded-l-[28px] relative z-20 cursor-default shadow-sm"
                      : "text-zinc-400 hover:text-white mx-4 px-3.5 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer font-medium"
                  }`}
                  style={isActive ? { width: "calc(100% - 16px + 2px)" } : {}}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-zinc-950 stroke-[2.5]" : "text-zinc-400"}`} />
                  <span className="tracking-tight truncate">{item.label}</span>
                </button>

                {/* Blended Concave Corners (Quarter-Circle Bezier Fillets) */}
                {isActive && (
                  <>
                    {/* Top Concave Fillet */}
                    <svg
                      className="absolute -top-6 right-[-1px] w-6 h-6 pointer-events-none z-20"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path d="M0 24 C13.25 24 24 13.25 24 0 L24 24 Z" fill="#ffffff" />
                    </svg>

                    {/* Bottom Concave Fillet */}
                    <svg
                      className="absolute -bottom-6 right-[-1px] w-6 h-6 pointer-events-none z-20"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path d="M0 0 C13.25 0 24 10.75 24 24 L24 0 Z" fill="#ffffff" />
                    </svg>
                  </>
                )}
              </div>
            );
          })}
        </nav>
      </div>


    </aside>
  );
}
