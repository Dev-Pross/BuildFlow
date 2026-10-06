"use client";

import { PreviousNodeOutput, VariableDefinition } from "@/app/lib/types/node.types";
import { useAppSelector } from "@/app/hooks/redux";
import { selectAllOutputs, NodeTestOutput } from "@/store/slices/nodeOutputSlice";
import { useState } from "react";
import { NodeIcon } from "@/app/components/ui/NodeIcon";

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
  const [modeViews, setModeViews] = useState<Record<string, 'tree' | 'table'>>({});
  const [treeExpanded, setTreeExpanded] = useState<Record<string, boolean>>({});
  const [tableExpanded, setTableExpanded] = useState<Record<string, boolean>>({});
  const [drillDownStacks, setDrillDownStacks] = useState<Record<string, { path: string; data: any[]; label: string }[]>>({});

  const toggleTableExpand = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    setTableExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const mapToVariableDefinition = (v: any): VariableDefinition => ({
    name: v.name,
    path: v.path,
    type: v.type as any,
    sampleValue: v.sampleValue,
    children: v.children ? v.children.map(mapToVariableDefinition) : undefined
  });

  // Get tested outputs from Redux
  const testedOutputs = useAppSelector(selectAllOutputs);

  // Merge static outputSchema with dynamic tested data
  const enrichedNodes: PreviousNodeOutput[] = previousNodes?.map(node => {
    const testedData = testedOutputs[node.nodeId];

    // If node was tested, use the dynamic variables from real output
    if (testedData?.success && testedData.data) {
      // 1. Check if the output is a 2D matrix (array of arrays)
      const is2DMatrix = Array.isArray(testedData.data) && Array.isArray(testedData.data[0]);
      
      // 2. Select the correct wire based on node.wireIndex, or fallback
      let wireData = testedData.data;
      if (is2DMatrix && node.wireIndex !== undefined) {
        wireData = testedData.data[node.wireIndex] ?? [];
      } else if (is2DMatrix) {
        wireData = testedData.data[0] ?? [];
      }

      // 3. Extract variables dynamically for this specific wire!
      const { extractVariablesFromOutput } = require('@repo/common/zod');
      const dynamicVariables = extractVariablesFromOutput(wireData);

      if (dynamicVariables.length > 0) {
        return {
          ...node,
          variables: dynamicVariables.map(mapToVariableDefinition),
          // Mark as dynamically discovered
          _tested: true
        } as PreviousNodeOutput & { _tested?: boolean };
      }
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

    const formattedNodeName = node.nodeId

    const renderRows = (vars: VariableDefinition[], depth: number = 0, currParentPath: string = "") => {
      return vars.map((variable, idx) => {
        // Build path strictly by concatenating dot if needed
        let strictConcatPath = variable.path;
        if (currParentPath) {
          const prefix = variable.path.startsWith('.') || variable.path.startsWith('[') ? '' : '.';
          strictConcatPath = `${currParentPath}${prefix}${variable.path.replace(/^\./, '')}`;
        }

        const hasChildren = variable.children && variable.children.length > 0;
        const expandKey = `${formattedNodeName}-${strictConcatPath}`;
        const isExpanded = !!tableExpanded[expandKey];

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
                className="flex-[2.5] px-3 py-2 flex items-center min-w-0 relative"
                style={{ paddingLeft: `${depth * 16 + 12}px` }}
              >
                {/* Tree branch line */}
                {depth > 0 && (
                  <div 
                    className="absolute left-0 top-0 bottom-0 border-l border-[#2a2f3e]" 
                    style={{ marginLeft: `${(depth - 1) * 16 + 21}px` }} 
                  />
                )}
                
                {hasChildren ? (
                  <button 
                    type="button"
                    onClick={(e) => toggleTableExpand(e, expandKey)}
                    className={`mr-1.5 w-5 h-5 flex items-center justify-center rounded-md transition-all z-10 ${
                      isExpanded 
                        ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700'
                    }`}
                  >
                    <span className="text-[10px] leading-none">{isExpanded ? '▼' : '▶'}</span>
                  </button>
                ) : (
                  <span className="mr-1.5 w-5 h-5 inline-block" />
                )}

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
                    ? (
                        <span className="text-gray-500 italic">
                          {variable.type === 'array' ? `Array [${variable.children?.length || 0}]` : `Object {${variable.children?.length || 0}}`}
                        </span>
                      )
                    : String(variable.sampleValue))
                  : <span className="text-gray-600 italic">No Data</span>
                }
              </div>
            </div>
            {hasChildren && isExpanded && renderRows(variable.children || [], depth + 1, strictConcatPath)}
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
  const renderSpreadsheetTable = (nodeName: string, nodeId: string, data: any) => {
    const formattedNodeName = nodeId;
    const rows = data.rows || data; // Handle data directly if it's the 2D array
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const headers = rows[0] as string[];
    const dataRows = rows.slice(1);

    return (
      <div className="w-full border-t border-gray-800">
        <div className="text-[10px] p-2 bg-gray-800/50 text-gray-400 flex justify-between items-center border-b border-gray-800 w-full">
          <div className="flex items-center gap-2">
            <span>Spreadsheet Data</span>
            <button
              onClick={() => handleInsert(`{{${formattedNodeName}.rows}}`)}
              className="px-2 py-0.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 rounded transition-colors"
              title="Insert the entire array of data"
            >
              Select Entire Table
            </button>
          </div>
          <span>{dataRows.length} rows</span>
        </div>
        <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
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
      </div>
    );
  };

  // Interactive recursive JSON Tree viewer
  const renderJsonTree = (
    nodeId: string,
    nodeName: string,
    data: any,
    currentPath: string,
    depth = 0,
    isTested = true,
    mappedPath?: string
  ): React.ReactNode => {
    const activeMappedPath = mappedPath ?? currentPath;

    if (data === null || data === undefined) {
      return <span className="text-gray-500 italic text-xs px-2 py-0.5 font-mono">null</span>;
    }

    if (typeof data !== 'object') {
      const varSyntax = `{{${nodeId}${activeMappedPath}}}`;
      return (
        <div 
          className={`flex items-center justify-between py-1 px-2.5 rounded hover:bg-[#1a2333] transition-colors group ${activeField && isTested ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
          onClick={() => activeField && isTested && handleInsert(varSyntax)}
          title={activeField ? `Insert: ${varSyntax}` : 'Select an input field first'}
        >
          <span className="font-mono text-xs text-emerald-400 truncate max-w-[200px]">{JSON.stringify(data)}</span>
          <span className="text-[10px] text-blue-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
            + Map
          </span>
        </div>
      );
    }

    if (Array.isArray(data)) {
      const arraySyntax = `{{${nodeId}${activeMappedPath}}}`;
      const isExpanded = treeExpanded[`${nodeId}_${currentPath}`] ?? (depth < 2);

      return (
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between py-1 px-2.5 rounded hover:bg-[#1f293d] group transition-colors">
            <div 
              className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0"
              onClick={() => setTreeExpanded(prev => ({ ...prev, [`${nodeId}_${currentPath}`]: !isExpanded }))}
            >
              <span className="text-gray-500 text-[10px] font-mono">{isExpanded ? '▼' : '▶'}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 border border-purple-800/40 text-purple-300">
                Array ({data.length})
              </span>
            </div>

            <button
              type="button"
              draggable={isTested}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', arraySyntax);
                e.dataTransfer.setData('application/buildflow-variable', JSON.stringify({
                  nodeName: nodeId,
                  path: activeMappedPath.replace(/^\./, ''),
                  display: arraySyntax
                }));
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (activeField && isTested) handleInsert(arraySyntax);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                activeField && isTested
                  ? 'bg-blue-500/20 hover:bg-blue-500/35 border-blue-500/40 text-blue-300 cursor-grab active:cursor-grabbing'
                  : 'bg-gray-800/40 border-gray-700/50 text-gray-500 cursor-not-allowed'
              }`}
              title={`Map entire array: ${arraySyntax}`}
            >
              + Map Array ({data.length})
            </button>
          </div>

          {isExpanded && (
            <div className="pl-3.5 border-l border-gray-800/80 ml-2 mt-0.5 space-y-0.5">
              {data.slice(0, 50).map((item, idx) => (
                <div key={idx} className="flex flex-col">
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono py-0.5">
                    <span>[{idx}]:</span>
                  </div>
                  {renderJsonTree(nodeId, nodeName, item, `${currentPath}.[${idx}]`, depth + 1, isTested, activeMappedPath)}
                </div>
              ))}
              {data.length > 50 && (
                <div className="text-[10px] text-gray-500 italic py-1 pl-2 font-mono">
                  ...and {data.length - 50} more items
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    const entries = Object.entries(data);
    return (
      <div className="flex flex-col w-full space-y-0.5">
        {entries.map(([key, val]) => {
          if (key === 'sourceRefs' || key === 'Source Refs') return null;
          
          const itemPath = `${currentPath}.${key}`;
          const itemMappedPath = `${activeMappedPath}.${key}`;
          const itemSyntax = `{{${nodeId}${itemMappedPath}}}`;
          const isValArray = Array.isArray(val);
          const isValObj = typeof val === 'object' && val !== null && !isValArray;
          const isNested = isValArray || isValObj;
          const isExpanded = treeExpanded[`${nodeId}_${itemPath}`] ?? (depth < 2);

          if (isNested) {
            return (
              <div key={key} className="flex flex-col">
                <div className="flex items-center justify-between py-1 px-2.5 rounded hover:bg-[#1a2333] transition-colors group">
                  <div 
                    className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0"
                    onClick={() => setTreeExpanded(prev => ({ ...prev, [`${nodeId}_${itemPath}`]: !isExpanded }))}
                  >
                    <span className="text-gray-500 text-[10px] font-mono">{isExpanded ? '▼' : '▶'}</span>
                    <span className="font-mono text-xs text-blue-300 font-medium truncate">{key}</span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {isValArray ? `[${val.length}]` : '{...}'}
                    </span>
                  </div>

                  {isValArray && (
                    <button
                      type="button"
                      draggable={isTested}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', itemSyntax);
                        e.dataTransfer.setData('application/buildflow-variable', JSON.stringify({
                          nodeName: nodeId,
                          path: itemMappedPath.replace(/^\./, ''),
                          display: itemSyntax
                        }));
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeField && isTested) handleInsert(itemSyntax);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                        activeField && isTested
                          ? 'bg-blue-500/20 hover:bg-blue-500/35 border-blue-500/40 text-blue-300 cursor-grab active:cursor-grabbing'
                          : 'bg-gray-800/40 border-gray-700/50 text-gray-500 cursor-not-allowed'
                      }`}
                      title={`Map entire array: ${itemSyntax}`}
                    >
                      + Map Array
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="pl-3.5 border-l border-gray-800/80 ml-2 mt-0.5">
                    {renderJsonTree(nodeId, nodeName, val, itemPath, depth + 1, isTested, itemMappedPath)}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              key={key}
              className={`flex items-center justify-between py-1 px-2.5 rounded hover:bg-[#1a2333] transition-colors group ${activeField && isTested ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
              onClick={() => activeField && isTested && handleInsert(itemSyntax)}
              title={activeField ? `Insert: ${itemSyntax}` : 'Select an input field first'}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-gray-600 text-xs">•</span>
                <span className="font-mono text-xs text-gray-300 truncate">{key}:</span>
                <span className="font-mono text-xs text-emerald-400/90 truncate max-w-[150px]">{String(val ?? '')}</span>
              </div>
              <span className="text-[10px] text-blue-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                + Map
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Rendering for standard array of objects
  const renderArrayTable = (
    nodeName: string, 
    nodeId: string, 
    dataArray: any[], 
    isTested: boolean, 
    wireIndex?: number,
    customPathPrefix?: string,
    customLabel?: string
  ) => {
    const formattedNodeName = nodeId;

    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return (
        <div className="p-4 text-center text-xs text-gray-500 italic bg-[#111620]">
          No items found in dataset
        </div>
      );
    }

    // Check if items are wrapped in { json: ... }
    const isWrappedJsonArray = dataArray.every(
      item => item && typeof item === 'object' && 'json' in item && typeof item.json === 'object' && item.json !== null
    );

    // Unpack rows to expose real columns directly
    const rows = isWrappedJsonArray ? dataArray.map(item => item.json) : dataArray;

    const basePrefix = customPathPrefix !== undefined
      ? customPathPrefix
      : (wireIndex !== undefined ? `.[${wireIndex}]` : '');

    // Collect unique keys across the rows
    const keysSet = new Set<string>();
    rows.slice(0, 50).forEach(item => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        Object.keys(item).forEach(k => {
          if (k !== 'sourceRefs' && k !== 'Source Refs') {
            keysSet.add(k);
          }
        });
      }
    });
    const headers = Array.from(keysSet);

    if (headers.length === 0) {
      // It's an array of primitives
      const allValuesSyntax = `{{${formattedNodeName}${basePrefix}}}`;
      return (
        <div className="w-full border-t border-gray-800">
          <div className="text-[10px] px-3 py-2 bg-[#161b22] text-gray-400 flex justify-between items-center border-b border-gray-800 w-full gap-2">
            <span className="font-semibold text-gray-300 uppercase tracking-wider text-[10px]">Values</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                draggable={isTested}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', allValuesSyntax);
                  e.dataTransfer.setData('application/buildflow-variable', JSON.stringify({
                    nodeName: formattedNodeName,
                    path: basePrefix.replace(/^\./, ''),
                    display: allValuesSyntax
                  }));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => activeField && isTested && handleInsert(allValuesSyntax)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                  activeField && isTested
                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/40 cursor-grab active:cursor-grabbing'
                    : 'bg-gray-800/40 text-gray-500 border-gray-700/50 cursor-not-allowed opacity-60'
                }`}
              >
                + All Values
              </button>
              <span className="px-2 py-0.5 rounded-full bg-blue-900/30 border border-blue-800/40 text-blue-400 font-mono text-[10px]">
                {rows.length} items
              </span>
            </div>
          </div>
          <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-gray-700">
            <table className="w-full text-left text-xs text-gray-300 min-w-max border-collapse">
              <tbody>
                {rows.slice(0, 100).map((item, index) => {
                  const insertSyntax = `{{${formattedNodeName}${basePrefix}[${index}]}}`;
                  return (
                    <tr key={index} className="border-b border-gray-800/50 hover:bg-[#1a2333] transition-colors">
                      <td className="px-2.5 py-1.5 w-8 text-center border-r border-gray-800/50 text-gray-600 font-mono text-[10px]">{index}</td>
                      <td 
                        className={`px-3 py-1.5 truncate max-w-[300px] transition-colors font-mono text-emerald-400/90
                          ${activeField && isTested ? "hover:bg-blue-500/20 hover:text-blue-300 cursor-pointer" : "cursor-not-allowed"}`}
                        onClick={() => activeField && isTested && handleInsert(insertSyntax)}
                      >
                        {String(item)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    const allRowsSyntax = customPathPrefix !== undefined
      ? `{{${formattedNodeName}${customPathPrefix}}}`
      : (nodeName.toLowerCase().includes('google sheet')
          ? `{{${formattedNodeName}.rows}}`
          : `{{${formattedNodeName}${wireIndex !== undefined ? `.[${wireIndex}]` : ''}}}`);

    const allRowsLabel = customLabel || `+ All Rows (${nodeName}${wireIndex !== undefined ? `.[${wireIndex}]` : ''})`;

    return (
      <div className="w-full border-t border-gray-800">
        {/* Clean Top Toolbar */}
        <div className="text-[10px] px-3 py-2 bg-[#161b22] text-gray-400 flex justify-between items-center border-b border-gray-800 w-full gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-gray-300 uppercase tracking-wider text-[10px] truncate">
              {customLabel ? customLabel.replace(/^\+\s*/, '') : 'Data Grid'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              draggable={isTested}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', allRowsSyntax);
                e.dataTransfer.setData('application/buildflow-variable', JSON.stringify({
                  nodeName: formattedNodeName,
                  path: customPathPrefix ? customPathPrefix.replace(/^\./, '') : (wireIndex !== undefined ? `[${wireIndex}]` : 'rows'),
                  display: allRowsSyntax
                }));
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => {
                if (activeField && isTested) {
                  handleInsert(allRowsSyntax);
                }
              }}
              className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all border flex items-center gap-1.5 ${
                activeField && isTested
                  ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-blue-500/40 cursor-grab active:cursor-grabbing shadow-sm'
                  : 'bg-gray-800/40 text-gray-500 border-gray-700/50 cursor-not-allowed opacity-60'
              }`}
              title={
                !isTested
                  ? 'Test node first'
                  : activeField
                    ? `Insert: ${allRowsSyntax}`
                    : 'Select an input field first'
              }
            >
              <span>{allRowsLabel}</span>
            </button>
            <span className="px-2 py-0.5 rounded-full bg-blue-900/30 border border-blue-800/40 text-blue-400 font-mono text-[10px]">
              {rows.length} rows
            </span>
          </div>
        </div>

        {/* Clean, Flat Data Table */}
        <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <table className="w-full text-left text-xs text-gray-300 min-w-max border-collapse">
            <thead className="bg-[#1a1f2e] sticky top-0 z-10">
              <tr>
                <th className="px-2.5 py-2 text-center border-r border-b border-[#2a2f3e] text-gray-500 font-mono text-[10px] w-10">
                  #
                </th>
                {headers.map((header) => {
                  const headerVariableText = `{{${formattedNodeName}${basePrefix}.${header}}}`;
                  const dragPath = `${basePrefix ? basePrefix.replace(/^\./, '') + '.' : ''}${header}`;

                  return (
                    <th
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', headerVariableText);
                        e.dataTransfer.setData('application/buildflow-variable', JSON.stringify({
                          nodeName: formattedNodeName,
                          path: dragPath,
                          display: headerVariableText.replace('{{', '').replace('}}', '')
                        }));
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      key={header}
                      className={`px-3 py-2 border-r border-b border-[#2a2f3e] font-medium text-gray-300 max-w-[180px] transition-colors group select-none
                        ${activeField && isTested 
                          ? "hover:bg-blue-600/20 hover:text-blue-300 cursor-grab active:cursor-grabbing" 
                          : "cursor-not-allowed opacity-60"
                        }
                      `}
                      onClick={() => {
                        if (activeField && isTested) {
                          handleInsert(headerVariableText);
                        }
                      }}
                      title={
                        !isTested
                          ? "Test node first to map data"
                          : activeField
                            ? `Map column: ${headerVariableText} (Click or drag)`
                            : "Select an input field first"
                      }
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate">{header}</span>
                        <span className="text-[9px] text-blue-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          + Map
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 100).map((item, rowIndex) => (
                <tr key={rowIndex} className="border-b border-[#1a1f2e]/60 hover:bg-[#1a2333]/70 transition-colors group">
                  <td className="px-2.5 py-1.5 text-center border-r border-[#1a1f2e]/60 text-gray-600 bg-[#141822] font-mono text-[10px]">
                    {rowIndex}
                  </td>
                  {headers.map((header) => {
                    const val = item?.[header];
                    const isValArray = Array.isArray(val);
                    const isValObj = typeof val === 'object' && val !== null && !isValArray;

                    const fieldPath = rows.length === 1 
                      ? `${basePrefix}.${header}` 
                      : `${basePrefix}.[${rowIndex}].${header}`;

                    if (isValArray) {
                      const arraySyntax = `{{${formattedNodeName}${fieldPath}}}`;
                      return (
                        <td key={header} className="px-2.5 py-1.5 border-r border-[#1a1f2e]/60 align-middle max-w-[220px]">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 border border-purple-800/40 text-purple-300 whitespace-nowrap">
                              Array ({val.length})
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeField && isTested) {
                                  handleInsert(arraySyntax);
                                }
                              }}
                              className={`px-1.5 py-0.5 text-[9px] rounded font-medium border transition-colors whitespace-nowrap ${
                                activeField && isTested
                                  ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-blue-500/40'
                                  : 'bg-gray-800/40 text-gray-500 border-gray-700/50'
                              }`}
                              title={`Map array: ${arraySyntax}`}
                            >
                              + Map
                            </button>
                            {val.length > 0 && typeof val[0] === 'object' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDrillDownStacks(prev => ({
                                    ...prev,
                                    [nodeId]: [
                                      ...(prev[nodeId] || []),
                                      { 
                                        path: fieldPath, 
                                        data: val, 
                                        label: rows.length === 1 ? header : `${header} [${rowIndex}]` 
                                      }
                                    ]
                                  }));
                                }}
                                className="px-1.5 py-0.5 text-[9px] rounded font-medium bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40 whitespace-nowrap"
                                title="Explore this array as a table"
                              >
                                View ↗
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    }

                    if (isValObj) {
                      const objSyntax = `{{${formattedNodeName}${fieldPath}}}`;
                      const keyCount = Object.keys(val).filter(k => k !== 'sourceRefs').length;
                      return (
                        <td key={header} className="px-2.5 py-1.5 border-r border-[#1a1f2e]/60 align-middle max-w-[220px]">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-950/60 border border-blue-800/40 text-blue-300 whitespace-nowrap truncate max-w-[100px]">
                              Object ({keyCount})
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeField && isTested) {
                                  handleInsert(objSyntax);
                                }
                              }}
                              className={`px-1.5 py-0.5 text-[9px] rounded font-medium border transition-colors whitespace-nowrap ${
                                activeField && isTested
                                  ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-blue-500/40'
                                  : 'bg-gray-800/40 text-gray-500 border-gray-700/50'
                              }`}
                              title={`Map object: ${objSyntax}`}
                            >
                              + Map
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDrillDownStacks(prev => ({
                                  ...prev,
                                  [nodeId]: [
                                    ...(prev[nodeId] || []),
                                    { 
                                      path: fieldPath, 
                                      data: [val], 
                                      label: rows.length === 1 ? header : `${header} [${rowIndex}]` 
                                    }
                                  ]
                                }));
                              }}
                              className="px-1.5 py-0.5 text-[9px] rounded font-medium bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40 whitespace-nowrap"
                              title="Explore this object"
                            >
                              View ↗
                            </button>
                          </div>
                        </td>
                      );
                    }

                    // Primitive value
                    const cellVariableText = `{{${formattedNodeName}${fieldPath}}}`;
                    const displayStr = val !== undefined && val !== null ? String(val) : '';

                    return (
                      <td
                        key={header}
                        className={`px-3 py-1.5 border-r border-[#1a1f2e]/60 max-w-[200px] transition-colors
                          ${activeField && isTested 
                            ? "hover:bg-blue-500/20 hover:text-white cursor-pointer" 
                            : "cursor-not-allowed opacity-75"
                          }
                        `}
                        onClick={() => {
                          if (activeField && isTested) {
                            handleInsert(cellVariableText);
                          }
                        }}
                        title={
                          !isTested
                            ? "Test node first to map data"
                            : activeField
                              ? `Map cell: ${cellVariableText}\nValue: ${displayStr}`
                              : "Select an input field first"
                        }
                      >
                        <span className="truncate block font-mono text-[11px] text-gray-300">
                          {displayStr}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    <div className="w-full h-full bg-[#0d1117] flex flex-col overflow-hidden">

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
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative flex-shrink-0">
                    <NodeIcon
                      icon={node.icon}
                      name={node.nodeName}
                      size="lg"
                      nodeType={node.nodeType === "trigger" ? "trigger" : "action"}
                    />
                    {isTested && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#161b22] rounded-full" title="Successfully Executed"></span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-medium text-sm truncate ${isExpanded ? 'text-white' : 'text-gray-300'}`}>
                      {node.nodeName}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                      {isTested ? 'Data available' : 'Using sample schema'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  {onTestNode && !node.nodeName.toLowerCase().includes('webhook') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTestNode(node.nodeId);
                      }}
                      disabled={isNodeLoading}
                      className={`
                          px-2 py-1 flex items-center gap-1.5 rounded text-[10px] font-medium transition-colors border whitespace-nowrap flex-shrink-0
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
                <div className="bg-[#0d1117] flex flex-col">
                  {hasData ? (() => {
                    const wIndex = node.wireIndex !== undefined ? node.wireIndex : 0;
                    const wireData = Array.isArray(testOutput.data) ? (testOutput.data[wIndex] || []) : testOutput.data;
                    const currentMode = modeViews[node.nodeId] ?? 'table';
                    
                    return (
                      <>
                        <div className="flex justify-end px-2 py-1.5 border-b border-[#2a2f3e] bg-[#161b22]">
                          <div className="flex items-center gap-1 p-0.5 bg-[#0d1117] rounded-md border border-[#2a2f3e]">
                            <button
                              type="button"
                              onClick={() => setModeViews(prev => ({ ...prev, [node.nodeId]: 'tree' }))}
                              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                                currentMode === 'tree'
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'text-gray-400 hover:text-gray-200'
                              }`}
                            >
                              Tree (JSON)
                            </button>
                            <button
                              type="button"
                              onClick={() => setModeViews(prev => ({ ...prev, [node.nodeId]: 'table' }))}
                              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                                currentMode === 'table'
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'text-gray-400 hover:text-gray-200'
                              }`}
                            >
                              Table
                            </button>
                          </div>
                        </div>

                        {currentMode === 'tree' ? (
                          <div className="p-2.5 bg-[#111620] overflow-x-auto">
                            <div className="text-[10px] text-gray-500 font-mono mb-2 flex items-center justify-between">
                              <span>Interactive JSON Explorer (click or drag to map)</span>
                              <span>{Array.isArray(wireData) ? `${wireData.length} items` : 'Object'}</span>
                            </div>
                            {renderJsonTree(node.nodeId, node.nodeName, wireData, Array.isArray(testOutput.data) && Array.isArray(testOutput.data[0]) ? `.[${wIndex}]` : "", 0, isTested)}
                          </div>
                        ) : (
                          <div className="bg-[#111620]">
                            {(() => {
                              const currentDrillStack = drillDownStacks[node.nodeId] || [];
                              const isDrilled = currentDrillStack.length > 0;
                              const currentLevel = isDrilled ? currentDrillStack[currentDrillStack.length - 1] : null;

                              if (isDrilled && currentLevel) {
                                return (
                                  <>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141a24] border-b border-gray-800 text-xs">
                                      <button
                                        type="button"
                                        onClick={() => setDrillDownStacks(prev => ({ ...prev, [node.nodeId]: [] }))}
                                        className="text-gray-400 hover:text-blue-400 font-medium transition-colors flex items-center gap-1"
                                      >
                                        <span>Root</span>
                                      </button>
                                      {currentDrillStack.map((step, sIdx) => {
                                        const isLast = sIdx === currentDrillStack.length - 1;
                                        return (
                                          <div key={sIdx} className="flex items-center gap-1.5">
                                            <span className="text-gray-600">/</span>
                                            {isLast ? (
                                              <span className="text-blue-400 font-medium truncate max-w-[150px]">{step.label}</span>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => setDrillDownStacks(prev => ({
                                                  ...prev,
                                                  [node.nodeId]: currentDrillStack.slice(0, sIdx + 1)
                                                }))}
                                                className="text-gray-400 hover:text-blue-400 transition-colors truncate max-w-[120px]"
                                              >
                                                {step.label}
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })}
                                      <button
                                        type="button"
                                        onClick={() => setDrillDownStacks(prev => ({
                                          ...prev,
                                          [node.nodeId]: currentDrillStack.slice(0, -1)
                                        }))}
                                        className="ml-auto text-[10px] text-gray-400 hover:text-gray-200 bg-gray-800/80 hover:bg-gray-700 px-2 py-0.5 rounded border border-gray-700 flex items-center gap-1"
                                      >
                                        ← Back
                                      </button>
                                    </div>
                                    {renderArrayTable(
                                      node.nodeName,
                                      node.nodeId,
                                      currentLevel.data,
                                      isTested,
                                      wIndex,
                                      currentLevel.path,
                                      `+ All Items (${currentLevel.label})`
                                    )}
                                  </>
                                );
                              }

                              if (node.nodeType === 'google_sheet' && (wireData?.rows || Array.isArray(wireData)) && Array.isArray((wireData.rows || wireData)[0])) {
                                return renderSpreadsheetTable(node.nodeName, node.nodeId, wireData);
                              }

                              const targetArray = Array.isArray(wireData?.rows || wireData)
                                ? (wireData?.rows || wireData)
                                : (typeof wireData === 'object' && wireData !== null ? [wireData] : null);

                              if (targetArray) {
                                return renderArrayTable(
                                  node.nodeName,
                                  node.nodeId,
                                  targetArray,
                                  isTested,
                                  wIndex,
                                  Array.isArray(testOutput.data) && Array.isArray(testOutput.data[0]) ? `.[${wIndex}]` : (wireData?.rows ? '.rows' : "")
                                );
                              }

                              return renderVariableTable(node, isTested);
                            })()}
                          </div>
                        )}
                      </>
                    );
                  })() : (
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
