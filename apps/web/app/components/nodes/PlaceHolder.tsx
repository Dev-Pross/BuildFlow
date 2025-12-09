import { Handle, Position } from "@xyflow/react";

interface PlaceholderNodeProps {
  data: {
    label: string;
  };
}

const PlaceholderNode = ({ data }: PlaceholderNodeProps) => {
  return (
    <div className="flex items-center justify-center w-24 h-24 bg-gray-700 border-2 border-dashed border-gray-500 rounded-lg cursor-pointer hover:border-blue-500">
      <span className="text-4xl text-gray-300">+</span>
      <Handle type="target" position={Position.Left} /> 
      <Handle type="source" position={Position.Right} />  
    </div>
  );
};

export default PlaceholderNode;
