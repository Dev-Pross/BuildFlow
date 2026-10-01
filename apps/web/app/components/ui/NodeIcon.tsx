import React from "react";

interface NodeIconProps {
  icon?: string | null;
  name?: string;
  nodeType?: "trigger" | "action";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  sm: "w-7 h-7 text-sm",
  md: "w-8 h-8 text-base",
  lg: "w-9 h-9 text-lg",
  xl: "w-12 h-12 text-2xl",
};

export function NodeIcon({
  icon,
  name,
  nodeType = "action",
  size = "md",
  className = "",
}: NodeIconProps) {
  const isImageUrl =
    typeof icon === "string" &&
    (icon.startsWith("http://") ||
      icon.startsWith("https://") ||
      icon.startsWith("/") ||
      icon.startsWith("data:image"));

  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      className={`relative flex-shrink-0 flex items-center justify-center rounded-lg bg-white/10 p-1 border border-white/5 shadow-sm overflow-hidden ${sizeClasses} ${className}`}
    >
      {isImageUrl ? (
        <img
          src={icon}
          alt={name || "Node icon"}
          className="w-full h-full object-contain"
        />
      ) : icon ? (
        <span className="leading-none select-none font-sans">{icon}</span>
      ) : nodeType === "trigger" ? (
        <svg
          className="w-3/5 h-3/5 text-amber-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ) : (
        <svg
          className="w-3/5 h-3/5 text-indigo-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      )}
    </div>
  );
}

export default NodeIcon;
