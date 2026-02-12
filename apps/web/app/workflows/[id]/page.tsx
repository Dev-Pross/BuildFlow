"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { PreviousNodeOutput } from "../../lib/types/node.types";
import BaseNode from "@/app/components/nodes/BaseNode";
import { TriggerSideBar } from "@/app/components/nodes/TriggerSidebar";
import ActionSideBar from "@/app/components/Actions/ActionSidebar";
import { api } from "@/app/lib/api";
import ConfigModal from "./components/ConfigModal";
import { toast } from "sonner";
import { getNodeConfig } from "@/app/lib/nodeConfigs";

export default function WorkflowCanvas() {
  const params = useParams();
  const workflowId = params.id as string;

  const getPreviousNodes = (
  selectedNodeId: string,
  allNodes: Node[],
  allEdges: Edge[]
  ): PreviousNodeOutput[] => {
    // Find edges pointing TO the selected node
    const incomingEdges = allEdges.filter(edge => edge.target === selectedNodeId);
    
    // Get source node IDs
    const previousNodeIds = incomingEdges.map(edge => edge.source);
    
    // Build PreviousNodeOutput for each
    return allNodes
      .filter(node => previousNodeIds.includes(node.id))
      .filter(node => !node.data?.isPlaceholder)
      .map(node => {
        const label = (node.data?.label as string) || "";
        const icon = (node.data?.icon as string) || "⚙️";
        const nodeConfig = getNodeConfig(label);
        return {
          nodeId: node.id,
          nodeName: label || "Unknown",
          nodeType: nodeConfig ? nodeConfig.id : "unknown",
          icon: icon,
          variables: nodeConfig?.outputSchema || []
        };
      });
  };
  // State
  const handleExecute = async () => {
    setLoading(true);
    try {
      const data = await api.workflows.execute({workflowId})
      console.log("This is from the Execute Button", data)
      toast.success("Execution Started")
    }
    catch (error: any) {
      toast.error("Failed to Execute Workflow");

    }
    finally {
      setLoading(false);
    }
  }
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([
    {
      id: "trigger-placeholder",
      type: "customNode",
      position: { x: 250, y: 50 },
      data: {
        label: "Add Trigger",
        icon: "➕",
        isPlaceholder: true,
        nodeType: "trigger",
        onConfigure: () => setTriggerOpen(true),
      },
    },
  ]);

  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<any>("")
  const nodeTypes = {
    customNode: BaseNode,
  };


  // Safe default position - reused everywhere below
  const DEFAULT_TRIGGER_POSITION = { x: 250, y: 50 };
  const DEFAULT_ACTION_POSITION = { x: 500, y: 200 };

  // Helper to ensure node has a valid position (defensive)
  function ensurePosition(pos: any, fallback = { x: 0, y: 0 }) {
    if (!pos || typeof pos.x !== "number" || typeof pos.y !== "number") {
      return fallback;
    }
    return pos;
  }
  console.log("The Detaisl of Selected Node is ", selectedNode)
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        const workflows = await api.workflows.get(workflowId);

        // Defensive: Default to empty arrays if not present
        const dbNodes = Array.isArray(workflows?.data?.Data?.nodes)
          ? workflows.data.Data.nodes
          : [];
        console.log("the node data is", dbNodes)
        const dbEdges = Array.isArray(workflows?.data?.Data?.Edges)
          ? workflows.data.Data.Edges
          : [];
        const Trigger = workflows?.data?.Data?.Trigger;

        if (!Trigger) {
          setError("No trigger found in workflow data, so start with selecting the trigger for the workflow");
          return;
        }

        // Ensure trigger position
        const triggerPosition = ensurePosition(
          Trigger?.config?.position,
          DEFAULT_TRIGGER_POSITION
        );

        const triggerNode = {
          id: Trigger.id,
          type: "customNode",
          position: triggerPosition,
          data: {
            label: Trigger.name || Trigger.data?.label || "Trigger",
            icon: Trigger.data?.icon || "⚡",
            nodeType: "trigger",
            isConfigured: true,
            onConfigure: () =>
              handleNodeConfigure({
                id: Trigger.id,
                name: Trigger.name
              }),
          },
        };

        // 3. Transform action nodes, ensuring position property is always valid
        const transformedNodes = dbNodes.map((node: any) => ({
          id: node.id,
          type: "customNode",
          position: ensurePosition(node?.position, {
            x: triggerPosition.x + 350,
            y: triggerPosition.y + 150,
          }),
          data: {
            label: node.data?.label || node.name || "Unknown",
            icon: node.data?.icon || "⚙️",
            nodeType: "action",
            onConfigure: () =>
              handleNodeConfigure({
                id: node.id,
                name: node.data?.label || node.name,
                type: "action",
                actionType: node.AvailableNodeId,
              }),
          },
        }));

        // 4. Calculate placeholder position: use last action node, fallback to trigger
        const lastNode =
          transformedNodes.length > 0
            ? transformedNodes[transformedNodes.length - 1]
            : triggerNode;

        const lastPosition = ensurePosition(
          lastNode?.position,
          transformedNodes.length > 0
            ? { x: triggerPosition.x + 350, y: triggerPosition.y + 150 }
            : triggerPosition
        );

        const placeholderPosition = {
          x: lastPosition.x + 550,
          y: lastPosition.y,
        };

        const actionPlaceholder = {
          id: `action-placeholder-${Date.now()}`,
          type: "customNode",
          position: placeholderPosition,
          data: {
            label: "Add Action",
            icon: "➕",
            isPlaceholder: true,
            nodeType: "action",
            onConfigure: () => setActionOpen(true),
          },
        };

        // 5. Combine nodes
        const finalNodes = [triggerNode, ...transformedNodes, actionPlaceholder];

        // 6. Manage edges
        let finalEdges = Array.isArray(dbEdges) ? [...dbEdges] : [];

        const placeholderEdge = {
          id: `e-${lastNode.id}-${actionPlaceholder.id}`,
          source: lastNode.id,
          target: actionPlaceholder.id,
          type: "default",
          animated: true,
        };

        if (dbEdges.length === 0 && transformedNodes.length > 0) {
          const triggerEdge = {
            id: `e-${triggerNode.id}-${transformedNodes[0].id}`,
            source: triggerNode.id,
            target: transformedNodes[0].id,
            type: "default",
          };
          finalEdges.push(triggerEdge);
        }

        finalEdges.push(placeholderEdge);

        setNodes(finalNodes);
        setEdges(finalEdges);
        setError(null);
      } catch (err: any) {
        console.error("Failed to load workflow:", err);
        setError(
          err?.message ??
          "Failed to load workflow. Please check your connection or reload the page."
        );
      }
    };

    loadWorkflows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  const handleNodeConfigure = (node: any) => {
    setSelectedNode(node);
    setConfigOpen(true);
  };

  const handleNodesChange = (changes: NodeChange[]) => {
    onNodesChange(changes);
    try {
      changes.forEach((change) => {
        if (change.type === "position" && change.position) {
          const changedNode = nodes.find((n) => n.id === change.id);

          if (changedNode?.data?.nodeType === "trigger") {
            api.triggers.update({
              TriggerId: change.id,
              Config: {
                ...(typeof changedNode.data.config === "object" &&
                  changedNode.data.config !== null
                  ? changedNode.data.config
                  : {}),
                position: change.position,
              },
            });
          } else {
            api.nodes.update({
              NodeId: change.id,
              position: change.position,
            });
          }
        }
      });
      setError(null);
    } catch (err: any) {
      setError(
        err?.message ??
        "Failed to update node position. Please try again."
      );
    }
  };

  const handleActionSelection = async (action: any) => {
    // Defensive: Ensure at least one trigger present
    const triggerNode = nodes.find(
      (n) => n.data.nodeType === "trigger" && !n.data.isPlaceholder
    );
    if (!triggerNode) {
      setError("No trigger found. Please add a trigger before adding actions.");
      return;
    }

    // Calculate next available action node index (excluding placeholders)
    const currentActionNodes = nodes.filter(
      (n) => n.data.nodeType === "action" && !n.data.isPlaceholder
    );
    const nextIndex = currentActionNodes.length;

    // Place new action node after last action (or at default offset if none)
    const ACTION_NODE_DEFAULT_X = 350;
    const ACTION_NODE_DEFAULT_Y = 400;
    const ACTION_NODE_OFFSET_X = 320;
    const newNodePosition = {
      x: ACTION_NODE_DEFAULT_X + ACTION_NODE_OFFSET_X * nextIndex,
      y: ACTION_NODE_DEFAULT_Y,
    };

    try {
      const result = await api.nodes.create({
        Name: action.name,
        AvailableNodeId: action.id,
        Config: {
          CredentialsID: "",
        },
        WorkflowId: workflowId,
        position: newNodePosition,
        stage: nextIndex,
      });
      console.log("The data of Node Positions from 201", newNodePosition)
      const actionId = result.data.data.id;

      const newNode = {
        id: actionId,
        type: "customNode",
        position: newNodePosition,
        data: {
          label: action.name,
          icon: action.icon,
          isPlaceholder: false,
          nodeType: "action",
          isConfigured: false,
          config: {},
          onConfigure: () =>
            handleNodeConfigure({
              id: actionId,
              name: action.name,
              type: "action",
              actionType: action.id,
            }),
        },
      };

      // Place the action placeholder after the new node, prevent overlap
      const actionPlaceholderPosition = {
        x: ACTION_NODE_DEFAULT_X + ACTION_NODE_OFFSET_X * (nextIndex + 1) + 400,
        y: ACTION_NODE_DEFAULT_Y,
      };

      const actionPlaceholder = {
        id: `action-placeholder-${Date.now()}`,
        type: "customNode",
        position: actionPlaceholderPosition,
        data: {
          label: "Add Action",
          icon: "➕",
          isPlaceholder: true,
          nodeType: "action",
          config: {},
          onConfigure: () => setActionOpen(true),
        },
      };

      const triggerId = triggerNode.id;

      setNodes((prevNodes) => {
        // Remove any existing action placeholder nodes
        const filtered = prevNodes.filter(
          (n) => !(n.data.isPlaceholder && n.data.nodeType === "action")
        );
        return [...filtered, newNode, actionPlaceholder];
      });

      setEdges((prevEdges) => {
        // Remove placeholder-targeting edges
        const filtered = prevEdges.filter((e) => {
          const targetNode = nodes.find((n) => n.id === e.target);
          return !(
            targetNode?.data.isPlaceholder &&
            targetNode?.data.nodeType === "action"
          );
        });

        const existingActionNodes = nodes.filter(
          (n) => n.data.nodeType === "action" && !n.data.isPlaceholder
        );

        const sourceNodeId =
          existingActionNodes.length > 0
            ? existingActionNodes[existingActionNodes.length - 1]!.id
            : triggerId;

        return [
          ...filtered,
          {
            id: `e-action-${sourceNodeId}-${actionId}`,
            source: sourceNodeId,
            target: actionId,
          },
          {
            id: `e-action-${actionId}-placeholder`,
            source: actionId,
            target: actionPlaceholder.id,
          },
        ];
      });

      setActionOpen(false);
      setError(null);
    } catch (err: any) {
      setError(
        err?.message ??
        "Failed to add an action node. Please try again."
      );
    }
  };

  const handleSelection = async (trigger: any) => {
    try {
      const result = await api.triggers.create({
        Name: trigger.name,
        AvailableTriggerID: trigger.id,
        Config: {},
        WorkflowId: workflowId,
        TriggerType: trigger.type,
      });
      const triggerId = result.data.data.id as string;

      const newNode = {
        id: triggerId,
        type: "customNode",
        position: DEFAULT_TRIGGER_POSITION,
        data: {
          label: trigger.name,
          icon: trigger.icon,
          isPlaceholder: false,
          nodeType: "trigger",
          isConfigured: false,
          config: {},
          onConfigure: () =>
            handleNodeConfigure({
              id: triggerId,
              name: trigger.name,
              type: "trigger",
            }),
        },
      };

      const actionPlaceholder = {
        id: "action-holder",
        type: "customNode",
        position: DEFAULT_ACTION_POSITION,
        data: {
          label: "Add Action",
          icon: "➕",
          isPlaceholder: true,
          nodeType: "action",
          config: {},
          onConfigure: () => setActionOpen(true),
        },
      };

      setNodes([newNode, actionPlaceholder]);
      setEdges([
        {
          id: "e1",
          source: triggerId,
          target: "action-holder",
        },
      ]);
      setTriggerOpen(false);
      setError(null);
    } catch (err: any) {
      setError(
        err?.message ??
        "Failed to add trigger. Please try again."
      );
    }
  };

  const handleSave = async () => {
    try {
      await api.workflows.put({
        workflowId: workflowId,
        edges: edges,
      });
      setError(null);
    } catch (err: any) {
      setError(
        err?.message ??
        "Failed to save workflow. Please try again."
      );
    }
  };
  console.log("THis log from page.tsx about the nodeConfig", selectedNode)

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      {error && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 10000,
            background: "#F87171",
            color: "white",
            padding: "16px 24px",
            borderRadius: "8px",
            fontWeight: "bold",
            boxShadow: "0 4px 12px 0 rgba(0,0,0,0.09)",
            minWidth: 250,
            maxWidth: 400,
            display: "flex",
            alignItems: "center",
          }}
          role="alert"
          aria-live="assertive"
        >
          <span style={{ marginRight: 12 }}>⚠️</span>
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: "16px",
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: "18px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
            aria-label="Dismiss error"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />


        <div style={{ position: "fixed", bottom: "1rem", right: "10rem", display: "flex", gap: "1rem", zIndex: 50 }}>
          <button
            onClick={handleSave}
            className="border bg-white text-black font-bold p-4 shadow-lg px-12 rounded-2xl"
          >
            Save
          </button>
          <button
            onClick={async () => {
              await handleExecute();
            }}
            disabled={loading}
            className="border bg-white text-black font-bold p-4 shadow-lg px-12 rounded-2xl"
            style={{ fontWeight: 600 }}
            type="button"
          >
            {loading ? "Executing..." : "Execute"}
          </button>
        </div>
      </ReactFlow>

      <ConfigModal
        isOpen={configOpen}
        selectedNode={selectedNode}
        workflowId={workflowId}
        previousNodes={selectedNode ? getPreviousNodes(selectedNode.id, nodes, edges) : []}
        onClose={() => {
          setConfigOpen(false);
          setSelectedNode(null);
        }}
        onSave={async (nodeId: string, config: any, userId: string) => {
          try {
            const triggerNode = nodes.find(
              (n) => n.data.nodeType === "trigger"
            );
            const isTrigger = triggerNode?.id === nodeId;

            if (isTrigger) {
              await api.triggers.update({
                TriggerId: nodeId,
                Config: config,
              });
            } else {
              await api.nodes.update({
                NodeId: nodeId,
                Config: config,
              });
            }

            setNodes((prevNodes) =>
              prevNodes.map((node) =>
                node.id === nodeId
                  ? {
                    ...node,
                    data: { ...node.data, config, isConfigured: true },
                  }
                  : node
              )
            );
            setError(null);
          } catch (err: any) {
            setError(
              err?.message ??
              "Failed to save configuration. Please try again."
            );
          }
        }}
      />

      <TriggerSideBar
        isOpen={triggerOpen}
        onClose={() => setTriggerOpen(false)}
        onSelectTrigger={handleSelection}
      />

      <ActionSideBar
        isOpen={actionOpen}
        onClose={() => setActionOpen(false)}
        onSelectAction={handleActionSelection}
      />
    </div>
  );
}
