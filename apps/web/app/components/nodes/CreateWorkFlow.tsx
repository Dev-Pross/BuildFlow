"use client";
import { useState } from "react";
import "@xyflow/react/dist/style.css";
import { ReactFlow } from "@xyflow/react";
import PlaceholderNode from "./PlaceHolder";
import { TriggerNode } from "./TriggerNode";
import { TriggerSideBar } from "./TriggerSidebar";
interface NodeType {
    id: string;
    type: "placeholder" | "trigger";
    position: { x: number; y: number };
    data: {
      label: string;
      name?:  string;
      icon?: string;
      type?:  string;
      config?: Record<string, unknown>;
    };
  }
  interface EdgeType {
    id: string;
    source: string;
    target: string;
  }
  
export const CreateWorkFlow = () => {
  const [sidebaropen, setSideBarOpen] = useState(false);
  const [nodes, setNodes] = useState<NodeType[]>([
    {
      id: "1",
      type: "placeholder",
      position: { x: 0, y: 0 },
      data: {
        label: "Select This one",
        icon: "→",
      },
    },  
  ]);
  const [edges, setEdges] = useState<EdgeType[]>([]);

  const nodeType = {
    placeholder: PlaceholderNode,
    trigger: TriggerNode,
  };
//   const handleSelectTrigger = (trigger: { id: string; name: string; type: string; icon?: string }) => {
//     const edgeId = `e-trigger-${trigger.id}-placeholder-${Date.now()}`;
//     const placeholderId = `placeholder-${Date.now()}`;

//     setNodes((currentNodes) => {
//       const placeholderNode = currentNodes.find((n) => n.type === "placeholder");
//       if (!placeholderNode) return currentNodes;

//       const triggerNode: NodeType = {
//         id: `trigger-${trigger.id}`,
//         type: "trigger",
//         position: placeholderNode.position,
//         data: {
//           label: trigger.name,
//           name: trigger.name,
//           icon: trigger.icon || "⚡",
//           type: trigger.type,
//         },
//       };

//       const newPlaceholder: NodeType = {
//         id: placeholderId,
//         type: "placeholder",
//         position: {
//           x: placeholderNode.position.x + 200,
//           y: placeholderNode.position.y,
//         },
//         data: {
//           label: "+",
//         },
//       };

//       return [triggerNode, newPlaceholder];
//     });

//     // TypeScript expects you to define a type for edges.
//     // We'll use a generic structure: id (string), source (string), target (string)
//     setEdges([
//         {
//           id: edgeId,
//           source: `trigger-${trigger.id}`,
//           target: placeholderId,
//         }
//       ]);
//   };
  

const handleSelectTrigger = (trigger:  { id: string; name: string; type: string; icon?: string }) => {
    const timestamp = Date.now();  // ✅ Call ONCE
    const placeholderId = `placeholder-${timestamp}`;
    const triggerNodeId = `trigger-${trigger.id}`;
    const edgeId = `e-${triggerNodeId}-${placeholderId}`;
  
    setNodes((currentNodes) => {
      const placeholderNode = currentNodes.find((n) => n.type === "placeholder");
      if (!placeholderNode) return currentNodes;
  
      const triggerNode: NodeType = {
        id:   triggerNodeId,  // ✅ Use variable
        type: "trigger",
        position:   placeholderNode.position,
        data: {
          label: trigger.name,
          name: trigger.name,
          icon: trigger.icon || "⚡",
          type:   trigger.type,
        },
      };
  
      const newPlaceholder:   NodeType = {
        id:  placeholderId,  // ✅ Use variable
        type: "placeholder",
        position: {
          x: placeholderNode.position.x + 200,
          y: placeholderNode.position.y,
        },
        data: { label: "+" },
      };
  
      return [triggerNode, newPlaceholder];
    });
  
    setEdges([
      {
        id:   edgeId,
        source: triggerNodeId,  // ✅ Matches trigger node
        target: placeholderId,   // ✅ Matches placeholder node
      }
    ]);
  };
return (
    <div style={{ width: "100%", height: "100vh" }}>
      <ReactFlow
        nodeTypes={nodeType}
        nodes={nodes}
        edges={edges}
        onNodeClick={(event, node) => {
          if (node.type === "placeholder") {
            setSideBarOpen(true);
          }
        }}
      ></ReactFlow>
        <TriggerSideBar
        isOpen={sidebaropen}
        onClose={() => setSideBarOpen(false)}
        onSelectTrigger={handleSelectTrigger}
      />
    </div>
  );
};

export default CreateWorkFlow;
