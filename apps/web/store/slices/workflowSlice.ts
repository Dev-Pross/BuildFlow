import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Trigger {
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
interface NodeItem {
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
    changedNodeIds: string[];
}

const initialData = {
    workflowId: null,
    name: null,
    description: null,
    trigger: null,
    nodes: [],
    edges: []
}

const initialState: WorkflowSlice = {
    data: initialData,
    lastSynced: null,
    isChanged: {
        trigger: false,
        nodes: false,
        edges: false
    },
    changedNodeIds: []
}

const workflowSlice = createSlice({
    name: 'workflow',
    initialState,
    reducers: {
        setWorkflow(state, action: PayloadAction<Workflow>){
            state.data = action.payload;
            state.isChanged = { trigger: false, nodes: false, edges: false };
            state.changedNodeIds = []
        },

        setWorkflowTrigger(state, action: PayloadAction<Trigger | null>) {
            state.data.trigger = action.payload
            state.isChanged.trigger = true
        },

        addWorkflowNode(state, action: PayloadAction<NodeItem>) {
            state.data.nodes.push(action.payload)
            state.isChanged.nodes = true
            if(!state.changedNodeIds?.includes(action.payload.NodeId))
                state.changedNodeIds?.push(action.payload.NodeId)
        },

        updateNodePosition(state, action: PayloadAction<{nodeId: string, position: Position}>){
            const node = state.data.nodes.find((n)=> n.NodeId === action.payload.nodeId)

            if(node){
                node.position = action.payload.position
                state.isChanged.nodes = true

                if(!state.changedNodeIds?.includes(action.payload.nodeId))
                    state.changedNodeIds?.push(action.payload.nodeId)
            }
        
        },
        updateNodeConfig(state, action: PayloadAction<{nodeId: string,config: any}>){
            const node = state.data.nodes.find((n)=> n.NodeId === action.payload.nodeId);
            if(node){
                node.Config = action.payload.config
                state.isChanged.nodes = true

                if(!state.changedNodeIds?.includes(action.payload.nodeId))
                    state.changedNodeIds?.push(action.payload.nodeId)
            }
        },
        updateTriggerPosition(state, action: PayloadAction<Position>){
            if(state.data.trigger){
                state.data.trigger.position = action.payload
                state.isChanged.trigger = true
            }
        },
        updateTriggerConfig(state, action: PayloadAction<{config: any}>){
            if(state.data.trigger){
                state.data.trigger.Config = action.payload.config
                state.isChanged.trigger = true
            }
        },
        setEdge(state, action: PayloadAction<EdgeItem[]>){
            state.data.edges = action.payload
            state.isChanged.edges = true
        },
        markSynced(state){
            state.isChanged = {
                trigger: false,
                nodes: false,
                edges: false
            }
            state.changedNodeIds = []
            state.lastSynced = Date.now()
        },
        clearWorkflow() {
            return initialState
        }
    }
})

export const workflowReducer = workflowSlice.reducer;
export const workflowActions = workflowSlice.actions;
