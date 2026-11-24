"use client";

import { Handle, Position } from "@xyflow/react";

interface PlaceholderNodeProps {
  data: {
    onClick?: () => void;
  };
}

export function PlaceholderNode({ data }: PlaceholderNodeProps) {
  return (
    <div
      onClick={data.onClick}
      className="border-2 border-dashed border-white/20 rounded-2xl bg-chassis text-chassis-foreground hover:bg-chassis/90 hover:border-primary/60 cursor-pointer transition-all min-w-[240px] p-6 shadow-2xl group select-none"
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !border-2 !border-chassis" />

      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mb-3 text-chassis-foreground group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm">
          <span className="text-xl">➕</span>
        </div>
        <p className="text-xs font-bold text-chassis-foreground">Add Action Step</p>
        <p className="text-[10px] text-chassis-foreground/60 mt-0.5">Click to configure next node</p>
      </div>
    </div>
  );
}
