import { combineReducers } from "@reduxjs/toolkit";
import { userReducer } from "./slices/userSlice";
import { workflowReducer } from "./slices/workflowSlice";

export const rootReducer = combineReducers({
    user: userReducer,
    workflow: workflowReducer
});