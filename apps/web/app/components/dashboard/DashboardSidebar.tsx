"use client";

import { type ComponentType } from "react";
import {
  CircleUserRound,
  LayoutDashboard,
  Plug,
  Zap,
  Activity,
  Search,
  RefreshCw,
  Crown,
  Workflow,
} from "lucide-react";
import { DashboardTab } from "@/app/types/dashboard.types";
import { useAppSelector } from "@/app/hooks/redux";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@workspace/ui/components/sidebar";

const DASHBOARD_TABS: Array<{
  key: DashboardTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
    { key: "profile", label: "Profile", icon: CircleUserRound },
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "automations", label: "Automations", icon: Zap },
    { key: "executions", label: "Executions", icon: Activity },
    { key: "integrations", label: "Integrations", icon: Plug },
  ];

const PRIMARY_TABS: DashboardTab[] = ["profile", "dashboard", "automations"];
const SECONDARY_TABS: DashboardTab[] = ["executions", "integrations"];

interface DashboardSidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onRefresh: () => void;
}

export default function DashboardSidebar({
  activeTab,
  onTabChange,
  onRefresh,
}: DashboardSidebarProps) {
  const user = useAppSelector((state) => state.user);

  return (
    <Sidebar collapsible="icon" className="border-r border-[#2a3525]/30 bg-[#0d120d]">
      <SidebarHeader className='flex items-center justify-between p-4 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:p-2'>
        <Workflow className="shrink-0 text-[#baf266]" />
        <span className='text-2xl font-bold text-[#f0f0e8] group-data-[state=collapsed]:hidden'>BuildFlow</span>
        {/* <SidebarTrigger className="group-data-[state=collapsed]:hidden" /> */}
      </SidebarHeader>

      <SidebarContent className="px-3 py-2 group-data-[state=collapsed]:px-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#5a6350] text-[10px] uppercase tracking-wider mb-2 px-2 group-data-[state=collapsed]:hidden">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PRIMARY_TABS.map((tabKey) => {
                const tab = DASHBOARD_TABS.find((t) => t.key === tabKey)!;
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <SidebarMenuItem key={tab.key}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(tab.key)}
                      isActive={active}
                      tooltip={tab.label}
                      className={`w-full gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group-data-[state=collapsed]:gap-0 group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:justify-center ${active
                        ? "bg-[#baf266]/10 text-[#baf266] hover:bg-[#baf266]/15 hover:text-[#baf266]"
                        : "text-[#8a9178] hover:text-[#c8d4a8] hover:bg-[#1a2118]/60"
                        }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="font-medium group-data-[state=collapsed]:hidden">{tab.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-[#5a6350] text-[10px] uppercase tracking-wider mb-2 px-2 group-data-[state=collapsed]:hidden">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SECONDARY_TABS.map((tabKey) => {
                const tab = DASHBOARD_TABS.find((t) => t.key === tabKey)!;
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <SidebarMenuItem key={tab.key}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(tab.key)}
                      isActive={active}
                      tooltip={tab.label}
                      className={`w-full gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group-data-[state=collapsed]:gap-0 group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:justify-center ${active
                        ? "bg-[#baf266]/10 text-[#baf266] hover:bg-[#baf266]/15 hover:text-[#baf266]"
                        : "text-[#8a9178] hover:text-[#c8d4a8] hover:bg-[#1a2118]/60"
                        }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="font-medium group-data-[state=collapsed]:hidden">{tab.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onRefresh}
                  tooltip="Refresh Data"
                  className="w-full gap-3 px-3 py-2.5 rounded-xl text-[#8a9178] hover:text-[#c8d4a8] hover:bg-[#1a2118]/60 transition-all group-data-[state=collapsed]:gap-0 group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:justify-center"
                >
                  <RefreshCw className="h-5 w-5 shrink-0" />
                  <span className="font-medium group-data-[state=collapsed]:hidden">Refresh</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 mt-auto group-data-[state=collapsed]:p-2">
        <div className="p-4 rounded-2xl bg-[#141a14] border border-[#2a3525]/40 group-data-[state=collapsed]:p-0 group-data-[state=collapsed]:border-none group-data-[state=collapsed]:bg-transparent">
          <div className="flex items-center gap-3 group-data-[state=collapsed]:justify-center">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#baf266] to-[#82c246] flex items-center justify-center text-[#0a0d0a] font-bold shrink-0">
              {user.name?.[0] || 'U'}
            </div>
            <div className="flex flex-col min-w-0 group-data-[state=collapsed]:hidden">
              <span className="text-sm font-semibold text-[#f0f0e8] truncate">{user.name || 'User'}</span>
              <span className="text-[11px] text-[#5a6350] truncate">{user.email || 'user@example.com'}</span>
            </div>
          </div>
          <button onClick={() => { window.location.href = 'mailto:tejabudumuru3@gmail.com?subject=BuildFlow-Upgrade' }} className="mt-4 w-full py-2 rounded-lg bg-[#baf266]/10 text-[#baf266] text-xs font-semibold border border-[#baf266]/20 hover:bg-[#baf266]/20 transition-all group-data-[state=collapsed]:hidden">
            Upgrade
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
