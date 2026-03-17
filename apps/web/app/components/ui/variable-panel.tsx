"use client";

import { PreviousNodeOutput, VariableDefinition } from "@/app/lib/types/node.types";
import { useAppSelector } from "@/app/hooks/redux";
import { selectAllOutputs, NodeTestOutput } from "@/store/slices/nodeOutputSlice";
import { useState } from "react";

interface VariablePanelProps {
  previousNodes: PreviousNodeOutput[];
  onInsert: (variableSyntax: string) => void;
  activeField: string | null;
  onTestNode?: (nodeId: string) => void;
}

export function VariablePanel({ previousNodes, onInsert, activeField, onTestNode }: VariablePanelProps) {
  // State for accordion behavior
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(
    previousNodes?.length > 0 ? previousNodes[previousNodes.length - 1]!.nodeId : null
  );
  const state = useAppSelector((state) => state.nodeOutput);

  // Get tested outputs from Redux
  const testedOutputs = useAppSelector(selectAllOutputs);

  // Merge static outputSchema with dynamic tested data
  const enrichedNodes: PreviousNodeOutput[] = previousNodes?.map(node => {
    const testedData = testedOutputs[node.nodeId];

    // If node was tested, use the dynamic variables from real output
    if (testedData?.success && testedData.variables && testedData.variables.length > 0) {
      return {
        ...node,
        variables: testedData.variables,
        // Mark as dynamically discovered
        _tested: true
      } as PreviousNodeOutput & { _tested?: boolean };
    }

    // Otherwise use the static outputSchema
    return node;
  }) || [];

  // Handlers for insertion
  const handleInsert = (syntax: string) => {
    if (activeField) {
      onInsert(syntax);
    }
  };

  // --- Render Helpers ---

  // Renders a tabular tree view for standard variables
  const renderVariableTable = (node: PreviousNodeOutput, isTested: boolean) => {
    const isWebhook = node.nodeName.toLowerCase().includes('webhook');
    if (!node.variables || node.variables.length === 0) {
      return (
        <p className="text-xs text-gray-500 italic p-6 text-center bg-[#111620]">
          {isWebhook
            ? 'Webhook data will be available when the workflow is triggered'
            : 'Test this node to discover available variables'}
        </p>
      );
    }

    const formattedNodeName = node.nodeName.toLowerCase().replace(/\s+/g, '_');

    const renderRows = (vars: VariableDefinition[], depth: number = 0, currParentPath: string = "") => {
      return vars.map((variable, idx) => {
        // Build path strictly by concatenating dot if needed
        let strictConcatPath = variable.path;
        if (currParentPath) {
          const prefix = variable.path.startsWith('.') || variable.path.startsWith('[') ? '' : '.';
          strictConcatPath = `${currParentPath}${prefix}${variable.path.replace(/^\./, '')}`;
        }

        const hasChildren = variable.children && variable.children.length > 0;

        return (
          <div key={`${depth}-${strictConcatPath}-${idx}`} className="w-full">
            <div
              className={`
                flex items-center group transition-colors border-b border-[#1a1f2e]/50
                ${activeField && isTested ? "hover:bg-[#202737] cursor-pointer" : "cursor-not-allowed opacity-50"}
              `}
              onClick={(e) => {
                e.stopPropagation();
                if (activeField && isTested) {
                  handleInsert(`{{${formattedNodeName}.${strictConcatPath}}}`);
                }
              }}
              title={
                !isTested
                  ? "Test node first to map data"
                  : activeField
                    ? `Insert {{${formattedNodeName}.${strictConcatPath}}}`
                    : "Select a field first"
              }
            >
              <div
                className="flex-[2.5] px-3 py-2 flex items-center min-w-0"
                style={{ paddingLeft: `${depth * 16 + 12}px` }}
              >
                <span className="opacity-50 mr-2 text-[10px] w-4 text-center border border-gray-700/50 rounded-sm">
                  {getTypeIcon(variable.type)}
                </span>
                <span className={`text-xs font-medium truncate transition-colors ${activeField && isTested ? 'text-gray-200 group-hover:text-blue-400' : 'text-gray-500'}`}>
                  {variable.name}
                </span>
                {variable.type && (
                  <span className="ml-2 text-[10px] text-purple-400/50 font-mono tracking-wider hidden sm:inline-block">
                    {variable.type}
                  </span>
                )}
              </div>
              <div className="flex-[3.5] px-3 py-2 text-xs text-gray-400 truncate border-l border-[#1a1f2e]/50 min-w-0 font-mono bg-[#161b26]/30">
                {variable.sampleValue !== undefined && variable.sampleValue !== null
                  ? (typeof variable.sampleValue === 'object'
                    ? <span className="text-gray-600 italic">Object/Array</span>
                    : String(variable.sampleValue))
                  : <span className="text-gray-600 italic">No Data</span>
                }
              </div>
            </div>
            {hasChildren && renderRows(variable.children || [], depth + 1, strictConcatPath)}
          </div>
        );
      });
    };

    return (
      <div className="w-full border-t border-gray-800 bg-[#111620]">
        <div className="flex bg-[#161b22] border-b border-[#2a2f3e] sticky top-0 shadow-sm z-10">
          <div className="flex-[2.5] px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-gray-500">Name</div>
          <div className="flex-[3.5] px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-gray-500 border-l border-[#2a2f3e]">Value</div>
        </div>
        <div className="flex flex-col mb-1 pb-2">
          {renderRows(node.variables)}
        </div>
      </div>
    );
  };

  // Rendering for Spreadsheet (Arrays of arrays)
  const renderSpreadsheetTable = (nodeName: string, data: any) => {
    const formattedNodeName = nodeName.toLowerCase().replace(/\s+/g, '_');
    const rows = data.rows || data; // Handle data directly if it's the 2D array
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const headers = rows[0] as string[];
    const dataRows = rows.slice(1);

    return (
      <div className="overflow-x-auto w-full border-t border-gray-800 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <div className="text-[10px] p-2 bg-gray-800/50 text-gray-400 flex justify-between items-center border-b border-gray-800">
          <span>Spreadsheet Data</span>
          <span>{dataRows.length} rows</span>
        </div>
        <table className="w-full text-left text-xs text-gray-300 min-w-max border-collapse">
          <thead className="bg-[#1a1f2e] sticky top-0">
            <tr>
              <th className="px-2 py-2 w-8 text-center border-r border-b border-[#2a2f3e] text-gray-500 font-normal">#</th>
              {headers.map((header, colIndex) => {
                const colPath = String(header).trim().toLowerCase().replace(/\s+/g, '_') || `column_${colIndex + 1}`;
                return (
                  <th
                    key={colIndex}
                    className={`px-3 py-2 border-r border-b border-[#2a2f3e] font-medium truncate max-w-[150px] transition-colors
                      ${activeField ? "hover:bg-blue-500/20 hover:text-blue-300 cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                    onClick={() => handleInsert(`{{${formattedNodeName}.${colPath}}}`)}
                    title={`Insert entire column array: {{${formattedNodeName}.${colPath}}}`}
                  >
                    {header || `Column ${colIndex + 1}`}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {dataRows.slice(0, 50).map((row: any[], rowIndex: number) => (
              <tr key={rowIndex} className="border-b border-[#1a1f2e]/50 hover:bg-[#1f2536] transition-colors group">
                <td className="px-2 py-1.5 text-center border-r border-[#1a1f2e]/50 text-gray-600 bg-[#161b26]">{rowIndex + 1}</td>
                {headers.map((_, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-3 py-1.5 border-r border-[#1a1f2e]/50 truncate max-w-[200px] transition-colors
                      ${activeField ? "group-hover:text-white hover:bg-blue-500/30 cursor-pointer" : "cursor-not-allowed opacity-70"}`}
                    onClick={() => handleInsert(`{{${formattedNodeName}.rows[${rowIndex + 1}][${colIndex}]}}`)}
                    title={`Insert cell {{${formattedNodeName}.rows[${rowIndex + 1}][${colIndex}]}}`}
                  >
                    {String(row[colIndex] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Rendering for standard array of objects
  const renderArrayTable = (nodeName: string, dataArray: any[], isTested: boolean) => {
    const formattedNodeName = nodeName.toLowerCase().replace(/\s+/g, '_');

    // Find all unique keys across objects to form headers
    const keysSet = new Set<string>();
    dataArray.slice(0, 50).forEach(item => {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(k => keysSet.add(k));
      }
    });
    const headers = Array.from(keysSet);

    if (headers.length === 0) {
      // It's an array of primitives
      return (
        <div className="overflow-x-auto w-full border-t border-gray-800">
          <table className="w-full text-left text-xs text-gray-300 min-w-max">
            <tbody>
              {dataArray.slice(0, 100).map((item, index) => (
                <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-800 transition-colors">
                  <td className="px-2 py-1.5 w-8 text-center border-r border-gray-800/50 text-gray-600 font-mono text-[10px]">{index}</td>
                  <td className={`px-3 py-1.5 truncate max-w-[300px] transition-colors
                     ${activeField ? "hover:bg-blue-500/20 hover:text-blue-300 cursor-pointer" : "cursor-not-allowed"}`}
                    onClick={() => handleInsert(`{{${formattedNodeName}[${index}]}}`)}
                  >
                    {String(item)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto w-full border-t border-gray-800 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <div className="text-[10px] p-2 bg-gray-800/50 text-gray-400 flex justify-between items-center border-b border-gray-800">
          <span>JSON Array</span>
          <span>{dataArray.length} items</span>
        </div>
        <table className="w-full text-left text-xs text-gray-300 min-w-max border-collapse">
          <thead className="bg-[#1a1f2e] sticky top-0">
            <tr>
              <th className="px-2 py-2 text-center border-r border-b border-[#2a2f3e] text-gray-500 font-normal w-8">#</th>
              {headers.map((header) => (
                <th
                  draggable={true}
                  onDragStart={(e) => {
                    const variableText = `{{${formattedNodeName}.map(item => item.${header})}}`;

                    e.dataTransfer.setData('text/plain', variableText);

                    e.dataTransfer.setData('application/buildflow-variable', JSON.stringify({
                      nodeName: formattedNodeName,
                      path: header,
                      display: `${formattedNodeName}.${header}`
                    }))

                    e.dataTransfer.effectAllowed = 'copy';

                  }}
                  key={header}
                  className={`px-3 py-2 border-r border-b border-[#2a2f3e] font-medium text-gray-400 truncate max-w-[150px] transition-colors
                      ${activeField && isTested ? "hover:bg-blue-500/20 hover:text-blue-300 cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-50"}
                    `}
                  onClick={() => {
                    if (activeField && isTested) {
                      handleInsert(`{{${formattedNodeName}.map(item => item.${header})}}`);
                    }
                  }}
                  title={
                    !isTested
                      ? "Test node first to map data"
                      : activeField
                        ? `Insert entire column as array: {{${formattedNodeName}.map(item => item.${header})}}`
                        : "Select a field first"
                  }
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataArray.slice(0, 50).map((item, rowIndex) => (
              <tr key={rowIndex} className="border-b border-[#1a1f2e]/50 hover:bg-[#1f2536] transition-colors group">
                <td className="px-2 py-1.5 text-center border-r border-[#1a1f2e]/50 text-gray-600 bg-[#161b26]">{rowIndex}</td>
                {headers.map(header => {
                  const val = item?.[header];
                  const displayStr = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '');
                  return (
                    <td
                      key={header}
                      className={`px-3 py-1.5 border-r border-[#1a1f2e]/50 truncate max-w-[200px] transition-colors
                        ${activeField && isTested ? "group-hover:text-white hover:bg-blue-500/30 cursor-pointer" : "cursor-not-allowed opacity-70"}`}
                      onClick={() => {
                        if (activeField && isTested) {
                          handleInsert(`{{${formattedNodeName}[${rowIndex}].${header}}}`);
                        }
                      }}
                      title={
                        !isTested
                          ? "Test node first to map data"
                          : activeField
                            ? `Insert {{${formattedNodeName}[${rowIndex}].${header}}}`
                            : "Select a field first"
                      }
                    >
                      {displayStr}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (enrichedNodes.length === 0) {
    return (
      <div className="w-[35%] h-full bg-[#0d1117] border-r border-gray-800 p-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4 border border-gray-700">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </div>
        <h3 className="text-gray-300 font-medium mb-2">No Data Available</h3>
        <p className="text-sm text-gray-500 max-w-[200px]">
          Add a trigger or action before this node to map variables.
        </p>
      </div>
    );
  }

  return (
    <div className="w-[35%] h-full bg-[#0d1117] border-r border-gray-800 flex flex-col overflow-hidden shadow-2xl z-10">

      {/* Panel Header */}
      <div className="p-4 border-b border-gray-800 bg-[#161b22] sticky top-0 z-20 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          Data Mapping
        </h2>
        {!activeField ? (
          <div className="mt-3 text-xs text-yellow-500/90 bg-yellow-500/10 border border-yellow-500/20 p-2.5 rounded-md flex items-start gap-2 leading-relaxed">
            <div className="mt-0.5">ℹ️</div>
            <div>Select an input field in the configuration panel on the right before inserting data.</div>
          </div>
        ) : (
          <div className="mt-3 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Ready to map data. Select a variable or cell below.
          </div>
        )}
      </div>

      {/* Accordion List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {enrichedNodes.map((node) => {
          const testOutput = testedOutputs[node.nodeId];
          const isTested = !!testOutput?.success;
          const isExpanded = expandedNodeId === node.nodeId;
          const hasData = isTested && testOutput?.data !== undefined && testOutput?.data !== null;

          // Determine if currently loading testing locally in Redux

          const isNodeLoading = state.isLoading[node.nodeId] ?? false;

          return (
            <div
              key={node.nodeId}
              className={`
                rounded-lg border transition-all duration-200 overflow-hidden bg-[#161b22]
                ${isExpanded ? 'border-gray-600 shadow-lg' : 'border-gray-800 hover:border-gray-700'}
              `}
            >
              {/* Accordion Header */}
              <div
                className={`flex items-center justify-between w-full p-3 text-left transition-colors cursor-pointer select-none
                  ${isExpanded ? 'bg-[#1a202c]' : 'hover:bg-[#1a202c]'}
                `}
                onClick={() => setExpandedNodeId(isExpanded ? null : node.nodeId)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {node.icon ? (
                      <img src={node.icon} className="w-8 h-8 rounded bg-white p-1" alt={node.nodeName} />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-800 p-1 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                    )}
                    {isTested && (
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-[#161b22] rounded-full" title="Successfully Executed"></span>
                    )}
                  </div>
                  <div>
                    <h3 className={`font-medium text-sm ${isExpanded ? 'text-white' : 'text-gray-300'}`}>
                      {node.nodeName}
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5 max-w-[150px] truncate">
                      {isTested ? 'Data available' : 'Using sample schema'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onTestNode && !node.nodeName.toLowerCase().includes('webhook') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTestNode(node.nodeId);
                      }}
                      disabled={isNodeLoading}
                      className={`
                          px-2 py-1 flex items-center gap-1.5 rounded text-[10px] font-medium transition-colors border
                          ${isNodeLoading ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-wait' :
                          isTested
                            ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 border-blue-800/50'
                            : 'bg-purple-900/20 text-purple-400 hover:bg-purple-900/40 border-purple-800/50'
                        }
                        `}
                    >
                      {isNodeLoading ? (
                        <span className="w-3 h-3 border-2 border-t-transparent border-gray-500 rounded-full animate-spin"></span>
                      ) : isTested ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                      {isNodeLoading ? 'Testing' : isTested ? 'Retest' : 'Test Node'}
                    </button>
                  )}
                  <div className="text-gray-500 transition-transform duration-200 ml-1">
                    {isExpanded ? (
                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Accordion Body */}
              {isExpanded && (
                <div className="bg-[#0d1117]">
                  {hasData ? (
                    <>
                      {/* Try matching Spreadsheet Pattern */}
                      {testOutput.data.rows && Array.isArray(testOutput.data.rows) && testOutput.data.rows.length > 0 && Array.isArray(testOutput.data.rows[0]) ? (
                        <div className="bg-[#111620]">
                          {renderSpreadsheetTable(node.nodeName, testOutput.data)}
                        </div>
                      ) : Array.isArray(testOutput.data) && testOutput.data.length > 0 && Array.isArray(testOutput.data[0]) ? (
                        <div className="bg-[#111620]">
                          {renderSpreadsheetTable(node.nodeName, testOutput.data)}
                        </div>
                      ) :
                        /* Try matching Standard Array pattern */
                        Array.isArray(testOutput.data) ? (
                          <div className="bg-[#111620]">
                            {renderArrayTable(node.nodeName, testOutput.data, isTested)}
                          </div>
                        ) : (
                          /* Fallback to Tree Table if it's an object or string */
                          renderVariableTable(node, isTested)
                        )}
                    </>
                  ) : (
                    renderVariableTable(node, isTested)
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div >
    </div >
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
