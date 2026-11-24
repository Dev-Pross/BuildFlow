"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutGrid,
  GitBranch,
  BarChart2,
  Boxes,
  Settings,
  LogOut,
  X
} from "lucide-react";
import { DashboardTab } from "@/app/types/dashboard.types";
import { signOut } from "next-auth/react";
import { Logo } from "@/app/components/ui/Logo";

interface SidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onRefresh?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS: { id: DashboardTab; label: string; icon: any }[] = [
  { id: "dashboard", label: "Home", icon: LayoutGrid },
  { id: "automations", label: "Workflows", icon: GitBranch },
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

  return (
    <>
      {/* ── Desktop Docked Sidebar (Fixed 240px with Bezier Concave Fillets) ── */}
      <aside className="hidden lg:flex w-60 min-w-[240px] max-w-[240px] shrink-0 flex-shrink-0 h-full flex-col justify-between pt-5 pb-5 select-none bg-transparent relative z-20">
        <div>
          {/* Brand Header */}
          <div className="px-5 mb-5 flex items-center justify-between">
            <Link href="/" className="group">
              <Logo variant="nav" surface="chassis" />
            </Link>
          </div>

          {/* Navigation List with Desktop Concave Bezier Fillets */}
          <nav className="space-y-1 relative">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <div key={item.id} className="relative">
                  <button
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex items-center gap-3 text-sm transition-all duration-150 ${
                      isActive
                        ? "w-[calc(100%-16px+2px)] bg-workspace text-workspace-foreground font-bold ml-4 pl-4 pr-3 py-3 rounded-l-[28px] relative z-20 cursor-default shadow-xs"
                        : "w-[calc(100%-32px)] text-zinc-400 hover:text-white mx-4 px-3.5 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer font-medium"
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-workspace-foreground stroke-[2.5]" : "text-zinc-400"}`} />
                    <span className="tracking-tight truncate">{item.label}</span>
                  </button>

                  {/* Blended Concave Corners (Opposite Curves Expanding into Main Container) */}
                  {isActive && (
                    <>
                      <svg
                        className="absolute -top-6 right-[-1px] w-6 h-6 pointer-events-none z-20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path d="M0 24 C13.25 24 24 13.25 24 0 L24 24 Z" className="fill-workspace" />
                      </svg>
                      <svg
                        className="absolute -bottom-6 right-[-1px] w-6 h-6 pointer-events-none z-20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path d="M0 0 C13.25 0 24 10.75 24 24 L24 0 Z" className="fill-workspace" />
                      </svg>
                    </>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sign Out */}
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
      </aside>

      {/* ── Mobile Slide-Over Backdrop ── */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* ── Mobile Slide-Over Drawer (Normal Curved Buttons) ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-chassis text-chassis-foreground border-r border-border/20 shadow-2xl flex flex-col justify-between p-5 lg:hidden transition-transform duration-300 ease-in-out ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Mobile Header with Close Button */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" onClick={onCloseMobile}>
              <Logo variant="nav" surface="chassis" />
            </Link>
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close Sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Normal Curved Buttons on Mobile */}
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all cursor-pointer font-medium ${
                    isActive
                      ? "bg-workspace text-workspace-foreground font-bold shadow-md"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-workspace-foreground stroke-[2.5]" : "text-zinc-400"}`} />
                  <span className="tracking-tight truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Sign Out */}
        <div className="pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 text-sm font-medium transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="tracking-tight">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
