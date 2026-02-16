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
      className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-blue-400 cursor-pointer transition-all min-w-[280px]"
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />

      <div className="p-8 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
          <span className="text-2xl">➕</span>
        </div>
        <p className="text-sm font-medium text-gray-600">Add what the hell is Action</p>
      </div>
    </div>
  );
}
