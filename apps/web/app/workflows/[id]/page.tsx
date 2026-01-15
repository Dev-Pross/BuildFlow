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
  // const handleActionSelection = async (action: any) => {
  //   try {
  //     // 1. Find trigger node
  //     const triggerNode = nodes.find(
  //       (n) => n.data.nodeType === "trigger" && !n.data.isPlaceholder
  //     );

  //     if (!triggerNode) {
  //       throw new Error("No trigger found");
  //     }

  //     const triggerId = triggerNode.id;

  //     // 2. Find existing action nodes
  //     const existingActionNodes = nodes.filter(
  //       (n) => n.data.nodeType === "action" && !n.data.isPlaceholder
  //     );

  //     // 3. Calculate position for new action node
  //     let newPosition;
  //     if (existingActionNodes.length === 0) {
  //       // First action: place below trigger
  //       newPosition = {
  //         x: triggerNode.position.x,
  //         y: triggerNode.position.y + 150  // 150px below trigger
  //       };
  //     } else {
  //       // Subsequent actions: place below last action
  //       const lastAction = existingActionNodes[existingActionNodes.length - 1];
  //       newPosition = {
  //         x: lastAction!.position.x,
  //         y: lastAction!.position.y + 150  // 150px below last action
  //       };
  //     }

  //     const sourceNodeId = existingActionNodes.length > 0
  //       ? existingActionNodes[existingActionNodes.length - 1]!.id
  //       : triggerId;

  //     // 4. Call API
  //     const result = await api.nodes.create({
  //       Name: action.name,
  //       AvailableNodeId: action.id,
  //       Config: {
  //         Position : newPosition
  //       },
  //       WorkflowId: workflowId,
  //       Position: 1,  // ✅ Dynamic position!

  //     });

  //     const actionId = result.data.data.id;

  //     // 5. Create action node with calculated position
  //     const newActionNode = {
  //       id: actionId,
  //       type: "customNode",
  //       position: newPosition,  // ✅ Use calculated position
  //       data: {
  //         label: action.name,
  //         icon: action.icon,
  //         isPlaceholder: false,
  //         nodeType: "action",  // ✅ Fixed from earlier
  //         config: {},
  //         onConfigure: () => console.log("Configure", actionId),
  //       },
  //     };

  //     // 6. Create placeholder below new action
  //     const placeholderPosition = {
  //       x: newPosition.x,
  //       y: newPosition.y + 150  // 150px below new action
  //     };

  //     const newPlaceholder = {
  //       id: `action-placeholder-${Date.now()}`,
  //       type: "customNode",
  //       position: placeholderPosition,
  //       data: {
  //         label: "Add Action",
  //         icon: "➕",
  //         isPlaceholder: true,
  //         nodeType: "action",
  //         config: {},
  //         onConfigure: () => setActionOpen(true),
  //       },
  //     };

  //     // Rest of your code stays the same...
  //     setNodes((prevNodes) => {
  //       const filtered = prevNodes.filter(
  //         (n) => !(n.data.isPlaceholder && n.data.nodeType === "action")
  //       );
  //       return [...filtered, newActionNode, newPlaceholder];
  //     });

  //     setEdges((prevEdges) => {
  //       const filtered = prevEdges.filter((e) => {
  //         const targetNode = nodes.find(n => n.id === e.target);
  //         return !(targetNode?.data.isPlaceholder && targetNode?.data.nodeType === "action");
  //       });

  //       return [
  //         ...filtered,
  //         {
  //           id: `e-${sourceNodeId}-${actionId}`,
  //           source: sourceNodeId,
  //           target: actionId,
  //         },
  //         {
  //           id: `e-${actionId}-${newPlaceholder.id}`,
  //           source: actionId,
  //           target: newPlaceholder.id,
  //         },
  //       ];
  //     });

  //     setActionOpen(false);
  //   } catch (error: any) {
  //     setError(error);
  //   }
  // };

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
      </ReactFlow>

      {/* ADD THIS MODAL */}
      <ConfigModal
        isOpen={configOpen}
        selectedNode={selectedNode}
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

            const res =  JSON.stringify(data);
            console.log("THe response is res from saving the data is " , res)
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
