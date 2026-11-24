"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Workflow,
  Webhook,
  ArrowRight,
  Zap,
  GitBranch,
  Play,
  Activity,
  Layers,
  FileSpreadsheet,
  Mail,
  Globe,
  Sliders,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Database,
  Lock,
  Boxes,
  Clock,
  Check,
  Filter,
  Copy,
  Menu,
  X
} from "lucide-react";
import { IsometricHeroSystem } from "./components/ui/Design/IsometricHeroSystem";
import { ScrollFlipWorkflow } from "./components/ui/Design/ScrollFlipWorkflow";
import { FeaturesBentoGrid } from "./components/ui/Design/FeaturesBentoGrid";
import { IntegrationsSection } from "./components/ui/Design/IntegrationsSection";
import { FooterAboutSection } from "./components/ui/Design/FooterAboutSection";
import { ThemeToggle } from "./components/ui/ThemeToggle";
import { Logo } from "./components/ui/Logo";

// ─── Animation Variants ───
const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
  }
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const [replayKey, setReplayKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-clip selection:bg-primary/20 selection:text-primary relative">

      {/* ── Navigation Bar ── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="group shrink-0" aria-label="BuildFlow Home">
            <Logo variant="nav" />
          </Link>

          <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#integrations" className="hover:text-foreground transition-colors">Integrations</a>
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="hidden sm:block">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary-hover transition-colors shadow-card"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Link>
              </motion.div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="hidden sm:block">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary-hover transition-colors shadow-card"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Link>
                </motion.div>
              </>
            )}

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md px-5 py-4 flex flex-col gap-3 shadow-lg">
            {/* Mobile Prominent Full-Width CTA */}
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-card"
              >
                <span>Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-card"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            <nav className="flex flex-col gap-2 text-sm font-medium text-muted-foreground pt-1">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-foreground transition-colors"
              >
                How It Works
              </a>

              <a
                href="#integrations"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-foreground transition-colors"
              >
                Integrations
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-foreground transition-colors"
              >
                About
              </a>
            </nav>
            {!isAuthenticated && (
              <div className="pt-2.5 border-t border-border flex items-center justify-between">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Already have an account? <span className="text-primary font-semibold">Sign In</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </motion.header>

      {/* ── Split-Screen Hero Section (Isometric Systems Aesthetic) ── */}
      <section className="relative pt-4 sm:pt-6 lg:pt-8 pb-10 sm:pb-14 lg:pb-20 px-4 sm:px-6 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* Left Column (Content & CTAs) */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-display font-bold tracking-tight text-foreground leading-[1.2]">
              Stop repeating tasks.
              <span className="block mt-2">
                Start <span className="text-primary">building flows.</span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 sm:mt-6 text-sm sm:text-base leading-normal text-muted-foreground max-w-xl">
              Connect Gmail, Sheets, and any API in one visual canvas. Design your workflow once, and BuildFlow runs it reliably every time.
            </p>

            {/* Dual CTA Row */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Link
                href={isAuthenticated ? "/dashboard" : "/login"}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.98] transition-colors shadow-card w-full sm:w-auto"
              >
                <span>Start building</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.98] transition-colors shadow-card cursor-pointer w-full sm:w-auto"
              >
                <Play className="h-3.5 w-3.5 text-muted-foreground fill-muted-foreground/20" />
                <span>See how it works</span>
              </a>
            </div>

            {/* Micro-proof row */}
            <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-border flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 text-xs sm:text-sm text-muted-foreground w-full">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Drag-and-drop canvas</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>No glue code</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Runs automatically</span>
              </div>
            </div>
          </div>

          {/* Right Column (Isometric System Container) */}
          <div className="lg:col-span-7 relative w-full items-center justify-center overflow-visible">
            <IsometricHeroSystem replayTrigger={replayKey} />
          </div>
        </div>

        {/* Hero Bottom Anchor: Integration Strip */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-8 sm:mt-12 lg:mt-16">
          <div className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
            WORKS SEAMLESSLY WITH
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              <span>Webhooks</span>
            </div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Google Sheets</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Gmail</span>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>HTTP APIs</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: How BuildFlow Works (Scroll-Slide-Flip Lifecycle) ── */}
      <ScrollFlipWorkflow />

      {/* ── Section 3: Platform Capabilities Bento Grid ── */}
      <FeaturesBentoGrid />

      {/* ── Section 4: Ecosystem & Integrations Hub ── */}
      <IntegrationsSection />

      {/* ── Section 5: Final Call-to-Action ── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative rounded-3xl bg-card border border-border p-8 sm:p-14 lg:p-16 text-center overflow-hidden shadow-card"
        >
          {/* Subtle Radial Ambient Glow (Token Based) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[320px] rounded-full blur-3xl"
            style={{
              background: "radial-gradient(circle at center, color-mix(in srgb, var(--primary) 10%, transparent) 0%, transparent 70%)"
            }}
          />

          <h2 className="relative z-10 text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-4 sm:mb-6">
            Ready to build your first workflow?
          </h2>
          <p className="relative z-10 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            Connect triggers, filter incoming payloads, and dispatch parallel actions across Google Sheets and Gmail with zero server maintenance.
          </p>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
              <Link
                href={isAuthenticated ? "/dashboard" : "/login"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.98] transition-colors shadow-card"
              >
                <span>{isAuthenticated ? "Go to Dashboard" : "Get Started for Free"}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.98] transition-colors shadow-card cursor-pointer"
            >
              <span>See How It Works</span>
            </a>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-border flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span>No credit card required</span>
            <span>•</span>
            <span>Instant webhook URL</span>
            <span>•</span>
            <span>Live visual canvas</span>
          </div>
        </motion.div>
      </section>

      {/* ── Section 6: About & Mega Footer with Logo Selector ── */}
      <FooterAboutSection />
    </div>
  );
}