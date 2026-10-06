"use client";

import Link from "next/link";
import WorkflowListView from "@/app/components/workflows/WorkflowListView";
import { ArrowLeft, Workflow } from "lucide-react";

export default function UserWorkflowsPage() {
  return (
    <div className="min-h-screen bg-[#0e0f11] text-[#f9fafb] flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-[#1e1f23] bg-[#0e0f11]/80 backdrop-blur-md px-8 py-5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#9ca3af] hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-[#1e2025]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-[#2a2c33]" />
            <div className="flex items-center gap-2.5">
              <Workflow className="h-5 w-5 text-indigo-400" />
              <span className="text-sm font-bold text-white">All Automations</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        <WorkflowListView title="Your Automation Workflows" showTitle={true} showCreateButton={true} />
      </main>
    </div>
  );
}