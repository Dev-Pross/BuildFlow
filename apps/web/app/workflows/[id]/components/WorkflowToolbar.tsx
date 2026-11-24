"use client";

import React from "react";
import {
  Play,
  Save,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  Check,
  RefreshCw,
  Loader2,
  Activity
} from "lucide-react";

interface WorkflowToolbarProps {
  onExecute: () => void;
  isExecuting?: boolean;
  onSave: () => void;
  saveStatus?: string;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onExport?: () => void;
  onToggleHistory?: () => void;
  hasUnsavedChanges?: boolean;
}

export function WorkflowToolbar({
  onExecute,
  isExecuting = false,
  onSave,
  saveStatus = "Saved",
  onZoomIn,
  onZoomOut,
  onFitView,
  onExport,
  onToggleHistory,
  hasUnsavedChanges = false,
}: WorkflowToolbarProps) {
  const isSaving = saveStatus.toLowerCase().includes("saving");
  const isSaved = saveStatus.toLowerCase().includes("saved") && !hasUnsavedChanges;

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-2 bg-chassis/95 text-chassis-foreground backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/30 select-none">
      {/* ── Run / Execute Workflow Button ── */}
      <button
        type="button"
        onClick={onExecute}
        disabled={isExecuting}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 shadow-md cursor-pointer shrink-0"
        title="Execute Workflow Test Run"
      >
        {isExecuting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Running...</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run once</span>
          </>
        )}
      </button>

      <div className="h-5 w-px bg-white/10 mx-0.5" />

      {/* ── Save / Status Button ── */}
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
          isSaving
            ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
            : isSaved
            ? "text-chassis-foreground/80 hover:text-chassis-foreground hover:bg-white/10"
            : "text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20"
        }`}
        title="Save Workflow Sync State"
      >
        {isSaving ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : isSaved ? (
          <Check className="w-3.5 h-3.5 text-success" />
        ) : (
          <Save className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">{saveStatus}</span>
      </button>

      {/* ── Zoom Controls ── */}
      {(onZoomIn || onZoomOut || onFitView) && (
        <>
          <div className="h-5 w-px bg-white/10 mx-0.5" />

          {onZoomOut && (
            <button
              type="button"
              onClick={onZoomOut}
              className="p-2 rounded-full text-chassis-foreground/70 hover:text-chassis-foreground hover:bg-white/10 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          )}

          {onZoomIn && (
            <button
              type="button"
              onClick={onZoomIn}
              className="p-2 rounded-full text-chassis-foreground/70 hover:text-chassis-foreground hover:bg-white/10 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          )}

          {onFitView && (
            <button
              type="button"
              onClick={onFitView}
              className="p-2 rounded-full text-chassis-foreground/70 hover:text-chassis-foreground hover:bg-white/10 transition-colors cursor-pointer"
              title="Fit View"
            >
              <Maximize className="w-4 h-4" />
            </button>
          )}
        </>
      )}

      {/* ── Toggle History Drawer ── */}
      {onToggleHistory && (
        <>
          <div className="h-5 w-px bg-white/10 mx-0.5" />
          <button
            type="button"
            onClick={onToggleHistory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-chassis-foreground/70 hover:text-chassis-foreground hover:bg-white/10 transition-colors cursor-pointer"
            title="Toggle Executions Logs"
          >
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span className="hidden md:inline">Logs</span>
          </button>
        </>
      )}
    </div>
  );
}

export default WorkflowToolbar;
