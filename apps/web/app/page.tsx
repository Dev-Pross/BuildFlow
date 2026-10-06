"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Workflow,
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
  Check
} from "lucide-react";

// ─── Animation Variants ───
const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
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
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;

  return (
    <div className="min-h-screen bg-[#000000] text-[#f9fafb] overflow-x-hidden selection:bg-indigo-500/20 selection:text-indigo-300 relative">
      {/* ── Vibe Coded Animated Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#000000]">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        
        {/* Noise texture for grain (vibe-coded aesthetic) */}
        <div className="absolute inset-0 opacity-[0.04] mix-blend-screen" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }} />

        {/* Animated Aurora Orbs */}
        <motion.div 
          animate={{ 
            x: ["0%", "-10%", "10%", "0%"],
            y: ["0%", "10%", "-10%", "0%"],
            scale: [1, 1.1, 0.9, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen"
        />
        
        <motion.div 
          animate={{ 
            x: ["0%", "15%", "-5%", "0%"],
            y: ["0%", "-15%", "5%", "0%"],
            scale: [1, 1.2, 0.8, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[20%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen"
        />
        
        <motion.div 
          animate={{ 
            x: ["0%", "-5%", "15%", "0%"],
            y: ["0%", "5%", "-15%", "0%"],
            scale: [1, 0.9, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute -bottom-[10%] left-[15%] w-[60vw] h-[60vw] rounded-full bg-emerald-600/10 blur-[120px] mix-blend-screen"
        />

        <motion.div 
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] rounded-full bg-blue-600/10 blur-[100px] mix-blend-screen"
        />
      </div>

      {/* ── Navigation Bar ── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-50 border-b border-[#222429] bg-[#0f1012]/80 backdrop-blur-xl sticky top-0"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-indigo-500/5">
              <Workflow className="h-5 w-5 text-indigo-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Build<span className="text-indigo-400">Flow</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#canvas-preview" className="hover:text-white transition-colors">Canvas</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#integrations" className="hover:text-white transition-colors">Integrations</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all shadow-md shadow-white/10"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all shadow-md shadow-white/10"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* ── Hero Section ── */}
      <section className="relative z-10 pt-20 pb-24 px-6 max-w-7xl mx-auto text-center">
        {/* Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#18191c] border border-[#27282d] text-xs font-semibold text-indigo-300 mb-8 shadow-inner"
        >
          <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
          <span>Next-Generation Visual Automation Engine</span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.12]"
        >
          Automate <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-300">Everything</span>.<br />
          Build Workflows Visually.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
        >
          Connect webhooks, spreadsheets, APIs, and microservices on an infinite interactive canvas.
          Orchestrate multi-step branches, filters, and loops with live variable interpolation.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
            <Link
              href={isAuthenticated ? "/workflows" : "/register"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-white text-black text-base font-bold hover:bg-gray-100 transition-all shadow-xl shadow-white/10"
            >
              <span>{isAuthenticated ? "Open Workflow Canvas" : "Start Building Free"}</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#141518] border border-[#222429] text-white text-base font-semibold hover:border-indigo-500/40 hover:bg-[#18191c] transition-all"
            >
              <Play className="h-4 w-4 text-indigo-400" />
              <span>Explore Dashboard</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Metrics Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-10 border-t border-[#222429]/60"
        >
          <div className="text-center">
            <div className="text-3xl font-extrabold text-white">99.99%</div>
            <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">Uptime Guarantee</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-white">&lt;20ms</div>
            <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">Execution Latency</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-white">50+</div>
            <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">Native Integrations</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-white">100%</div>
            <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">Visual Flow Builder</div>
          </div>
        </motion.div>

        {/* ── Make.com Style Interactive Canvas Preview ── */}
        <motion.div
          id="canvas-preview"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 relative max-w-5xl mx-auto"
        >
          {/* Card Outer Frame */}
          <div className="rounded-3xl border border-[#222429] bg-[#141518]/95 p-3 sm:p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Window controls bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#222429] mb-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#27282d]" />
                <div className="h-3 w-3 rounded-full bg-[#27282d]" />
                <div className="h-3 w-3 rounded-full bg-[#27282d]" />
                <span className="ml-3 text-xs font-mono text-gray-500">workflow_sync_production.flow</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Syncing
                </span>
              </div>
            </div>

            {/* Dotted Canvas with Pastel Make.com Nodes */}
            <div className="relative h-[380px] sm:h-[430px] rounded-2xl bg-[#f8fafc] border border-gray-200/80 flex items-center justify-center p-6 overflow-hidden bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:20px_20px]">
              {/* Floating Canvas Elements */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 w-full max-w-4xl relative z-10">
                {/* Node 1: Webhook Trigger (Make.com Pastel Rose/Pink Card) */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-60 p-4 rounded-2xl bg-[#fdf2f8] border-2 border-pink-300 shadow-xl shadow-pink-100/50 flex flex-col gap-3 relative cursor-grab active:cursor-grabbing hover:shadow-2xl transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm border border-pink-200 flex items-center justify-center text-pink-600">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-gray-900">Webhook Catch</div>
                      <div className="text-[10px] text-gray-600 font-mono">POST /hooks/order</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-pink-200/80 text-[10px]">
                    <span className="text-pink-700 font-bold">✓ Active Trigger</span>
                    <span className="text-gray-500 font-mono">200 OK</span>
                  </div>
                </motion.div>

                {/* Animated Connection Line 1 */}
                <div className="hidden sm:flex items-center justify-center text-indigo-500">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-pink-300 via-indigo-300 to-purple-300" />
                  <ChevronRight className="h-4 w-4 -ml-2 text-indigo-500" />
                </div>

                {/* Node 2: Logic / Filter (Make.com Pastel Purple Card) */}
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="w-60 p-4 rounded-2xl bg-[#faf5ff] border-2 border-purple-300 shadow-xl shadow-purple-100/50 flex flex-col gap-3 relative cursor-grab active:cursor-grabbing hover:shadow-2xl transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm border border-purple-200 flex items-center justify-center text-purple-600">
                      <Sliders className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-gray-900">Amount Filter</div>
                      <div className="text-[10px] text-gray-600 font-mono">total &gt; $100</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-purple-200/80 text-[10px]">
                    <span className="text-purple-700 font-bold">2 Branches</span>
                    <span className="text-gray-500 font-mono">Passed (True)</span>
                  </div>
                </motion.div>

                {/* Animated Connection Line 2 */}
                <div className="hidden sm:flex items-center justify-center text-emerald-500">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-purple-300 via-emerald-300 to-emerald-400" />
                  <ChevronRight className="h-4 w-4 -ml-2 text-emerald-500" />
                </div>

                {/* Node 3: Google Sheets Action (Make.com Pastel Mint Card) */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="w-60 p-4 rounded-2xl bg-[#ecfdf5] border-2 border-emerald-300 shadow-xl shadow-emerald-100/50 flex flex-col gap-3 relative cursor-grab active:cursor-grabbing hover:shadow-2xl transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-gray-900">Google Sheets</div>
                      <div className="text-[10px] text-gray-600 font-mono">Append Row</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-emerald-200/80 text-[10px]">
                    <span className="text-emerald-700 font-bold">✓ Synced</span>
                    <span className="text-gray-500 font-mono">14ms</span>
                  </div>
                </motion.div>
              </div>

              {/* Make.com Floating Bottom Toolbar Pill */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-2xl bg-white shadow-xl border border-gray-200 text-xs font-semibold text-gray-700">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Run once</span>
                </button>
                <div className="h-4 w-px bg-gray-200" />
                <span className="text-gray-500 text-[11px] hidden sm:inline">Auto-save on edit</span>
              </div>

              {/* Floating metrics badge */}
              <div className="absolute top-4 left-4 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white shadow-md border border-gray-200 text-xs text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold text-gray-800">100% Success Rate</span>
              </div>

              <div className="absolute top-4 right-4 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white shadow-md border border-gray-200 text-xs text-gray-600">
                <span>Avg latency:</span>
                <span className="text-indigo-600 font-bold">14ms</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Key Features Grid (Framer Motion Staggered Scroll) ── */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto border-t border-[#222429]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Capabilities</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Designed for Developers. Intuitive for Everyone.
          </h2>
          <p className="mt-4 text-gray-400">
            Everything you need to orchestrate complex data pipelines, webhooks, and automation loops.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Feature 1 */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="p-7 rounded-3xl bg-[#141518] border border-[#222429] hover:border-indigo-500/40 transition-colors group shadow-lg"
          >
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Infinite Drag &amp; Drop Canvas</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Built on ReactFlow with full branch wiring, multi-select, zoom controls, and smart edge routing.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="p-7 rounded-3xl bg-[#141518] border border-[#222429] hover:border-purple-500/40 transition-colors group shadow-lg"
          >
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
              <GitBranch className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Conditional Logic &amp; Branching</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Create compound AND/OR condition groups, array iterators, and row uniqueness filters without code.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="p-7 rounded-3xl bg-[#141518] border border-[#222429] hover:border-emerald-500/40 transition-colors group shadow-lg"
          >
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
              <Play className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Single-Node Live Testing</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Execute individual nodes on demand, inspect raw inputs and outputs, and test before deploying.
            </p>
          </motion.div>

          {/* Feature 4 */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="p-7 rounded-3xl bg-[#141518] border border-[#222429] hover:border-sky-500/40 transition-colors group shadow-lg"
          >
            <div className="h-12 w-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400 mb-5 group-hover:scale-110 transition-transform">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">HTTP &amp; Webhook Engine</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Full REST support with custom headers, authentication tokens, JSON payloads, and dynamic parameters.
            </p>
          </motion.div>

          {/* Feature 5 */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="p-7 rounded-3xl bg-[#141518] border border-[#222429] hover:border-amber-500/40 transition-colors group shadow-lg"
          >
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Execution Logs &amp; Analytics</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Detailed step-by-step audit trails with execution duration, payload snapshots, and trend charts.
            </p>
          </motion.div>

          {/* Feature 6 */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="p-7 rounded-3xl bg-[#141518] border border-[#222429] hover:border-rose-500/40 transition-colors group shadow-lg"
          >
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 mb-5 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Secure OAuth Credentials</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Native Google OAuth token refresh, encrypted database storage, and per-user permission boundaries.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* ── How It Works Section (Framer Motion Slide-In Cards) ── */}
      <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto border-t border-[#222429]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Workflow Lifecycle</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How BuildFlow Works in 3 Steps
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
        >
          {/* Step 1 */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="p-8 rounded-3xl bg-[#141518] border border-[#222429] flex flex-col items-center text-center shadow-lg"
          >
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 font-extrabold text-xl flex items-center justify-center mb-6">
              1
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Define Your Trigger</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Listen for external webhook payloads, scheduled cron jobs, or manual run invocations to trigger the flow.
            </p>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="p-8 rounded-3xl bg-[#141518] border border-[#222429] flex flex-col items-center text-center shadow-lg"
          >
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 font-extrabold text-xl flex items-center justify-center mb-6">
              2
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Map &amp; Transform Data</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Wire nodes together. Reference output properties using <code className="text-indigo-400 font-mono text-xs bg-indigo-500/10 px-1.5 py-0.5 rounded">{"{{trigger.email}}"}</code> syntax with rich variable chips.
            </p>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="p-8 rounded-3xl bg-[#141518] border border-[#222429] flex flex-col items-center text-center shadow-lg"
          >
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 font-extrabold text-xl flex items-center justify-center mb-6">
              3
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Execute &amp; Monitor</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Run automatically in the background. Trace step execution latency, error messages, and metrics in real-time.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Integrations Section (Framer Motion Staggered Badges) ── */}
      <section id="integrations" className="py-24 px-6 max-w-7xl mx-auto border-t border-[#222429] text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeInUp}
          className="max-w-3xl mx-auto mb-14"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Ecosystem</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Connect Your Favorite Tools
          </h2>
          <p className="mt-4 text-gray-400">
            Plug into modern services with pre-configured node templates and OAuth 2.0.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="flex flex-wrap items-center justify-center gap-4 max-w-4xl mx-auto"
        >
          {[
            { name: "Google Sheets", icon: FileSpreadsheet, color: "text-emerald-400" },
            { name: "Gmail", icon: Mail, color: "text-rose-400" },
            { name: "Webhooks", icon: Zap, color: "text-pink-400" },
            { name: "HTTP Request", icon: Globe, color: "text-sky-400" },
            { name: "Logic & If-Else", icon: GitBranch, color: "text-purple-400" },
            { name: "Data Filter", icon: Sliders, color: "text-amber-400" },
            { name: "AI Automations", icon: Cpu, color: "text-indigo-400" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.name}
                variants={scaleIn}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#141518] border border-[#222429] hover:border-indigo-500/40 transition-colors shadow-sm"
              >
                <Icon className={`h-5 w-5 ${item.color}`} />
                <span className="text-sm font-semibold text-white">{item.name}</span>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── Big CTA Section ── */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl bg-gradient-to-br from-[#141518] to-[#18191c] border border-[#222429] p-12 sm:p-16 text-center overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-6">
            Ready to Build Your First Workflow?
          </h2>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join developers and teams automating their systems with zero friction. Free to get started.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={isAuthenticated ? "/workflows" : "/register"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-black text-base font-bold hover:bg-gray-100 transition-all shadow-xl shadow-white/10"
              >
                <span>{isAuthenticated ? "Launch Workflow Editor" : "Create Free Account"}</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#222429] py-12 px-6 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-3">
          <Workflow className="h-5 w-5 text-indigo-400" />
          <span className="font-bold text-white">BuildFlow</span>
          <span>© 2026. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-gray-400">
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <Link href="/workflows" className="hover:text-white transition-colors">Workflows</Link>
          <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          <Link href="/register" className="hover:text-white transition-colors">Register</Link>
        </div>
      </footer>
    </div>
  );
}