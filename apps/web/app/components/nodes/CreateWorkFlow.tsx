"use client";
import { useEffect, useState } from "react";
import "@xyflow/react/dist/style.css";
import { Background, Controls, ReactFlow } from "@xyflow/react";
import PlaceholderNode from "./PlaceHolder";
import { TriggerNode } from "./TriggerNode";

import { TriggerSideBar } from "./TriggerSidebar";
import ActionSideBar from "../Actions/ActionSidebar";
import ActionNode from "../Actions/ActionNode";
import { GoogleSheetFormClient } from "./GoogleSheetFormClient";
import { useDispatch } from "react-redux";
import { workflowActions } from "@/store/slices/workflowSlice";
import { createWorkflow, getEmptyWorkflow, getworkflowData } from "@/app/workflow/lib/config";
import { useAppSelector } from '@/app/hooks/redux';


interface NodeType {
  id: string;
  type: "placeholder" | "trigger" | "action";
  position: { x: number; y: number };
  data: {
    label: string;
    name?: string;
    icon?: string;
    type?: string;
    config?: Record<string, unknown>;
  };
}

interface EdgeType {
  id: string;
  source: string;
  target: string;
}

export const CreateWorkFlow = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionSidebarOpen, setActionSidebarOpen] = useState(false);
  const [credType, setCredType] = useState<string>("");
  const [loadSheet, setLoadSheet] = useState<boolean>(false);
  const dispatch = useDispatch();
  const userId = useAppSelector(s=>s.user.userId)
  const workflowId = useAppSelector(s=>s.workflow.workflow_id)
  const existingTrigger = useAppSelector(s=>s.workflow.trigger)
  const existingNodes = useAppSelector(s=>s.workflow.nodes)
  // console.log(`workflow from redux, TRigger: ${existingTrigger}, Nodes: ${existingNodes}`)

  const [nodes, setNodes] = useState<NodeType[]>([
    {
      id: "1",
      type: "placeholder",
      position: { x: 100, y: 200 },
      data: {
        label: "+",
      },
    },
  ]);

  const [edges, setEdges] = useState<EdgeType[]>([]);

  const nodeTypes = {
    placeholder: PlaceholderNode,
    trigger: TriggerNode,
    action: ActionNode,
  };

  // Handle trigger selection
  const handleSelectTrigger = (trigger: {
    id: string;
    name: string;
    type: string;
    icon?: string;
  }) => {
    const timestamp = Date.now();
    const placeholderId = `placeholder-${timestamp}`;
    const triggerNodeId = `trigger~${trigger.id}`;
    const edgeId = `e-${triggerNodeId}-${placeholderId}`;

    setNodes((currentNodes) => {
      const placeholderNode = currentNodes.find(
        (n) => n.type === "placeholder"
      );
      if (!placeholderNode) return currentNodes;

      const triggerNode: NodeType = {
        id: triggerNodeId,
        type: "trigger",
        position: placeholderNode.position,
        data: {
          label: trigger.name,
          name: trigger.name,
          icon: trigger.icon || "⚡",
          type: trigger.type,
        },
      };

      const newPlaceholder: NodeType = {
        id: placeholderId,
        type: "placeholder",
        position: {
          x: placeholderNode.position.x + 250,
          y: placeholderNode.position.y,
        },
        data: { label: "+" },
      };

      return [triggerNode, newPlaceholder];
    });

    setEdges([
      {
        id: edgeId,
        source: triggerNodeId,
        target: placeholderId,
      },
    ]);
  };

  useEffect(() => {
    async function getEmptyWorkflowID() {
      const workflow = await getEmptyWorkflow();

      if (workflow) {
        const { id, isEmpty } = workflow;
        dispatch(workflowActions.setWorkflowId(id));
        dispatch(workflowActions.setWorkflowStatus(isEmpty));
      } else {
        // const newWorkflow
      }
    }
    getEmptyWorkflowID();
  }, [dispatch]);

  useEffect(()=>{
    // Guard: only rebuild nodes/edges if there's actual stored data
    if (existingNodes.length === 0 && !existingTrigger) {
      return; // Keep the current placeholder state
    }

    function loadWorkflow(){
      const START_X = 100;
      const GAP = 250;
      const Y = 200;

      const newNodes: NodeType[] = [];
      const newEdges: EdgeType[] = [];
      const type = existingTrigger?.name.split(" - ")[0]
      if(existingTrigger){
        newNodes.push({
          id: `trigger-${existingTrigger.dbId}`,
          type: 'trigger' as const,
          position: { x: START_X, y: Y},
          data:{
            label: existingTrigger.name,
            name: existingTrigger.name,
            type: type,
            icon: '📊',
            config: existingTrigger.config,
          }
        })
      }

      existingNodes.forEach((node, index)=>{
        const nodeId = `action-${node.dbId}-${index}`;
        const type = node.name.split(" - ")[0]
        newNodes.push({
          id: nodeId,
          type: 'action' as const,
          position: { x: START_X + (index + 1) * GAP, y: Y},
          data:{
            label: node.name,
            name: node.name,
            icon: '⚙️',
            type: type,
            config: node.config,
          }
        });
      });

      const placeholderIndex = newNodes.length;
      newNodes.push({
        id: `placeholder-${Date.now()}`,
        type: 'placeholder' as const,
        position: { x: START_X + placeholderIndex * GAP, y: Y},
        data: { label: '+' }
      });
      
      for(let i=0; i<newNodes.length - 1; i++){
        newEdges.push({
          id: `edge-${i}`,
          source: newNodes[i]?.id || '',
          target: newNodes[i+1]?.id || ''
        });
      }

      setNodes(newNodes);
      setEdges(newEdges)
    }

    loadWorkflow()
  },[existingNodes, existingTrigger])


  const handleSelectAction = (action: {
    id: string;
    name: string;
    type: string;
    icon?: string;
  }) => {
    const timestamp = Date.now();
    const newPlaceholderId = `placeholder-${timestamp}`;
    const actionNodeId = `action~${action.id}`;

    setNodes((currentNodes) => {
      const placeholderNode = currentNodes.find(
        (n) => n.type === "placeholder"
      );
      if (!placeholderNode) return currentNodes;

      const previousNodeId = edges.find(
        (e) => e.target === placeholderNode.id
      )?.source;

      const actionNode: NodeType = {
        id: actionNodeId,
        type: "action",
        position: placeholderNode.position,
        data: {
          label: action.name,
          name: action.name,
          icon: action.icon || "⚙️",
          type: action.type,
        },
      };

      const newPlaceholder: NodeType = {
        id: newPlaceholderId,
        type: "placeholder",
        position: {
          x: placeholderNode.position.x + 250,
          y: placeholderNode.position.y,
        },
        data: { label: "+" },
      };

      const otherNodes = currentNodes.filter(
        (n) => n.id !== placeholderNode.id
      );
      return [...otherNodes, actionNode, newPlaceholder];
    });

    setEdges((currentEdges) => {
      const edgeToPlaceholder = currentEdges.find((e) =>
        e.target.startsWith("placeholder")
      );

      const updatedEdges = currentEdges.map((e) => {
        if (edgeToPlaceholder && e.id === edgeToPlaceholder.id) {
          return { ...e, target: actionNodeId };
        }
        return e;
      });

      return [
        ...updatedEdges,
        {
          id: `e-${actionNodeId}-${newPlaceholderId}`,
          source: actionNodeId,
          target: newPlaceholderId,
        },
      ];
    });
  };

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodeClick={async (event, node) => {
          if (node.type === "placeholder") {
            const hasTrigger = nodes.some((n) => n.type === "trigger");
            if (hasTrigger) {
              setActionSidebarOpen(true);
            } else {
              setSidebarOpen(true);
            }
          }
          if (node.type === "action" || node.type === "trigger") {
            if (node.data.name === "Google Sheet") {
              console.log("sheet called");
              console.log(node.id);
              // setNodeId("550e8400-e29b-41d4-a716-446655440000")
              // getCredentials(node.data.type ? node.data.type : "")
              // setNodeId(node.id.split("trigger-")[1] || "")
              // if(cred)  setLoadSheet(true)
              setCredType(
                node.data.type === "google_sheet" ? "google_oauth" : ""
              );
              setLoadSheet(!loadSheet);
              console.log("hook called");
            }
          }
        }}
      >
        <Background />
        <Controls />
      </ReactFlow>

      <TriggerSideBar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectTrigger={handleSelectTrigger}
      />

      <ActionSideBar
        isOpen={actionSidebarOpen}
        onClose={() => setActionSidebarOpen(false)}
        onSelectAction={handleSelectAction}
      />

      {loadSheet && <GoogleSheetFormClient type={credType} />}
    </div>
  );
};

export default CreateWorkFlow;
