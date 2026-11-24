"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { NodeIcon } from "@/app/components/ui/NodeIcon";
import { getNodeConfig } from "@/app/lib/nodeConfigs";
import { Settings, Trash2, RefreshCw, Plus, Play, Check } from "lucide-react";

interface BaseNodeProps {
  id: string;
  type: string;
  data: {
    label: string;
    icon?: string;
    isPlaceholder?: boolean;
    config: any;
    nodeType?: "trigger" | "action";
    isConfigured?: boolean;
    status?: "idle" | "running" | "success" | "error";
    executionStatus?: "running" | "completed" | "failed" | "skipped" | null;
    onConfigure?: () => void;
    onTest?: () => void;
    onAddChild?: (sourceHandleId?: string) => void;
    onDelete?: () => void;
    onReplace?: () => void;
  };
}

// Pastel style mapper matching Make.com (photo_2026-02-14_11-35-22.jpg)
function getNodeTheme(name: string, isTrigger: boolean) {
  const lower = name.toLowerCase();
  if (lower.includes("sheet") || lower.includes("drive")) {
    return {
      iconBg: "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400",
      badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
      accent: "text-emerald-400",
      handle: "!bg-emerald-500",
    };
  }
  if (lower.includes("mail") || lower.includes("gmail") || lower.includes("webhook")) {
    return {
      iconBg: "bg-rose-500/15 border border-rose-500/30 text-rose-400",
      badge: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
      accent: "text-rose-400",
      handle: "!bg-rose-500",
    };
  }
  if (lower.includes("slack") || lower.includes("http") || lower.includes("api") || lower.includes("request")) {
    return {
      iconBg: "bg-sky-500/15 border border-sky-500/30 text-sky-400",
      badge: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
      accent: "text-sky-400",
      handle: "!bg-sky-500",
    };
  }
  if (lower.includes("if") || lower.includes("canva") || lower.includes("logic")) {
    return {
      iconBg: "bg-purple-500/15 border border-purple-500/30 text-purple-400",
      badge: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
      accent: "text-purple-400",
      handle: "!bg-purple-500",
    };
  }
  if (lower.includes("filter") || lower.includes("iterator") || lower.includes("loop")) {
    return {
      iconBg: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
      badge: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
      accent: "text-amber-400",
      handle: "!bg-amber-500",
    };
  }
  if (lower.includes("notion")) {
    return {
      iconBg: "bg-white/10 border border-white/20 text-white",
      badge: "bg-white/10 text-white/90 border border-white/20",
      accent: "text-white",
      handle: "!bg-zinc-700",
    };
  }

  // Default clean dark card theme
  return {
    iconBg: "bg-white/10 border border-white/10 text-white",
    badge: "bg-white/10 text-white/80 border border-white/15",
    accent: "text-white",
    handle: "!bg-primary",
  };
}

export default function BaseNode({ id, type, data }: BaseNodeProps) {
  const {
    label,
    icon,
    isPlaceholder,
    config,
    onConfigure,
    onAddChild,
    onTest,
    nodeType,
    onDelete,
    onReplace,
    isConfigured,
    executionStatus,
  } = data;

  const isTrigger = nodeType === "trigger";
  const theme = getNodeTheme(label, isTrigger);

  const currentStatus = executionStatus || data.status;
  const statusRing =
    currentStatus === "running"
      ? "border-primary ring-4 ring-primary/40 shadow-[0_0_25px_rgba(59,130,246,0.5)] animate-pulse"
      : currentStatus === "completed" || currentStatus === "success"
        ? "border-success ring-2 ring-success/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        : currentStatus === "failed" || currentStatus === "error"
          ? "border-destructive ring-2 ring-destructive/40 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
          : currentStatus === "skipped"
            ? "border-white/20 opacity-50 grayscale-[50%]"
            : "border-white/10 hover:border-primary/50";

  // ── Placeholder Node (Make.com Style) ──
  if (isPlaceholder) {
    return (
      <div
        onClick={onConfigure}
        className="group w-[160px] p-5 rounded-3xl bg-chassis text-chassis-foreground border-2 border-dashed border-white/20 hover:border-primary/60 hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col items-center gap-2.5 select-none"
      >
        <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm">
          <Plus className="w-5 h-5" />
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-chassis-foreground">
            {label}
          </p>
          <span className="text-[10px] text-chassis-foreground/60 mt-0.5 block">Click to setup</span>
        </div>

        {/* Handles */}
        {nodeType === "action" ? (
          <>
            <Handle
              type="target"
              position={Position.Left}
              id="a-in"
              className="!w-3 !h-3 !bg-primary !border-2 !border-chassis hover:!scale-125 transition-transform"
            />
            <Handle
              type="source"
              position={Position.Right}
              id="a-out"
              className="!w-3 !h-3 !bg-primary !border-2 !border-chassis hover:!scale-125 transition-transform"
            />
          </>
        ) : (
          <Handle
            type="source"
            position={Position.Right}
            id="t-out"
            className="!w-3 !h-3 !bg-primary !border-2 !border-chassis"
          />
        )}
      </div>
    );
  }

  // ── Configured Visual Node Card (Dark Elevated Theme) ──
  return (
    <div
      className={`min-w-[200px] max-w-[250px] rounded-3xl border-2 p-4 shadow-2xl hover:shadow-[0_0_30px_rgba(0,0,0,0.6)] hover:scale-[1.02] transition-all duration-200 relative group select-none bg-chassis text-chassis-foreground ${statusRing}`}
    >
      <div className="flex flex-col items-center text-center">
        {/* Node Icon Container */}
        <div className="mb-2 relative">
          <NodeIcon
            icon={icon}
            name={label}
            size="xl"
            nodeType={nodeType}
            className={`w-14 h-14 rounded-2xl ${theme.iconBg}`}
          />
        </div>

        {/* Node Label */}
        <h4 className="font-extrabold text-sm tracking-tight truncate w-full text-chassis-foreground" title={label}>
          {label}
        </h4>

        {/* Operation / Description */}
        <p className="text-[11px] text-chassis-foreground/70 truncate w-full mt-0.5 font-medium">
          {config?.operation?.replace(/_/g, " ") || (isTrigger ? "Webhook trigger" : "Action step")}
        </p>

        {/* Configured Status Pill */}
        <div className="mt-2.5 flex items-center justify-center">
          {isConfigured ? (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/80 border border-white/15 shadow-xs"
            >
              <Check className="h-3 w-3 text-white/70" />
              <span>Ready</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-chassis-foreground/60 border border-dashed border-white/15">
              <span>Setup needed</span>
            </span>
          )}
        </div>

        {/* Quick Action Buttons on Hover */}
        <div className="flex items-center justify-center gap-1 pt-3 mt-3 border-t border-white/10 w-full">
          {onConfigure && (
            <button
              type="button"
              onClick={onConfigure}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors shadow-xs cursor-pointer"
              title="Configure Node"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}

          {onTest && (
            <button
              type="button"
              onClick={onTest}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors shadow-xs cursor-pointer"
              title="Test Node"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          {onReplace && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReplace();
              }}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors shadow-xs cursor-pointer"
              title="Replace Node"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 transition-colors shadow-xs cursor-pointer"
              title="Delete Node"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── ReactFlow Handles ── */}
      {nodeType === "action" ? (
        <>
          {/* Target Handle (Left) */}
          <Handle
            type="target"
            position={Position.Left}
            id="a-in"
            className="!w-4 !h-4 !bg-primary !border-2 !border-chassis hover:!scale-125 transition-transform cursor-crosshair shadow-md"
          />

          {/* Dynamic Source Handles (Right) */}
          {(() => {
            const nodeConfigDef = getNodeConfig(label);
            let resolvedOutputs;
            if (!resolvedOutputs && nodeConfigDef?.outputs) {
              resolvedOutputs = nodeConfigDef.outputs;
            }

            if (!resolvedOutputs && nodeConfigDef) {
              const operationField = nodeConfigDef.fields?.find((f: any) => f.name === "operation");
              if (operationField && operationField.options) {
                const selectedOpId = config?.operation || operationField.defaultValue;
                const selectedOp = operationField.options.find((o: any) => o.id === selectedOpId);
                if (selectedOp && selectedOp.outputs) {
                  resolvedOutputs = selectedOp.outputs;
                }
              }
            }

            const outputs = resolvedOutputs || [{ id: "out-0", label: "Output" }];

            return outputs.map((output: any, index: number) => {
              const topPosition = `${((index + 1) * 100) / (outputs.length + 1)}%`;
              const isAlternative = output.id === "out-1";

              return (
                <div key={output.id} className="group/handle">
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={output.id}
                    style={{ top: topPosition }}
                    className={`!w-5 !h-5 flex items-center justify-center !border-2 !border-chassis transition-all cursor-crosshair shadow-md z-20 ${isAlternative
                        ? "!bg-rose-500 !text-white"
                        : "!bg-primary !text-primary-foreground"
                      }`}
                    title={`${output.label} (${output.id})`}
                  >
                    {onAddChild && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddChild(output.id);
                        }}
                        className="w-full h-full flex items-center justify-center font-bold z-30 leading-none pb-[1px] cursor-pointer text-white"
                        style={{ fontSize: "12px" }}
                        title={`Add node from ${output.label}`}
                      >
                        +
                      </button>
                    )}
                  </Handle>

                  {/* Output Label Tag */}
                  <div
                    className="absolute pointer-events-none flex items-center gap-1 z-30"
                    style={{
                      top: topPosition,
                      right: "-12px",
                      transform: "translate(100%, -50%)",
                    }}
                  >
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-md whitespace-nowrap opacity-80 group-hover/handle:opacity-100 transition-opacity ${isAlternative
                          ? "bg-rose-950/90 text-rose-300 border-rose-500/40"
                          : "bg-chassis text-chassis-foreground border-white/20"
                        }`}
                    >
                      {output.label}
                    </span>
                  </div>
                </div>
              );
            });
          })()}
        </>
      ) : (
        /* Trigger Node Source Handle (Right) */
        <div className="group/handle">
          <Handle
            type="source"
            position={Position.Right}
            id="t-out"
            className="!w-5 !h-5 flex items-center justify-center !bg-primary !text-primary-foreground !border-2 !border-chassis hover:!scale-125 transition-all cursor-crosshair shadow-md z-20"
          >
            {onAddChild && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild("t-out");
                }}
                className="w-full h-full flex items-center justify-center text-primary-foreground font-bold z-30 leading-none pb-[1px] cursor-pointer"
                style={{ fontSize: "12px" }}
                title="Add action node"
              >
                +
              </button>
            )}
          </Handle>
        </div>
      )}
    </div>
  );
}
