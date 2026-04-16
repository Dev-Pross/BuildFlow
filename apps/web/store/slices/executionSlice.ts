import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WorkflowExecutionLog } from "@/app/types/execution.types";

export interface ExecutionState {
  executions: WorkflowExecutionLog[];
  selectedExecution: WorkflowExecutionLog | null;
  isLoading: boolean;
  error: string | null;
  isFooterExpanded: boolean;
  hasMore: boolean;
  skip: number;
  take: number;
}

const initialState: ExecutionState = {
  executions: [],
  selectedExecution: null,
  isLoading: false,
  error: null,
  isFooterExpanded: false,
  hasMore: true,
  skip: 0,
  take: 20,
};

export const executionSlice = createSlice({
  name: "execution",
  initialState,
  reducers: {
    // Set full execution list (replace)
    setExecutions: (state, action: PayloadAction<WorkflowExecutionLog[]>) => {
      state.executions = action.payload;
    },

    // Append more executions (lazy load)
    appendExecutions: (state, action: PayloadAction<WorkflowExecutionLog[]>) => {
      state.executions = [...state.executions, ...action.payload];
    },

    // Select an execution
    selectExecution: (state, action: PayloadAction<WorkflowExecutionLog>) => {
      state.selectedExecution = action.payload;
    },

    // Deselect current execution
    clearSelectedExecution: (state) => {
      state.selectedExecution = null;
    },

    // Toggle footer expanded state
    setIsFooterExpanded: (state, action: PayloadAction<boolean>) => {
      state.isFooterExpanded = action.payload;
      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "executionFooterExpanded",
          JSON.stringify(action.payload)
        );
      }
    },

    // Set loading state
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Set if more data available
    setHasMore: (state, action: PayloadAction<boolean>) => {
      state.hasMore = action.payload;
    },

    // Reset pagination
    resetPagination: (state) => {
      state.skip = 0;
      state.executions = [];
    },

    // Increment skip by take amount
    incrementSkip: (state) => {
      state.skip += state.take;
    },

    // Initialize from localStorage
    initializeFromStorage: (state) => {
      if (typeof window !== "undefined") {
        const expanded = localStorage.getItem("executionFooterExpanded");
        if (expanded !== null) {
          state.isFooterExpanded = JSON.parse(expanded);
        }
      }
    },

    // Clear all execution data
    clearExecutions: (state) => {
      state.executions = [];
      state.selectedExecution = null;
      state.skip = 0;
      state.hasMore = true;
    },
  },
});

export const {
  setExecutions,
  appendExecutions,
  selectExecution,
  clearSelectedExecution,
  setIsFooterExpanded,
  setIsLoading,
  setError,
  setHasMore,
  resetPagination,
  incrementSkip,
  initializeFromStorage,
  clearExecutions,
} = executionSlice.actions;

export default executionSlice.reducer;
