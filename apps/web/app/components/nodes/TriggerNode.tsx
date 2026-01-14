import { Handle, Position } from "@xyflow/react";

interface TriggerNodeProps {
  data: {
    name: string;
    icon?: string;
    type: string;
    config?: Record<string, unknown>;
  };
}

export const TriggerNode = ({ data }: TriggerNodeProps) => {
  return (
    <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg border border-gray-600">
      <div className="text-3xl">{data.icon}</div>
      <div className="text-white font-bold mt-2">{data.name}</div>
      <div className="text-gray-400 text-sm">{data.type}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};
