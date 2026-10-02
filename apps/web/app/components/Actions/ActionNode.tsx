import { Handle, Position } from "@xyflow/react";
import { NodeIcon } from "@/app/components/ui/NodeIcon";

interface ActionNodeProps {
  data: {
    label: string;
    name?: string;
    icon?: string;
    type?: string;
  };
}

export const ActionNode = ({ data }: ActionNodeProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-800 border-2 border-blue-500 rounded-lg min-w-[150px]">
      <Handle type="target" position={Position.Left} />
      
      <NodeIcon icon={data.icon} name={data.name} size="lg" nodeType="action" className="mb-2" />
      <span className="text-white font-semibold">{data.name}</span>
      <span className="text-gray-400 text-sm">{data.type}</span>
      
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default ActionNode;