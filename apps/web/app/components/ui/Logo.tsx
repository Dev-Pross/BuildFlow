import { SVGProps } from "react";

/**
 * BuildFlowMark: Exact SVG reproduction of the BuildFlow brand mark.
 * Consists of exactly three shapes:
 * 1. Trigger node: outlined rounded squircle
 * 2. Connector: smooth S-curve
 * 3. Result node: solid circle
 * Uses currentColor for dynamic app theming.
 */
export function BuildFlowMark({
  className = "w-5 h-5",
  strokeWidth = 2.5,
  ...props
}: SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* 1. Connector: smooth S-curve leaving squircle right wall and merging into circle */}
      <path d="M 10 6.5 C 13.5 6.5, 13.5 10.0, 13.5 11.5 C 13.5 13.5, 13.5 18.0, 18.0 18.0" />
      {/* 2. Trigger node: outlined rounded square (hollow squircle frame) */}
      <rect x="3" y="3" width="7" height="7" rx="2" />
      {/* 3. Result node: solid circle drawn over curve end */}
      <circle cx="18" cy="18" r="3.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Backwards compatibility alias
export const WorkflowIcon = BuildFlowMark;

export interface LogoProps {
  variant?: "nav" | "footer" | "icon" | "tile" | "full" | "lockup";
  showTagline?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  /**
   * Surface context:
   * - "auto": Adapts dynamically to light/dark mode (for normal page surfaces)
   * - "chassis": Always renders the dark navbar tile with white text (for persistent dark sidebars)
   * - "dark": Forces dark tile styling and white text
   * - "light": Forces light tile styling and dark slate text
   */
  surface?: "auto" | "chassis" | "light" | "dark";
}

export function Logo({
  variant = "nav",
  showTagline = false,
  className = "",
  size = "md",
  surface = "auto",
}: LogoProps) {
  // Pure icon variant (no tile background)
  if (variant === "icon") {
    const iconSizes = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-8 h-8",
    };
    return <BuildFlowMark className={className || iconSizes[size]} />;
  }

  // Determine surface theme classes for tile and wordmark
  const isChassis = surface === "chassis";
  const isDarkSurface = surface === "dark" || isChassis;
  const isLightSurface = surface === "light";

  const tileThemeClasses = isChassis
    ? "bg-logo-tile-dark-bg border-logo-tile-dark-border text-logo-tile-dark-mark"
    : isDarkSurface
    ? "bg-logo-tile-dark-bg border-logo-tile-dark-border text-logo-tile-dark-mark"
    : isLightSurface
    ? "bg-logo-tile-light-bg border-logo-tile-light-border text-logo-tile-light-mark"
    : "bg-logo-tile-bg border-logo-tile-border text-logo-tile-mark";

  const textThemeClasses = isChassis
    ? "text-chassis-foreground"
    : isDarkSurface
    ? "text-white"
    : isLightSurface
    ? "text-[#0F172A]"
    : "text-foreground";

  const taglineThemeClasses = isChassis
    ? "text-chassis-foreground/60"
    : isDarkSurface
    ? "text-zinc-400"
    : isLightSurface
    ? "text-[#475569]"
    : "text-muted-foreground";

  // Standalone branded tile variant
  // Corner radii: ~22% of dimension (rounded-md for 28px, rounded-lg for 32px, rounded-xl for 48px)
  if (variant === "tile") {
    const tileSizes = {
      sm: "h-7 w-7 rounded-md",
      md: "h-8 w-8 rounded-lg",
      lg: "h-12 w-12 rounded-xl",
    };
    const iconSizes = {
      sm: "h-3.5 w-3.5",
      md: "h-4 w-4",
      lg: "h-6 w-6",
    };
    return (
      <div
        className={`${tileSizes[size]} ${tileThemeClasses} border flex items-center justify-center shadow-xs shrink-0 transition-transform group-hover:scale-105 ${className}`}
      >
        <BuildFlowMark className={iconSizes[size]} strokeWidth={2.5} />
      </div>
    );
  }

  // Large footer / hero showcase variant
  if (variant === "footer" || variant === "full") {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        {/* Large Brand Emblem Tile (rounded-2xl is ~22% of 64px) */}
        <div className={`p-3.5 rounded-2xl ${tileThemeClasses} border transition-transform duration-300 group-hover:scale-105 shadow-xs shrink-0`}>
          <BuildFlowMark className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={2.5} />
        </div>
        {/* Wordmark + Tagline Lockup */}
        <div className="flex flex-col">
          <span className={`text-2xl sm:text-3xl font-bold font-sans tracking-tight ${textThemeClasses}`}>
            BuildFlow
          </span>
          {(showTagline || true) && (
            <span className={`text-[11px] font-medium font-sans uppercase tracking-[0.08em] ${taglineThemeClasses} mt-0.5`}>
              Visual automation canvas
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default: "nav" / "lockup" variant
  // Navbar tile height (32px) equals ~1.6x wordmark cap height (~20px).
  // Gap between tile and wordmark is half tile width (12-14px ~ gap-3).
  // Corner radius is 8px (rounded-lg) for squircle proportions, never a circle.
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Navbar Tile */}
      <div className={`h-8 w-8 rounded-lg ${tileThemeClasses} border flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 shrink-0`}>
        <BuildFlowMark className="h-4 w-4" strokeWidth={2.5} />
      </div>
      {/* Wordmark */}
      <div className="flex flex-col justify-center">
        <span className={`text-base font-bold font-sans tracking-tight ${textThemeClasses} leading-none`}>
          BuildFlow
        </span>
        {showTagline && (
          <span className={`text-[9px] font-medium font-sans uppercase tracking-[0.08em] ${taglineThemeClasses} mt-1`}>
            Visual automation canvas
          </span>
        )}
      </div>
    </div>
  );
}
