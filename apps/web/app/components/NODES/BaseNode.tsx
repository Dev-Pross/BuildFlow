import { Handle, Position } from "@xyflow/react";
interface BaseNodeProps {
  id: string;
  type: string;
  data: {
    label: string;
    icon?: string;
    isPlaceholder?: boolean;
    config: any;
    nodeType?: "trigger" | "action";

    status?: "idle" | "running" | "success" | "error";
    onConfigure?: () => void;
    onTest?: () => void;
    onAddChild?: () => void;
  };
}

export default function BaseNode({ id, type, data }: BaseNodeProps) {
  const {
    label,
    icon,
    isPlaceholder,
    config,
    onConfigure,
    onAddChild,
    onTest,
    nodeType,
  } = data;

  // For a node to be connectable, it must have handles.
  // We always want placeholder and configured nodes to be connectable.
  // TRIGGER nodes: Only source handle out (right)
  // ACTION nodes: Both target handle in (left) and source handle out (right)

  if (isPlaceholder) {
    return (
      <div
        onClick={onConfigure}
        className="
          group
          w-[240px] 
          px-4 py-6
          bg-gray-800/40
          border-2 border-dashed border-gray-600
          rounded-lg
          cursor-pointer
          transition-all duration-200
          hover:border-blue-500 
          hover:bg-gray-800/60
          hover:shadow-lg hover:shadow-blue-500/20
          flex flex-col items-center gap-3
        "
      >
        {/* Icon */}
        <div
          className="
            w-12 h-12 
            rounded-full 
            bg-gray-700/50
            border border-gray-600
            flex items-center justify-center
            text-2xl
            group-hover:bg-blue-500/20
            group-hover:border-blue-500
            transition-all duration-200
          "
        >
          {icon || "➕"}
        </div>
        {/* Label */}
        <div className="text-center">
          <p className="text-gray-300 font-medium text-sm group-hover:text-blue-400 transition-colors">
            {label}
          </p>
          <p className="text-gray-500 text-xs mt-1">Click to configure</p>
        </div>

        {/* Handles */}
        {nodeType === "action" ? (
          <>
            {/* Action placeholders get both handles -- left (input), right (output) */}
            <Handle type="target" position={Position.Left} id="a-in" />
            <Handle type="source" position={Position.Right} id="a-out" />
          </>
        ) : (
          // Trigger placeholders only output
          <Handle type="source" position={Position.Right} id="t-out" />
        )}
      </div>
    );
  }

  return (
    <div className="text-black bg-white border-2 border-gray-200 rounded-lg shadow-sm min-w-[200px] relative">
      <div className="px-4 py-3">
        {/* Icon + Label */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{icon || "📦"}</span>
          <span className="font-semibold text-sm">{label}</span>
        </div>
        {data.onConfigure && (
          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            ✓ Configured
          </span>
        )}
        {/* Show config summary if exists */}
        {/* {config && (
          <div className="text-xs text-gray-500 mt-1">
            {config.summary
              ? config.summary
              : config.description
                ? config.description
                : "Configured"}
          </div>
        )} */}

        {/* Buttons */}
        <div className="flex gap-2 mt-2">
          {onConfigure && (
            <button
              onClick={onConfigure}
              className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              ⚙️ Settings
            </button>
          )}
          {onTest && (
            <button
              onClick={onTest}
              className="text-xs px-2 py-1 bg-blue-100 rounded hover:bg-blue-200"
            >
              ▶️ Test
            </button>
          )}
        </div>
      </div>

      {/* Add child button */}
      {onAddChild && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <button
            onClick={onAddChild}
            className="bg-white border-2 border-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:border-blue-400"
          >
            +
          </button>
        </div>
      )}

      {/* Handles */}
      {nodeType === "action" ? (
        <>
          {/* Action nodes get both handles */}
          <Handle type="target" position={Position.Left} id="a-in" />
          <Handle type="source" position={Position.Right} id="a-out" />
        </>
      ) : (
        // Trigger node gets only source handle (output)
        <Handle type="source" position={Position.Right} id="t-out" />
      )}
    </div>
  );
}
