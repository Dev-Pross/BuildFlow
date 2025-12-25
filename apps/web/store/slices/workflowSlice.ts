import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface WorkflowSlice{
    workflow_id: string | null,
    empty: boolean | null
}

const initialState: WorkflowSlice = {
    workflow_id :null,
    empty: true
}

const workflowSlice = createSlice({
    name: 'workflow',
    initialState,
    reducers:{
        setWorkflowId(state, action:PayloadAction<string | null>){
            state.workflow_id = action.payload
        },
        setWorkflowStatus(state, action: PayloadAction<boolean | null>){
            state.empty = action.payload
        },
        clearWorkflow(){
            return initialState
        }
    }
})

export const workflowReducer = workflowSlice.reducer;
export const workflowActions = workflowSlice.actions;
