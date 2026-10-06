"use client";

import React, { useState } from "react";
import { Terminal, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface LogsProps {
  logs?: Array<{ timestamp?: string | number; level?: "info" | "warn" | "error"; message: string }>;
  raw?: any;
}

export default function Logs({ logs = [], raw }: LogsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = raw ? JSON.stringify(raw, null, 2) : logs.map(l => l.message).join("\n");
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Logs copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-2xl bg-[#141518] border border-[#222429] p-4 font-mono text-xs text-gray-300 flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-[#222429] mb-3">
        <div className="flex items-center gap-2 text-gray-400">
          <Terminal className="h-4 w-4 text-indigo-400" />
          <span className="font-bold text-xs uppercase tracking-wider text-[#f9fafb]">Execution Output</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#18191c] border border-[#27282d] text-[11px] text-gray-400 hover:text-white transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-80 space-y-1.5">
        {raw ? (
          <pre className="text-xs text-gray-200 whitespace-pre-wrap break-all leading-relaxed">
            {JSON.stringify(raw, null, 2)}
          </pre>
        ) : logs.length === 0 ? (
          <p className="text-gray-500 italic py-6 text-center">No logs recorded for this step.</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="flex items-start gap-2 leading-relaxed">
              {log.timestamp && (
                <span className="text-gray-500 shrink-0">
                  {typeof log.timestamp === "number" ? new Date(log.timestamp).toLocaleTimeString() : log.timestamp}
                </span>
              )}
              {log.level && (
                <span
                  className={`px-1 rounded text-[10px] font-bold uppercase shrink-0 ${
                    log.level === "error"
                      ? "text-red-400 bg-red-950/40"
                      : log.level === "warn"
                      ? "text-amber-400 bg-amber-950/40"
                      : "text-emerald-400 bg-emerald-950/40"
                  }`}
                >
                  {log.level}
                </span>
              )}
              <span className="text-[#f9fafb] break-all">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
