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
import TriggerReplaceModal from "./components/TriggerReplaceModal";
import { toast } from "sonner";
import { getNodeConfig } from "@/app/lib/nodeConfigs";
import { useAppDispatch, useAppSelector } from "@/app/hooks/redux";
import { useAutoSave } from "@/app/hooks/useAutoSave";
import { NodeItem, Trigger, workflowActions } from "@/store/slices/workflowSlice";
import { setNodeOutput, setNodeLoading, selectAllOutputs, clearNodeOutput } from "@/store/slices/nodeOutputSlice";
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
      const msg = `Configure these nodes first: ${unConfigured.map(n => n.data.label).join(', ')}`;
      setError(msg);
      toast.error(msg);
      return;
    }
    setLoading(true);

    try {
      const data = await api.workflows.execute({ workflowId })
      console.log("This is from the Execute Button", data)
      toast.success("Execution Started")
    }
    catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Failed to Execute Workflow";
      setError(msg);
      toast.error(msg);
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

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  const [branchSourceNodeId, setBranchSourceNodeId] = useState<string | null>(null);
  const [branchSourceHandleId, setBranchSourceHandleId] = useState<string | null>(null);
  const nodeTypes = {
    customNode: BaseNode,
  };
  const [replacingNodeId, setReplacingNodeId] = useState<string | null>(null);
  const [replacingTriggerId, setReplacingTriggerId] = useState<string | null>(null);
  const [triggerReplaceModalOpen, setTriggerReplaceModalOpen] = useState(false);
  const [pendingTriggerIdToReplace, setPendingTriggerIdToReplace] = useState<string | null>(null);

  const handleRequestReplaceTrigger = (triggerId: string) => {
    setPendingTriggerIdToReplace(triggerId);
    setTriggerReplaceModalOpen(true);
  };

  const handleConfirmTriggerReplace = () => {
    if (pendingTriggerIdToReplace) {
      setReplacingTriggerId(pendingTriggerIdToReplace);
      setTriggerOpen(true);
    }
    setTriggerReplaceModalOpen(false);
    setPendingTriggerIdToReplace(null);
  };

  const handleCancelTriggerReplace = () => {
    setTriggerReplaceModalOpen(false);
    setPendingTriggerIdToReplace(null);
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
        return {
          ...node,
          data: {
            ...node.data,
            config: reduxConfig || {},
            isConfigured: checkIsConfigure(name, reduxConfig)
          }
        };
      }

      if (node.data.nodeType === 'action') {
        const reduxNode = reduxWorkflow.data.nodes.find(n => n.NodeId === node.id);
        if (!reduxNode) return node;
        return {
          ...node,
          data: {
            ...node.data,
            config: reduxNode.Config || {},
            isConfigured: checkIsConfigure(reduxNode.name, reduxNode.Config)
          }
        };
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
            deletable: false,
            position: triggerPosition,
            data: {
              label: trigger.name || "Trigger",
              icon: trigger.icon || "⚡", // add icon field in redux and db 
              nodeType: "trigger",
              config: trigger.Config || {},
              isConfigured: checkIsConfigure(trigger.name, trigger.Config),
              onConfigure: () =>
                handleNodeConfigure({
                  id: trigger.TriggerId,
                  name: trigger.name,
                  icon: trigger.icon
                }),
              // onTest: (trigger.name.toLowerCase().includes('webhook') ? undefined : () => testNodeFromCanvas(trigger.TriggerId, trigger.name, "trigger")),
              onAddChild: (sourceHandleId?: string) => {
                setBranchSourceNodeId(trigger.TriggerId);
                setBranchSourceHandleId(sourceHandleId || null);
                setActionOpen(true);
              },
              onReplace: () => handleRequestReplaceTrigger(trigger.TriggerId)
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
              config: node.Config || {},
              isConfigured: checkIsConfigure(node.name, node.Config),
              onConfigure: () =>
                handleNodeConfigure({
                  id: node.NodeId,
                  name: node.name,
                  type: "action",
                  actionType: node.AvailableNodeID,
                  icon: node.icon
                }),
              // onTest: () => testNodeFromCanvas(node.NodeId, node.name, "action"),
              onAddChild: (sourceHandleId?: string) => {
                setBranchSourceNodeId(node.NodeId);
                setBranchSourceHandleId(sourceHandleId || null);
                setActionOpen(true);
              },
              onDelete: () => {
                dispatch(workflowActions.deleteNode(node.NodeId))
                dispatch(clearNodeOutput(node.NodeId))

                setNodes(prev => prev.filter(n => n.id !== node.NodeId))
                setEdges(prev => prev.filter(e => e.source !== node.NodeId && e.target !== node.NodeId))
              },
              onReplace: () => {
                setReplacingNodeId(node.NodeId);
                setActionOpen(true)
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
          const healedReduxEdges = cleanReduxEdges.map((e: any) => {
            const sourceExists = finalNodes.some((n: any) => n.id === e.source);
            if (!sourceExists && transformedNodes.some((n: any) => n.id === e.target)) {
              return {
                ...e,
                id: `e-${triggerNode.id}-${e.target}`,
                source: triggerNode.id,
                sourceHandle: "t-out",
                targetHandle: e.targetHandle || "a-in",
              };
            }
            return e;
          }).filter((e: any) => finalNodes.some((n: any) => n.id === e.source) && finalNodes.some((n: any) => n.id === e.target));

          const newEdges = [
            ...healedReduxEdges,
            { id: `e-action-${sourceNodeId}-placeholder`, source: sourceNodeId, target: actionPlaceholder.id },
          ]
          setNodes(finalNodes)
          setEdges(newEdges)

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
            deletable: false,
            data: {
              label: Trigger.name || Trigger.data?.label || "Trigger",
              icon: Trigger?.icon || "⚡",
              nodeType: "trigger",
              config: Trigger.config || {},
              isConfigured: checkIsConfigure(Trigger.name, Trigger.config || {}),
              onConfigure: () =>
                handleNodeConfigure({
                  id: Trigger.id,
                  name: Trigger.name,
                  icon: Trigger.icon
                }),
              onTest: (Trigger.name.toLowerCase().includes('webhook') ? undefined : () => testNodeFromCanvas(Trigger.id, Trigger.name, "trigger")),
              onAddChild: (sourceHandleId?: string) => {
                setBranchSourceNodeId(Trigger.id);
                setBranchSourceHandleId(sourceHandleId || null);
                setActionOpen(true);
              },
              onReplace: () => handleRequestReplaceTrigger(Trigger.id)
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
              config: node.config || {},
              isConfigured: checkIsConfigure(node.name || node.data?.label, node.config || {}),
              onConfigure: () =>
                handleNodeConfigure({
                  id: node.id,
                  name: node.data?.label || node.name,
                  type: "action",
                  icon: node.icon,
                  actionType: node.AvailableNodeId,
                }),
              onTest: () => testNodeFromCanvas(node.id, node.name, "action"),
              onAddChild: (sourceHandleId?: string) => {
                setBranchSourceNodeId(node.id);
                setBranchSourceHandleId(sourceHandleId || null);
                setActionOpen(true);
              },
              onDelete: () => {
                dispatch(workflowActions.deleteNode(node.id));
                dispatch(clearNodeOutput(node.id));

                setNodes(prev => prev.filter(n => n.id !== node.id));
                setEdges(prev => prev.filter(e => e.source !== node.id && e.target !== node.id));
              },
              onReplace: () => {
                setReplacingNodeId(node.id);
                setActionOpen(true);
              }
            },
          }));

          // 4. Combine nodes
          const finalNodes = [triggerNode, ...transformedNodes];

          // 5. Manage edges
          let finalEdges = Array.isArray(dbEdges) ? [...dbEdges] : [];

          // Auto-heal any edge whose source was a replaced trigger
          finalEdges = finalEdges.map((e: any) => {
            const sourceExists = finalNodes.some((n: any) => n.id === e.source);
            if (!sourceExists && transformedNodes.some((n: any) => n.id === e.target)) {
              return {
                ...e,
                id: `e-${triggerNode.id}-${e.target}`,
                source: triggerNode.id,
                sourceHandle: "t-out",
                targetHandle: e.targetHandle || "a-in",
              };
            }
            return e;
          }).filter((e: any) => finalNodes.some((n: any) => n.id === e.source) && finalNodes.some((n: any) => n.id === e.target));

          if (finalEdges.length === 0 && transformedNodes.length > 0) {
            const triggerEdge = {
              id: `e-${triggerNode.id}-${transformedNodes[0].id}`,
              source: triggerNode.id,
              target: transformedNodes[0].id,
              sourceHandle: "t-out",
              targetHandle: "a-in",
              type: "default",
            };
            finalEdges.push(triggerEdge);
          }

          setNodes(finalNodes);
          setEdges(finalEdges);
          dispatch(workflowActions.setEdge(finalEdges));
        }
      } catch (err: any) {
        console.error("Failed to load workflow:", err);
        toast.error(
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
    const currentTriggerId = reduxWorkflow.data.trigger?.TriggerId;
    const safeChanges = changes.filter(c => !(c.type === 'remove' && c.id === currentTriggerId));

    const removeChanges = safeChanges.filter(c => c.type === 'remove');
    removeChanges.forEach(c => {
      dispatch(workflowActions.deleteNode(c.id));
      dispatch(clearNodeOutput(c.id));
    });
    onNodesChange(safeChanges);
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
    const activeEdges = edges.filter(e => nodes.some(n => n.id === e.source) && nodes.some(n => n.id === e.target));
    if (activeEdges.some(e =>
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
      toast.error(
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
      toast.error("No trigger found. Please add a trigger before adding actions.");
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
      // const result = await api.nodes.create({
      //   Name: action.name,
      //   AvailableNodeId: action.id,
      //   WorkflowId: workflowId,
      //   position: newNodePosition,
      //   stage: nextIndex,
      // });
      // console.log("The data of Node Positions from 201", newNodePosition)
      const actionId = crypto.randomUUID();

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
          onDelete: () => {
            dispatch(workflowActions.deleteNode(actionId))
            dispatch(clearNodeOutput(actionId))

            setNodes(prev => prev.filter(n => n.id !== actionId))
            setEdges(prev => prev.filter(e => e.source !== actionId && e.target !== actionId))
          },
          onReplace: () => {
            setReplacingNodeId(actionId);
            setActionOpen(true)
          },
          onAddChild: (sourceHandleId?: string) => {
            setBranchSourceNodeId(actionId);
            setBranchSourceHandleId(sourceHandleId || null);
            setActionOpen(true);
          }
        },
      };

      if (replacingNodeId) {
        const oldCanvasNode = nodes.find(n => n.id === replacingNodeId);
        const oldReduxNode = reduxWorkflow.data.nodes.find(n => n.NodeId === replacingNodeId);
        const targetPosition = oldCanvasNode?.position || oldReduxNode?.position || newNodePosition;

        newNode.position = targetPosition;

        const newReduxNode: NodeItem = {
          NodeId: actionId,
          name: action.name,
          type: action.type,
          Config: {},
          icon: action.icon,
          stage: oldReduxNode?.stage ?? nextIndex,
          position: targetPosition,
          AvailableNodeID: action.id
        };

        dispatch(workflowActions.replaceNode({
          oldNodeId: replacingNodeId,
          newNode: newReduxNode
        }));

        dispatch(clearNodeOutput(replacingNodeId));

        setNodes(prev => prev
          .filter(n => !(n.data.isPlaceholder && n.data.nodeType === "action"))
          .map(n => n.id === replacingNodeId ? newNode : n)
        );

        setEdges(prev => prev.map(e => ({
          ...e,
          source: e.source === replacingNodeId ? actionId : e.source,
          target: e.target === replacingNodeId ? actionId : e.target,
        })));

        setReplacingNodeId(null);
        setActionOpen(false);
        return;
      }

      // Normal addition flow
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

      setNodes((prevNodes) => {
        // Remove any existing action placeholder nodes (cleanup)
        const filtered = prevNodes.filter(
          (n) => !(n.data.isPlaceholder && n.data.nodeType === "action")
        );
        return [...filtered, newNode];
      });
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
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Failed to add an action node. Please try again.";
      setError(msg);
      toast.error(msg);
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
        deletable: false,
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
          onReplace: () => handleRequestReplaceTrigger(triggerId),
          onAddChild: (sourceHandleId?: string) => {
            setBranchSourceNodeId(triggerId);
            setBranchSourceHandleId(sourceHandleId || null);
            setActionOpen(true);
          }
        },
      };

      if (replacingTriggerId) {
        const oldCanvasTrigger = nodes.find(n => n.id === replacingTriggerId);
        const oldTrigger = reduxWorkflow.data.trigger;
        const triggerPos = oldCanvasTrigger?.position ?? oldTrigger?.position ?? DEFAULT_TRIGGER_POSITION;
        newNode.position = triggerPos;

        const newTrigger: Trigger = {
          TriggerId: triggerId,
          name: trigger.name,
          type: trigger.type,
          Config: {},
          icon: trigger.icon || "",
          position: triggerPos,
          AvailableTriggerID: trigger.id
        };

        dispatch(workflowActions.setWorkflowTrigger(newTrigger));
        dispatch(clearNodeOutput(replacingTriggerId));

        setNodes(prev => prev.map(n => n.id === replacingTriggerId ? newNode : n));

        const updatedEdges = edges.map(e => {
          if (e.source === replacingTriggerId || !nodes.some(n => n.id === e.source && n.data?.nodeType === 'action')) {
            return {
              ...e,
              id: `e-${triggerId}-${e.target}`,
              source: triggerId,
              sourceHandle: "t-out",
              targetHandle: e.targetHandle || "a-in"
            };
          }
          return e;
        });
        const cleanRedux = updatedEdges.filter(e => !e.target.startsWith('action-placeholder-') && e.target !== 'action-holder');
        setEdges(updatedEdges);
        dispatch(workflowActions.setEdge(cleanRedux));

        setReplacingTriggerId(null);
        setTriggerOpen(false);
        return;
      }

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
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Failed to add trigger. Please try again.";
      setError(msg);
      toast.error(msg);
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
      {/* Floating auto-clearing non-blocking error notification */}
      {error && (
        <div className="fixed top-5 right-5 z-[9999] pointer-events-none flex flex-col items-end animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="pointer-events-auto flex items-start gap-3 bg-red-950/90 text-white border border-red-700/50 backdrop-blur-md px-4 py-3 rounded-xl shadow-2xl max-w-md w-full">
            <span className="text-red-400 mt-0.5 text-base">⚠️</span>
            <div className="flex-1 text-xs font-medium leading-relaxed text-red-100">
              {error}
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-white p-1 rounded transition-colors text-sm leading-none cursor-pointer"
              title="Dismiss error"
            >
              ×
            </button>
          </div>
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
            const removedIds = changes.filter(c => c.type === 'remove').map((c: any) => c.id);
            const clean = edges
              .filter(e => !removedIds.includes(e.id) && !e.target.startsWith('action-placeholder-') && e.target !== 'action-holder')
              .map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle ?? null, targetHandle: e.targetHandle ?? null }));
            dispatch(workflowActions.setEdge(clean));
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

      <TriggerReplaceModal
        isOpen={triggerReplaceModalOpen}
        triggerName={reduxWorkflow.data.trigger?.name || "Trigger"}
        onConfirm={handleConfirmTriggerReplace}
        onClose={handleCancelTriggerReplace}
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
