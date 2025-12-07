"use client";
import { useState, useCallback } from "react";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Edage, NodeType } from "@/app/types/workflow.types";
import SheetDemo from "./TriggerSidebar";
import PlaceholderNode from "./PlaceHolder";

export default function WorkFlow() {
  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [edges, setEdges] = useState<Edage[]>([]);
  const [open, setOpen] = useState(false);

  // Node/edge handlers
  const onNodesChange = useCallback(
    (changes: any) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: any) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  );
  const onConnect = useCallback(
    (params: any) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    []
  );

  // For demonstration, let the "Add Trigger" floating button always re-open sidebar, but only show sidebar when no nodes exist
  // (could adapt to allow multiple triggers/nodes later)
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
      }}
    >
      {/* Overlay to add a trigger node if empty */}
      {!nodes.length && (
        <>
          <SheetDemo
            isOPen={open}
            setIsOpen={setOpen}
            onSelect={(trigger) => {
              setNodes([
                {
                  id: String(Math.random()),
                  // type: "trigger",
                  position: { x: 200, y: 100 },
                  data: {
                    label: trigger.name,
                    SelectedType: trigger.type,
                    TYpe: "Trigger",
                    config: trigger.config as unknown as JSON,
                  },
                },
              ]);
              setOpen(false); // close after selection
            }}
          />
        </>
      )}
      {/* Hide the "+" button after a trigger is selected, i.e., when there is at least one node */}
      {!nodes.length && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <button
            className="text-4xl text-white pointer-events-auto border border-dotted-red-50 px-6 p-2 rounded-2xl"
            onClick={() => setOpen(true)}
          >
            +
          </button>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        nodeTypes={{ trigger: PlaceholderNode }}
      />
    </div>
  );
}
