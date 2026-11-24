"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Layers,
  GitBranch,
  Zap,
  Activity,
  Play,
  ShieldCheck,
  Check,
  ArrowRight,
  Clock,
  Sparkles,
  Lock,
  Globe
} from "lucide-react";
import Image from "next/image";

interface BentoCardData {
  id: string;
  label: string;
  title: string;
  desc: string;
  icon: any;
  spanDesktop: string;
}

const BENTO_FEATURES: BentoCardData[] = [
  {
    id: "canvas",
    label: "Core Architecture",
    title: "Infinite Drag & Drop Canvas",
    desc: "Orchestrate conditional logic, multi-app action steps, and loop iterators on an infinite visual canvas with live wire validation.",
    icon: Layers,
    spanDesktop: "md:col-span-2 lg:col-span-2 lg:row-span-2",
  },
  {
    id: "filter",
    label: "Declarative Rules",
    title: "Conditional Logic & Filters",
    desc: "Route payloads with visual AND/OR rule groups, regex matchers, and array aggregators without writing code.",
    icon: GitBranch,
    spanDesktop: "md:col-span-1 lg:col-span-1 lg:row-span-1",
  },
  {
    id: "testing",
    label: "Developer Experience",
    title: "Single-Node Live Testing",
    desc: "Execute and inspect any isolated node in sandbox mode with live mocked input payloads before publishing changes.",
    icon: Play,
    spanDesktop: "md:col-span-1 lg:col-span-1 lg:row-span-2",
  },

  {
    id: "telemetry",
    label: "Observability",
    title: "Live Execution Telemetry",
    desc: "Real-time execution timelines, per-step millisecond latency traces, payload snapshots, and automated alert routing.",
    icon: Activity,
    spanDesktop: "md:col-span-1 lg:col-span-1 lg:row-span-1",
  },

  {
    id: "webhooks",
    label: "Edge Ingestion",
    title: "Instant Webhook Endpoints",
    desc: "Zero-latency HTTP endpoints with HMAC signature verification, payload buffering, and auto-retry policies.",
    icon: Globe,
    spanDesktop: "md:col-span-1 lg:col-span-1 lg:row-span-1",
  },
  {
    id: "oauth",
    label: "Security & Ecosystem",
    title: "Encrypted OAuth & Token Vault",
    desc: "Secure OAuth tokens encrypted at rest with automatic credential management for Google Workspace (Sheets, Gmail) and custom APIs.",
    icon: ShieldCheck,
    spanDesktop: "md:col-span-2 lg:col-span-3 lg:row-span-1",
  },
];

export function FeaturesBentoGrid() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section id="features" className="py-20 sm:py-24 px-4 sm:px-6 max-w-[1200px] mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Capabilities
        </p>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
          Built for speed. Designed for everyone.
        </h2>
        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Everything required to connect distributed APIs, automate mission-critical workflows, and monitor execution health in one unified canvas.
        </p>
      </div>

      {/* Responsive Bento Grid: 1 col on mobile, 2 cols on tablet, 3 cols on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 auto-rows-auto md:auto-rows-auto lg:auto-rows-[minmax(180px,auto)]">
        {BENTO_FEATURES.map((item, idx) => {
          const isDimmed = hoveredIdx !== null && hoveredIdx !== idx;
          const isHovered = hoveredIdx === idx;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              whileHover={{ y: -3 }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`relative rounded-2xl border border-border bg-card p-5 sm:p-6 overflow-hidden flex flex-col justify-between transition-all duration-500 ease-out cursor-pointer shadow-card ${item.spanDesktop} ${isDimmed ? "opacity-35 scale-[0.97] blur-[2px]" : "opacity-100 scale-100"
                } ${isHovered ? "border-primary/60 shadow-xl scale-[1.01] z-20" : ""}`}
            >
              {/* Header Info */}
              <div className="z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-primary tracking-wider uppercase">
                      {item.label}
                    </span>
                  </div>
                  {isHovered && (
                    <span className="text-[10px] font-mono font-semibold text-primary/80 hidden sm:inline-flex items-center gap-1">
                      <span>Active</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {/* Dynamic Micro-Visual Demonstrating Feature (Built with Theme Tokens) */}
              <div className="mt-4 pt-3 border-t border-border/80 w-full z-10">
                {/* ── CARD 0: Mini Canvas Flow ── */}
                {idx === 0 && (
                  <div className="bg-secondary/70 border border-border rounded-xl p-3 sm:p-4 font-mono text-[11px]">
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-border/70 text-xs font-bold text-foreground">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        Canvas State: Live Connected
                      </span>
                      <span className="text-[10px] text-muted-foreground">3 Nodes Connected</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-card border border-border">
                        <span className="text-[9.5px] text-primary font-bold uppercase block">Trigger</span>
                        <span className="font-semibold text-foreground truncate block">Webhook POST</span>
                      </div>
                      <div className="p-2 rounded-lg bg-card border border-border">
                        <span className="text-[9.5px] text-primary font-bold uppercase block">Filter</span>
                        <span className="font-semibold text-foreground truncate block">Score &gt;= 80</span>
                      </div>
                      <div className="p-2 rounded-lg bg-card border border-border">
                        <span className="text-[9.5px] text-success font-bold uppercase block">Action</span>
                        <span className="font-semibold text-foreground truncate block">Sheets + Mail</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── CARD 1: Conditional Logic Evaluator (Expanded 1x1.5) ── */}
                {idx === 1 && (
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-secondary border border-border">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-muted-foreground">lead.score</span>
                        <span className="text-primary font-bold">&gt;=</span>
                        <span className="text-foreground font-semibold">80</span>
                      </div>
                      <span className="text-[10px] font-bold text-success shrink-0">TRUE ✓</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 rounded-lg bg-success/10 border border-success/30 flex flex-col justify-between">
                        <span className="font-bold text-success text-[10.5px]">Branch A</span>
                        <span className="text-foreground text-[9.5px] mt-0.5">Sheets + Gmail</span>
                      </div>
                      <div className="p-2 rounded-lg bg-secondary border border-border opacity-70 flex flex-col justify-between">
                        <span className="font-bold text-muted-foreground text-[10.5px]">Branch B</span>
                        <span className="text-muted-foreground text-[9.5px] mt-0.5">Dead-Letter</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── CARD 2: Single Node Live Testing (Sandbox Inspector) ── */}
                {idx === 2 && (
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-secondary border border-border">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-muted-foreground">mock_payload</span>
                        <span className="text-primary font-bold">:</span>
                        <span className="text-foreground font-semibold">&#123; score: 92 &#125;</span>
                      </div>
                      <span className="text-[10px] font-bold text-success shrink-0">Ready</span>
                    </div>

                    <div className="p-2 rounded-lg bg-secondary/80 border border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Play className="w-3.5 h-3.5 text-primary fill-primary/20 shrink-0" />
                        <span className="text-[10.5px] text-foreground font-semibold">Sandbox Execution</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/30 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Passed (0.4ms)
                      </span>
                    </div>
                  </div>
                )}

                {/* ── CARD 3: Telemetry Stream ── */}
                {idx === 3 && (
                  <div className="space-y-2 font-mono text-[10.5px]">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-secondary border border-border">
                      <span className="text-foreground">Webhook.Receive</span>
                      <span className="text-success font-bold">2.4ms</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-secondary border border-border">
                      <span className="text-foreground">Filter.Evaluate</span>
                      <span className="text-success font-bold">0.3ms</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-secondary border border-border">
                      <span className="text-foreground">Sheets.Commit</span>
                      <span className="text-success font-bold">11.2ms</span>
                    </div>
                  </div>
                )}

                {/* ── CARD 4: Instant Webhook Endpoints ── */}
                {idx === 4 && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary border border-border font-mono text-[11px]">
                    <div className="flex items-center gap-2 truncate">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary text-primary-foreground">POST</span>
                      <span className="text-muted-foreground truncate">/v1/wh/live_8a3f...</span>
                    </div>
                    <span className="text-[10px] font-bold text-success shrink-0">200 OK</span>
                  </div>
                )}

                {/* ── CARD 5: OAuth Token Vault ── */}
                {idx === 5 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-1">
                        <div className="w-6 h-6 rounded-md bg-secondary border border-border flex items-center justify-center p-1">
                          <Image src="/google_sheet.svg" alt="Google" width={14} height={14} className="w-3.5 h-3.5 object-contain" />
                        </div>
                        <div className="w-6 h-6 rounded-md bg-secondary border border-border flex items-center justify-center p-1">
                          <Image src="/gmail.svg" alt="Gmail" width={14} height={14} className="w-3.5 h-3.5 object-contain" />
                        </div>
                      </div>
                      <span className="text-muted-foreground text-xs">Google OAuth 2.0</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/30 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Encrypted at Rest
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
