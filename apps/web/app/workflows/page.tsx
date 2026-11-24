"use client";

import Link from "next/link";
import WorkflowListView from "@/app/components/workflows/WorkflowListView";
import { ArrowLeft, Workflow } from "lucide-react";
import { ThemeToggle } from "@/app/components/ui/ThemeToggle";

export default function UserWorkflowsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-border bg-background/85 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-xl hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <Workflow className="h-4 sm:h-5 w-4 sm:w-5 text-primary" />
              <span className="text-xs sm:text-sm font-bold text-foreground">All Automations</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        <WorkflowListView title="Your Automation Workflows" showTitle={true} showCreateButton={true} />
      </main>
    </div>
  );
}
