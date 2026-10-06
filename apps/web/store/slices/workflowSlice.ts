import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Trigger {
    TriggerId: string;
    name: string;
    icon: string | null;
    type: string;
    Config: any;
    position: Position;
    AvailableTriggerID: string
}

interface Position {
    x: number;
    y: number;
}

const DEFAULT_TRIGGER_POSITION = { x: 250, y: 50 };
export interface NodeItem {
    NodeId: string;
    name: string;
    icon: string | null;
    type: string;
    Config: any;
    position: Position;
    stage: number;
    AvailableNodeID: string
}

interface EdgeItem {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
}

type Nodes = NodeItem[];
export interface Workflow {
    workflowId: string | null;
    name: string | null;
    description: string | null
    trigger: Trigger | null;
    nodes: NodeItem[];
    edges: EdgeItem[];
}

export interface WorkflowSlice {
    data: Workflow;
    isChanged: {
        trigger: boolean;
        nodes: boolean;
        edges: boolean;
    }
    lastSynced: number | null;
    lastChanged: number | null;
    changedNodeIds: string[];
    deletedNodeIds: string[];
    newNodeIds: string[];
    deletedTriggerId: string | null;
}

const initialData = {
    workflowId: null,
    name: null,
    description: null,
    trigger: null,
    nodes: [],
    edges: [],
}

const initialState: WorkflowSlice = {
    data: initialData,
    lastSynced: null,
    lastChanged: null,
    isChanged: {
        trigger: false,
        nodes: false,
        edges: false
    },
    changedNodeIds: [],
    deletedNodeIds: [],
    deletedTriggerId: null,
    newNodeIds: []
}

const workflowSlice = createSlice({
    name: 'workflow',
    initialState,
    reducers: {
        setWorkflowFromBackend(
            state,
            action: PayloadAction<{ workflowId: string; data: any }>
        ) {
            const { workflowId, data } = action.payload;

            // Backend casing is inconsistent (e.g. Trigger vs trigger, Edges vs edges),
            // so normalize the payload here so the rest of the app can rely on Redux's shape.
            const backendData = data ?? {};
            const backendNodes = Array.isArray(backendData?.nodes)
                ? backendData.nodes
                : [];
            const backendEdges = Array.isArray(backendData?.Edges)
                ? backendData.Edges
                : [];
            const backendTrigger = backendData?.Trigger ?? null;

            state.data = {
                workflowId,
                name: backendData?.name ?? null,
                description: backendData?.description ?? null,
                trigger: backendTrigger
                    ? {
                        TriggerId: backendTrigger?.id ?? "",
                        name: backendTrigger?.name ?? "",
                        type: backendTrigger?.type ?? "",
                        icon: backendTrigger?.icon ?? null,
                        Config: backendTrigger?.config || {},
                        position:
                            backendTrigger?.Position || DEFAULT_TRIGGER_POSITION,
                        AvailableTriggerID:
                            backendTrigger?.AvailableTriggerID ?? "",
                    }
                    : null,
                nodes: backendNodes.map((n: any) => ({
                    NodeId: n?.id ?? "",
                    name: n?.name ?? "",
                    type: n?.type ?? "",
                    icon: n?.icon ?? null,
                    Config: n?.config || {},
                    position: n?.position || { x: 0, y: 0 },
                    stage: n?.stage ?? 0,
                    AvailableNodeID: n?.AvailableNodeId ?? "",
                })),
                edges: backendEdges.map((e: any) => ({
                    id: e?.id ?? "",
                    source: e?.source ?? "",
                    target: e?.target ?? "",
                    sourceHandle: e?.sourceHandle ?? null,
                    targetHandle: e?.targetHandle ?? null,
                })),
            };
            state.isChanged = { trigger: false, nodes: false, edges: false };
            state.changedNodeIds = [];
            state.newNodeIds = [];
            state.deletedNodeIds = [];
            state.deletedTriggerId = null;
        },

        setWorkflow(state, action: PayloadAction<Workflow>) {
            state.data = action.payload;
            state.isChanged = { trigger: false, nodes: false, edges: false };
            state.changedNodeIds = []
        },

        setWorkflowTrigger(state, action: PayloadAction<Trigger | null>) {
            if (state.data.trigger) {
                state.deletedTriggerId = state.data.trigger.TriggerId;
            }
            state.data.trigger = action.payload
            state.isChanged.trigger = true
            state.lastChanged = Date.now()
        },

        addWorkflowNode(state, action: PayloadAction<NodeItem>) {
            if (!state.data.nodes) state.data.nodes = [];
            state.data.nodes.push(action.payload)
            
            if (!state.newNodeIds) state.newNodeIds = [];
            state.newNodeIds.push(action.payload.NodeId)
            
            state.isChanged.nodes = true
            state.lastChanged = Date.now()
            
            if (!state.changedNodeIds) state.changedNodeIds = [];
            if (!state.changedNodeIds.includes(action.payload.NodeId))
                state.changedNodeIds.push(action.payload.NodeId)
        },

        updateNodePosition(state, action: PayloadAction<{ nodeId: string, position: Position }>) {
            const node = state.data.nodes.find((n) => n.NodeId === action.payload.nodeId)

            if (node) {
                node.position = action.payload.position
                state.isChanged.nodes = true
                state.lastChanged = Date.now()

                if (!state.changedNodeIds?.includes(action.payload.nodeId))
                    state.changedNodeIds?.push(action.payload.nodeId)
            }

        },
        updateNodeConfig(state, action: PayloadAction<{ nodeId: string, config: any }>) {
            const node = state.data.nodes.find((n) => n.NodeId === action.payload.nodeId);
            if (node) {
                node.Config = action.payload.config
                state.isChanged.nodes = true
                state.lastChanged = Date.now()

                if (!state.changedNodeIds?.includes(action.payload.nodeId))
                    state.changedNodeIds?.push(action.payload.nodeId)
            }
        },
        updateTriggerPosition(state, action: PayloadAction<Position>) {
            if (state.data.trigger) {
                state.data.trigger.position = action.payload
                state.isChanged.trigger = true
                state.lastChanged = Date.now()
            }
        },
        updateTriggerConfig(state, action: PayloadAction<{ config: any }>) {
            if (state.data.trigger) {
                state.data.trigger.Config = action.payload.config
                state.isChanged.trigger = true
                state.lastChanged = Date.now()
            }
        },
        setEdge(state, action: PayloadAction<EdgeItem[]>) {
            state.data.edges = action.payload
            state.isChanged.edges = true
            state.lastChanged = Date.now()
        },
        markSynced(state) {
            state.isChanged = {
                trigger: false,
                nodes: false,
                edges: false
            }
            state.changedNodeIds = []

            state.deletedNodeIds = []
            state.newNodeIds = []
            state.deletedTriggerId = null

            state.lastSynced = Date.now()
        },
        deleteNode(state, action: PayloadAction<string>) {
            if (!state.data.nodes) state.data.nodes = [];
            if (!state.data.edges) state.data.edges = [];
            
            state.data.nodes = state.data.nodes.filter(n => n.NodeId !== action.payload)
            state.data.edges = state.data.edges.filter(e => (e.source !== action.payload && e.target !== action.payload))

            state.isChanged.edges = true;
            state.isChanged.nodes = true
            state.lastChanged = Date.now()

            if (!state.newNodeIds) state.newNodeIds = [];
            if (!state.deletedNodeIds) state.deletedNodeIds = [];

            if (state.newNodeIds.includes(action.payload))
                state.newNodeIds = state.newNodeIds.filter(n => n !== action.payload)
            else
                state.deletedNodeIds.push(action.payload)
        },
        replaceNode(state, action: PayloadAction<{ oldNodeId: string, newNode: NodeItem }>) {
            const { oldNodeId, newNode } = action.payload;

            if (!state.data.nodes) state.data.nodes = [];
            if (!state.data.edges) state.data.edges = [];

            state.data.nodes = state.data.nodes.map(n =>
                n.NodeId === oldNodeId ? newNode : n
            );

            state.data.edges = state.data.edges.map(e => {
                if (e.source === oldNodeId) {
                    return { ...e, source: newNode.NodeId }
                }
                if (e.target === oldNodeId) {
                    return { ...e, target: newNode.NodeId }
                }

                return e
            });

            if (!state.newNodeIds) state.newNodeIds = [];
            if (!state.deletedNodeIds) state.deletedNodeIds = [];

            if (state.newNodeIds.includes(action.payload.oldNodeId))
                state.newNodeIds = state.newNodeIds.filter(n => n !== action.payload.oldNodeId)
            else
                state.deletedNodeIds.push(action.payload.oldNodeId)

            state.newNodeIds.push(action.payload.newNode.NodeId)
            // state.deletedNodeIds.push(oldNodeId)

            state.isChanged.edges = true;
            state.isChanged.nodes = true
            state.lastChanged = Date.now()
        },
        clearTracker(state) {
            state.changedNodeIds = []
            state.deletedNodeIds = []
            state.newNodeIds = []
            state.deletedTriggerId = null;
        },
        clearWorkflow() {
            return initialState
        }
    }
})

export const workflowReducer = workflowSlice.reducer;
export const workflowActions = workflowSlice.actions;
