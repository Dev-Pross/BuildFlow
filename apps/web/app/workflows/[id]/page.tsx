"use client";

import { useState, useEffect, act } from "react";
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

import BaseNode from "@/app/components/nodes/BaseNode";
import { TriggerSideBar } from "@/app/components/nodes/TriggerSidebar";
import ActionSideBar from "@/app/components/Actions/ActionSidebar";
import { api } from "@/app/lib/api";
import ConfigModal from "./components/ConfigModal";

export default function WorkflowCanvas() {
  const params = useParams();
  const workflowId = params.id as string;

  // State
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
        onConfigure: () => setTriggerOpen(true), // Opens sidebar!
      },
    },
  ]);

  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const [error, setError] = useState<string>("'");
  const nodeTypes = {
    customNode: BaseNode,
  };
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        const workflows = await api.workflows.get(workflowId);
        console.log("This is the  New Triggering trigger Data is",workflows.data.Data.Trigger.AvailableTriggerID);
        
        // 1. SAFEGUARD: Default to empty arrays to prevent crashes
        const dbNodes = workflows.data.Data.nodes || [];
        const dbEdges = workflows.data.Data.Edges || [];
        const Trigger = workflows.data.Data.Trigger;
        console.log("This is the  trigger Data is",workflows.data.Data);

        console.log("The Data of Trigger is",Trigger)
        // 2. CREATE TRIGGER NODE
        // We assume the trigger is always the starting point
        const triggerNode = {
          id: Trigger.id,
          type: "customNode",
          // Default to top center if no position exists
          position: Trigger.position || { x: 250, y: 50 }, 
          data: {
            label: Trigger.name || Trigger.data?.label || "Trigger",
            icon: Trigger.data?.icon || "⚡", // Lightning icon for trigger
            nodeType: "trigger",
            isConfigured: true,
            onConfigure: () => handleNodeConfigure({
               id: Trigger.id,
               // ... pass your trigger config props here
            })
          },
        };
        if (!Trigger) {
          +  console.error("No trigger found in workflow data");
            return;
          }
  
        // 3. TRANSFORM ACTION NODES
        const transformedNodes = dbNodes.map((node: any) => ({
          id: node.id,
          type: "customNode",
          position: node.position || { x: 0, y: 0 },
          data: {
            label: node.data?.label || node.name || "Unknown",
            icon: node.data?.icon || "⚙️",
            nodeType: "action",
            // ... rest of your data mapping
            onConfigure: () => handleNodeConfigure({
              id: node.id,
              name: node.data?.label || node.Name,
              type: "action",
              actionType: node.AvailableNodeId
            })
          }
        }));
  
        // 4. CALCULATE PLACEHOLDER POSITION
        // Find the "last" node to attach the placeholder to. 
        // If we have actions, use the last action. If not, use the trigger.
        const lastNode = transformedNodes.length > 0 
          ? transformedNodes[transformedNodes.length - 1] 
          : triggerNode;
  
        // Position placeholder 150 pixels below the last node
        const placeholderPosition = { 
          x: lastNode.position.x, 
          y: lastNode.position.y + 150 
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
  
        // 5. COMBINE NODES
        const finalNodes = [triggerNode, ...transformedNodes, actionPlaceholder];
  
        // 6. MANAGE EDGES
        // If we have DB edges, use them. 
        // If not, we should auto-connect Trigger -> First Node -> Placeholder
        let finalEdges = [...dbEdges];
  
        // Auto-connect Placeholder to the last node (visual guide)
        const placeholderEdge = {
          id: `e-${lastNode.id}-${actionPlaceholder.id}`,
          source: lastNode.id,
          target: actionPlaceholder.id,
          type: 'default', // or your custom edge type
          animated: true,  // Make it dashed/animated to indicate it's temporary
        };
        
        // Ensure Trigger is connected to first action if DB edges are empty & actions exist
        if (dbEdges.length === 0 && transformedNodes.length > 0) {
           const triggerEdge = {
              id: `e-${triggerNode.id}-${transformedNodes[0].id}`,
              source: triggerNode.id,
              target: transformedNodes[0].id,
              type: 'default'
           };
           finalEdges.push(triggerEdge);
        }
  
        finalEdges.push(placeholderEdge);
  
        setNodes(finalNodes);
        setEdges(finalEdges);
  
      } catch (error) {
        console.error("Failed to load workflow:", error);
      }
    };
  
    loadWorkflows();
  }, [workflowId]);


  // useEffect(() => {
  //   const loadWorkflows = async () => {
  //     const workflows = await api.workflows.get(workflowId);
  //     console.log("This is the Data from workflow form DB",workflows.data.Data)
  //     const dbNodes = workflows.data.Data.nodes;
  //     const Trigger = workflows.data.Data.trigger;
  //     console.log("The Trigger is",Trigger)
  //     const dbEdges = workflows.data.Data.Edges || [];
  //     console.log("These are the DbNodes ",dbNodes)
  //     console.log("These are the DB Edges  ",dbEdges)
  //     const transformedNodes = dbNodes.map((node: any) => ({
  //       id: node.id,
  //       type: "customNode", // ⚠️ This was missing!
  //       position: node.position || { x: 0, y: 0 },
  //       data: {
  //         label: node.data?.label || node.name || "Unknown",
  //         icon: node.data?.icon || "⚙️",
  //         nodeType: node.data?.nodeType || (node.TriggerId ? "trigger" : "action"),
  //         isPlaceholder: node.data?.isPlaceholder || false,
  //         isConfigured: node.data?.isConfigured || false,
  //         config: node.data?.config || node.Config || {},

  //         // ⚠️ CRITICAL: Re-attach callbacks
  //         onConfigure: () => handleNodeConfigure({
  //           id: node.id,
  //           name: node.data?.label || node.Name,
  //           type: node.data?.nodeType || (node.TriggerId ? "trigger" : "action"),
  //           actionType: node.AvailableNodeId || node.AvailableTriggerID
  //         })
  //       }
  //     }));
  //     const actionPlaceholder = {
  //       id: `action-placeholder-${Date.now()}`,
  //       type: "customNode",
  //       position: { x: 550, y: 200 },
  //       data: {
  //         label: "Add Action",
  //         icon: "➕",
  //         isPlaceholder: true,
  //         nodeType: "action",
  //         config: {},
  //         onConfigure: () => setActionOpen(true),
  //       },
  //     };

  //     console.log("This Data after Tranforming",transformedNodes)
  //     setNodes([...transformedNodes, actionPlaceholder]);
  //     setEdges(dbEdges);
  //   }

  //   loadWorkflows();
  // }, [workflowId])



  // useEffect(() => {
  //   const loadWorkflows = async () => {
  //     const workflows = await api.workflows.get(workflowId);
  //     const dbNodes = workflows.data.Data.nodes;
  //     // Fix: Normalize dbEdges to always be an array
  //     let dbEdges = workflows.data.Data.edges;
  //     if (!Array.isArray(dbEdges)) {
  //       // Try alternative key (if backend provides Edges sometimes)
  //       dbEdges = workflows.data.Data.Edges;
  //     }
  //     if (!Array.isArray(dbEdges)) {
  //       dbEdges = [];
  //     }

  //     // Get the trigger (from the "Trigger" key in backend response)
  //     const trigger = workflows.data.Data.Trigger;

  //     // Transform trigger to a node if it exists and not already a node
  //     let triggerNode = null;
  //     if (trigger) {
  //       triggerNode = {
  //         id: trigger.id || "trigger-node", // fallback in case trigger has no id
  //         type: "customNode",
  //         position: trigger.config?.position || { x: 250, y: 50 },
  //         data: {
  //           label: trigger.name || trigger.Name || "Trigger",
  //           icon: "⚡",
  //           nodeType: "trigger",
  //           isPlaceholder: false,
  //           isConfigured: true,
  //           config: trigger.config || trigger.Config || {},
  //           onConfigure: () => handleNodeConfigure({
  //             id: trigger.id,
  //             name: trigger.name || trigger.Name,
  //             type: "trigger",
  //             actionType: trigger.AvailableTriggerID // triggers have this, not actions
  //           }),
  //         }
  //       };
  //     }

  //     // Transform database nodes to React Flow format, excluding any possible trigger node
  //     const transformedNodes = dbNodes
  //       .filter((node: any) => !node.TriggerId) // trigger node will come separately
  //       .map((node: any) => ({
  //         id: node.id,
  //         type: "customNode",
  //         position: node.position || node.Config?.position || { x: 0, y: 0 },
  //         data: {
  //           label: node.Name || node.data?.label || "Unknown",
  //           icon: node.data?.icon || "⚙️",
  //           nodeType: node.TriggerId ? "trigger" : "action",
  //           isPlaceholder: false, // Loaded nodes are never placeholders
  //           isConfigured: node.data?.isConfigured || false,
  //           config: node.Config || node.data?.config || {},
  //           onConfigure: () => handleNodeConfigure({
  //             id: node.id,
  //             name: node.Name || node.data?.label,
  //             type: node.TriggerId ? "trigger" : "action",
  //           })
  //         }
  //       }));

  //     // Combine trigger node (if present) and transformed nodes
  //     let allNodes = [];
  //     if (triggerNode) {
  //       allNodes.push(triggerNode);
  //     }
  //     allNodes = [...allNodes, ...transformedNodes];

  //     // Find action nodes for logic
  //     const realActionNodes = allNodes.filter((n: any) => n.data.nodeType === "action");

  //     // Find (now explicit) trigger node ref
  //     const triggerNodeRef = allNodes.find((n: any) => n.data.nodeType === "trigger");
  //     let actionPlaceholder: any;

  //     if (realActionNodes.length === 0) {
  //       // No real actions: place after trigger
  //       actionPlaceholder = {
  //         id: "action-placeholder-end",
  //         type: "customNode",
  //         position: triggerNodeRef
  //           ? { x: triggerNodeRef.position.x + 300, y: triggerNodeRef.position.y + 150 }
  //           : { x: 550, y: 200 },
  //         data: {
  //           label: "Add Action",
  //           icon: "➕",
  //           isPlaceholder: true,
  //           nodeType: "action",
  //           onConfigure: () => setActionOpen(true),
  //         }
  //       };
  //     } else {
  //       // Place after last real action
  //       const lastAction = realActionNodes[realActionNodes.length - 1];
  //       actionPlaceholder = {
  //         id: "action-placeholder-end",
  //         type: "customNode",
  //         position: {
  //           x: lastAction.position.x + 200,
  //           y: lastAction.position.y + 150
  //         },
  //         data: {
  //           label: "Add Action",
  //           icon: "➕",
  //           isPlaceholder: true,
  //           nodeType: "action",
  //           onConfigure: () => setActionOpen(true),
  //         }
  //       };
  //     }

  //     // Build up-to-date edge array
  //     let updatedEdges = Array.isArray(dbEdges) ? [...dbEdges] : [];
  //     if (realActionNodes.length > 0) {
  //       // Connect last action to action-placeholder
  //       const lastAction = realActionNodes[realActionNodes.length - 1];
  //       updatedEdges = [
  //         ...updatedEdges,
  //         {
  //           id: `edge-${lastAction.id}-action-placeholder-end`,
  //           source: lastAction.id,
  //           target: "action-placeholder-end",
  //           type: "default"
  //         }
  //       ];
  //     } else if (triggerNodeRef) {
  //       // No actions yet, connect trigger to action-placeholder
  //       updatedEdges = [
  //         ...updatedEdges,
  //         {
  //           id: `edge-${triggerNodeRef.id}-action-placeholder-end`,
  //           source: triggerNodeRef.id,
  //           target: "action-placeholder-end",
  //           type: "default"
  //         }
  //       ];
  //     }

  //     // Add placeholder node
  //     allNodes = [...allNodes, actionPlaceholder];

  //     setNodes(allNodes);
  //     setEdges(updatedEdges);
  //   };

  //   if (workflowId) loadWorkflows();
  // }, [workflowId]);



  const handleNodeConfigure = (node: any) => {
    setSelectedNode(node);
    setConfigOpen(true);
  };

  const handleNodesChange = (changes: NodeChange[]) => {
    onNodesChange(changes); // Update UI first
    try {
      changes.forEach((change) => {
        if (change.type === "position" && change.position) {
          // Find the node in local state to check its type
          const changedNode = nodes.find((n) => n.id === change.id);

          if (changedNode?.data?.nodeType === "trigger") {
            // If it's a trigger node, update via trigger API
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
            // Otherwise, update in node table
            api.nodes.update({
              NodeId: change.id,
              position: change.position,
            });
          }
        }
      });
    } catch (error: any) {
      setError(error);
    }
  };

  const handleActionSelection = async (action: any) => {
    try {
      console.log("This is node Id before log", action.id);

      const result = await api.nodes.create({
        Name: action.name,
        AvailableNodeId: action.id,
        Config: {
          CredentialsID: "",
        },
        WorkflowId: workflowId,
        Position: 1,
      });
      console.log("This is node Id before log", action.id);
      const actionId = result.data.data.id;

      // 2. Create action node
      const newNode = {
        id: actionId,
        type: "customNode",
        position: { x: 350, y: 400 },
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

          // onConfigure: () => console.log("Configure", actionId),
        },

      };

      // 3. Create NEW placeholder
      const actionPlaceholder = {
        id: `action-placeholder-${Date.now()}`,
        type: "customNode",
        position: { x: 550, y: 200 },
        data: {
          label: "Add Action",
          icon: "➕",
          isPlaceholder: true,
          nodeType: "action",
          config: {},
          onConfigure: () => setActionOpen(true),
        },
      };

      // Find the current trigger node (non-placeholder)
      const triggerNode = nodes.find(
        (n) => n.data.nodeType === "trigger" && !n.data.isPlaceholder
      );

      if (!triggerNode) {
        throw new Error("No trigger found");
      }

      const triggerId = triggerNode.id;

      // Remove old action placeholder and add new action + new placeholder
      setNodes((prevNodes) => {
        const filtered = prevNodes.filter(
          (n) => !(n.data.isPlaceholder && n.data.nodeType === "action")
        );

        return [...filtered, newNode, actionPlaceholder];
      });

      // Determine the previous latest action node (for correct edge chaining)
      setEdges((prevEdges) => {
        // Remove edges pointing to the old placeholder
        const filtered = prevEdges.filter((e) => {
          const targetNode = nodes.find((n) => n.id === e.target);
          return !(
            targetNode?.data.isPlaceholder &&
            targetNode?.data.nodeType === "action"
          );
        });

        // Find all non-placeholder action nodes in the CURRENT state (after newNode is added)
        const currentActionNodes = [
          ...nodes.filter(
            (n) => n.data.nodeType === "action" && !n.data.isPlaceholder
          ),
          newNode,
        ];

        // Find all existing action nodes (NOT including newNode yet)
        const existingActionNodes = nodes.filter(
          (n) => n.data.nodeType === "action" && !n.data.isPlaceholder
        );

        // Source is the last existing action, or trigger if this is first action
        const sourceNodeId =
          existingActionNodes.length > 0
            ? existingActionNodes[existingActionNodes.length - 1]!.id
            : triggerId;

        return [
          ...filtered,
          // Edge from previous node (trigger or prev action) to the new action
          {
            id: `e-action-${sourceNodeId}-${actionId}`,
            source: sourceNodeId,
            target: actionId,
          },
          // Edge from new action to new placeholder
          {
            id: `e-action-${actionId}-placeholder`,
            source: actionId,
            target: actionPlaceholder.id,
          },
        ];
      });

      setActionOpen(false);
    } catch (error: any) {
      setError(error);
    }
  };

  const handleSelection = async (trigger: any) => {
    console.log("THe trigger name is ", trigger.name);

    try {
      const result = await api.triggers.create({
        Name: trigger.name,
        AvailableTriggerID: trigger.id,
        Config: {},
        WorkflowId: workflowId,
        TriggerType: trigger.type,
      });
      const triggerId = result.data.data.id as string;
      console.log("The Trigger Id is : ", triggerId);

      const newNode = {
        id: triggerId,
        type: "customNode",
        position: { x: 250, y: 50 },
        data: {
          label: trigger.name,
          icon: trigger.icon,
          isPlaceholder: false,
          nodeType: "trigger",
          isConfigured: false,
          config: {},
          // onConfigure: () => console.log("Configure", triggerId),
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
        position: { x: 550, y: 200 },
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
    } catch (error: any) {
      setError(error);
    }
  };


  const handleSave = async () => {
    const payload = {
      workflowId: workflowId,
      nodes: nodes,
      edges: edges
    };
    console.log("THe Nodes are ", payload.nodes)
    console.log("The payload in handleSave is ", payload);
    try {
      const response = await api.workflows.put({
        workflowId: workflowId,
        nodes : nodes,
        edges: edges
      });
      // Optionally, you can show a message or update UI on success
      console.log("Workflow updated successfully:", response.data);
    } catch (error: any) {
      setError(error);
    }
  }
  return (
    <div style={{ width: "100%", height: "100vh" }}>
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
        <button
          onClick={handleSave}
          className=" bottom-4  border  bg-white text-black font-bold p-4 z-50 shadow-lg  px-12 rounded-2xl"
          style={{ position: 'fixed', bottom: '1rem', right: '10rem' }}
        >
          Save
        </button>
      </ReactFlow>

      {/* ADD THIS MODAL */}
      <ConfigModal
        isOpen={configOpen}
        selectedNode={selectedNode}
        workflowId={workflowId}
        onClose={() => {
          setConfigOpen(false);
          setSelectedNode(null);
        }}
        onSave={async (nodeId: string, config: any, userId: string) => {
          console.log("Updating the trigger");

          // Find the trigger node based on its type being 'trigger'
          const triggerNode = nodes.find((n) => n.data.nodeType === "trigger");
          console.log(
            "This is  the triggerNode from the Trigger Node ",
            triggerNode
          );
          console.log("This is  the NodeId which must be Triiger", nodeId);
          const isTrigger = triggerNode?.id === nodeId;
          console.log("Is this a trigger or not", isTrigger);
          if (isTrigger) {
            const data = await api.triggers.update({ TriggerId: nodeId, Config: config });
            console.log("The Data saved to DataBase is", data);
            // The 'data' is undefined because api.triggers.update does not return anything (it's missing a 'return' statement).
            // To debug, log after the call and also the actual variable:
            console.log("api.triggers.update response:", data);

            const res = JSON.stringify(data);
            console.log("THe response is res from saving the data is ", res)
            console.log("Updating the trigger");
          } else {
            await api.nodes.update({ NodeId: nodeId, Config: config });
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
  
  