"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutGrid,
  Workflow,
  BarChart2,
  Boxes,
  Settings,
  LogOut,
  X
} from "lucide-react";
import { DashboardTab } from "@/app/types/dashboard.types";
import { signOut } from "next-auth/react";

interface SidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onRefresh?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS: { id: DashboardTab; label: string; icon: any }[] = [
  { id: "dashboard", label: "Home", icon: LayoutGrid },
  { id: "automations", label: "Workflows", icon: Workflow },
  { id: "executions", label: "Progress", icon: BarChart2 },
  { id: "integrations", label: "Integrations", icon: Boxes },
  { id: "profile", label: "Settings", icon: Settings },
];

export default function DashboardSidebar({
  activeTab,
  onTabChange,
  isOpenMobile = false,
  onCloseMobile
}: SidebarProps) {
  const handleSelectTab = (tab: DashboardTab) => {
    onTabChange(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const handleSignOut = () => {
    if (onCloseMobile) onCloseMobile();
    signOut({ callbackUrl: "/login" });
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between pt-6 pb-5 select-none overflow-hidden">
      <div>
        {/* Brand Header */}
        <div className="px-5 mb-7 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group" onClick={onCloseMobile}>
            <div className="w-10 h-10 rounded-2xl bg-[#22c55e] text-white font-black text-xl flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:scale-105 transition-transform shrink-0">
              B
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xl font-bold tracking-tight text-white font-sans leading-tight">
                BuildFlow
              </span>
            </div>
          </Link>

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close Sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="space-y-1 relative">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <div key={item.id} className="relative">
                <button
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
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
                    <svg
                      className="absolute -top-6 right-[-1px] w-6 h-6 pointer-events-none z-20"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path d="M0 24 C13.25 24 24 13.25 24 0 L24 24 Z" fill="#ffffff" />
                    </svg>
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

      {/* Bottom Footer: Sign Out Button */}
      <div className="px-4 pt-4 border-t border-white/5">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 text-sm font-medium transition-colors cursor-pointer group"
        >
          <LogOut className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-rose-400 transition-colors" />
          <span className="tracking-tight">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Docked Sidebar */}
      <aside className="hidden lg:flex w-60 min-w-[240px] max-w-[240px] shrink-0 flex-shrink-0 h-full flex-col justify-between bg-[#0c0d0e] relative z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Slide-Over Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#0c0d0e] border-r border-zinc-800 shadow-2xl flex flex-col lg:hidden transition-transform duration-300 ease-in-out ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
