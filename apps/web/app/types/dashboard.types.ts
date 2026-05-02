export type DashboardTab =
  | "profile"
  | "dashboard"
  | "automations"
  | "executions"
  | "integrations";

export type DashboardRange = "7d" | "30d" | "90d";

export interface DashboardIntegration {
  key: "gmail" | "googleSheets";
  label: string;
  connected: boolean;
}

export interface DashboardRecentWorkflow {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  status?: string | null;
}

export interface DashboardOverview {
  workflowCount: number;
  executionCount: number;
  failedRate: number;
  successRate: number;
  executionQuota: number;
  remainingExecutions: number;
  integrations: DashboardIntegration[];
  recentWorkflows: DashboardRecentWorkflow[];
}

export interface DashboardTrendPoint {
  date: string;
  total: number;
  completed: number;
  failed: number;
  inFlight: number;
}

export interface DashboardTrendTotals {
  total: number;
  completed: number;
  failed: number;
  inFlight: number;
}

export interface DashboardExecutionTrend {
  range: DashboardRange;
  points: DashboardTrendPoint[];
  totals: DashboardTrendTotals;
}
