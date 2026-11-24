"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Check,
  RotateCcw,
  Filter,
  Mail,
  X,
} from "lucide-react";

export type NodeId = "webhook" | "filter" | "sheets" | "gmail";
export type NodeState = "idle" | "processing" | "completed";
export type EdgeState = "idle" | "flowing" | "completed";

interface NodeMetadata {
  id: NodeId;
  category: string;
  title: string;
  subtitle: string;
  summary: string;
}

/**
 * Plain-English metadata for each horizontal workflow node.
 * Visual color is driven purely by execution state (neutral -> blue -> green)
 * using theme tokens with zero decorative multi-color clutter.
 */
const WORKFLOW_NODES: Record<NodeId, NodeMetadata> = {
  webhook: {
    id: "webhook",
    category: "TRIGGER",
    title: "Webhook",
    subtitle: "New form lead",
    summary: "Listens for incoming form submissions and starts the workflow automatically.",
  },
  filter: {
    id: "filter",
    category: "CONDITION",
    title: "Filter",
    subtitle: "Score >= 80",
    summary: "Checks lead score and routes qualified leads to both actions in parallel.",
  },
  sheets: {
    id: "sheets",
    category: "ACTION",
    title: "Google Sheets",
    subtitle: "Append row",
    summary: "Appends the qualified lead details into your Leads Tracker sheet.",
  },
  gmail: {
    id: "gmail",
    category: "ACTION",
    title: "Gmail",
    subtitle: "Send welcome",
    summary: "Sends a personalized welcome email immediately after qualification.",
  },
};

/**
 * Generates stepped 3D acrylic slab thickness shadows along the down-left vector
 * (-0.35px, +1.0px) for rotateX(38deg) rotateY(12deg) rotateZ(-12deg).
 * Keeps identical shadow layer count across states so CSS transitions smoothly:
 * - 'idle': calm neutral frosted slate
 * - 'processing': soft blueish (var(--primary)) edge & ambient glow
 * - 'completed': soft green (var(--success)) edge & ambient glow
 */
function buildNodeSlabShadow(steps: number, state: NodeState, elevated = false): string {
  const shadows = [
    "inset 0 1px 0 var(--card)",
    "inset 1px 0 0 color-mix(in srgb, var(--card) 92%, transparent)",
  ];

  const isProcessing = state === "processing";
  const isCompleted = state === "completed";

  const tintVar = isProcessing
    ? "var(--primary)"
    : isCompleted
      ? "var(--success)"
      : "var(--border)";

  for (let i = 1; i <= steps; i++) {
    const t = (i - 1) / Math.max(steps - 1, 1);
    const tintPct = isProcessing
      ? Math.round(16 + t * 36)
      : isCompleted
        ? Math.round(18 + t * 38)
        : Math.round(42 + t * 44);
    const cardPct = 100 - tintPct;
    const x = (-0.35 * i).toFixed(2);
    const y = (1.0 * i).toFixed(2);
    shadows.push(
      `${x}px ${y}px 0px color-mix(in srgb, ${tintVar} ${tintPct}%, var(--card) ${cardPct}%)`
    );
  }

  const spread = elevated ? 1.32 : isCompleted ? 1.18 : 1;
  const floorX = (-0.35 * (steps + 11) * spread).toFixed(1);
  const floorY = (1.0 * (steps + 11) * spread).toFixed(1);
  const floorBlur = elevated ? 24 : 18;

  // Soft neutral contact shadow
  shadows.push(
    `${floorX}px ${floorY}px ${floorBlur}px color-mix(in srgb, var(--foreground) ${elevated ? 8 : isCompleted ? 5 : 7
    }%, transparent)`
  );

  // Close-range colored cast shadow (blueish when processing, lush green when completed)
  const glowX = (-0.35 * (steps + 8) * spread).toFixed(1);
  const glowY = (1.0 * (steps + 8) * spread).toFixed(1);
  if (isProcessing) {
    shadows.push(
      `${glowX}px ${glowY}px 24px color-mix(in srgb, var(--primary) 30%, transparent)`
    );
  } else if (isCompleted) {
    shadows.push(
      `${glowX}px ${glowY}px 24px color-mix(in srgb, var(--success) 34%, transparent)`
    );
  } else {
    shadows.push(
      `${glowX}px ${glowY}px 16px color-mix(in srgb, var(--foreground) 4%, transparent)`
    );
  }

  // Wide diffused ambient floor glow spilling onto the canvas
  const haloX = (-0.35 * (steps + 14) * spread).toFixed(1);
  const haloY = (1.0 * (steps + 14) * spread).toFixed(1);
  if (isProcessing) {
    shadows.push(
      `${haloX}px ${haloY}px 32px color-mix(in srgb, var(--primary) 18%, transparent)`
    );
  } else if (isCompleted) {
    shadows.push(
      `${haloX}px ${haloY}px 34px color-mix(in srgb, var(--success) 24%, transparent)`
    );
  } else {
    shadows.push(
      `${haloX}px ${haloY}px 22px color-mix(in srgb, var(--foreground) 2%, transparent)`
    );
  }

  return shadows.join(", ");
}

/**
 * Generates stepped 3D edge extrusion for the floating 740x390 frosted canvas platform.
 * Uses ONLY theme tokens via color-mix().
 */
function buildPlatformShadow(): string {
  const shadows = [
    "inset 0 1px 0 var(--card)",
    "inset 1px 0 0 color-mix(in srgb, var(--card) 90%, transparent)",
  ];

  for (let i = 1; i <= 8; i++) {
    const x = (-0.35 * i).toFixed(2);
    const y = (1.0 * i).toFixed(2);
    const borderPct = Math.round(45 + (i / 8) * 35);
    const cardPct = 100 - borderPct;
    shadows.push(
      `${x}px ${y}px 0px color-mix(in srgb, var(--border) ${borderPct}%, var(--card) ${cardPct}%)`
    );
  }

  shadows.push(
    "-8px 26px 40px color-mix(in srgb, var(--foreground) 10%, transparent)"
  );
  shadows.push(
    "-3px 14px 20px color-mix(in srgb, var(--primary) 7%, transparent)"
  );

  return shadows.join(", ");
}

/**
 * Generates a compact 4-step mini 3D extrusion for the raised icon tile inside each node.
 * Follows the calm state palette: neutral -> soft blue -> soft green.
 */
function buildMiniCubeShadow(state: NodeState): string {
  const shadows = [
    "inset 0 1px 0 color-mix(in srgb, var(--card) 55%, transparent)",
  ];

  const isProcessing = state === "processing";
  const isCompleted = state === "completed";

  for (let i = 1; i <= 4; i++) {
    const x = (-0.35 * i).toFixed(2);
    const y = (1.0 * i).toFixed(2);
    if (isProcessing) {
      shadows.push(
        `${x}px ${y}px 0px color-mix(in srgb, var(--primary-hover) ${55 + i * 8}%, var(--card) 12%)`
      );
    } else if (isCompleted) {
      shadows.push(
        `${x}px ${y}px 0px color-mix(in srgb, var(--success) ${24 + i * 9}%, var(--card) ${76 - i * 9}%)`
      );
    } else {
      shadows.push(
        `${x}px ${y}px 0px color-mix(in srgb, var(--border) ${55 + i * 9}%, var(--card) ${45 - i * 9}%)`
      );
    }
  }

  if (isProcessing) {
    shadows.push(
      "-2px 7px 14px color-mix(in srgb, var(--primary) 28%, transparent)"
    );
  } else if (isCompleted) {
    shadows.push(
      "-2px 7px 14px color-mix(in srgb, var(--success) 28%, transparent)"
    );
  } else {
    shadows.push(
      "-2px 5px 8px color-mix(in srgb, var(--foreground) 7%, transparent)"
    );
  }

  return shadows.join(", ");
}

/**
 * Tracks container width smoothly so the fixed 740x390 3D stage scales cleanly
 * without clipping on any viewport width.
 */
function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>, fallback = 640): number {
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      if (el.clientWidth > 0) setWidth(el.clientWidth);
    };

    update();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ref]);

  return width;
}

/**
 * Inline Webhook branching glyph.
 */
function WebhookGlyph({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="6.5" r="2.4" stroke="currentColor" strokeWidth="2" />
      <circle cx="6.5" cy="16.5" r="2.4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="16.5" r="2.4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M10.7 8.7L7.8 14.3M13.3 8.7L16.2 14.3M9 16.5H15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Raised Floating 3D Icon Tile inside each workflow node.
 * Keeps all icons in one calm color family and shifts subtly by state:
 * idle (neutral) -> processing (blue) -> completed (soft green).
 */
function Raised3DNodeIcon({ nodeId, state }: { nodeId: NodeId; state: NodeState }) {
  const isProcessing = state === "processing";
  const isCompleted = state === "completed";

  const tileStyle: React.CSSProperties = isProcessing
    ? {
      background:
        "linear-gradient(145deg, color-mix(in srgb, var(--primary) 86%, var(--card)) 0%, var(--primary) 60%, var(--primary-hover) 100%)",
      color: "var(--primary-foreground)",
      border: "1px solid color-mix(in srgb, var(--card) 35%, var(--primary))",
      boxShadow: buildMiniCubeShadow("processing"),
    }
    : isCompleted
      ? {
        background: "color-mix(in srgb, var(--success) 10%, var(--card))",
        color: "var(--success)",
        border: "1px solid color-mix(in srgb, var(--success) 26%, var(--card))",
        boxShadow: buildMiniCubeShadow("completed"),
      }
      : {
        background: "color-mix(in srgb, var(--muted) 75%, var(--card))",
        color: nodeId === "filter" ? "var(--primary)" : "var(--muted-foreground)",
        border: "1px solid color-mix(in srgb, var(--border) 90%, var(--card))",
        boxShadow: buildMiniCubeShadow("idle"),
      };

  const renderGlyph = () => {
    if (nodeId === "webhook") return <WebhookGlyph className="w-[18px] h-[18px]" />;
    if (nodeId === "filter") return <Filter className="w-[17px] h-[17px]" />;
    if (nodeId === "sheets") {
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
          <line x1="4" y1="9.5" x2="20" y2="9.5" stroke="currentColor" strokeWidth="1.6" />
          <line x1="4" y1="14.5" x2="20" y2="14.5" stroke="currentColor" strokeWidth="1.6" />
          <line x1="10" y1="9.5" x2="10" y2="20" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    }
    return <Mail className="w-[17px] h-[17px]" />;
  };

  return (
    <div
      className={`relative w-9 h-9 rounded-[var(--radius)] flex items-center justify-center shrink-0 transition-all duration-500 ${nodeId === "filter" && isProcessing ? "bf-cube-float" : ""
        }`}
      style={{
        transform: isProcessing ? "translateZ(14px)" : "translateZ(10px)",
        ...tileStyle,
      }}
    >
      {nodeId === "webhook" && isProcessing && (
        <span
          aria-hidden="true"
          className="bf-radar-ring pointer-events-none absolute -inset-1 rounded-[var(--radius)]"
          style={{
            border: "1.5px solid color-mix(in srgb, var(--primary) 60%, transparent)",
          }}
        />
      )}
      {renderGlyph()}
    </div>
  );
}

/**
 * Refined circular input/output handle pin mounted on node left/right edges.
 * Quiet neutral border when idle, soft blue while processing, soft green once completed.
 */
function NodeHandlePin({
  side,
  topOffset,
  state,
}: {
  side: "left" | "right";
  topOffset?: number;
  state: NodeState;
}) {
  const isProcessing = state === "processing";
  const isCompleted = state === "completed";

  const posStyle: React.CSSProperties =
    topOffset !== undefined
      ? { top: `${topOffset}px`, transform: "translateY(-50%) translateZ(2px)" }
      : { top: "50%", transform: "translateY(-50%) translateZ(2px)" };

  const ringColor = isProcessing
    ? "color-mix(in srgb, var(--primary) 75%, var(--card))"
    : isCompleted
      ? "color-mix(in srgb, var(--success) 65%, var(--card))"
      : "color-mix(in srgb, var(--border) 95%, var(--muted-foreground) 15%)";

  const coreColor = isProcessing
    ? "var(--primary)"
    : isCompleted
      ? "var(--success)"
      : "color-mix(in srgb, var(--muted-foreground) 45%, var(--card))";

  return (
    <span
      aria-hidden="true"
      className={`absolute ${side === "left" ? "-left-[5px]" : "-right-[5px]"} w-[10px] h-[10px] rounded-full flex items-center justify-center transition-all duration-500 z-30`}
      style={{
        ...posStyle,
        backgroundColor: "var(--card)",
        border: `1.5px solid ${ringColor}`,
        boxShadow: isProcessing
          ? "0 0 0 3px color-mix(in srgb, var(--primary) 16%, transparent)"
          : isCompleted
            ? "0 0 0 2px color-mix(in srgb, var(--success) 12%, transparent)"
            : "0 1px 2px color-mix(in srgb, var(--foreground) 8%, transparent)",
      }}
    >
      <span
        className="w-[4px] h-[4px] rounded-full transition-colors duration-500"
        style={{ backgroundColor: coreColor }}
      />
    </span>
  );
}

interface NodeCardProps {
  id: NodeId;
  left: number;
  top: number;
  width: number;
  height: number;
  depthSteps: number;
  state: NodeState;
  hasLeftHandle: boolean;
  leftHandleState?: NodeState;
  rightHandles?: Array<{ topOffset?: number; state?: NodeState }>;
  footerPill?: string;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (id: NodeId | null) => void;
  onSelect: (id: NodeId) => void;
}

function NodeCard({
  id,
  left,
  top,
  width,
  height,
  depthSteps,
  state,
  hasLeftHandle,
  leftHandleState,
  rightHandles = [],
  footerPill,
  isHovered,
  isSelected,
  onHover,
  onSelect,
}: NodeCardProps) {
  const node = WORKFLOW_NODES[id];
  const isProcessing = state === "processing";
  const isCompleted = state === "completed";
  const isElevated = isHovered || isSelected || isProcessing;

  const surfaceGradient = isProcessing
    ? "linear-gradient(155deg, var(--card) 0%, color-mix(in srgb, var(--primary) 4%, var(--card)) 100%)"
    : isCompleted
      ? "linear-gradient(155deg, var(--card) 0%, color-mix(in srgb, var(--success) 5%, var(--card)) 100%)"
      : "linear-gradient(155deg, var(--card) 0%, color-mix(in srgb, var(--background) 55%, var(--card)) 100%)";

  const borderColor = isProcessing
    ? "color-mix(in srgb, var(--primary) 58%, var(--card))"
    : isCompleted
      ? "color-mix(in srgb, var(--success) 52%, var(--border))"
      : "color-mix(in srgb, var(--border) 92%, var(--card))";

  return (
    <div
      role="button"
      tabIndex={0}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(id);
        }
      }}
      className="absolute z-20 rounded-[var(--radius)] flex flex-col justify-between cursor-pointer transition-all duration-500 ease-out focus:outline-none"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        transformStyle: "preserve-3d",
        transform: isElevated ? "translateZ(28px)" : "translateZ(18px)",
        background: surfaceGradient,
        border: `1.25px solid ${borderColor}`,
        outline: isSelected ? "2px solid color-mix(in srgb, var(--primary) 65%, transparent)" : "none",
        outlineOffset: "2px",
        boxShadow: buildNodeSlabShadow(depthSteps, state, isElevated),
      }}
    >
      {/* Left Input Handle Pin */}
      {hasLeftHandle && (
        <NodeHandlePin side="left" state={leftHandleState || state} />
      )}

      {/* Right Output Handle Pin(s) */}
      {rightHandles.map((handle, idx) => (
        <NodeHandlePin
          key={idx}
          side="right"
          topOffset={handle.topOffset}
          state={handle.state || state}
        />
      ))}

      {/* Top Category Header Strip + Status Indicator */}
      <div
        className="px-3 py-1.5 flex items-center justify-between border-b rounded-t-[var(--radius)] transition-colors duration-500"
        style={{
          borderColor: "color-mix(in srgb, var(--border) 70%, transparent)",
          backgroundColor: isProcessing
            ? "color-mix(in srgb, var(--primary) 4%, var(--card))"
            : isCompleted
              ? "color-mix(in srgb, var(--success) 3.5%, var(--card))"
              : "color-mix(in srgb, var(--background) 45%, var(--card))",
        }}
      >
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.08em] font-mono whitespace-nowrap"
          style={{ color: "var(--muted-foreground)" }}
        >
          {node.category}
        </span>

        {/* Circular Status Indicator */}
        <span
          className="w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all duration-500 shrink-0"
          style={{
            backgroundColor: isCompleted
              ? "var(--success)"
              : isProcessing
                ? "color-mix(in srgb, var(--primary) 14%, var(--card))"
                : "var(--muted)",
            color: isCompleted ? "var(--success-foreground)" : "var(--primary)",
            boxShadow: isCompleted
              ? "0 0 0 2px color-mix(in srgb, var(--success) 16%, transparent)"
              : isProcessing
                ? "0 0 0 2px color-mix(in srgb, var(--primary) 16%, transparent)"
                : "none",
          }}
        >
          {isCompleted ? (
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          ) : (
            <span
              className={`w-2 h-2 rounded-full transition-colors duration-500 ${isProcessing ? "animate-pulse" : ""
                }`}
              style={{
                backgroundColor: isProcessing ? "var(--primary)" : "var(--border)",
              }}
            />
          )}
        </span>
      </div>

      {/* Main Node Body */}
      <div
        className="px-3 py-2.5 flex items-center gap-2.5 flex-1 min-w-0"
        style={{ transformStyle: "preserve-3d" }}
      >
        <Raised3DNodeIcon nodeId={id} state={state} />
        <div className="min-w-0">
          <div
            className="text-[13.5px] font-semibold leading-tight whitespace-nowrap"
            style={{ color: "var(--foreground)" }}
          >
            {node.title}
          </div>
          <div
            className="text-[11px] leading-tight mt-0.5 whitespace-nowrap"
            style={{ color: "var(--muted-foreground)" }}
          >
            {node.subtitle}
          </div>
        </div>
      </div>

      {/* Optional Footer Pill inside Filter Condition Node */}
      {footerPill && (
        <div className="px-3 pb-2.5 pt-0 flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius)] text-[10px] font-semibold whitespace-nowrap transition-colors duration-500"
            style={{
              backgroundColor: isCompleted
                ? "color-mix(in srgb, var(--success) 10%, var(--card))"
                : isProcessing
                  ? "var(--secondary)"
                  : "var(--muted)",
              color: isCompleted
                ? "var(--success)"
                : isProcessing
                  ? "var(--secondary-foreground)"
                  : "var(--muted-foreground)",
              border: `1px solid ${isCompleted
                ? "color-mix(in srgb, var(--success) 24%, transparent)"
                : isProcessing
                  ? "color-mix(in srgb, var(--primary) 20%, transparent)"
                  : "var(--border)"
                }`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full transition-colors duration-500"
              style={{
                backgroundColor: isCompleted
                  ? "var(--success)"
                  : isProcessing
                    ? "var(--primary)"
                    : "var(--muted-foreground)",
              }}
            />
            {footerPill}
          </span>
        </div>
      )}
    </div>
  );
}

export interface IsometricHeroSystemProps {
  replayTrigger?: number;
  replaySignal?: number;
}

/**
 * TRUE HORIZONTAL (LEFT-TO-RIGHT) 3D ISOMETRIC WORKFLOW BOARD
 * Pure HTML, CSS 3D transforms, inline SVG, and design system theme tokens.
 * Calm monochrome base with clear state progression: neutral -> blue (processing) -> green (completed).
 */
export function IsometricHeroSystem({
  replayTrigger = 0,
  replaySignal = 0,
}: IsometricHeroSystemProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(outerRef, 660);

  // 5-phase sequential wave so every node clearly shows: idle -> processing (blue) -> completed (green)
  // 1: Webhook processing
  // 2: Webhook completed, Filter processing
  // 3: Webhook + Filter completed, Sheets + Gmail processing
  // 4: All nodes completed (calm green)
  // 5: Brief neutral settle before looping
  const [step, setStep] = useState(1);
  const [hoveredId, setHoveredId] = useState<NodeId | null>(null);
  const [selectedId, setSelectedId] = useState<NodeId | null>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);

  const triggerWave = useCallback(() => {
    clearTimers();
    setStep(1);

    const t1 = setTimeout(() => setStep(2), 1150);
    const t2 = setTimeout(() => setStep(3), 2350);
    const t3 = setTimeout(() => setStep(4), 3550);
    const t4 = setTimeout(() => setStep(5), 4950);
    const tLoop = setTimeout(() => triggerWave(), 5750);

    timersRef.current = [t1, t2, t3, t4, tLoop];
  }, [clearTimers]);

  useEffect(() => {
    triggerWave();
    return () => clearTimers();
  }, [replayTrigger, replaySignal, triggerWave, clearTimers]);

  // Scale 740x390 projected isometric board cleanly into available width
  const responsiveScale = Math.min(0.88, Math.max(0.38, (containerWidth - 8) / 775));

  // Clear per-node execution states: 'idle' | 'processing' | 'completed'
  const webhookState: NodeState =
    step === 1 ? "processing" : step >= 2 && step <= 4 ? "completed" : "idle";
  const filterState: NodeState =
    step === 2 ? "processing" : step >= 3 && step <= 4 ? "completed" : "idle";
  const actionsState: NodeState =
    step === 3 ? "processing" : step === 4 ? "completed" : "idle";

  // Per-edge states for soft transitions: 'idle' | 'flowing' | 'completed'
  const edge1State: EdgeState =
    step === 1 ? "flowing" : step >= 2 && step <= 4 ? "completed" : "idle";
  const edge2State: EdgeState =
    step === 2 ? "flowing" : step >= 3 && step <= 4 ? "completed" : "idle";

  // Exact pixel-locked horizontal cubic Bezier wire coordinates on 740x390 stage
  const paths = {
    webhookToFilter: "M 200 193 L 274 193",
    filterToSheets: "M 460 168 C 502 168, 492 102, 534 102",
    filterToGmail: "M 460 218 C 502 218, 492 284, 534 284",
  };

  const selectedNode = selectedId ? WORKFLOW_NODES[selectedId] : null;
  const selectedNodeState: NodeState =
    selectedId === "webhook"
      ? webhookState
      : selectedId === "filter"
        ? filterState
        : selectedId
          ? actionsState
          : "idle";

  const liveStatusText =
    step === 1
      ? "Step 1/3 - Webhook processing incoming lead..."
      : step === 2
        ? "Step 2/3 - Filter evaluating condition (Score >= 80)..."
        : step === 3
          ? "Step 3/3 - Updating Google Sheets & sending Gmail..."
          : step === 4
            ? "Completed - All workflow steps succeeded"
            : "Ready - Waiting for next event";

  const platformShadow = buildPlatformShadow();

  const handleSelect = (id: NodeId) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  /**
   * Renders one solid Bezier connector with state tinting and glowing droplet pulse
   */
  const renderSoftEdge = (d: string, edgeState: EdgeState, dur = "1.05s", begin = "0s") => {
    const isFlowing = edgeState === "flowing";
    const isCompleted = edgeState === "completed";

    return (
      <g>
        {/* 1. Soft diffuse halo when flowing or completed */}
        <path
          d={d}
          fill="none"
          stroke={isFlowing ? "var(--primary)" : "var(--success)"}
          strokeWidth={isFlowing ? 8 : 5.5}
          strokeLinecap="round"
          opacity={isFlowing ? 0.16 : isCompleted ? 0.09 : 0}
          filter="url(#bfSoftEdgeGlow)"
          className="transition-all duration-500"
        />

        {/* 2. Base rail */}
        <path
          d={d}
          fill="none"
          stroke="color-mix(in srgb, var(--border) 88%, var(--muted-foreground) 12%)"
          strokeWidth="2.25"
          strokeLinecap="round"
        />

        {/* 3. Soft state tint overlay */}
        <path
          d={d}
          fill="none"
          stroke={
            isFlowing
              ? "color-mix(in srgb, var(--primary) 68%, var(--card))"
              : "color-mix(in srgb, var(--success) 52%, var(--border))"
          }
          strokeWidth={isFlowing ? 2.5 : 2.25}
          strokeLinecap="round"
          opacity={isFlowing ? 0.92 : isCompleted ? 0.85 : 0}
          className="transition-all duration-500"
        />

        {/* 4. Glowing droplet pulse gliding while flowing */}
        {isFlowing && (
          <g>
            <circle r="5.5" fill="url(#bfSoftOrbHalo)" opacity="0">
              <animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={d} />
              <animate
                attributeName="opacity"
                values="0;0.9;0.9;0"
                keyTimes="0;0.15;0.85;1"
                dur={dur}
                begin={begin}
                repeatCount="indefinite"
              />
            </circle>
            <circle r="2.1" fill="var(--card)" opacity="0">
              <animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={d} />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.15;0.85;1"
                dur={dur}
                begin={begin}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="relative flex flex-col items-center w-full">
      {/* Scoped CSS 3D Animations */}
      <style>{`
        @keyframes bfCubeFloat {
          0%, 100% {
            transform: translateZ(14px);
          }
          50% {
            transform: translateZ(19px);
          }
        }

        .bf-cube-float {
          animation: bfCubeFloat 2.4s ease-in-out infinite;
        }

        @keyframes bfRadarPing {
          0% {
            transform: scale(0.92);
            opacity: 0.65;
          }
          100% {
            transform: scale(1.42);
            opacity: 0;
          }
        }

        .bf-radar-ring {
          animation: bfRadarPing 1.15s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* Outer Viewport for 3D Isometric Board */}
      <div
        ref={outerRef}
        onClick={() => setSelectedId(null)}
        className="relative w-full h-[240px] sm:h-[300px] md:h-[350px] lg:h-[360px] flex items-center justify-center overflow-visible select-none"
      >
        {/* Subtle Radial Ambient Halo Behind the Board */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[360px] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 7%, transparent) 0%, transparent 72%)",
          }}
        />

        {/* Responsive Scale Wrapper Centered Optically */}
        <div
          className="relative shrink-0 transition-transform duration-200 ease-out"
          style={{
            width: "740px",
            height: "390px",
            transform: `translate(4px, -6px) scale(${responsiveScale})`,
            transformOrigin: "center center",
          }}
        >
          {/* Fixed-Coordinate 740x390 TRUE HORIZONTAL 3D Isometric Board Stage */}
          <div
            className="relative w-full h-full"
            style={{
              transformStyle: "preserve-3d",
              transform: "perspective(1400px) rotateX(38deg) rotateY(12deg) rotateZ(-12deg)",
              borderRadius: "20px",
              backgroundColor: "color-mix(in srgb, var(--card) 94%, var(--background))",
              border: "1px solid color-mix(in srgb, var(--border) 90%, var(--card))",
              backgroundImage: "radial-gradient(var(--border) 1.4px, transparent 1.4px)",
              backgroundSize: "20px 20px",
              boxShadow: platformShadow,
            }}
          >
            {/* Subtle Canvas Corner Watermark Label on Platform Floor */}
            <div
              className="pointer-events-none absolute top-3.5 left-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] font-mono"
              style={{
                color: "color-mix(in srgb, var(--muted-foreground) 68%, transparent)",
                transform: "translateZ(1px)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "var(--primary)" }}
              />
              <span>BuildFlow Canvas</span>
            </div>

            {/* LAYER A: Feather-Soft Floor Cast Wire Shadows */}
            <svg
              viewBox="0 0 740 390"
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              style={{
                transform: "translateZ(1px) translate(-2px, 8px)",
                zIndex: 5,
              }}
              aria-hidden="true"
            >
              <defs>
                <filter id="bfWireShadowBlur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" />
                </filter>
              </defs>
              <g
                fill="none"
                stroke="color-mix(in srgb, var(--foreground) 7%, transparent)"
                strokeWidth="3.5"
                strokeLinecap="round"
                filter="url(#bfWireShadowBlur)"
              >
                <path d={paths.webhookToFilter} />
                <path d={paths.filterToSheets} />
                <path d={paths.filterToGmail} />
              </g>
            </svg>

            {/* LAYER B: Soft, Silky Horizontal Cubic Bezier Edges (translateZ(14px)) */}
            <svg
              viewBox="0 0 740 390"
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              style={{
                transform: "translateZ(14px)",
                zIndex: 15,
              }}
              aria-hidden="true"
            >
              <defs>
                <filter id="bfSoftEdgeGlow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="3.5" />
                </filter>
                <radialGradient id="bfSoftOrbHalo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.95" />
                  <stop offset="55%" stopColor="var(--primary)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </radialGradient>
              </defs>

              {renderSoftEdge(paths.webhookToFilter, edge1State, "0.95s", "0s")}
              {renderSoftEdge(paths.filterToSheets, edge2State, "1.05s", "0s")}
              {renderSoftEdge(paths.filterToGmail, edge2State, "1.05s", "0.12s")}
            </svg>

            {/* Soft Integrated "Pass" Pill Along Top Branch */}
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-[var(--radius)] text-[9.5px] font-medium border transition-all duration-500 whitespace-nowrap"
              style={{
                left: "497px",
                top: "134px",
                zIndex: 25,
                transform: "translate(-50%, -50%) translateZ(18px)",
                backgroundColor:
                  edge2State === "flowing"
                    ? "var(--secondary)"
                    : edge2State === "completed"
                      ? "color-mix(in srgb, var(--success) 8%, var(--card))"
                      : "var(--card)",
                borderColor:
                  edge2State === "flowing"
                    ? "color-mix(in srgb, var(--primary) 35%, var(--border))"
                    : edge2State === "completed"
                      ? "color-mix(in srgb, var(--success) 30%, var(--border))"
                      : "var(--border)",
                color:
                  edge2State === "flowing"
                    ? "var(--secondary-foreground)"
                    : edge2State === "completed"
                      ? "var(--success)"
                      : "var(--muted-foreground)",
                boxShadow:
                  "-1px 3px 6px color-mix(in srgb, var(--foreground) 6%, transparent)",
              }}
            >
              Pass
            </div>

            {/* NODE 1 (FAR LEFT): Webhook (Trigger) */}
            <NodeCard
              id="webhook"
              left={26}
              top={135}
              width={174}
              height={116}
              depthSteps={10}
              state={webhookState}
              hasLeftHandle={false}
              rightHandles={[{ state: webhookState }]}
              isHovered={hoveredId === "webhook"}
              isSelected={selectedId === "webhook"}
              onHover={setHoveredId}
              onSelect={handleSelect}
            />

            {/* NODE 2 (CENTER): Filter (Condition) */}
            <NodeCard
              id="filter"
              left={274}
              top={127}
              width={186}
              height={132}
              depthSteps={13}
              state={filterState}
              hasLeftHandle={true}
              leftHandleState={filterState}
              rightHandles={[
                { topOffset: 41, state: filterState },
                { topOffset: 91, state: filterState },
              ]}
              footerPill="Match: True"
              isHovered={hoveredId === "filter"}
              isSelected={selectedId === "filter"}
              onHover={setHoveredId}
              onSelect={handleSelect}
            />

            {/* NODE 3A (TOP-RIGHT): Google Sheets (Action) */}
            <NodeCard
              id="sheets"
              left={534}
              top={44}
              width={180}
              height={116}
              depthSteps={10}
              state={actionsState}
              hasLeftHandle={true}
              leftHandleState={actionsState}
              rightHandles={[]}
              isHovered={hoveredId === "sheets"}
              isSelected={selectedId === "sheets"}
              onHover={setHoveredId}
              onSelect={handleSelect}
            />

            {/* NODE 3B (BOTTOM-RIGHT): Gmail (Action) */}
            <NodeCard
              id="gmail"
              left={534}
              top={226}
              width={180}
              height={116}
              depthSteps={10}
              state={actionsState}
              hasLeftHandle={true}
              leftHandleState={actionsState}
              rightHandles={[]}
              isHovered={hoveredId === "gmail"}
              isSelected={selectedId === "gmail"}
              onHover={setHoveredId}
              onSelect={handleSelect}
            />
          </div>
        </div>
      </div>

      {/* Compact Floating Status & Inspection Bar Below Diagram */}
      <div
        className="mt-6 w-full max-w-[560px] px-4 py-1 rounded-[var(--radius)] border flex items-center justify-between gap-3"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-300 ${!selectedNode && step <= 3 ? "animate-pulse" : ""
              }`}
            style={{
              backgroundColor: selectedNode
                ? selectedNodeState === "processing"
                  ? "var(--primary)"
                  : selectedNodeState === "completed"
                    ? "var(--success)"
                    : "var(--muted-foreground)"
                : step === 4
                  ? "var(--success)"
                  : step === 5
                    ? "var(--border)"
                    : "var(--primary)",
            }}
          />
          {selectedNode ? (
            <div className="flex items-center gap-2 min-w-0 text-xs">
              <span
                className="font-semibold whitespace-nowrap shrink-0"
                style={{ color: "var(--foreground)" }}
              >
                {selectedNode.title}:
              </span>
              <span
                className="truncate"
                style={{ color: "var(--muted-foreground)" }}
              >
                {selectedNode.summary}
              </span>
            </div>
          ) : (
            <span
              className="text-xs font-medium truncate"
              style={{ color: "var(--muted-foreground)" }}
            >
              {liveStatusText}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedNode && (
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label="Clear node selection"
              className="p-1 rounded-[var(--radius)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
              style={{ color: "var(--muted-foreground)" }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={triggerWave}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius)] border text-xs font-semibold transition-colors cursor-pointer hover:bg-[var(--muted)] whitespace-nowrap"
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            <RotateCcw className="w-3 h-3" style={{ color: "var(--primary)" }} />
            <span>Replay</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Named alias so existing codebases can import either name
export { IsometricHeroSystem as HorizontalIsometricWorkflow };
