import React from "react";
import { 
  Zap, 
  Globe, 
  Filter, 
  GitFork, 
  Repeat, 
  FileSpreadsheet, 
  Mail, 
  SlidersHorizontal,
  Bot
} from "lucide-react";

interface NodeIconProps {
  icon?: string | null;
  name?: string;
  nodeType?: "trigger" | "action";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-11 h-11 text-base",
  xl: "w-14 h-14 text-xl",
};

const ICON_SIZE_MAP = {
  sm: 14,
  md: 18,
  lg: 22,
  xl: 28,
};

export function NodeIcon({
  icon,
  name = "",
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
  const iconPixelSize = ICON_SIZE_MAP[size] || ICON_SIZE_MAP.md;
  const lowerName = name.toLowerCase();

  const renderKnownIcon = () => {
    if (lowerName.includes("sheet")) {
      return <FileSpreadsheet size={iconPixelSize} className="text-emerald-500" />;
    }
    if (lowerName.includes("mail") || lowerName.includes("gmail")) {
      return <Mail size={iconPixelSize} className="text-rose-500" />;
    }
    if (lowerName.includes("webhook")) {
      return <Zap size={iconPixelSize} className="text-amber-500" />;
    }
    if (lowerName.includes("http") || lowerName.includes("api") || lowerName.includes("request")) {
      return <Globe size={iconPixelSize} className="text-cyan-500" />;
    }
    if (lowerName.includes("filter")) {
      return <Filter size={iconPixelSize} className="text-indigo-400" />;
    }
    if (lowerName.includes("if") || lowerName.includes("condition") || lowerName.includes("branch")) {
      return <GitFork size={iconPixelSize} className="text-violet-400" />;
    }
    if (lowerName.includes("iterator") || lowerName.includes("loop")) {
      return <Repeat size={iconPixelSize} className="text-blue-400" />;
    }
    if (lowerName.includes("ai") || lowerName.includes("gpt") || lowerName.includes("agent")) {
      return <Bot size={iconPixelSize} className="text-emerald-400" />;
    }
    if (nodeType === "trigger") {
      return <Zap size={iconPixelSize} className="text-amber-500" />;
    }
    return <SlidersHorizontal size={iconPixelSize} className="text-gray-400" />;
  };

  return (
    <div
      className={`relative flex-shrink-0 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden ${sizeClasses} ${className}`}
    >
      {isImageUrl ? (
        <img
          src={icon}
          alt={name || "Node icon"}
          className="w-full h-full object-contain p-1.5"
        />
      ) : icon && icon.length <= 4 ? (
        <span className="leading-none select-none font-sans text-center">{icon}</span>
      ) : (
        renderKnownIcon()
      )}
    </div>
  );
}

export default NodeIcon;
