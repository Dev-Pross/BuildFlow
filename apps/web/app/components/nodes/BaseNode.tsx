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
    isConfigured?: boolean;

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
          <span className="text-xl  p-2 rounded-full object-center">
            { icon ? 
            <img src={icon ? icon : "⚡"} className="w-16 h-16 object-cover"
            /> : ("⚡")}

          </span>
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
          {onTest && (
            <button
              onClick={onTest}
              className="text-xs px-2 py-1 bg-blue-100 rounded hover:bg-blue-200"
            >
              <svg width="10px" height="10px" viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000000" strokeWidth="0.00024000000000000003" transform="rotate(0)"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M21.4086 9.35258C23.5305 10.5065 23.5305 13.4935 21.4086 14.6474L8.59662 21.6145C6.53435 22.736 4 21.2763 4 18.9671L4 5.0329C4 2.72368 6.53435 1.26402 8.59661 2.38548L21.4086 9.35258Z" fill="#000000"></path> </g></svg>
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
