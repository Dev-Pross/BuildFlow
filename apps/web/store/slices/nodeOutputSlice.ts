import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { VariableDefinition } from "@/app/lib/types/node.types";

// Output data stored after testing a node
export interface NodeTestOutput {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  data: any;                        // Raw output from execution
  variables: VariableDefinition[];  // Extracted variables for UI
  testedAt: number;                 // Timestamp
  success: boolean;
  error?: string;
}

export interface NodeOutputState {
  outputs: Record<string, NodeTestOutput>;  // keyed by nodeId
  isLoading: Record<string, boolean>;       // loading state per node
}

const initialState: NodeOutputState = {
  outputs: {},
  isLoading: {},
};

const nodeOutputSlice = createSlice({
  name: "nodeOutput",
  initialState,
  reducers: {
    // Set loading state for a node
    setNodeLoading: (
      state,
      action: PayloadAction<{ nodeId: string; loading: boolean }>
    ) => {
      state.isLoading[action.payload.nodeId] = action.payload.loading;
    },

    // Store the output of a tested node
    setNodeOutput: (state, action: PayloadAction<NodeTestOutput>) => {
      state.outputs[action.payload.nodeId] = action.payload;
      state.isLoading[action.payload.nodeId] = false;
    },

    // Clear output for a specific node
    clearNodeOutput: (state, action: PayloadAction<string>) => {
      delete state.outputs[action.payload];
      delete state.isLoading[action.payload];
    },

    // Clear all outputs (e.g., when switching workflows)
    clearAllOutputs: (state) => {
      state.outputs = {};
      state.isLoading = {};
    },

    // Update variables for a node (useful when schema changes)
    updateNodeVariables: (
      state,
      action: PayloadAction<{ nodeId: string; variables: VariableDefinition[] }>
    ) => {
      const existing = state.outputs[action.payload.nodeId];
      if (existing !== undefined) {
        existing.variables = action.payload.variables;
      }
    },
  },
});

export const {
  setNodeLoading,
  setNodeOutput,
  clearNodeOutput,
  clearAllOutputs,
  updateNodeVariables,
} = nodeOutputSlice.actions;

export const nodeOutputReducer = nodeOutputSlice.reducer;

// Selectors
export const selectNodeOutput = (state: { nodeOutput: NodeOutputState }, nodeId: string) =>
  state.nodeOutput.outputs[nodeId];

export const selectNodeLoading = (state: { nodeOutput: NodeOutputState }, nodeId: string) =>
  state.nodeOutput.isLoading[nodeId] ?? false;

export const selectAllOutputs = (state: { nodeOutput: NodeOutputState }) =>
  state.nodeOutput.outputs;
