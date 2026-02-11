"use client";

import { PreviousNodeOutput, VariableDefinition } from "@/app/lib/types/node.types";
import { useAppSelector } from "@/app/hooks/redux";
import { selectAllOutputs, NodeTestOutput } from "@/store/slices/nodeOutputSlice";

interface VariablePanelProps {
  previousNodes: PreviousNodeOutput[];
  onInsert: (variableSyntax: string) => void;
  activeField: string | null;
}

export function VariablePanel({ previousNodes, onInsert, activeField }: VariablePanelProps) {
  // Get tested outputs from Redux
  const testedOutputs = useAppSelector(selectAllOutputs);
  
  // Debug logging
  console.log('[VariablePanel] previousNodes:', previousNodes);
  console.log('[VariablePanel] testedOutputs from Redux:', testedOutputs);
  
  // Merge static outputSchema with dynamic tested data
  const enrichedNodes: PreviousNodeOutput[] = previousNodes.map(node => {
    const testedData = testedOutputs[node.nodeId];
    
    console.log(`[VariablePanel] Node ${node.nodeName} (${node.nodeId}):`, {
      hasTestedData: !!testedData,
      testedSuccess: testedData?.success,
      testedVariablesCount: testedData?.variables?.length,
      staticVariablesCount: node.variables?.length
    });
    
    // If node was tested, use the dynamic variables from real output
    if (testedData?.success && testedData.variables.length > 0) {
      console.log(`[VariablePanel] Using DYNAMIC variables for ${node.nodeName}:`, testedData.variables);
      return {
        ...node,
        variables: testedData.variables,
        // Mark as dynamically discovered
        _tested: true
      } as PreviousNodeOutput & { _tested?: boolean };
    }
    
    // Otherwise use the static outputSchema
    console.log(`[VariablePanel] Using STATIC variables for ${node.nodeName}:`, node.variables);
    return node;
  });
  
  const handleClick = (nodeName: string, variable: VariableDefinition) => {
    // Build the variable syntax: {{nodeName.path}}
    const syntax = `{{${nodeName}.${variable.path}}}`;
    onInsert(syntax);
  };

  if (enrichedNodes.length === 0) {
    return (
      <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 text-gray-400 text-sm">
        <p>No previous nodes available.</p>
        <p className="mt-2 text-xs">Add a trigger or action before this node to use its output data.</p>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 space-y-4 overflow-y-auto max-h-[80vh]">
      <div className="text-sm font-medium text-white mb-2">
        📦 Available Variables
      </div>
      
      {!activeField && (
        <div className="text-xs text-yellow-400 bg-yellow-400/10 p-2 rounded">
          Click on a field first, then click a variable to insert it.
        </div>
      )}

      {enrichedNodes.map((node) => {
        const isTested = testedOutputs[node.nodeId]?.success;
        
        return (
          <div key={node.nodeId} className="space-y-2">
            {/* Node Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <span>{node.icon || "⚙️"}</span>
                <span>{node.nodeName}</span>
              </div>
              {isTested && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                  ✓ Tested
                </span>
              )}
            </div>
            
            {/* No variables message */}
            {node.variables.length === 0 && (
              <p className="text-xs text-gray-500 italic">
                Test this node to discover available variables
              </p>
            )}
            
            {/* Variable Pills */}
            <div className="flex flex-wrap gap-2">
              {node.variables.map((variable) => (
                <button
                  key={variable.path}
                  onClick={() => handleClick(node.nodeName.toLowerCase().replace(/\s+/g, '_'), variable)}
                  disabled={!activeField}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium
                    transition-all duration-150
                    ${activeField 
                      ? isTested
                        ? "bg-green-500/20 text-green-300 hover:bg-green-500/40 cursor-pointer border border-green-500/30"
                        : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 cursor-pointer border border-blue-500/30" 
                      : "bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/30"
                  }
                `}
                title={`${variable.sampleValue ? `Sample: ${variable.sampleValue}\n` : ''}Insert {{${node.nodeName.toLowerCase().replace(/\s+/g, '_')}.${variable.path}}}`}
              >
                <span className="mr-1">{getTypeIcon(variable.type)}</span>
                {variable.name}
                {variable.sampleValue && (
                  <span className="ml-1 text-gray-500 max-w-16 truncate">
                    ({String(variable.sampleValue).substring(0, 15)}{String(variable.sampleValue).length > 15 ? '...' : ''})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Render nested children if any */}
          {node.variables
            .filter(v => v.children && v.children.length > 0)
            .map(variable => (
              <div key={`${variable.path}-children`} className="ml-4 mt-1">
                <div className="text-xs text-gray-500 mb-1">└ {variable.name} fields:</div>
                <div className="flex flex-wrap gap-1">
                  {variable.children?.map(child => (
                    <button
                      key={child.path}
                      onClick={() => handleClick(
                        node.nodeName.toLowerCase().replace(/\s+/g, '_'), 
                        { ...child, path: `${variable.path}${child.path}` }
                      )}
                      disabled={!activeField}
                      className={`
                        px-2 py-1 rounded text-xs
                        ${activeField 
                          ? "bg-purple-500/20 text-purple-300 hover:bg-purple-500/40 cursor-pointer" 
                          : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                        }
                      `}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      );
      })}
    </div>
  );
}

// Helper function for type icons
function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    string: "📝",
    number: "🔢",
    boolean: "✓",
    date: "📅",
    array: "📋",
    object: "{}",
    any: "•",
  };
  return icons[type] || "•";
}

export default VariablePanel;
