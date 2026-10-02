"use client";

import { useState, useEffect, useCallback } from "react";
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
  addEdge,
  Connection,
  EdgeChange
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
import { useAppDispatch, useAppSelector } from "@/app/hooks/redux";
import { useAutoSave } from "@/app/hooks/useAutoSave";
import { workflowActions } from "@/store/slices/workflowSlice";
import { setNodeOutput, setNodeLoading, selectAllOutputs } from "@/store/slices/nodeOutputSlice";
import { resolveConfigVariables } from "@repo/common/zod";
import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { AppSidebar } from "@/app/components/ui/app-sidebar";
import ExecutionHistoryFooter from "@/app/components/ExecutionHistoryFooter";
export default function WorkflowCanvas() {
  const params = useParams();
  const workflowId = params.id as string;
  const dispatch = useAppDispatch()
  const reduxWorkflow = useAppSelector(s => s.workflow)
  const allTestedOutputs = useAppSelector(selectAllOutputs);
  const { batchSave, displayStatus } = useAutoSave(workflowId)


  // context rebuilding for test function

  const buildTestContext = () => {
    const context: Record<string, any> = {};
    for (const [nodeId, testOutput] of Object.entries(allTestedOutputs)) {
      if (testOutput.success && testOutput.data) {
        const normalizedName = testOutput.nodeName.toLowerCase().replace(/\s+/g, '_')
        context[normalizedName] = testOutput.data
      }
    }
    return context;
  }

  const testNodeFromCanvas = async (nodeId: string, nodeName: string, nodeType: string) => {
    dispatch(setNodeLoading({ nodeId: nodeId, loading: true }));
    try {
      const isTrigger = reduxWorkflow.data.trigger?.TriggerId === nodeId;
      const savedConfig = isTrigger ? reduxWorkflow.data.trigger?.Config :
        reduxWorkflow.data.nodes.find(n => n.NodeId === nodeId)?.Config;
      console.log(savedConfig, "-- from 57852")
      const interpolationContext = buildTestContext();
      const resolvedConfig = resolveConfigVariables(savedConfig, interpolationContext);
      console.log(resolvedConfig, "--from 60")
      const response = await api.execute.node(nodeId, resolvedConfig);
      dispatch(setNodeOutput({
        nodeId: nodeId,
        nodeName: nodeName,
        nodeType: nodeType,
        data: response.output,
        metadata: response.metadata,
        testedAt: Date.now(),
        success: true,
        variables: []
      }))
      toast.success(`Tested ${nodeName} successfully!`);
    } catch (err: any) {
      console.log(err, "from 73")
      toast.error(`Test failed: ${err.message}`);
      dispatch(setNodeOutput({
        nodeId,
        nodeName,
        nodeType,
        data: null,
        variables: [],
        testedAt: Date.now(),
        success: false,
        error: err.message
      }));
    }
  }
  const getPreviousNodes = (
    selectedNodeId: string,
    allNodes: Node[],
    allEdges: Edge[]
  ): PreviousNodeOutput[] => {
    // BFS backward through the graph to find ALL ancestor nodes
    const visited = new Set<string>();
    const queue = [selectedNodeId];
    const previousNodeIds: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const parents = allEdges
        .filter(e => e.target === current)
        .map(e => e.source);
      for (const parentId of parents) {
        if (!visited.has(parentId)) {
          visited.add(parentId);
          previousNodeIds.push(parentId);
          queue.push(parentId);
        }
      }
    }

    // Build PreviousNodeOutput for each ancestor
    return previousNodeIds
      .map(id => allNodes.find(n => n.id === id))
      .filter((node): node is Node => !!node && !node.data?.isPlaceholder)
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

    const unConfigured = nodes.filter(
      n => !n.data.isPlaceholder && !n.data.isConfigured
    );

    if (unConfigured.length > 0) {
      setError(`Configure these nodes first: ${unConfigured.map(n => n.data.label).join(', ')}`);
      return
    }
    setLoading(true);

    try {
      const data = await api.workflows.execute({ workflowId })
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
  const [loading, setLoading] = useState<boolean>(false);
  const [branchSourceNodeId, setBranchSourceNodeId] = useState<string | null>(null);
  const [branchSourceHandleId, setBranchSourceHandleId] = useState<string | null>(null);
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

  function checkIsConfigure(nodeName: string, config: any): boolean {
    const nodeConfig = getNodeConfig(nodeName);
    if (!nodeConfig || !nodeConfig.fields) return true;
    const requiredFields = nodeConfig.fields.filter((f: any) => f.required);
    if (requiredFields.length === 0) return true;
    return requiredFields.every((f: any) => config?.[f.name] !== undefined && config?.[f.name] !== '');
  }

  useEffect(() => {
    setNodes(prev => prev.map(node => {
      if (node.data?.isPlaceholder) return node;
      if (node.data?.nodeType === 'trigger') {
        const reduxConfig = reduxWorkflow.data.trigger?.Config;
        const name = reduxWorkflow.data.trigger?.name || "";
        return { ...node, data: { ...node.data, isConfigured: checkIsConfigure(name, reduxConfig) } }
      }

      if (node.data.nodeType === 'action') {
        const reduxNode = reduxWorkflow.data.nodes.find(n => n.NodeId === node.id);
        if (!reduxNode) return node;
        return { ...node, data: { ...node.data, isConfigured: checkIsConfigure(reduxNode.name, reduxNode.Config) } };
      }
      return node;
    }));
  }, [reduxWorkflow.data.nodes, reduxWorkflow.data.trigger])

  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        if (reduxWorkflow.data.workflowId === workflowId) {
          const { trigger, nodes: reduxNodes, edges: reduxEdges } = reduxWorkflow.data

          if (!trigger) {
            setNodes([{
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
            }]);
            setEdges([]);
            setError(null);
            return;
          }
          const triggerPosition = ensurePosition(trigger.position, DEFAULT_TRIGGER_POSITION)
          const triggerNode = {
            id: trigger.TriggerId,
            type: "customNode",
            position: triggerPosition,
            data: {
              label: trigger.name || "Trigger",
              icon: trigger.icon || "⚡", // add icon field in redux and db 
              nodeType: "trigger",
              isConfigured: checkIsConfigure(trigger.name, trigger.Config),
              onConfigure: () =>
                handleNodeConfigure({
                  id: trigger.TriggerId,
                  name: trigger.name,
                  icon: trigger.icon
                }),
              onTest: (trigger.name.toLowerCase().includes('webhook') ? undefined : () => testNodeFromCanvas(trigger.TriggerId, trigger.name, "trigger")),
              onAddChild: (sourceHandleId?: string) => {
                setBranchSourceNodeId(trigger.TriggerId);
                setBranchSourceHandleId(sourceHandleId || null);
                setActionOpen(true);
              }
            },
          };

          console.log(JSON.stringify(reduxNodes), "from 236")
          const transformedNodes = reduxNodes.map((node) => ({
            id: node.NodeId,
            type: "customNode",
            position: ensurePosition(node.position, {
              x: triggerPosition.x + 350,
              y: triggerPosition.y + 150,
            }),
            data: {
              label: node.name || "Unknown",
              icon: node.icon || "⚙️",
              nodeType: "action",
              isConfigured: checkIsConfigure(node.name, node.Config),
              onConfigure: () =>
                handleNodeConfigure({
                  id: node.NodeId,
                  name: node.name,
                  type: "action",
                  actionType: node.AvailableNodeID,
                  icon: node.icon
                }),
              onTest: () => testNodeFromCanvas(node.NodeId, node.name, "action"),
              onAddChild: (sourceHandleId?: string) => {
                setBranchSourceNodeId(node.NodeId);
                setBranchSourceHandleId(sourceHandleId || null);
                setActionOpen(true);
              }
            }
          }))

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

          const lastActionNode = reduxNodes.length > 0 ? reduxNodes[reduxNodes.length - 1] : null;
          const sourceNodeId = lastActionNode ? lastActionNode.NodeId : trigger.TriggerId

          const cleanReduxEdges = reduxEdges.filter(e => !e.target.startsWith('action-placeholder-'))

          const newEdges = [
            ...cleanReduxEdges,
            { id: `e-action-${sourceNodeId}-placeholder`, source: sourceNodeId, target: actionPlaceholder.id },
          ]
          setNodes(finalNodes)
          setEdges(newEdges)
          setError(null)

          return
        }


        else {
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
            setNodes([{
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
            }]);
            setEdges([]);
            setError(null);
            return;
          }

          // store updating
          dispatch(
            workflowActions.setWorkflowFromBackend({
              workflowId,
              data: workflows.data.Data,
            })
          )
          // Ensure trigger position
          const triggerPosition = ensurePosition(
            Trigger?.Position,
            DEFAULT_TRIGGER_POSITION
          );

          const triggerNode = {
            id: Trigger.id,
            type: "customNode",
            position: triggerPosition,
            data: {
              label: Trigger.name || Trigger.data?.label || "Trigger",
              icon: Trigger?.icon || "⚡",
              nodeType: "trigger",
              isConfigured: checkIsConfigure(Trigger.name, Trigger.config || {}),
              onConfigure: () =>
                handleNodeConfigure({
                  id: Trigger.id,
                  name: Trigger.name,
                  icon: Trigger.icon
                }),
              onTest: (Trigger.name.toLowerCase() === 'webhook' ? undefined : () => testNodeFromCanvas(Trigger.TriggerId, Trigger.name, "trigger")),
              onAddChild: () => {
                setBranchSourceNodeId(Trigger.id);
                setActionOpen(true);
              }
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
              icon: node.icon || "⚙️",
              nodeType: "action",
              isConfigured: checkIsConfigure(node.name || node.data?.label, node.config || {}),
              onConfigure: () =>
                handleNodeConfigure({
                  id: node.id,
                  name: node.data?.label || node.name,
                  type: "action",
                  icon: node.icon,
                  actionType: node.AvailableNodeId,
                }),
              onTest: () => testNodeFromCanvas(node.NodeId, node.name, "action"),
              onAddChild: (sourceHandleId?: string) => {
                setBranchSourceNodeId(node.id);
                setBranchSourceHandleId(sourceHandleId || null);
                setActionOpen(true);
              }
            },
          }));

          // 4. Combine nodes
          const finalNodes = [triggerNode, ...transformedNodes];

          // 5. Manage edges
          let finalEdges = Array.isArray(dbEdges) ? [...dbEdges] : [];

          if (dbEdges.length === 0 && transformedNodes.length > 0) {
            const triggerEdge = {
              id: `e-${triggerNode.id}-${transformedNodes[0].id}`,
              source: triggerNode.id,
              target: transformedNodes[0].id,
              type: "default",
            };
            finalEdges.push(triggerEdge);
          }

          setNodes(finalNodes);
          setEdges(finalEdges);
          setError(null);
        }
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
  };

  const onConnect = (connection: Connection) => {
    if (connection.source === connection.target) {
      toast.error("A node cannot connect to itself.")
      return
    }
    const targetNode = nodes.find((n) => n.id === connection.target)
    if (targetNode?.data.nodeType === 'trigger') {
      toast.error("Triggers cannot receive inputs.")
      return
    }
    if (targetNode?.data.isPlaceholder) {
      toast.error("Please configure the node before connecting.")
      return
    }
    if (edges.some(e =>
      e.target === connection.target && !e.target.startsWith("action-placeholder-")
    )) {
      toast.error("Each node can only accept 1 incoming connection (1 -> M).")
      return
    }

    const newEdge: Edge = {
      ...connection,
      id: `e-${connection.source}-${connection.target}-${Date.now()}`,
      animated: true,
    };
    const updated = addEdge(newEdge, edges);
    setEdges(updated);

    const cleanEdges = updated
      .filter((e) => !e.target.startsWith("action-placeholder-") && e.target !== "action-holder")
      .map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle ?? null, targetHandle: e.targetHandle ?? null }));
    dispatch(workflowActions.setEdge(cleanEdges));
    toast.success("Branch connected successfully!");
  };

  const nodeChangeDb = async (event: React.MouseEvent, node: Node) => {
    try {
      if (node.data?.nodeType === "trigger") {
        // await api.triggers.update({
        //   TriggerId: node.id,
        //   Config: {
        //     ...(typeof node.data.config === "object" && node.data.config !== null
        //       ? node.data.config
        //       : {}),
        //     position: node.position,
        //   },
        // });
        dispatch(workflowActions.updateTriggerPosition(node.position))
      }
      else {
        // await api.nodes.update({
        //   NodeId: node.id,
        //   position: node.position,
        // });
        dispatch(workflowActions.updateNodePosition({
          nodeId: node.id,
          position: node.position
        }))
      }
    } catch (err: any) {
      setError(
        err?.message ??
        "Failed to update node position. Please try again."
      );
    }
  }

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

    // Use branchSourceNodeId if branching, otherwise fall back to linear
    const actualSourceNodeId = branchSourceNodeId || (currentActionNodes.length > 0 ? currentActionNodes[currentActionNodes.length - 1]!.id : triggerNode.id);
    const actualSourceNode = nodes.find(n => n.id === actualSourceNodeId);
    
    // Check how many children this source node has to vertically stack them
    const childCount = edges.filter(e => e.source === actualSourceNodeId && !e.target.startsWith('action-placeholder-')).length;

    const newNodePosition = actualSourceNode ? {
      x: actualSourceNode.position.x + 350,
      y: actualSourceNode.position.y + (childCount * 170),
    } : { x: 350, y: 400 };

    try {
      const result = await api.nodes.create({
        Name: action.name,
        AvailableNodeId: action.id,
        WorkflowId: workflowId,
        position: newNodePosition,
        stage: nextIndex,
      });
      console.log("The data of Node Positions from 201", newNodePosition)
      const actionId = result.data.data.id;

      // const reduxState = store.getState().workflow.data
      // const existingReduxNodes = reduxState.nodes
      // const sourceNodeId = existingReduxNodes.length > 0
      //     ? existingReduxNodes[existingReduxNodes.length - 1]!.NodeId
      //     : triggerNode.id
      // const filterEdges = reduxState.edges.filter(e => !e.target.startsWith('action-placeholder-'))

      const sourceNodeId = actualSourceNodeId;

      const cleanReduxEdges = edges.filter(
        e => !e.target.startsWith('action-placeholder-') &&
          e.target !== 'action-holder'
      )
      // store updating

      dispatch(workflowActions.addWorkflowNode({
        NodeId: actionId,
        name: action.name,
        type: action.type,
        Config: {},
        icon: "",
        position: newNodePosition,
        stage: nextIndex,
        AvailableNodeID: action.id
      }))

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
              icon: action.icon
            }),
          onTest: () => testNodeFromCanvas(actionId, action.name, "action"),
          onAddChild: (sourceHandleId?: string) => {
            setBranchSourceNodeId(actionId);
            setBranchSourceHandleId(sourceHandleId || null);
            setActionOpen(true);
          }
        },
      };

      setNodes((prevNodes) => {
        // Remove any existing action placeholder nodes (cleanup)
        const filtered = prevNodes.filter(
          (n) => !(n.data.isPlaceholder && n.data.nodeType === "action")
        );
        return [...filtered, newNode];
      });

      // const reduxState = store.getState().workflow.data
      // const existingReduxNodes = reduxState.nodes
      // const sourceNodeId = existingReduxNodes.length > 0 
      //     ? existingReduxNodes[existingReduxNodes.length - 1]!.NodeId 
      //     : triggerId 
      // // Remove placeholder-targeting edges
      // const filterEdges = reduxState.edges.filter(e => !e.target.startsWith('action-placeholder-'))

      const newEdges = [
        ...cleanReduxEdges,
        { 
          id: `e-action-${sourceNodeId}-${actionId}`, 
          source: sourceNodeId, 
          target: actionId,
          sourceHandle: actualSourceNode?.data.nodeType === "trigger" ? "t-out" : (branchSourceHandleId || "out-0"),
          targetHandle: "a-in"
        }
      ]

      setEdges(newEdges);
      const reduxEdges = newEdges.filter(e => !e.target.startsWith('action-placeholder-') && e.target !== 'action-holder')
      dispatch(workflowActions.setEdge(reduxEdges))
      setBranchSourceNodeId(null);
      setBranchSourceHandleId(null);
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
          isConfigured: checkIsConfigure(trigger.name, {}),
          config: {},
          onConfigure: () =>
            handleNodeConfigure({
              id: triggerId,
              name: trigger.name,
              type: "trigger",
              icon: trigger.icon
            }),
          onTest: (trigger.name.toLowerCase() === 'webhook' ? undefined : () => testNodeFromCanvas(trigger.TriggerId, trigger.name, "trigger")),
          onAddChild: (sourceHandleId?: string) => {
            setBranchSourceNodeId(triggerId);
            setBranchSourceHandleId(sourceHandleId || null);
            setActionOpen(true);
          }
        },
      };

      setNodes([newNode]);
      setEdges([]);

      dispatch(workflowActions.setWorkflowTrigger({
        TriggerId: triggerId,
        name: trigger.name,
        type: trigger.type,
        Config: {},
        icon: "",
        position: DEFAULT_TRIGGER_POSITION,
        AvailableTriggerID: trigger.id
      }))
      dispatch(workflowActions.setEdge([]))
      setTriggerOpen(false);
      setError(null);
    } catch (err: any) {
      setError(
        err?.message ??
        "Failed to add trigger. Please try again."
      );
    }
  };

  // const handleSave = async () => {
  //   try {
  //     await api.workflows.put({
  //       workflowId: workflowId,
  //       edges: edges,
  //     });
  //     setError(null);
  //   } catch (err: any) {
  //     setError(
  //       err?.message ??
  //       "Failed to save workflow. Please try again."
  //     );
  //   }
  // };
  // console.log("THis log from page.tsx about the nodeConfig", selectedNode)

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "row" }}>
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
      <div className=" w-auto h-full text-black">
        <SidebarProvider>
          <AppSidebar />

          {/* {children} */}
        </SidebarProvider>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={(changes) => {
          onEdgesChange(changes);
          if (changes.some(c => c.type === 'remove')) {
            // Give ReactFlow a tick to update edges state, then dispatch
            setTimeout(() => {
              setEdges(currentEdges => {
                const clean = currentEdges.filter(e => !e.target.startsWith('action-placeholder-') && e.target !== 'action-holder')
                  .map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle ?? null, targetHandle: e.targetHandle ?? null }));
                dispatch(workflowActions.setEdge(clean));
                return currentEdges;
              });
            }, 0);
          }
        }}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeDragStop={nodeChangeDb}
        fitView
      >
        <Background bgColor="#fdfdfd" />
        <Controls />


        <div style={{ position: "fixed", bottom: "60px", right: "10rem", display: "flex", gap: "1rem", zIndex: 50 }}>
          <button
            onClick={batchSave}
            className="border bg-white text-black font-bold p-4 shadow-lg px-12 rounded-2xl"
          >
            {displayStatus}
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
      // onNodeConfigured={(nodeId, isConfigured)=>{
      //   setNodes(prev=> prev.map(n=>
      //     n.id === nodeId ? { ...n, data: {...n.data, isConfigured}} : n
      //   ))
      // }}
      // onSave={async (nodeId: string, config: any, userId: string) => {
      //   try {
      //     const triggerNode = nodes.find(
      //       (n) => n.data.nodeType === "trigger"
      //     );
      //     const isTrigger = triggerNode?.id === nodeId;

      //     if (isTrigger) {
      //       // await api.triggers.update({
      //       //   TriggerId: nodeId,
      //       //   Config: config,
      //       // });
      //       dispatch(workflowActions.updateTriggerConfig({config}))
      //     } else {
      //       // await api.nodes.update({
      //       //   NodeId: nodeId,
      //       //   Config: config,
      //       // });
      //       dispatch(workflowActions.updateNodeConfig({nodeId, config}))
      //     }

      //     setNodes((prevNodes) =>
      //       prevNodes.map((node) =>
      //         node.id === nodeId
      //           ? {
      //             ...node,
      //             data: { ...node.data, config, isConfigured: true },
      //           }
      //           : node
      //       )
      //     );
      //     setError(null);
      //   } catch (err: any) {
      //     setError(
      //       err?.message ??
      //       "Failed to save configuration. Please try again."
      //     );
      //   }
      // }}
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

      <ExecutionHistoryFooter
        workflowId={workflowId}
        onExecutionFetch={() => { }}
      />
    </div>
  );
}
