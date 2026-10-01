import { Handle, Position } from "@xyflow/react";
import { NodeIcon } from "@/app/components/ui/NodeIcon";

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
      <NodeIcon icon={data.icon} name={data.name} size="lg" nodeType="trigger" />
      <div className="text-white font-bold mt-2">{data.name}</div>
      <div className="text-gray-400 text-sm">{data.type}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};
