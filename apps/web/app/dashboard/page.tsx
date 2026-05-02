"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LucideBadgeCheck, LucideTimer, Plus, RefreshCcwDot, Sparkles, Workflow } from "lucide-react";
import { api } from "@/app/lib/api";
import { useAppSelector } from "@/app/hooks/redux";
import {
  DashboardExecutionTrend,
  DashboardOverview,
  DashboardRange,
  DashboardTab,
} from "@/app/types/dashboard.types";
import WorkflowListView from "@/app/components/workflows/WorkflowListView";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardStatCard from "../components/dashboard/DashboardStatCard";
import WorkflowActivityChart from "../components/dashboard/WorkflowActivityChart";
import ExecutionHealthGauge from "../components/dashboard/ExecutionHealthGauge";
import IntegrationStatus from "../components/dashboard/IntegrationStatus";
import RecentWorkflows from "../components/dashboard/RecentWorkflows";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@workspace/ui/components/sidebar";
import { CardDemo } from "../components/ui/Design/WorkflowCard";

const DASHBOARD_TABS: DashboardTab[] = [
  "profile",
  "dashboard",
  "automations",
  "executions",
  "integrations",
];

const isDashboardTab = (v: string | null): v is DashboardTab =>
  DASHBOARD_TABS.includes(v as DashboardTab);

const formatPercent = (v: number) => `${v.toFixed(1)}%`;

function PlaceholderPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-[#2a3525]/60 bg-[#111611] p-8">
      <h2 className="text-2xl font-semibold text-[#f0f0e8]">{title}</h2>
      <p className="mt-3 max-w-2xl text-[#6a7560]">{description}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppSelector((state) => state.user);

  const [selectedRange, setSelectedRange] = useState<DashboardRange>("7d");
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [trend, setTrend] = useState<DashboardExecutionTrend | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [trendError, setTrendError] = useState<string | null>(null);

  const activeTab: DashboardTab = useMemo(() => {
    const p = searchParams.get("tab");
    return isDashboardTab(p) ? p : "dashboard";
  }, [searchParams]);

  const [enableCreateButton, setEnableCreateButton] = useState(false)

  const setTab = (tab: DashboardTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/dashboard?${params.toString()}`);
  };

  const fetchOverview = async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      setOverview(await api.dashboard.getOverview());
    } catch (e: any) {
      setOverviewError(e?.message || "Failed to load overview");
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchTrend = async (range: DashboardRange) => {
    setTrendLoading(true);
    setTrendError(null);
    try {
      setTrend(await api.dashboard.getExecutionTrend(range));
    } catch (e: any) {
      setTrendError(e?.message || "Failed to load trend");
    } finally {
      setTrendLoading(false);
    }
  };

  useEffect(() => { fetchOverview(); }, []);
  useEffect(() => { fetchTrend(selectedRange); }, [selectedRange]);

  const handleRefresh = () => {
    fetchOverview();
    fetchTrend(selectedRange);
  };

  const renderDashboard = () => {

    if (overviewLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#baf266] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#5a6350]">Loading dashboard...</p>
          </div>
        </div>
      );
    }

    if (overviewError || !overview) {
      return (
        <div className="rounded-2xl border border-[#7f1d1d]/40 bg-[#1a1010] p-8 text-[#fca5a5]">
          {overviewError || "Unable to load dashboard"}
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Stat Cards Row */}
        <div className="flex w-full border border-[#2a3525]/60  gap-4 bg-[#111611] p-2 rounded-2xl ">
          <DashboardStatCard
            icon={<Workflow className="size-8 text-[#baf266]" />}
            label="Active Workflows"
            value={String(overview.workflowCount)}
            hint="from last month"
            trend={{ value: "12%", positive: true }}
            delay={0}
            border={true}
          />
          <DashboardStatCard
            icon={<RefreshCcwDot className="size-8 text-[#baf266]" />}
            label="Automation Executed"
            value={String(overview.executionCount).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            hint="from last month"
            trend={{ value: `${overview.executionCount > 0 ? "↑" : ""} ${overview.executionCount}`, positive: true }}
            delay={80}
            border={true}
          />
          <DashboardStatCard
            icon={<LucideTimer className="size-8 text-[#baf266]" />}
            label="Avg Execution Time"
            value="3.0s"
            hint="from last month"
            trend={{ value: "-0.5s", positive: false }}
            delay={160}
            border={true}
          />
          <DashboardStatCard
            icon={<LucideBadgeCheck className="size-8 text-[#baf266]" />}
            label="Success Rate"
            value={formatPercent(overview.successRate)}
            hint="from last month"
            trend={{ value: `${overview.successRate > 95 ? "6.6%" : "1%"}`, positive: overview.successRate >= 95 }}
            delay={240}
            border={false}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-3 flex-1 min-h-[500px]">
          <WorkflowActivityChart
            trend={trend}
            trendLoading={trendLoading}
            trendError={trendError}
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
          />
          <ExecutionHealthGauge overview={overview} />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.5fr] gap-3 shrink-0" style={{ minHeight: '180px', maxHeight: '220px' }}>
          <IntegrationStatus overview={overview} />
          <RecentWorkflows overview={overview} />
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === "dashboard") return renderDashboard();
    if (activeTab === "automations") {
      return (
        <div className="rounded-2xl border border-[#2a3525]/60 bg-[#111611] p-6">
          <h2 className="text-2xl font-semibold text-[#f0f0e8]">Automations</h2>
          <p className="mt-2 text-[#6a7560]">Your workflows list.</p>
          <div className="mt-6"><WorkflowListView showTitle={false} showCreateButton={false} /></div>
        </div>
      );
    }
    if (activeTab === "profile") return <PlaceholderPanel title="Profile" description="Profile panel coming in next phase." />;
    if (activeTab === "executions") return <PlaceholderPanel title="Executions" description="Executions panel coming soon." />;
    return <PlaceholderPanel title="Integrations" description="Integrations management coming soon." />;
  };

  return (
    <div className="dark h-full lg:overflow-hidden bg-[#0a0d0a] text-[#f0f0e8] flex">
      {/* Sidebar */}
      <SidebarProvider>
        <DashboardSidebar activeTab={activeTab} onTabChange={setTab} onRefresh={handleRefresh} />


        {/* Main Content */}
        <SidebarInset className="flex-1 flex flex-col min-h-0 min-w-0 bg-transparent">
          {/* Top Bar */}
          <header className="shrink-0 px-6 py-4 flex items-center gap-4 border-b border-[#2a3525]/30">
            <SidebarTrigger className="-ml-1 text-[#5a6350] hover:text-[#baf266]" />
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-[#f0f0e8]">
                  Welcome back, {user.name || "User"} 👋
                </h1>
                <p className="text-xs text-[#5a6350] mt-0.5">
                  Here&apos;s a quick summary of your automation workflows today.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEnableCreateButton(true) }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#141a14] border border-[#2a3525]/60 text-sm font-medium text-[#c8d4a8] hover:border-[#baf266]/30 hover:text-[#baf266] transition-all"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  Create Workflow
                </button>

              </div>
            </div>
          </header>

          {/* Mobile tabs */}
          <div className="flex gap-1 px-4 pt-3 md:hidden overflow-x-auto shrink-0">
            {DASHBOARD_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap ${activeTab === tab
                  ? "bg-[#baf266]/15 text-[#baf266] border border-[#baf266]/25"
                  : "text-[#5a6350] border border-transparent"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col">
            {renderContent()}
          </div>
          {enableCreateButton && (
            <CardDemo onClose={() => setEnableCreateButton(false)} />
          )}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
