"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  GitBranch,
  Sliders,
  Cpu,
  Search,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
  Sparkles,
  ExternalLink,
  Layers,
  Database
} from "lucide-react";

export type IntegrationCategory = "all" | "triggers" | "actions" | "logic";

interface IntegrationItem {
  id: string;
  name: string;
  category: "triggers" | "actions" | "logic";
  nodeType: "TRIGGER" | "ACTION" | "LOGIC";
  tag: string;
  description: string;
  authType: "OAuth 2.0" | "API Key" | "Native" | "Webhook Endpoint";
  iconType: "image" | "lucide";
  iconSrc?: string;
  lucideIcon?: any;
}

const INTEGRATIONS_DATA: IntegrationItem[] = [
  {
    id: "webhooks",
    name: "Inbound Webhook",
    category: "triggers",
    nodeType: "TRIGGER",
    tag: "Workflow Trigger",
    description: "Instant endpoint receiving JSON payloads from Stripe, Shopify, GitHub, or custom services to start workflows.",
    authType: "Webhook Endpoint",
    iconType: "image",
    iconSrc: "/webhook.svg",
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    category: "actions",
    nodeType: "ACTION",
    tag: "Spreadsheet Action",
    description: "Read rows, append new entries, update cell ranges, and clear sheets with secure Google OAuth 2.0.",
    authType: "OAuth 2.0",
    iconType: "image",
    iconSrc: "/google_sheet.svg",
  },
  {
    id: "gmail",
    name: "Gmail",
    category: "actions",
    nodeType: "ACTION",
    tag: "Email Action",
    description: "Send dynamic templated emails and notification alerts through authenticated Google mail accounts.",
    authType: "OAuth 2.0",
    iconType: "image",
    iconSrc: "/gmail.svg",
  },
  {
    id: "http-api",
    name: "HTTP Request",
    category: "actions",
    nodeType: "ACTION",
    tag: "Outbound API Action",
    description: "Send outbound GET, POST, PUT, PATCH, and DELETE requests to any external REST API with headers and bearer tokens.",
    authType: "API Key",
    iconType: "lucide",
    lucideIcon: Globe,
  },
  {
    id: "conditional-logic",
    name: "If / Else Branching",
    category: "logic",
    nodeType: "LOGIC",
    tag: "Rule Engine",
    description: "Route data to True or False execution branches based on visual condition groups and comparison rules.",
    authType: "Native",
    iconType: "lucide",
    lucideIcon: GitBranch,
  },
  {
    id: "data-filter",
    name: "Data Ops & Deduplication",
    category: "logic",
    nodeType: "LOGIC",
    tag: "Data Transformation",
    description: "Deduplicate dataset rows, compare new vs. existing data lists, and group payload records by key.",
    authType: "Native",
    iconType: "lucide",
    lucideIcon: Sliders,
  },
  {
    id: "iterator",
    name: "Array Loop Iterator",
    category: "logic",
    nodeType: "LOGIC",
    tag: "Batch Looping",
    description: "Extract and split array items from previous payloads into individual records for per-item execution.",
    authType: "Native",
    iconType: "lucide",
    lucideIcon: Layers,
  },
];

const CATEGORIES: { id: IntegrationCategory; label: string; count: number }[] = [
  { id: "all", label: "All Nodes", count: 7 },
  { id: "triggers", label: "Triggers", count: 1 },
  { id: "actions", label: "Actions", count: 3 },
  { id: "logic", label: "Logic & Transforms", count: 3 },
];

export function IntegrationsSection() {
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIntegrations = useMemo(() => {
    return INTEGRATIONS_DATA.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tag.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section id="integrations" className="py-20 sm:py-24 px-4 sm:px-6 max-w-[1200px] mx-auto border-t border-border">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Ecosystem
        </p>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
          Connect the tools you already rely on
        </h2>
        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Plug into modern cloud services with zero glue code. BuildFlow handles encrypted OAuth 2.0 refreshes, rate limits, and webhook retries out of the box.
        </p>
      </div>

      {/* Interactive Controls Bar: Category Pills + Search Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 sm:mb-10">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${isActive
                    ? "bg-primary text-primary-foreground shadow-card font-semibold"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Input Box */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter integrations..."
            aria-label="Filter integrations"
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-card border border-border text-foreground text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors shadow-xs"
          />
        </div>
      </div>

      {/* Integrations Responsive Grid (1 col mobile, 2 col tablet, 4 col desktop) */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
      >
        <AnimatePresence>
          {filteredIntegrations.map((item) => {
            const LucideIcon = item.lucideIcon;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="group relative rounded-xl bg-card border border-border p-5 hover:border-primary/50 transition-all duration-300 shadow-card flex flex-col justify-between hover:-translate-y-1"
              >
                <div>
                  {/* Card Header: Icon + Node Type Badge */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center p-2 shadow-xs group-hover:border-primary/40 transition-colors">
                      {item.iconType === "image" && item.iconSrc ? (
                        <Image
                          src={item.iconSrc}
                          alt={item.name}
                          width={24}
                          height={24}
                          className="w-5 h-5 object-contain"
                        />
                      ) : LucideIcon ? (
                        <LucideIcon className="w-5 h-5 text-primary" />
                      ) : null}
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-wider uppercase transition-colors ${
                        item.nodeType === "TRIGGER"
                          ? "bg-primary/10 text-primary border border-primary/25"
                          : "bg-secondary text-muted-foreground border border-border"
                      }`}
                    >
                      {item.nodeType}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Card Footer: Metadata Tag */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <span className="text-[10px] font-semibold text-muted-foreground">{item.authType}</span>
                  <span className="text-primary font-semibold text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <span>Configurable</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Empty Search State */}
      {filteredIntegrations.length === 0 && (
        <div className="py-12 text-center border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground">
            No integrations found matching <span className="font-semibold text-foreground">"{searchQuery}"</span>.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="mt-3 text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Integration Strip Footer / Custom API Callout */}
      <div className="mt-10 sm:mt-12 p-5 sm:p-6 rounded-2xl bg-secondary/50 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-primary shadow-xs shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              Don't see your internal system?
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Connect any custom REST API or webhook destination using our generic HTTP Request Node with bearer tokens and headers.
            </p>
          </div>
        </div>

        <a
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border border-border text-foreground text-xs font-semibold hover:bg-muted hover:border-primary/40 transition-colors shadow-xs shrink-0"
        >
          <span>Explore HTTP Node</span>
          <ArrowRight className="w-3.5 h-3.5 text-primary" />
        </a>
      </div>
    </section>
  );
}
