import { combineReducers } from "@reduxjs/toolkit";
import { userReducer } from "./slices/userSlice";
import { workflowReducer } from "./slices/workflowSlice";
import { nodeOutputReducer, NodeOutputState } from "./slices/nodeOutputSlice";
import executionReducer from "./slices/executionSlice";
import type { ExecutionState } from "./slices/executionSlice";

// Re-export types for use in types.ts
export type { NodeOutputState, ExecutionState };

export const rootReducer = combineReducers({
    user: userReducer,
    workflow: workflowReducer,
    nodeOutput: nodeOutputReducer,
    execution: executionReducer
});