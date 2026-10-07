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
} from '@workspace/ui/components/sidebar';

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
  ChevronDown,
  ChevronUp,
  Key,
  LogOut,
  LayoutDashboard,
  Plus,
  Workflow
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks/redux';
import { userAction } from '@/store/slices/userSlice';
import { workflowActions } from '@/store/slices/workflowSlice';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/lib/api';
import { CardDemo } from './Design/WorkflowCard';

export function AppSidebar() {
  const user = useAppSelector((s) => s.user);
  const reduxWorkflowId = useAppSelector((s) => s.workflow.data.workflowId);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(reduxWorkflowId);
  type WorkflowSummary = { id: string; name: string; description?: string | null };
  const [workflows, setWorkflows] = useState<WorkflowSummary[] | undefined>();
  const [creds, setCreds] = useState<Array<any>>();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    async function getWorkflows() {
      try {
        const flows = await api.workflows.getAll();
        if (flows?.data?.Data) setWorkflows(flows.data.Data);
      } catch {
        // non-blocking
      }
    }

    async function getCreds() {
      try {
        const credentials = await api.Credentials.getAllCreds();
        if (credentials?.data?.data) setCreds(credentials.data.data);
      } catch {
        // non-blocking
      }
    }

    getCreds();
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
      <Sidebar collapsible="icon" className="border-r border-[#222429] bg-[#0e0f11] text-white">
        {/* Header */}
        <SidebarHeader className="flex items-center justify-between p-4 border-b border-[#1e1f23]">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-2xl bg-white text-black flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <Workflow className="h-4.5 w-4.5 text-black" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white group-data-[state=collapsed]:hidden">
              BuildFlow
            </span>
          </Link>
          <SidebarTrigger className="text-[#9ca3af] hover:text-white" />
        </SidebarHeader>

        {/* Content */}
        <SidebarContent className="p-3 space-y-2">
          <SidebarMenu>
            {/* Create workflow action */}
            <SidebarMenuItem>
              <SidebarMenuButton
                className="w-full justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white text-black font-bold text-xs hover:bg-gray-100 transition-all shadow-sm cursor-pointer"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4 shrink-0 text-black" />
                <span className="group-data-[state=collapsed]:hidden">New Flow</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Back to Dashboard */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push('/dashboard')}
                className="w-full gap-2.5 px-3 py-2.5 rounded-2xl text-[#9ca3af] hover:text-white hover:bg-[#1a1b1f] text-xs font-semibold transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 shrink-0 text-white" />
                <span className="group-data-[state=collapsed]:hidden">Dashboard Hub</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* WORKFLOWS LIST */}
            <Collapsible defaultOpen className="group/collapsible pt-2">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="w-full justify-between px-3 py-2 text-xs font-semibold text-[#9ca3af] hover:text-white hover:bg-[#1a1b1f] rounded-2xl transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Workflow className="h-4 w-4 text-gray-400" />
                      <span className="group-data-[state=collapsed]:hidden">Workflows</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-180 group-data-[state=collapsed]:hidden" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="max-h-60 overflow-y-auto cursor-pointer space-y-1 px-1 py-1">
                    {workflows ? (
                      workflows.length === 0 ? (
                        <SidebarMenuSubItem key="empty">
                          <span className="text-[11px] text-[#6b7280] px-2 py-1 block">No flows yet</span>
                        </SidebarMenuSubItem>
                      ) : (
                        workflows.map((i) => {
                          const isActive = selectedWorkflow === i.id;
                          return (
                            <SidebarMenuSubItem onClick={() => workflowHandler(i)} key={i.id}>
                              <SidebarMenuSubButton
                                isActive={isActive}
                                className={`text-xs px-3 py-2 rounded-xl truncate transition-colors ${
                                  isActive
                                    ? "bg-white text-black font-bold shadow-xs"
                                    : "text-[#9ca3af] hover:text-white hover:bg-[#1a1b1f]"
                                }`}
                              >
                                <span className="truncate">{i.name}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })
                      )
                    ) : (
                      <span className="text-[11px] text-[#6b7280] px-2 py-1 block">Loading flows...</span>
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            {/* CREDENTIALS LIST */}
            <Collapsible className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="w-full justify-between px-3 py-2 text-xs font-semibold text-[#9ca3af] hover:text-white hover:bg-[#1a1b1f] rounded-2xl transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Key className="h-4 w-4 text-gray-400" />
                      <span className="group-data-[state=collapsed]:hidden">Credentials</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-180 group-data-[state=collapsed]:hidden" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="max-h-36 overflow-y-auto cursor-pointer space-y-1 px-1 py-1">
                    {creds ? (
                      creds.length === 0 ? (
                        <SidebarMenuSubItem key="none">
                          <span className="text-[11px] text-[#6b7280] px-2 py-1 block">No connected auths</span>
                        </SidebarMenuSubItem>
                      ) : (
                        creds.map((i: any) => (
                          <SidebarMenuSubItem key={i.id}>
                            <SidebarMenuSubButton className="text-xs text-[#9ca3af] hover:text-white px-2.5 py-1.5 truncate">
                              <span className="truncate">🔑 {i.type}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))
                      )
                    ) : (
                      <span className="text-[11px] text-[#6b7280] px-2 py-1 block">Loading keys...</span>
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="p-3 border-t border-[#1e1f23] mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="h-auto p-2.5 rounded-2xl hover:bg-[#1a1b1f] transition-colors w-full">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex flex-col text-left min-w-0 flex-1 ml-2.5 group-data-[state=collapsed]:hidden">
                      <span className="text-xs font-bold text-white truncate">{user.name || "User"}</span>
                      <span className="text-[10px] text-[#9ca3af] truncate">{user.email || "user@build.com"}</span>
                    </div>
                    <ChevronUp className="h-4 w-4 ml-auto text-gray-500 group-data-[state=collapsed]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="w-56 bg-[#18191c] border border-[#27282d] p-1.5 rounded-2xl shadow-2xl text-white"
                >
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center justify-between p-2 rounded-xl text-xs hover:bg-[#222429] cursor-pointer"
                  >
                    <span>Dashboard Overview</span>
                    <LayoutDashboard className="h-4 w-4 text-gray-400" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={logout}
                    className="flex items-center justify-between p-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/30 cursor-pointer"
                  >
                    <span>Sign Out</span>
                    <LogOut className="h-4 w-4 text-rose-400" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {createOpen && <CardDemo onClose={() => setCreateOpen(false)} />}
    </>
  );
}

export default AppSidebar;