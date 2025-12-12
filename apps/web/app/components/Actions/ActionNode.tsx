import { Handle, Position } from "@xyflow/react";

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
      
      <span className="text-3xl mb-2">{data.icon || "⚙️"}</span>
      <span className="text-white font-semibold">{data.name}</span>
      <span className="text-gray-400 text-sm">{data.type}</span>
      
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default ActionNode;