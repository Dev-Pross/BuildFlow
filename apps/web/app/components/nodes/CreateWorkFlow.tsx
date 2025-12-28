"use client";
import { useEffect, useState } from "react";
import "@xyflow/react/dist/style.css";
import { ReactFlow } from "@xyflow/react";
import PlaceholderNode from "./PlaceHolder";
import { TriggerNode } from "./TriggerNode";

import { TriggerSideBar } from "./TriggerSidebar";
import ActionSideBar from "../Actions/ActionSidebar";
import ActionNode from "../Actions/ActionNode";
import { GoogleSheetFormClient } from "./GoogleSheetFormClient";
import { useDispatch } from "react-redux";
import { workflowActions, workflowReducer } from "@/store/slices/workflowSlice";
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
  const [nodeIDType, setNodeIDType] = useState<string>('')
  const [loadSheet, setLoadSheet] = useState<boolean>(false) 
  const dispatch = useDispatch();
  const userId = useAppSelector(s=>s.user.userId)
  const workflowId = useAppSelector(s=>s.workflow.workflow_id)
  const existingTrigger = useAppSelector(s=>s.workflow.trigger?.name)
  const existingNodes = useAppSelector(s=>s.workflow.nodes)
  console.log(`workflow from redux, TRigger: ${existingTrigger}, Nodes: ${existingNodes}`)

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

  useEffect(()=>{
    async function getEmptyWorkflowID(){
      const workflow = await getEmptyWorkflow()
      
      if(workflow){
        const {id, isEmpty} = workflow
        dispatch(workflowActions.setWorkflowId(id))
        dispatch(workflowActions.setWorkflowStatus(isEmpty))
      }
      else{
        if (!userId) return
        const newWorkflow = await createWorkflow(userId)
        dispatch(workflowActions.setWorkflowId(newWorkflow.id))
        dispatch(workflowActions.setWorkflowStatus(newWorkflow.isEmpty))
      }
    }
    async function getWorkflowData(){
      if(!workflowId) return
      const workflow = await getworkflowData(workflowId)
      if(workflow.success){
        dispatch(workflowActions.setWorkflowStatus(false))
        dispatch(workflowActions.setWorkflowNodes(workflow.data.nodes))
        dispatch(workflowActions.setWorkflowTrigger(workflow.data.Trigger))
        // console.log(`workfklow from redux: ${workflow.data}`)
      }
    }
    if(!workflowId) getEmptyWorkflowID()
    getWorkflowData();
  },[dispatch, userId, workflowId])

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
        onNodeClick={async(event, node) => {
          if (node.type === "placeholder") {
            const hasTrigger = nodes.some((n) => n.type === "trigger");
            if (hasTrigger) {
              setActionSidebarOpen(true);
            } else {
              setSidebarOpen(true);
            }
          }
          if(node.type === 'action' || node.type === 'trigger'){
            if(node.data.name === 'Google Sheet' ){
              console.log("sheet called")
              console.log(node.id)
              // setNodeId("550e8400-e29b-41d4-a716-446655440000")
              // getCredentials(node.data.type ? node.data.type : "")
              // setNodeId(node.id.split("trigger-")[1] || "")
              // if(cred)  setLoadSheet(true)
              setNodeIDType(node.id)
              setCredType(node.data.type === "google_sheet" ? "google_oauth" : "")
              setLoadSheet(!loadSheet)
              console.log("hook called")
            }
          } 
        }}
      />

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

      {loadSheet && 
      <GoogleSheetFormClient type={credType} nodeType={nodeIDType}/>
      }
    </div>
  );
};

export default CreateWorkFlow;
