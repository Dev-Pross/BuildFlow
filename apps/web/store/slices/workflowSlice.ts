import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Trigger {
    dbId: string;
    name: string;
    type: string;
    config: any;
}

interface NodeItem {
    dbId: string;
    name: string;
    type: string;
    config: any;
    position: number;
}

type Nodes = NodeItem[];
export interface WorkflowSlice {
    workflow_id: string | null;
    empty: boolean | null;
    trigger: Trigger | null;
    nodes: Nodes;
}

const initialState: WorkflowSlice = {
    workflow_id: null,
    empty: true,
    trigger: null,
    nodes: []
}

const workflowSlice = createSlice({
    name: 'workflow',
    initialState,
    reducers: {
        setWorkflowId(state, action: PayloadAction<string | null>) {
            state.workflow_id = action.payload
        },
        setWorkflowStatus(state, action: PayloadAction<boolean | null>) {
            state.empty = action.payload
        },
        setWorkflowTrigger(state, action: PayloadAction<Trigger | null>) {
            state.trigger = action.payload
        },
        setWorkflowNodes(state, action: PayloadAction<Nodes>) {
            state.nodes = action.payload
        },
        addWorkflowNode(state, action: PayloadAction<NodeItem>) {
            state.nodes.push(action.payload)
        },
        clearWorkflow() {
            return initialState
        }
    }
})

export const workflowReducer = workflowSlice.reducer;
export const workflowActions = workflowSlice.actions;
