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
      cardBg: "bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46]",
      iconBg: "bg-white shadow-sm",
      badge: "bg-emerald-100/80 text-emerald-800 border-emerald-200",
      accent: "text-emerald-700",
      handle: "!bg-emerald-500",
    };
  }
  if (lower.includes("mail") || lower.includes("gmail") || lower.includes("webhook")) {
    return {
      cardBg: "bg-[#fdf2f8] border-[#fbcfe8] text-[#9d174d]",
      iconBg: "bg-white shadow-sm",
      badge: "bg-pink-100/80 text-pink-800 border-pink-200",
      accent: "text-pink-700",
      handle: "!bg-pink-500",
    };
  }
  if (lower.includes("slack") || lower.includes("http") || lower.includes("api") || lower.includes("request")) {
    return {
      cardBg: "bg-[#f0f9ff] border-[#bae6fd] text-[#0369a1]",
      iconBg: "bg-white shadow-sm",
      badge: "bg-sky-100/80 text-sky-800 border-sky-200",
      accent: "text-sky-700",
      handle: "!bg-sky-500",
    };
  }
  if (lower.includes("if") || lower.includes("canva") || lower.includes("logic")) {
    return {
      cardBg: "bg-[#faf5ff] border-[#e9d5ff] text-[#6b21a8]",
      iconBg: "bg-white shadow-sm",
      badge: "bg-purple-100/80 text-purple-800 border-purple-200",
      accent: "text-purple-700",
      handle: "!bg-purple-500",
    };
  }
  if (lower.includes("filter") || lower.includes("iterator") || lower.includes("loop")) {
    return {
      cardBg: "bg-[#fffbeb] border-[#fde68a] text-[#92400e]",
      iconBg: "bg-white shadow-sm",
      badge: "bg-amber-100/80 text-amber-800 border-amber-200",
      accent: "text-amber-700",
      handle: "!bg-amber-500",
    };
  }
  if (lower.includes("notion")) {
    return {
      cardBg: "bg-[#18181b] border-zinc-800 text-white",
      iconBg: "bg-zinc-800 text-white",
      badge: "bg-zinc-800 text-zinc-300 border-zinc-700",
      accent: "text-white",
      handle: "!bg-zinc-700",
    };
  }

  // Default clean card
  return {
    cardBg: isTrigger
      ? "bg-[#fff7ed] border-[#fed7aa] text-[#9a3412]"
      : "bg-white border-gray-200 text-gray-900",
    iconBg: "bg-gray-50 shadow-sm",
    badge: "bg-gray-100 text-gray-700 border-gray-200",
    accent: "text-gray-700",
    handle: "!bg-[#18181b]",
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
  } = data;

  const isTrigger = nodeType === "trigger";
  const theme = getNodeTheme(label, isTrigger);

  // ── Placeholder Node (Make.com Style) ──
  if (isPlaceholder) {
    return (
      <div
        onClick={onConfigure}
        className="group w-[150px] p-5 rounded-3xl bg-white/90 border-2 border-dashed border-gray-300 hover:border-gray-900 hover:bg-white hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col items-center gap-2.5 select-none"
      >
        <div className="w-11 h-11 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 group-hover:scale-110 group-hover:bg-[#18181b] group-hover:text-white transition-all shadow-sm">
          <Plus className="w-5 h-5" />
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
            {label}
          </p>
          <span className="text-[10px] text-gray-400 mt-0.5 block">Click to setup</span>
        </div>

        {/* Handles */}
        {nodeType === "action" ? (
          <>
            <Handle
              type="target"
              position={Position.Left}
              id="a-in"
              className="!w-3 !h-3 !bg-white !border-2 !border-gray-400 hover:!border-black transition-colors"
            />
            <Handle
              type="source"
              position={Position.Right}
              id="a-out"
              className="!w-3 !h-3 !bg-white !border-2 !border-gray-400 hover:!border-black transition-colors"
            />
          </>
        ) : (
          <Handle
            type="source"
            position={Position.Right}
            id="t-out"
            className="!w-3 !h-3 !bg-white !border-2 !border-gray-900"
          />
        )}
      </div>
    );
  }

  // ── Configured Visual Node Card (Make.com Style) ──
  return (
    <div
      className={`min-w-[190px] max-w-[240px] rounded-3xl border-2 p-4 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 relative group select-none ${theme.cardBg}`}
    >
      <div className="flex flex-col items-center text-center">
        {/* Node Icon Container */}
        <div className="mb-2 relative">
          <NodeIcon
            icon={icon}
            name={label}
            size="xl"
            nodeType={nodeType}
            className={`w-14 h-14 rounded-2xl ${theme.iconBg} border border-black/5`}
          />
        </div>

        {/* Node Label */}
        <h4 className="font-extrabold text-sm tracking-tight truncate w-full" title={label}>
          {label}
        </h4>

        {/* Operation / Description */}
        <p className="text-[11px] opacity-75 truncate w-full mt-0.5 font-medium">
          {config?.operation?.replace(/_/g, " ") || (isTrigger ? "Webhook trigger" : "Action step")}
        </p>

        {/* Configured Status Pill */}
        <div className="mt-2.5 flex items-center justify-center">
          {isConfigured ? (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-xs ${theme.badge}`}
            >
              <Check className="h-3 w-3 stroke-[3]" />
              <span>Ready</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">
              Setup needed
            </span>
          )}
        </div>

        {/* Quick Action Buttons on Hover */}
        <div className="flex items-center justify-center gap-1 pt-3 mt-3 border-t border-black/10 w-full">
          {onConfigure && (
            <button
              type="button"
              onClick={onConfigure}
              className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-gray-700 hover:text-black transition-colors shadow-xs cursor-pointer"
              title="Configure Node"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}

          {onTest && (
            <button
              type="button"
              onClick={onTest}
              className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-gray-700 hover:text-black transition-colors shadow-xs cursor-pointer"
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
              className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-gray-700 hover:text-black transition-colors shadow-xs cursor-pointer"
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
              className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-rose-600 hover:text-rose-700 transition-colors shadow-xs cursor-pointer"
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
            className="!w-4 !h-4 !bg-white !border-3 !border-gray-800 hover:!scale-125 transition-transform cursor-crosshair shadow-md"
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
                    className={`!w-5 !h-5 flex items-center justify-center !border-2 !border-white transition-all cursor-crosshair shadow-md z-20 ${
                      isAlternative
                        ? "!bg-rose-500 !text-white"
                        : "!bg-[#18181b] !text-white"
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
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-xs whitespace-nowrap opacity-80 group-hover/handle:opacity-100 transition-opacity ${
                        isAlternative
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-white text-gray-800 border-gray-200"
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
            className="!w-5 !h-5 flex items-center justify-center !bg-[#18181b] !border-2 !border-white hover:!scale-125 transition-all cursor-crosshair shadow-md z-20"
          >
            {onAddChild && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild("t-out");
                }}
                className="w-full h-full flex items-center justify-center text-white font-bold z-30 leading-none pb-[1px] cursor-pointer"
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
