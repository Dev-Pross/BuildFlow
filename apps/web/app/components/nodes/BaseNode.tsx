import { Handle, Position } from "@xyflow/react";
import { NodeIcon } from "@/app/components/ui/NodeIcon";
import { getNodeConfig } from "@/app/lib/nodeConfigs";
import { RefreshCw } from "lucide-react";
interface BaseNodeProps {
  id: string;
  type: string;
  data: {
    label: string;
    icon?: string;
    isPlaceholder?: boolean;
    config: any;
    nodeType?: "trigger" | "action";
    isConfigured?: boolean;

    status?: "idle" | "running" | "success" | "error";
    onConfigure?: () => void;
    onTest?: () => void;
    onAddChild?: (sourceHandleId?: string) => void;
    onDelete?: () => void;
    onReplace?: () => void
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
    onDelete,
    onReplace
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
          w-[140px] 
          px-4 py-6
          bg-white
          border-2 border-dashed border-gray-600
          rounded-lg
          cursor-pointer
          transition-all duration-200
          hover:border-blue-500 
          hover:bg-white
          hover:shadow-lg hover:shadow-blue-500/20
          flex flex-col items-center gap-3
        "
      >
        {/* Icon */}
        <div
          className="
            w-7 h-7  flex items-center justify-center
             bg-white
            text-2xl
            group-hover:border-blue-500
            transition-all duration-200
          "
        >
          {icon || "➕"}
        </div>
        {/* Label */}
        <div className="text-center">
          <p className="text-black font-bold  text-sm group-hover:text-blue-400 transition-colors">
            {label}
          </p>
          {/* <p className="text-gray-500 text-xs mt-1">Click to configure</p> */}
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
    <div className="text-black bg-gray-50 border-gray-200 rounded-lg shadow-[gray_0px_0px_2px_0.1px] min-w-[200px] relative">
      <div className="px-4 py-3">
        {/* Icon + Label */}
        <div className="flex flex-col items-center gap-2 mb-1">
          <NodeIcon
            icon={icon}
            name={label}
            size="xl"
            nodeType={nodeType}
            className="w-14 h-14 bg-white border-gray-200 shadow-sm"
          />
          <span className="font-semibold text-sm">{label}</span>
        </div>
        <div className="flex justify-center w-full">
          {data.isConfigured ? (
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-center text-xs rounded-full">
              ✓ Configured
            </span>
          ) : (
            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
              Not Configured
            </span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-2">
          {onConfigure && (
            <button
              onClick={onConfigure}
              className="text-xs px-2 py-1 bg-blue-100 rounded hover:bg-blue-200"
            >
              <svg width="10px" height="10px" viewBox="0 0 32.00 32.00" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" stroke="#000000" strokeWidth="0.576"></g><g id="SVGRepo_iconCarrier"><title>file_type_config</title><path d="M23.265,24.381l.9-.894c4.164.136,4.228-.01,4.411-.438l1.144-2.785L29.805,20l-.093-.231c-.049-.122-.2-.486-2.8-2.965V15.5c3-2.89,2.936-3.038,2.765-3.461L28.538,9.225c-.171-.422-.236-.587-4.37-.474l-.9-.93a20.166,20.166,0,0,0-.141-4.106l-.116-.263-2.974-1.3c-.438-.2-.592-.272-3.4,2.786l-1.262-.019c-2.891-3.086-3.028-3.03-3.461-2.855L9.149,3.182c-.433.175-.586.237-.418,4.437l-.893.89c-4.162-.136-4.226.012-4.407.438L2.285,11.733,2.195,12l.094.232c.049.12.194.48,2.8,2.962l0,1.3c-3,2.89-2.935,3.038-2.763,3.462l1.138,2.817c.174.431.236.584,4.369.476l.9.935a20.243,20.243,0,0,0,.137,4.1l.116.265,2.993,1.308c.435.182.586.247,3.386-2.8l1.262.016c2.895,3.09,3.043,3.03,3.466,2.859l2.759-1.115C23.288,28.644,23.44,28.583,23.265,24.381ZM11.407,17.857a4.957,4.957,0,1,1,6.488,2.824A5.014,5.014,0,0,1,11.407,17.857Z" fill="#000000"></path></g></svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete()
              }}
              className="text-xs px-2 py-1 bg-blue-100 rounded hover:bg-blue-200"
            >
              <svg width="12px" height="12px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2M4 7h16" /></svg>
            </button>
          )}
          {onReplace && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReplace()
              }}
              className="text-xs px-2 py-1 bg-blue-100 rounded hover:bg-blue-200"
            >
              <RefreshCw size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Handles */}
      {nodeType === "action" ? (
        <>
          {/* Action nodes get input handle on left */}
          <Handle
            type="target"
            position={Position.Left}
            id="a-in"
            className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white hover:!scale-125 transition-transform cursor-crosshair shadow-sm"
          />

          {(() => {
            const nodeConfigDef = getNodeConfig(label);
            let resolvedOutputs;
            if (!resolvedOutputs && nodeConfigDef?.outputs) {
              resolvedOutputs = nodeConfigDef.outputs;
            }

            if (!resolvedOutputs && nodeConfigDef) {
              const operationField = nodeConfigDef.fields?.find((f: any) => f.name === "operation");
              if (operationField && operationField.options) {
                const selectedOpId = config?.operation || operationField.defaultValue;
                const selectedOp = operationField.options.find((o: any) => o.id === selectedOpId);
                if (selectedOp && selectedOp.outputs) {
                  resolvedOutputs = selectedOp.outputs;
                }
              }
            }

            const outputs = resolvedOutputs || [{ id: "out-0", label: "Output" }];

            return outputs.map((output: any, index: number) => {
              const topPosition = `${((index + 1) * 100) / (outputs.length + 1)}%`;
              const bgClass = output.id === "out-1" ? "!bg-rose-500" : "!bg-indigo-500";
              const textClass = output.id === "out-1" ? "text-rose-600 bg-rose-50 border-rose-200" : "text-indigo-600 bg-indigo-50 border-indigo-200";

              return (
                <div key={output.id} className="group">
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={output.id}
                    style={{ top: topPosition }}
                    className={`!w-4 !h-4 flex items-center justify-center ${bgClass} !border-2 !border-white hover:!scale-125 transition-all cursor-crosshair shadow-sm z-20`}
                    title={`${output.label} (${output.id})`}
                  >
                    {/* The + Button inside the Handle! Always visible */}
                    {onAddChild && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddChild(output.id);
                        }}
                        className="w-full h-full flex items-center justify-center text-white font-bold z-30 leading-none pb-[1px]"
                        style={{ fontSize: '11px' }}
                        title={`Add node from ${output.label}`}
                      >
                        +
                      </button>
                    )}
                  </Handle>

                  {/* Floating Label (Shows on hover or is very subtle next to it) */}
                  <div
                    className="absolute pointer-events-none flex items-center gap-1"
                    style={{ top: topPosition, right: '-20px', transform: 'translate(100%, -150%)' }}
                  >
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border shadow-xs ${textClass} whitespace-nowrap opacity-60 group-hover:opacity-100 transition-opacity`}>
                      {output.label}
                    </span>
                  </div>
                </div>
              );
            });
          })()}
        </>
      ) : (
        // Trigger node gets only source handle (output)
        <div className="group">
          <Handle
            type="source"
            position={Position.Right}
            id="t-out"
            className="!w-4 !h-4 flex items-center justify-center !bg-amber-500 !border-2 !border-white hover:!scale-125 transition-all cursor-crosshair shadow-sm z-20"
          >
            {/* The + Button inside the Handle! Always visible */}
            {onAddChild && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild("t-out");
                }}
                className="w-full h-full flex items-center justify-center text-white font-bold z-30 leading-none pb-[1px]"
                style={{ fontSize: '11px' }}
                title={`Add action`}
              >
                +
              </button>
            )}
          </Handle>
        </div>
      )}
    </div>
  );
}
