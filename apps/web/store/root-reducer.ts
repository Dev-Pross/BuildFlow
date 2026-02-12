import { combineReducers } from "@reduxjs/toolkit";
import { userReducer } from "./slices/userSlice";
import { workflowReducer } from "./slices/workflowSlice";
import { nodeOutputReducer, NodeOutputState } from "./slices/nodeOutputSlice";

// Re-export types for use in types.ts
export type { NodeOutputState };

export const rootReducer = combineReducers({
    user: userReducer,
    workflow: workflowReducer,
    nodeOutput: nodeOutputReducer
});