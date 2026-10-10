"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LucideBadgeCheck,
  LucideTimer,
  Plus,
  RefreshCcwDot,
  Workflow,
  Shield,
  Activity,
  UserCheck,
  ExternalLink,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Mail,
  Zap,
  Globe,
  Sparkles,
  Search,
  User,
  MoreHorizontal,
  ChevronRight,
  Play,
  Sliders,
  Bell,
  Code,
  Layers,
  Database,
  Cpu,
  LayoutGrid,
  Boxes,
  Clock
} from "lucide-react";
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
import { CardDemo } from "../components/ui/Design/WorkflowCard";

const DASHBOARD_TABS: DashboardTab[] = [
  "dashboard",
  "automations",
  "executions",
  "integrations",
  "profile",
];

const isDashboardTab = (v: string | null): v is DashboardTab =>
  DASHBOARD_TABS.includes(v as DashboardTab);

const formatPercent = (v: number) => `${v.toFixed(1)}%`;

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppSelector((state) => state.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRange, setSelectedRange] = useState<DashboardRange>("7d");
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [trend, setTrend] = useState<DashboardExecutionTrend | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [credsLoading, setCredsLoading] = useState(false);
  const [enableCreateButton, setEnableCreateButton] = useState(false);

  const activeTab: DashboardTab = useMemo(() => {
    const p = searchParams.get("tab");
    return isDashboardTab(p) ? p : "dashboard";
  }, [searchParams]);

  const setTab = (tab: DashboardTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/dashboard?${params.toString()}`);
  };

  const fetchOverview = async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const data = await api.dashboard.getOverview();
      setOverview(data);
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
      const data = await api.dashboard.getExecutionTrend(range);
      setTrend(data);
    } catch (e: any) {
      setTrendError(e?.message || "Failed to load trend");
    } finally {
      setTrendLoading(false);
    }
  };

  const fetchCredentials = async () => {
    setCredsLoading(true);
    try {
      const res = await api.Credentials.getAllCreds();
      if (res?.data?.data) {
        setCredentials(res.data.data);
      }
    } catch {
      // Non-blocking
    } finally {
      setCredsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchCredentials();
  }, []);

  useEffect(() => {
    fetchTrend(selectedRange);
  }, [selectedRange]);

  const handleRefresh = () => {
    fetchOverview();
    fetchTrend(selectedRange);
    fetchCredentials();
  };

  // ─── Home View (Workflow Automation Platform) ───
  const renderHome = () => {
    return (
      <div className="flex flex-col gap-8 pb-4">
        {/* Welcome & Quick Actions Hero */}
        <section className="relative rounded-[32px] overflow-hidden bg-zinc-950 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          {/* Background Ambient Glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -left-[10%] top-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_60%)] blur-2xl" />
            <div className="absolute -right-[10%] -bottom-[20%] w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15)_0%,transparent_60%)] blur-2xl" />
          </div>

          <div className="relative z-10 max-w-xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
              Welcome to Build<span className="text-indigo-400">Flow</span>
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              Your centralized command center for visual automations. Build multi-step workflows, connect your favorite apps, and monitor live execution metrics in real-time.
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setEnableCreateButton(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-black font-bold hover:bg-zinc-100 transition-colors shadow-lg cursor-pointer"
              >
                <Plus className="h-5 w-5" />
                <span>Create Workflow</span>
              </button>
              <button
                onClick={() => setTab("integrations")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-800/80 text-white font-semibold hover:bg-zinc-800 transition-colors border border-zinc-700/50 cursor-pointer"
              >
                <Boxes className="h-5 w-5 text-indigo-400" />
                <span>Connect Apps</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Grid inside Hero */}
          <div className="relative z-10 grid grid-cols-2 gap-4 w-full md:w-auto shrink-0">
            <div className="bg-zinc-900/50 border border-zinc-800 backdrop-blur-md p-5 rounded-2xl flex flex-col items-center justify-center text-center w-36">
              <Activity className="h-6 w-6 text-emerald-400 mb-2" />
              <div className="text-2xl font-black text-white">{overview ? overview.workflowCount : "3"}</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mt-1">Active Flows</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 backdrop-blur-md p-5 rounded-2xl flex flex-col items-center justify-center text-center w-36">
              <Zap className="h-6 w-6 text-amber-400 mb-2" />
              <div className="text-2xl font-black text-white">{overview ? overview.executionCount : "1.2k"}</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mt-1">Executions</div>
            </div>
          </div>
        </section>

        {/* Workspace Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          {/* Left: Jump Back In (Recent Workflows as Cards) */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-zinc-950">Jump Back In</h3>
              <button
                onClick={() => setTab("automations")}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                View all workflows &rarr;
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(overview?.recentWorkflows || []).slice(0, 4).map((wf, idx) => {
                const gradients = [
                  "from-blue-500/10 to-indigo-500/10 border-indigo-200 text-indigo-700",
                  "from-emerald-500/10 to-teal-500/10 border-teal-200 text-teal-700",
                  "from-purple-500/10 to-fuchsia-500/10 border-fuchsia-200 text-fuchsia-700",
                  "from-amber-500/10 to-orange-500/10 border-orange-200 text-orange-700"
                ];
                const theme = gradients[idx % gradients.length];
                const isLive = wf.status?.toLowerCase() === "active";

                return (
                  <div
                    key={wf.id}
                    onClick={() => router.push("/workflows")}
                    className="p-5 rounded-3xl bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center border shadow-sm ${theme}`}>
                        <Workflow className="h-5 w-5" />
                      </div>
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-200 text-zinc-600 uppercase tracking-wider">
                          Draft
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {wf.name}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-1">Edited {new Date(wf.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
              {(!overview?.recentWorkflows || overview.recentWorkflows.length === 0) && (
                <div className="col-span-full p-8 rounded-3xl border border-dashed border-zinc-300 flex flex-col items-center justify-center text-center">
                  <Workflow className="h-8 w-8 text-zinc-300 mb-3" />
                  <p className="text-sm font-semibold text-zinc-600">No workflows yet</p>
                  <p className="text-xs text-zinc-500 mt-1">Create your first automation to see it here.</p>
                </div>
              )}
            </div>
          </section>

          {/* Right: Quick System Status */}
          <section>
            <h3 className="text-lg font-bold text-zinc-950 mb-5">System Health</h3>
            <div className="p-6 rounded-3xl bg-zinc-50 border border-zinc-200 flex flex-col gap-5 h-[calc(100%-48px)]">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900">Success Rate</div>
                    <div className="text-xs text-zinc-500">Last 7 days</div>
                  </div>
                </div>
                <div className="text-lg font-black text-emerald-600">
                  {overview ? formatPercent(overview.successRate) : "99.8%"}
                </div>
              </div>

              <div className="h-px w-full bg-zinc-200" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900">Avg Latency</div>
                    <div className="text-xs text-zinc-500">Pipeline execution</div>
                  </div>
                </div>
                <div className="text-lg font-black text-indigo-600">
                  14ms
                </div>
              </div>

              <div className="h-px w-full bg-zinc-200" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Database className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900">Task Usage</div>
                    <div className="text-xs text-zinc-500">Monthly quota</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-zinc-900">
                    {overview ? overview.executionCount : "1.2k"} / {overview ? overview.executionQuota : "10k"}
                  </div>
                </div>
              </div>

            </div>
          </section>
        </div>
      </div>
    );
  };

  // ─── Workflows Tab ───
  const renderWorkflows = () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">All Workflows</h2>
          <p className="text-xs text-zinc-500 mt-1">Manage, run, and wire your visual automation logic</p>
        </div>
        <button
          onClick={() => setEnableCreateButton(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>New Workflow</span>
        </button>
      </div>
      <div className="rounded-3xl border border-zinc-200 bg-zinc-50/50 p-6 shadow-sm">
        <WorkflowListView showTitle={false} showCreateButton={false} />
      </div>
    </div>
  );

  // ─── Progress / Executions Tab ───
  const renderExecutions = () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">Execution Analytics</h2>
          <p className="text-xs text-zinc-500 mt-1">Trace run frequency, latency metrics, and failure rates</p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
        >
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6 min-h-[440px]">
        <WorkflowActivityChart
          trend={trend}
          trendLoading={trendLoading}
          trendError={trendError}
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
        />
        <ExecutionHealthGauge overview={overview} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50/50 p-6 shadow-sm">
          <RecentWorkflows overview={overview} />
        </div>
        <IntegrationStatus overview={overview} />
      </div>
    </div>
  );

  // ─── Messages / Integrations Tab ───
  const renderIntegrations = () => {
    const list = [
      {
        id: "googleSheets",
        name: "Google Sheets",
        description: "Append rows, update spreadsheets, and read tables automatically.",
        icon: "/google_sheet.svg",
        color: "text-emerald-500",
        connected: credentials.some((c) => c.provider === "googleSheets" || c.name?.includes("Sheets")),
      },
      {
        id: "gmail",
        name: "Gmail API",
        description: "Send automated transactional emails and trigger flows on inbox alerts.",
        icon: "/gmail.svg",
        color: "text-rose-500",
        connected: credentials.some((c) => c.provider === "gmail" || c.name?.includes("Gmail")),
      },
      {
        id: "webhook",
        name: "Catch Webhooks",
        description: "Receive incoming HTTP JSON payloads from Stripe, Shopify, or GitHub.",
        icon: "/webhook.svg",
        color: "text-amber-500",
        connected: true,
      },
      {
        id: "http",
        name: "Custom REST APIs",
        description: "Call external APIs with custom authorization headers and query payloads.",
        icon: "/globe.png",
        color: "text-cyan-500",
        connected: true,
      },
    ];

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">Integrations &amp; Connectors</h2>
            <p className="text-xs text-zinc-500 mt-1">Manage API keys, OAuth access tokens, and third-party links</p>
          </div>
          <button
            onClick={fetchCredentials}
            disabled={credsLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            {credsLoading ? "Syncing..." : "Refresh"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {list.map((item) => {
            return (
              <div
                key={item.id}
                className="p-6 rounded-3xl bg-zinc-50 border border-zinc-200 hover:border-zinc-400 transition-all flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center p-2.5">
                      <img src={item.icon} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    {item.connected ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-200/80 text-zinc-600 border border-zinc-300">
                        <XCircle className="h-3.5 w-3.5" /> Disconnected
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-zinc-900">{item.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">{item.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-200 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">
                    {item.connected ? "Token: Valid & Refreshable" : "Requires Authorization"}
                  </span>
                  <button
                    onClick={() => {
                      if (!item.connected && item.id.includes("google")) {
                        window.location.href = `${api.workflows ? "http://localhost:3002" : ""}/auth/google/initiate`;
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      item.connected
                        ? "bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                        : "bg-zinc-950 text-white hover:bg-zinc-800 shadow-sm"
                    }`}
                  >
                    {item.connected ? "Configure" : "Connect"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Settings Tab ───
  const renderSettings = () => (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">Account &amp; Settings</h2>
        <p className="text-xs text-zinc-500 mt-1">Manage user credentials, personal workspace, and API preferences</p>
      </div>

      <div className="p-6 rounded-3xl bg-zinc-50 border border-zinc-200 space-y-5 shadow-sm">
        <div className="flex items-center gap-4 pb-5 border-b border-zinc-200">
          <div className="w-16 h-16 rounded-full bg-zinc-900 text-white font-black text-xl flex items-center justify-center shadow-md">
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h3 className="font-bold text-base text-zinc-900">{user.name || "Workspace Builder"}</h3>
            <p className="text-xs text-zinc-500">{user.email || "builder@buildflow.dev"}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ● Active Account
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-zinc-500 font-medium">User ID</label>
            <div className="p-2.5 rounded-xl bg-white border border-zinc-200 font-mono text-zinc-800 mt-1">
              {user.userId || "usr_demo_8829"}
            </div>
          </div>
          <div>
            <label className="text-zinc-500 font-medium">Auth Status</label>
            <div className="p-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-800 mt-1">
              {user.status || "Authenticated"}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-200 flex items-center justify-between">
          <span className="text-xs text-zinc-500">Need to sign out from this device?</span>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderHome();
      case "automations":
        return renderWorkflows();
      case "executions":
        return renderExecutions();
      case "integrations":
        return renderIntegrations();
      case "profile":
        return renderSettings();
      default:
        return renderHome();
    }
  };

  return (
    <div className="min-h-screen bg-[#070809] text-white flex items-center justify-center p-2 sm:p-4 lg:p-6 antialiased font-sans">
      {/* ── Giant Unified Container (matching EduTer photo_2026-10-06_20-55-04.jpg) ── */}
      <div className="w-full max-w-[1640px] h-[calc(100vh-24px)] min-h-[820px] bg-[#0c0d0e] rounded-[44px] shadow-2xl flex flex-row overflow-hidden border border-zinc-800/40 relative">
        {/* Left Column: Fixed Dark Sidebar with Blended Concave Tab */}
        <DashboardSidebar activeTab={activeTab} onTabChange={setTab} onRefresh={handleRefresh} />

        {/* Right Column: Seamless White Panel */}
        <main className="flex-1 min-w-0 bg-white text-zinc-900 rounded-[38px] my-3 mr-3 p-5 sm:p-6 lg:p-8 flex flex-col overflow-y-auto shadow-2xl relative z-10">
          {/* Top Bar matching photo: Pill search input + profile + action buttons */}
          <div className="flex items-center justify-between gap-4 mb-8 shrink-0">
            {/* Search Input Container */}
            <div className="flex-1 max-w-xl flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#f4f4f5] border border-transparent focus-within:border-zinc-300 transition-all">
              <Search className="h-4 w-4 text-zinc-400 shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-zinc-900 placeholder:text-zinc-400 w-full font-medium"
              />
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTab("profile")}
                className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-700 transition-colors shadow-sm cursor-pointer"
                title="Profile"
                type="button"
              >
                <User className="h-4 w-4" />
              </button>

              <button
                onClick={() => setEnableCreateButton(true)}
                className="w-10 h-10 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white flex items-center justify-center transition-colors shadow-md cursor-pointer"
                title="New Action"
                type="button"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Dynamic Tab Content Area */}
          <div className="flex-1 min-h-0">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Create Workflow Modal */}
      {enableCreateButton && (
        <CardDemo onClose={() => setEnableCreateButton(false)} />
      )}
    </div>
  );
}
