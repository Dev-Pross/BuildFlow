"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Workflow,
  Activity,
  CheckCircle2,
  XCircle,
  Zap,
  User,
  Clock,
  Database,
  Boxes,
  Menu,
  LayoutGrid,
  LocateIcon,
  Pin,
  PinOff,
  LocateOffIcon,
  Map,
  MapPin
} from "lucide-react";
import { api } from "@/app/lib/api";
import { BACKEND_URL } from "@repo/common/zod";
import { useAppSelector } from "@/app/hooks/redux";
import {
  DashboardExecutionTrend,
  DashboardOverview,
  DashboardRange,
  DashboardTab,
} from "@/app/types/dashboard.types";
import WorkflowListView from "@/app/components/workflows/WorkflowListView";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import WorkflowActivityChart from "../components/dashboard/WorkflowActivityChart";
import ExecutionHealthGauge from "../components/dashboard/ExecutionHealthGauge";
import IntegrationStatus from "../components/dashboard/IntegrationStatus";
import RecentWorkflows from "../components/dashboard/RecentWorkflows";
import { CardDemo } from "../components/ui/Design/WorkflowCard";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { useSession, signOut } from "next-auth/react";

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
  const { data: session } = useSession();

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
  const [geo, setGeo] = useState<{ city: string; country: string; provider: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/geo")
      .then((res) => res.json())
      .then((data) => setGeo(data))
      .catch(() => { });
  }, []);

  const initialTab = useMemo(() => {
    const p = searchParams.get("tab");
    return isDashboardTab(p) ? p : "dashboard";
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const setTab = (tab: DashboardTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
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

  // ─── Home View (Matching Reference Photo) ───
  const renderHome = () => {
    return (
      <div className="flex flex-col gap-8 pb-8">
        {/* Welcome & Quick Actions Hero (Tokenized Chassis Card) */}
        <section className="relative rounded-3xl overflow-hidden bg-chassis text-chassis-foreground border border-border/30 p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8 shadow-2xl">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <div className="absolute -left-[10%] top-0 w-[450px] h-[450px] bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--primary)_15%,transparent)_0%,transparent_70%)] blur-2xl" />
          </div>

          <div className="relative z-10 max-w-xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-chassis-foreground tracking-tight mb-2 sm:mb-3">
              Welcome to Build<span className="text-primary">Flow</span>
            </h2>
            <p className="text-chassis-foreground/70 text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8">
              Your centralized command center for visual automations. Build multi-step workflows, connect your favorite apps, and monitor live execution metrics in real-time.
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setEnableCreateButton(true)}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-primary hover:bg-primary-hover active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-ring text-primary-foreground text-xs sm:text-sm font-bold transition-all shadow-lg cursor-pointer"
              >
                <Plus className="h-4 sm:h-5 w-4 sm:w-5" />
                <span>Create Workflow</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("integrations")}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-ring text-chassis-foreground text-xs sm:text-sm font-semibold transition-all border border-white/10 cursor-pointer shadow-xs"
              >
                <Boxes className="h-4 sm:h-5 w-4 sm:w-5 text-primary" />
                <span>Connect Apps</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Grid inside Hero */}
          <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-4 w-full lg:w-auto shrink-0">
            <div className="bg-white/5 border border-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl flex flex-col items-center justify-center text-center w-full sm:w-36 shadow-xs">
              <Activity className="h-5 sm:h-6 w-5 sm:w-6 text-primary mb-2" />
              <div className="text-xl sm:text-2xl font-black text-chassis-foreground">{overview ? overview.workflowCount : "0"}</div>
              <div className="text-xs text-chassis-foreground/70 uppercase tracking-wider font-semibold mt-1">Active Flows</div>
            </div>
            <div className="bg-white/5 border border-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl flex flex-col items-center justify-center text-center w-full sm:w-36 shadow-xs">
              <Zap className="h-5 sm:h-6 w-5 sm:w-6 text-primary mb-2" />
              <div className="text-xl sm:text-2xl font-black text-chassis-foreground">{overview ? overview.executionCount : "0"}</div>
              <div className="text-xs text-chassis-foreground/70 uppercase tracking-wider font-semibold mt-1">Executions</div>
            </div>
          </div>
        </section>

        {/* Workspace Activity Row: Jump Back In + System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          {/* Left: Jump Back In */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Jump Back In</h3>
              <button
                type="button"
                onClick={() => setTab("automations")}
                className="text-xs sm:text-sm font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
              >
                View all workflows &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(overview?.recentWorkflows || []).slice(0, 4).map((wf) => {
                const rawStatus = (wf as any).executions?.[0]?.status || wf.status;
                const status = rawStatus?.toLowerCase();

                return (
                  <div
                    key={wf.id}
                    onClick={() => router.push(`/workflows/${wf.id}`)}
                    className="p-5 rounded-3xl bg-card border border-border hover:border-primary/50 hover:shadow-md active:scale-[0.99] transition-all cursor-pointer group flex flex-col justify-between min-h-[140px] shadow-card"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-10 h-10 rounded-xl bg-secondary border border-border text-primary flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                        <Workflow className="h-5 w-5" />
                      </div>
                      {status === "completed" || status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-success" />
                          Success
                        </span>
                      ) : status === "failed" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                          Failed
                        </span>
                      ) : status === "inprogress" || status === "running" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          Running
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/60 text-muted-foreground border border-border/50">
                          Never run
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {wf.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">Edited {new Date(wf.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
              {(!overview?.recentWorkflows || overview.recentWorkflows.length === 0) && (
                <div className="col-span-full p-8 rounded-3xl border border-dashed border-border bg-card flex flex-col items-center justify-center text-center shadow-card">
                  <Workflow className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm font-semibold text-foreground">No workflows yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create your first automation to see it here.</p>
                </div>
              )}
            </div>
          </section>

          {/* Right: Quick System Status */}
          <section>
            <h3 className="text-lg font-bold text-foreground mb-5">System Health</h3>
            <div className="p-6 rounded-3xl bg-card border border-border flex flex-col gap-5 h-[calc(100%-48px)] shadow-card">

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">Success Rate</div>
                    <div className="text-xs text-muted-foreground">Last 7 days</div>
                  </div>
                </div>
                <div className="text-lg font-black text-success">
                  {overview ? formatPercent(overview.successRate) : "99.8%"}
                </div>
              </div>

              <div className="h-px w-full bg-border" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">Avg Latency</div>
                    <div className="text-xs text-muted-foreground">Pipeline execution</div>
                  </div>
                </div>
                <div className="text-lg font-black text-primary">
                  14ms
                </div>
              </div>

              <div className="h-px w-full bg-border" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Database className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">Task Usage</div>
                    <div className="text-xs text-muted-foreground">Monthly quota</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-foreground">
                    {overview ? overview.executionCount : 0} / ∞
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
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">All Workflows</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage, run, and wire your visual automation logic</p>
        </div>
        <button
          type="button"
          onClick={() => setEnableCreateButton(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>New Workflow</span>
        </button>
      </div>
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
        <WorkflowListView showTitle={false} showCreateButton={false} />
      </div>
    </div>
  );

  // ─── Executions Tab ───
  const renderExecutions = () => (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Execution Analytics</h2>
          <p className="text-xs text-muted-foreground mt-1">Trace run frequency, latency metrics, and failure rates</p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-secondary border border-border text-foreground hover:bg-muted transition-colors cursor-pointer shadow-xs"
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
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
          <RecentWorkflows overview={overview} />
        </div>
        <IntegrationStatus overview={overview} />
      </div>
    </div>
  );

  // ─── Integrations Tab ───
  const renderIntegrations = () => {
    const list = [
      {
        id: "googleSheets",
        name: "Google Sheets",
        description: "Append rows, update spreadsheets, and read tables automatically.",
        icon: "/google_sheet.svg",
        connected: credentials.some((c: any) =>
          c.type === "gsheet_oauth" ||
          c.type === "googleSheets" ||
          c.type?.toLowerCase().includes("sheet")
        ),
      },
      {
        id: "gmail",
        name: "Gmail API",
        description: "Send automated transactional emails and trigger flows on inbox alerts.",
        icon: "/gmail.svg",
        connected: credentials.some((c: any) =>
          c.type === "gmail_oauth" ||
          c.type === "gmail" ||
          c.type?.toLowerCase().includes("gmail")
        ),
      },
    ];

    return (
      <div className="flex flex-col gap-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Integrations &amp; Connectors</h2>
            <p className="text-xs text-muted-foreground mt-1">Manage API keys, OAuth access tokens, and third-party links</p>
          </div>
          <button
            type="button"
            onClick={fetchCredentials}
            disabled={credsLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-secondary border border-border text-foreground hover:bg-muted transition-colors cursor-pointer shadow-xs disabled:opacity-60"
          >
            {credsLoading ? "Syncing..." : "Refresh"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {list.map((item) => {
            return (
              <div
                key={item.id}
                className="p-6 rounded-3xl bg-secondary/50 border border-border hover:border-primary/40 transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-center p-2.5">
                      <img src={item.icon} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    {item.connected ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-muted-foreground border border-border">
                        <XCircle className="h-3.5 w-3.5" /> Disconnected
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-foreground">{item.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{item.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {item.connected ? "OAuth: Valid & Refreshable" : "Requires Authorization"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!item.connected && (item.id.toLowerCase().includes("google") || item.id === "gmail")) {
                        const authType = item.id === "googleSheets" ? "gsheet_oauth" : (item.id === "gmail" ? "gmail_oauth" : item.id);
                        const token = (session as any)?.accessToken;
                        const tokenParam = token ? `&token=${encodeURIComponent(token)}` : "";
                        window.location.href = `${BACKEND_URL}/auth/google/initiate?authType=${encodeURIComponent(authType)}&redirect_url=${encodeURIComponent("/dashboard")}${tokenParam}`;
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${item.connected
                      ? "bg-secondary border border-border text-foreground hover:bg-muted"
                      : "bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs"
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
    <div className="flex flex-col gap-6 max-w-3xl pb-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Account &amp; Settings</h2>
        <p className="text-xs text-muted-foreground mt-1">Manage user identity, personal workspace, and runtime preferences</p>
      </div>

      <div className="p-6 rounded-3xl bg-secondary/50 border border-border space-y-5 shadow-xs">
        <div className="flex items-center gap-4 pb-5 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-card border border-border text-foreground font-black text-xl flex items-center justify-center shadow-xs overflow-hidden">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || user.name || "User Avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              (session?.user?.name || user.name)?.charAt(0).toUpperCase() || "U"
            )}
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">{session?.user?.name || user.name || "Workspace Builder"}</h3>
            <p className="text-xs text-muted-foreground">{session?.user?.email || user.email || "builder@buildflow.dev"}</p>
            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-success bg-success/10 px-2.5 py-0.5 rounded-full border border-success/20">
              ● Active Account
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-muted-foreground font-medium">User ID</label>
            <div className="p-2.5 rounded-xl bg-card border border-border font-mono text-foreground mt-1 truncate">
              {user.userId || "usr_demo_8829"}
            </div>
          </div>
          <div>
            <label className="text-muted-foreground font-medium">Auth Status</label>
            <div className="p-2.5 rounded-xl bg-card border border-border text-foreground mt-1 font-semibold">
              {user.status || "Authenticated"}
            </div>
          </div>
          <div>
            <label className="text-muted-foreground font-medium flex items-center justify-between">
              <span>Edge Geolocation</span>
              <span className="text-[10px] text-muted-foreground font-normal">{geo?.provider || "Edge"}</span>
            </label>
            <div className="p-2.5 rounded-xl bg-card border border-border text-foreground mt-1 font-semibold flex items-center gap-1.5">
              <span><MapPin /></span>
              <span className="truncate">{geo ? `${geo.city}, ${geo.country}` : "Detecting..."}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Need to sign out from this device?</span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors cursor-pointer"
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
    <div className="h-screen w-full bg-[#070809] flex items-center justify-center p-0 sm:p-2 lg:p-3 overflow-hidden select-none font-sans">
      {/* ── Unified Outer Chassis with Rounded Frame (Clips Sidebar & Envelops Main Container) ── */}
      <div className="w-full h-full max-w-[1720px] bg-chassis text-chassis-foreground rounded-none sm:rounded-3xl lg:rounded-[44px] shadow-2xl flex flex-col lg:flex-row overflow-hidden relative border-0 sm:border border-white/5">
        {/* ── Left Column: Docked Dark Sidebar on Desktop / Drawer on Mobile ── */}
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={setTab}
          onRefresh={handleRefresh}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* ── Right Column: Seamlessly Connected Main Panel ── */}
        <main className="flex-1 min-w-0 bg-workspace text-workspace-foreground rounded-none sm:rounded-2xl lg:rounded-[36px] my-0 mr-0 sm:my-2 sm:mr-2 lg:my-3 lg:mr-3 p-4 sm:p-6 lg:p-8 flex flex-col overflow-y-auto no-scrollbar shadow-2xl relative z-10 border-0">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 shrink-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 rounded-2xl bg-secondary text-foreground hover:bg-muted flex items-center justify-center transition-colors shadow-xs cursor-pointer shrink-0 border border-border"
              aria-label="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Spacer: allows left hamburger and right action cluster to anchor cleanly */}
            <div className="flex-1" />

            {/* Right Action Icons Cluster */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {geo && (
                <div
                  className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary border border-border/60 text-xs font-semibold text-muted-foreground shadow-xs"
                  title={`Detected via ${geo.provider}`}
                >
                  <span className="text-xs"><MapPin /></span>
                  <span className="max-w-[120px] truncate">{geo.city}, {geo.country}</span>
                </div>
              )}

              {/* Shared Theme Toggle */}
              <ThemeToggle />

              {/* Profile Avatar Button */}
              <button
                onClick={() => setTab("profile")}
                className="w-9 h-9 rounded-full bg-secondary hover:bg-muted flex items-center justify-center text-foreground transition-colors shadow-xs cursor-pointer overflow-hidden border border-border shrink-0"
                title="Profile Settings"
                type="button"
              >
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
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
