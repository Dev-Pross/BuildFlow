"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from '@workspace/ui/components/sidebar';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@workspace/ui/components/dropdown-menu';
import {
  Blocks,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeftOpen,
  Plus,
  Sun,
  Workflow
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useAppDispatch, useAppSelector } from '@/app/hooks/redux';
import { userAction } from '@/store/slices/userSlice';
import { workflowActions } from '@/store/slices/workflowSlice';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/lib/api';
import { CardDemo } from './Design/WorkflowCard';
import { Logo } from './Logo';

export function AppSidebar() {
  const { toggleSidebar } = useSidebar();
  const user = useAppSelector((s) => s.user);
  const reduxWorkflowId = useAppSelector((s) => s.workflow.data.workflowId);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(reduxWorkflowId);
  type WorkflowSummary = { id: string; name: string; description?: string | null };
  const [workflows, setWorkflows] = useState<WorkflowSummary[] | undefined>();
  const [createOpen, setCreateOpen] = useState(false);

  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark" || theme === "dark";

  const { data: session } = useSession()
  const useAvatar = session?.user?.image;
  const displayName = session?.user?.name || "User"
  const displayEmail = session?.user?.email || "user@buildflow.com";

  useEffect(() => {
    if (reduxWorkflowId) {
      setSelectedWorkflow(reduxWorkflowId);
    }
  }, [reduxWorkflowId]);

  useEffect(() => {
    async function getWorkflows() {
      try {
        const flows = await api.workflows.getAll();
        if (flows?.data?.Data) setWorkflows(flows.data.Data);
      } catch {
        // non-blocking
      }
    }

    getWorkflows();
  }, [dispatch]);

  const workflowHandler = (workflow: WorkflowSummary) => {
    setSelectedWorkflow(workflow.id);
    router.push(`/workflows/${workflow.id}`);
  };

  const logout = async () => {
    toast.info("Signing out...");
    await signOut({ redirect: false });
    dispatch(userAction.clearUser());
    dispatch(workflowActions.clearWorkflow());
    router.push('/login');
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-white/10 bg-chassis text-chassis-foreground">
        {/* Header: explicitly horizontal row with logo and collapse trigger */}
        <SidebarHeader className="!flex-row flex items-center justify-between p-3 border-b border-white/10 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center">
          {/* Expanded State: Brand logo lockup on left, collapse trigger on right */}
          <button
            type="button"
            onClick={toggleSidebar}
            title="Collapse Sidebar"
            className="flex items-center gap-3 group group-data-[collapsible=icon]:hidden cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          >
            <Logo variant="nav" surface="chassis" />
          </button>
          <SidebarTrigger className="text-zinc-400 hover:text-white hover:bg-white/10 size-8 rounded-lg cursor-pointer transition-colors group-data-[collapsible=icon]:hidden" />

          {/* Collapsed State: Logo tile that reveals expand action on hover */}
          <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  aria-label="Expand Sidebar"
                  className="group/logo-btn relative size-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {/* Default: BuildFlow logo tile */}
                  <span className="transition-all duration-200 group-hover/logo-btn:opacity-0 group-hover/logo-btn:scale-75 flex items-center justify-center">
                    <Logo variant="tile" size="sm" surface="chassis" />
                  </span>
                  {/* Hover: Panel expand icon */}
                  <span className="absolute inset-0 m-auto size-4 text-primary opacity-0 scale-75 group-hover/logo-btn:opacity-100 group-hover/logo-btn:scale-100 transition-all duration-200 flex items-center justify-center">
                    <PanelLeftOpen className="size-4 text-primary" />
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-chassis border border-white/10 text-chassis-foreground text-xs shadow-xl">
                Expand Sidebar
              </TooltipContent>
            </Tooltip>
          </div>
        </SidebarHeader>

        {/* Content */}
        <SidebarContent className="p-2 space-y-2 group-data-[collapsible=icon]:p-1.5 group-data-[collapsible=icon]:overflow-hidden">
          <SidebarMenu>
            {/* Create workflow action */}
            <SidebarMenuItem>
              <SidebarMenuButton
                className="w-full justify-center gap-2 py-2.5 px-3 rounded-2xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-primary-foreground font-bold text-xs transition-all shadow-md cursor-pointer group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-xl"
                onClick={() => setCreateOpen(true)}
                tooltip="New Flow"
              >
                <Plus className="h-4 w-4 shrink-0 text-primary-foreground" />
                <span className="group-data-[collapsible=icon]:hidden">New Flow</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Back to Dashboard */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push('/dashboard')}
                className="w-full gap-2.5 px-3 py-2.5 rounded-2xl text-chassis-foreground/70 hover:text-chassis-foreground hover:bg-white/10 text-xs font-semibold transition-colors group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl"
                tooltip="Dashboard Hub"
              >
                <LayoutDashboard className="h-4 w-4 shrink-0 text-primary" />
                <span className="group-data-[collapsible=icon]:hidden">Dashboard Hub</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Integrations Hub Link */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push('/dashboard?tab=integrations')}
                className="w-full gap-2.5 px-3 py-2.5 rounded-2xl text-chassis-foreground/70 hover:text-chassis-foreground hover:bg-white/10 text-xs font-semibold transition-colors group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl"
                tooltip="Integrations"
              >
                <Blocks className="h-4 w-4 shrink-0 text-primary" />
                <span className="group-data-[collapsible=icon]:hidden">Integrations</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* WORKFLOWS LIST */}
            <Collapsible defaultOpen className="group/collapsible pt-1 group-data-[collapsible=icon]:pt-0">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    className="w-full justify-between px-3 py-2 text-xs font-semibold text-chassis-foreground/70 hover:text-chassis-foreground hover:bg-white/10 rounded-2xl transition-colors group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl"
                    tooltip="Workflows"
                  >
                    <div className="flex items-center gap-2.5">
                      <Workflow className="h-4 w-4 text-chassis-foreground/60 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">Workflows</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-180 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                  <SidebarMenuSub className="max-h-60 overflow-y-auto no-scrollbar cursor-pointer space-y-0.5 !border-l-0 !mx-0 !translate-x-0 !px-1 py-1">
                    {workflows ? (
                      workflows.length === 0 ? (
                        <SidebarMenuSubItem key="empty">
                          <span className="text-[11px] text-chassis-foreground/50 px-2.5 py-1.5 block">No flows yet</span>
                        </SidebarMenuSubItem>
                      ) : (
                        workflows.map((i) => {
                          const isActive = selectedWorkflow === i.id;
                          return (
                            <SidebarMenuSubItem onClick={() => workflowHandler(i)} key={i.id}>
                              <SidebarMenuSubButton
                                isActive={isActive}
                                className={`w-full text-xs px-2.5 py-2 rounded-lg truncate transition-all flex items-center gap-2 ${isActive
                                    ? "bg-white/10 text-white font-semibold shadow-xs border border-white/15"
                                    : "text-chassis-foreground/60 hover:text-chassis-foreground hover:bg-white/5"
                                  }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-primary shadow-xs" : "bg-chassis-foreground/30"}`} />
                                <span className="truncate flex-1 text-left">{i.name}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })
                      )
                    ) : (
                      <span className="text-[11px] text-chassis-foreground/50 px-2.5 py-1.5 block">Loading flows...</span>
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="p-2 border-t border-white/10 mt-auto group-data-[collapsible=icon]:p-1.5">
          <SidebarMenu>
            {/* Profile Dropdown */}
            <SidebarMenuItem className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    tooltip={user.name || "User Profile"}
                    className="h-10 data-[state=open]:bg-white/10 hover:bg-white/10 transition-colors rounded-xl group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
                  >
                    <div className="aspect-square h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm ring-1 ring-white/10">
                      {useAvatar ? <img src={useAvatar} alt={displayName} className='w-full h-full object-cover rounded-full' /> : displayName[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex flex-col text-left min-w-0 flex-1 ml-2.5 group-data-[collapsible=icon]:hidden">
                      <span className="text-xs font-bold text-white truncate">{user.name || "User"}</span>
                      <span className="text-[10px] text-chassis-foreground/60 truncate">{user.email || "user@build.com"}</span>
                    </div>
                    <ChevronUp className="h-4 w-4 ml-auto text-chassis-foreground/60 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="w-56 bg-chassis border border-white/10 p-1.5 rounded-2xl shadow-2xl text-chassis-foreground"
                >
                  <DropdownMenuItem
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    className="flex items-center justify-between p-2.5 rounded-xl text-xs hover:bg-white/10 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {mounted ? (
                        isDark ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4 text-primary" />
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-white/20 animate-pulse" />
                      )}
                      <span>{mounted ? (isDark ? "Switch to Light Mode" : "Switch to Dark Mode") : "Switch Theme"}</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-white/10 text-chassis-foreground/60">
                      {mounted ? (isDark ? "Dark" : "Light") : ""}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={logout}
                    className="flex items-center justify-between p-2.5 rounded-xl text-xs text-rose-400 hover:bg-rose-950/30 cursor-pointer"
                  >
                    <span>Sign Out</span>
                    <LogOut className="h-4 w-4 text-rose-400" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail className="hover:after:bg-primary/50" />
      </Sidebar>

      {createOpen && <CardDemo onClose={() => setCreateOpen(false)} />}
    </>
  );
}

export default AppSidebar;