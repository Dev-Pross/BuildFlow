"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Filter,
  Check,
  Copy,
  Zap,
  ShieldCheck,
  Clock,
  Layers,
  ArrowRight,
  Sparkles
} from "lucide-react";

export function ScrollFlipWorkflow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [mobileStep, setMobileStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Track active step based on resting plateau zones
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      if (latest < 0.28) {
        setActiveStep(0);
      } else if (latest < 0.63) {
        setActiveStep(1);
      } else {
        setActiveStep(2);
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Horizontal translation with Resting Plateaus & Exit Buffer
  const x = useTransform(
    scrollYProgress,
    [0, 0.20, 0.35, 0.55, 0.70, 0.88, 1],
    ["0%", "0%", "-100%", "-100%", "-200%", "-200%", "-200%"]
  );

  // 3D Flip & Scale Transforms for Card 1 (Inbound Webhook)
  const card1RotateY = useTransform(scrollYProgress, [0, 0.20, 0.35], [0, 0, -30]);
  const card1Scale = useTransform(scrollYProgress, [0, 0.20, 0.35], [1, 1, 0.92]);
  const card1Opacity = useTransform(scrollYProgress, [0, 0.20, 0.35], [1, 1, 0.2]);

  // 3D Flip & Scale Transforms for Card 2 (Filter Logic)
  const card2RotateY = useTransform(scrollYProgress, [0.20, 0.35, 0.55, 0.70], [35, 0, 0, -30]);
  const card2Scale = useTransform(scrollYProgress, [0.20, 0.35, 0.55, 0.70], [0.92, 1, 1, 0.92]);
  const card2Opacity = useTransform(scrollYProgress, [0.20, 0.35, 0.55, 0.70], [0.2, 1, 1, 0.2]);

  // 3D Flip & Scale Transforms for Card 3 (Parallel Actions)
  const card3RotateY = useTransform(scrollYProgress, [0.55, 0.70, 0.88, 1], [35, 0, 0, 0]);
  const card3Scale = useTransform(scrollYProgress, [0.55, 0.70, 0.88, 1], [0.92, 1, 1, 1]);
  const card3Opacity = useTransform(scrollYProgress, [0.55, 0.70, 0.88, 1], [0.2, 1, 1, 1]);

  const handleCopy = () => {
    navigator.clipboard.writeText("https://api.buildflow.dev/v1/wh/live_8a3f4e29");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToStep = (stepIndex: number) => {
    if (!containerRef.current) return;
    const containerTop = containerRef.current.offsetTop;
    const containerHeight = containerRef.current.offsetHeight;
    const plateauCenters = [0.10, 0.45, 0.79];
    const progress = plateauCenters[stepIndex] ?? 0.10;
    const targetScroll = containerTop + progress * (containerHeight - window.innerHeight);
    window.scrollTo({ top: targetScroll, behavior: "smooth" });
  };

  /* ─────────────────────────────────────────────────────────────
     REUSABLE SLIDE RENDERERS (Zero duplication across Viewports)
  ───────────────────────────────────────────────────────────── */

  const renderSlide1 = () => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-stretch h-full">
      {/* Left Column: Narrative & Specs */}
      <div className="md:col-span-5 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center p-2 shadow-xs shrink-0">
              <Image
                src="/webhook.svg"
                alt="Webhook Logo"
                width={28}
                height={28}
                className="w-7 h-7 object-contain"
              />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-primary uppercase">
                Step 01 / Trigger
              </span>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-foreground">
                Catch Any Webhook
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-[13px] text-muted-foreground mt-2.5 leading-relaxed">
            Instant endpoints capture inbound HTTP payloads with zero server maintenance. Works out of the box with Stripe, Shopify, GitHub, Typeform, or custom backend services.
          </p>

          {/* Feature Spec Matrix */}
          <div className="mt-2.5 sm:mt-3 space-y-1 sm:space-y-1.5 font-mono text-[10.5px]">
            <div className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>HMAC-SHA256 Signature Verification</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Sub-5ms Edge Ingestion Buffer</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Auto-Retries on Downstream Downtime</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-2 text-success font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Listening for events
          </span>
          <span className="text-foreground font-semibold text-[11px]">TLS 1.3 Encrypted</span>
        </div>
      </div>

      {/* Right Column */}
      <div className="md:col-span-7 rounded-xl bg-secondary border border-border p-3 sm:p-4 font-mono text-xs shadow-inner flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-primary text-primary-foreground shadow-xs">
                POST
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-foreground">Inbound Payload Inspector</span>
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-success">200 OK</span>
          </div>

          {/* Endpoint URL with Copy */}
          <div className="mt-2 sm:mt-2.5 flex items-center justify-between px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-card border border-border text-[10.5px] sm:text-[11px] text-muted-foreground">
            <span className="truncate">https://api.buildflow.dev/v1/wh/live_8a3f4e29</span>
            <button
              type="button"
              onClick={handleCopy}
              className="ml-2 flex items-center gap-1 text-primary hover:text-primary-hover font-semibold cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          {/* Simulated Inbound JSON */}
          <div className="mt-2 sm:mt-2.5 p-2 sm:p-3 rounded-lg bg-card border border-border text-[10.5px] sm:text-[11px] leading-snug overflow-x-auto text-foreground">
            <pre className="text-foreground">
{`{
  "event": "order.completed",
  "customer": "Sarah Connor",
  "score": 85,
  "total": 350.00
}`}
            </pre>
          </div>
        </div>

        <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-border/80 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>content-type: application/json</span>
          <span className="text-success font-semibold">Signature Validated ✓</span>
        </div>
      </div>
    </div>
  );

  const renderSlide2 = () => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-stretch h-full">
      {/* Left Column: Narrative & Specs */}
      <div className="md:col-span-5 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center p-2 shadow-xs text-primary shrink-0">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-primary uppercase">
                Step 02 / Logic
              </span>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-foreground">
                Set Your Logic
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-[13px] text-muted-foreground mt-2.5 leading-relaxed">
            Filter, route, and transform payload values with declarative visual conditions. Only send verified, high-value data forward without writing complex custom code.
          </p>

          {/* Feature Spec Matrix */}
          <div className="mt-2.5 sm:mt-3 space-y-1 sm:space-y-1.5 font-mono text-[10.5px]">
            <div className="flex items-center gap-2 text-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Multi-Condition Logic (AND / OR Groups)</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>In-Memory Evaluation (&lt; 0.5ms Execution)</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Dead-Letter Routing for Unmatched Data</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-border items-center justify-between text-xs font-mono text-muted-foreground flex">
          <span className="flex items-center gap-2 text-foreground font-semibold text-[11px]">
            <Zap className="w-3.5 h-3.5 text-primary" />
            Zero-Latency Evaluation
          </span>
          <span className="text-success font-semibold text-[11px]">Condition Matched (TRUE)</span>
        </div>
      </div>

      {/* Right Column: Visual Condition Inspector */}
      <div className="md:col-span-7 rounded-xl bg-secondary border border-border p-3 sm:p-4 font-mono text-xs shadow-inner flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-border">
            <span className="text-[11px] sm:text-xs font-bold text-foreground">Visual Condition Evaluator</span>
            <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9.5px] sm:text-[10px] font-semibold bg-card border border-border text-foreground">
              Numeric &gt;=
            </span>
          </div>

          {/* Condition expression box */}
          <div className="mt-2 sm:mt-2.5 p-2 sm:p-2.5 rounded-lg bg-card border border-border flex items-center justify-between text-[10.5px] sm:text-[11px]">
            <div className="flex items-center gap-2">
              <span className="px-1.5 sm:px-2 py-0.5 rounded bg-secondary text-foreground font-semibold">
                payload.score
              </span>
              <span className="text-muted-foreground font-bold">&gt;=</span>
              <span className="px-1.5 sm:px-2 py-0.5 rounded bg-secondary text-primary font-bold">
                80
              </span>
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-success flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              TRUE (85 &gt;= 80)
            </span>
          </div>

          {/* Branching decision outcomes */}
          <div className="mt-2 sm:mt-2.5 grid grid-cols-2 gap-2 sm:gap-2.5 text-[10px] sm:text-[11px]">
            {/* True Branch */}
            <div className="p-2 sm:p-2.5 rounded-lg bg-success/10 border border-success/30 flex flex-col justify-between min-h-[60px] sm:min-h-[72px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-success text-[10.5px] sm:text-[11px]">Branch A (Passed)</span>
                <span className="w-2 h-2 rounded-full bg-success" />
              </div>
              <span className="text-foreground text-[9.5px] sm:text-[10.5px] mt-1 leading-snug">
                Forward to Sheets + Gmail actions
              </span>
            </div>

            {/* False Branch */}
            <div className="p-2 sm:p-2.5 rounded-lg bg-card border border-border opacity-60 flex flex-col justify-between min-h-[60px] sm:min-h-[72px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-muted-foreground text-[10.5px] sm:text-[11px]">Branch B (Filtered Out)</span>
                <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              </div>
              <span className="text-muted-foreground text-[9.5px] sm:text-[10.5px] mt-1 leading-snug">
                Halt &amp; Log to Dead-Letter Queue
              </span>
            </div>
          </div>
        </div>

        <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-border/80 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Evaluator Mode: Strict</span>
          <span className="text-primary font-semibold">Evaluation time: 0.3ms</span>
        </div>
      </div>
    </div>
  );

  const renderSlide3 = () => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-stretch h-full">
      {/* Left Column: Narrative & Specs */}
      <div className="md:col-span-5 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-2 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center p-1.5 shadow-xs">
                <Image
                  src="/google_sheet.svg"
                  alt="Google Sheets"
                  width={22}
                  height={22}
                  className="w-5 h-5 object-contain"
                />
              </div>
              <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center p-1.5 shadow-xs">
                <Image
                  src="/gmail.svg"
                  alt="Gmail"
                  width={22}
                  height={22}
                  className="w-5 h-5 object-contain"
                />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-primary uppercase">
                Step 03 / Action
              </span>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-foreground">
                Update Your Tools
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-[13px] text-muted-foreground mt-2.5 leading-relaxed">
            Dispatch records to downstream systems in parallel. Append rows to Google Sheets, fire formatted Gmail notifications, or trigger custom APIs in a single cycle.
          </p>

          {/* Feature Spec Matrix */}
          <div className="mt-2.5 sm:mt-3 space-y-1 sm:space-y-1.5 font-mono text-[10.5px]">
            <div className="flex items-center gap-2 text-foreground">
              <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Non-Blocking Concurrent Dispatch</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Exponential Backoff Retries on 5xx</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Full Audit Trail &amp; Execution Payload Diffs</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground flex">
          <span className="flex items-center gap-2 text-primary font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Parallel Execution Active
          </span>
          <span className="text-foreground font-semibold text-[11px]">18.4ms Total Latency</span>
        </div>
      </div>

      {/* Right Column: Parallel Action Nodes Simulator */}
      <div className="md:col-span-7 rounded-xl bg-secondary border border-border p-3 sm:p-4 font-mono text-xs shadow-inner flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-border">
            <span className="text-[11px] sm:text-xs font-bold text-foreground">Concurrent Dispatch Matrix</span>
            <span className="text-[9.5px] sm:text-[10px] font-semibold text-muted-foreground">2 Actions Dispatched</span>
          </div>

          {/* Google Sheets Dispatch Card */}
          <div className="mt-2 sm:mt-2.5 p-2 sm:p-2.5 rounded-lg bg-card border border-border flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <Image
                src="/google_sheet.svg"
                alt="Google Sheets"
                width={20}
                height={20}
                className="w-4.5 h-4.5 sm:w-5 sm:h-5 object-contain shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-foreground truncate">
                  Sheets: Append Row
                </p>
                <p className="text-[9.5px] sm:text-[10px] text-muted-foreground truncate">
                  Sheet: "Q4 Enterprise Leads" (+1 row committed)
                </p>
              </div>
            </div>
            <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-success/10 text-success border border-success/30 shrink-0">
              COMMITTED (11.2ms)
            </span>
          </div>

          {/* Gmail Dispatch Card */}
          <div className="mt-2 sm:mt-2.5 p-2 sm:p-2.5 rounded-lg bg-card border border-border flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <Image
                src="/gmail.svg"
                alt="Gmail"
                width={20}
                height={20}
                className="w-4.5 h-4.5 sm:w-5 sm:h-5 object-contain shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-foreground truncate">
                  Gmail: Priority Alert
                </p>
                <p className="text-[9.5px] sm:text-[10px] text-muted-foreground truncate">
                  Recipient: sales@acme.corp (VIP Order #350)
                </p>
              </div>
            </div>
            <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-success/10 text-success border border-success/30 shrink-0">
              DELIVERED (7.2ms)
            </span>
          </div>
        </div>

        {/* Latency Pipeline Footer */}
        <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
          <span className="text-[10px] sm:text-[10.5px]">Async Parallel Window:</span>
          <span className="text-primary font-bold text-[10.5px] sm:text-[11px]">11.2ms concurrent</span>
        </div>
      </div>
    </div>
  );

  return (
    <section id="how-it-works" className="relative w-full">
      {/* ── Mobile View (< md): Clean Interactive Tabbed Flow (Zero Clipping, Zero Scroll-Jacking) ── */}
      <div className="block md:hidden py-10 px-4 max-w-lg mx-auto">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="flex items-center gap-1.5 mb-2.5">
            {[
              { idx: 0, label: "01 Webhook" },
              { idx: 1, label: "02 Filter" },
              { idx: 2, label: "03 Actions" }
            ].map((step) => {
              const isActive = mobileStep === step.idx;
              return (
                <button
                  key={step.idx}
                  type="button"
                  onClick={() => setMobileStep(step.idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-card font-semibold"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {step.label}
                </button>
              );
            })}
          </div>

          <h2 className="text-xl font-bold tracking-tight text-foreground">
            How BuildFlow works in 3 steps
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Tap each step above to inspect the live execution stage.
          </p>
        </div>

        {/* Active Mobile Card (Natural Auto-Height, No Clipping) */}
        <div className="w-full rounded-2xl bg-card border border-border shadow-card p-4 sm:p-5 transition-all">
          {mobileStep === 0 && renderSlide1()}
          {mobileStep === 1 && renderSlide2()}
          {mobileStep === 2 && renderSlide3()}
        </div>
      </div>

      {/* ── Tablet & Desktop View (>= md): Full 3D Scroll-Driven Flip Track ── */}
      <div
        ref={containerRef}
        className="hidden md:block relative h-[300vh] sm:h-[340vh] w-full"
      >
        {/* Sticky Viewport Stage: Sized comfortably to fit all laptop & desktop screens */}
        <div className="sticky top-16 sm:top-20 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] w-full flex flex-col justify-center items-center overflow-hidden px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
          
          {/* Section Header: Compact & Locked in View */}
          <div className="w-full max-w-5xl mx-auto flex flex-col items-center text-center mb-3 sm:mb-4 shrink-0 z-20">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
              {[
                { idx: 0, label: "01 Inbound Webhook", shortLabel: "01 Webhook" },
                { idx: 1, label: "02 Filter Logic", shortLabel: "02 Filter" },
                { idx: 2, label: "03 Actions", shortLabel: "03 Actions" }
              ].map((step) => {
                const isActive = activeStep === step.idx;
                return (
                  <button
                    key={step.idx}
                    type="button"
                    onClick={() => scrollToStep(step.idx)}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-card"
                        : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="sm:hidden">{step.shortLabel}</span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                );
              })}
            </div>

            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-foreground">
              How BuildFlow works in 3 steps
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground max-w-xl mx-auto hidden sm:block">
              Scroll to slide and inspect each stage. Each card locks in place for clear reading.
            </p>
          </div>

          {/* 3D Perspective Canvas Container */}
          <div
            className="w-full flex justify-center items-center"
            style={{ perspective: 1200 }}
          >
            {/* Horizontal Translating Track */}
            <motion.div
              style={{ x }}
              className="flex w-full will-change-transform"
            >
              {/* ═══════════════ SLIDE 1: INBOUND WEBHOOK ═══════════════ */}
              <div className="w-full shrink-0 flex justify-center items-center px-2 sm:px-4">
                <motion.div
                  style={{
                    rotateY: card1RotateY,
                    scale: card1Scale,
                    opacity: card1Opacity,
                    transformStyle: "preserve-3d"
                  }}
                  className="w-full max-w-5xl rounded-2xl bg-card border border-border shadow-card p-4 sm:p-6 lg:p-7 min-h-[320px] sm:min-h-[380px] lg:max-h-[415px] flex flex-col justify-center transition-colors"
                >
                  {renderSlide1()}
                </motion.div>
              </div>

              {/* ═══════════════ SLIDE 2: FILTER & CONDITION ═══════════════ */}
              <div className="w-full shrink-0 flex justify-center items-center px-2 sm:px-4">
                <motion.div
                  style={{
                    rotateY: card2RotateY,
                    scale: card2Scale,
                    opacity: card2Opacity,
                    transformStyle: "preserve-3d"
                  }}
                  className="w-full max-w-5xl rounded-2xl bg-card border border-border shadow-card p-4 sm:p-6 lg:p-7 min-h-[320px] sm:min-h-[380px] lg:max-h-[415px] flex flex-col justify-center transition-colors"
                >
                  {renderSlide2()}
                </motion.div>
              </div>

              {/* ═══════════════ SLIDE 3: PARALLEL DISPATCH ═══════════════ */}
              <div className="w-full shrink-0 flex justify-center items-center px-2 sm:px-4">
                <motion.div
                  style={{
                    rotateY: card3RotateY,
                    scale: card3Scale,
                    opacity: card3Opacity,
                    transformStyle: "preserve-3d"
                  }}
                  className="w-full max-w-5xl rounded-2xl bg-card border border-border shadow-card p-4 sm:p-6 lg:p-7 min-h-[320px] sm:min-h-[380px] lg:max-h-[415px] flex flex-col justify-center transition-colors"
                >
                  {renderSlide3()}
                </motion.div>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
