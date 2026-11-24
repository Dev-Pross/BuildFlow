"use client";

import Link from "next/link";
import { ShieldCheck, Github, Linkedin, Twitter, Mail, X, TwitchIcon, TwitterIcon } from "lucide-react";
import { Logo } from "../Logo";

export function FooterAboutSection() {
  return (
    <footer id="about" className="border-t border-border bg-card/40 pt-16 sm:pt-20 pb-12 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* ── Main About / Footer 2-Column Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 pb-14 border-b border-border items-start">

          {/* ═══════════ LEFT COLUMN: Large Brand Card + Connect With Us ═══════════ */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* Large Brand Showcase Card (Inspired by Reference) */}
            <div className="w-full h-[220px] sm:h-[260px] rounded-2xl bg-card border border-border shadow-xl flex flex-col items-center justify-center p-8 relative overflow-hidden group">
              {/* Subtle ambient gradient backdrop */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

              {/* Centered Brand Mark + Wordmark */}
              <div className="relative z-10">
                <Logo variant="footer" showTagline />
              </div>
            </div>

            {/* Connect With Us Section */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Connect With Us</p>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/Dev-Pross/BuildFlow/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="BuildFlow on GitHub"
                  className="w-10 h-10 rounded-xl bg-card hover:bg-secondary border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 shadow-xs"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="https://www.linkedin.com/in/srinivas-sai-saran-teja-budumuru-15123a292"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="BuildFlow on LinkedIn"
                  className="w-10 h-10 rounded-xl bg-card hover:bg-secondary border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 shadow-xs"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="http://x.com/_Teja__Budumuru"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="BuildFlow on X (Twitter)"
                  className="w-10 h-10 rounded-xl bg-card hover:bg-secondary border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 shadow-xs"
                >
                  <TwitterIcon className="w-4 h-4" />
                </a>
                <a
                  href="mailto:tejabudumuru3@gmail.com"
                  aria-label="Contact BuildFlow Team"
                  className="w-10 h-10 rounded-xl bg-card hover:bg-secondary border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 shadow-xs"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

          </div>

          {/* ═══════════ RIGHT COLUMN: Platform Mission + Core Capabilities ═══════════ */}
          <div className="lg:col-span-7 flex flex-col pt-1">

            {/* Section Tag */}
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary mb-3">
              About The Platform
            </span>

            {/* Main Headline */}
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-4">
              Automation without the glue code.
            </h2>

            {/* Narrative Mission Paragraph */}
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6 max-w-2xl">
              BuildFlow eliminates the tedious manual work of moving data between apps. Ingest webhooks from Stripe or forms, apply simple filters, and update Google Sheets or send emails automatically, all on a clear, visual canvas.
            </p>

            {/* 3 Core Reliability Indicators */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 py-4 px-4 sm:px-5 rounded-xl bg-card border border-border shadow-xs mb-6 max-w-xl">
              <div>
                <span className="text-lg sm:text-xl font-bold font-mono tracking-tight text-foreground block">
                  0 code
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight mt-0.5 block">
                  No scripts or server setup
                </span>
              </div>
              <div className="border-l border-border pl-3 sm:pl-4">
                <span className="text-lg sm:text-xl font-bold font-mono tracking-tight text-foreground block">
                  &lt; 10ms
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight mt-0.5 block">
                  Webhook payload capture
                </span>
              </div>
              <div className="border-l border-border pl-3 sm:pl-4">
                <span className="text-lg sm:text-xl font-bold font-mono tracking-tight text-foreground block">
                  100%
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight mt-0.5 block">
                  Visual step-by-step runs
                </span>
              </div>
            </div>

            {/* What We Do Subhead */}
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Core Capabilities
            </h3>

            {/* Single-Line Compact Pill Chips (HireHawk Match) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl">
              {[
                "Visual Drag & Drop Canvas",
                "Inbound Webhook Ingestion",
                "Declarative Conditional Logic",
                "Guaranteed Action Dispatch",
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 rounded-xl bg-card border border-border flex items-center gap-3 transition-colors hover:border-primary/40 shadow-xs group"
                >
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0 transition-transform group-hover:scale-125" />
                  <span className="text-sm font-semibold text-foreground tracking-tight">
                    {item}
                  </span>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* ── Bottom Baseline Row: Copyright & Nav Links ── */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 BuildFlow Inc. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#integrations" className="hover:text-foreground transition-colors">
              Integrations
            </a>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
