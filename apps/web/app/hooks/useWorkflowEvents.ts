'use client';

import { useEffect, useRef } from "react";
import { BACKEND_URL } from "@repo/common/zod";

export interface WorkflowLiveEventCallbacks {
  workflowId: string | null | undefined;
  onConnected?: () => void;
  onTestWebhook?: (payload: any) => void;
  onNodeStart?: (data: { nodeId: string; executionId: string; startedAt: string }) => void;
  onNodeFinish?: (data: { nodeId: string; executionId: string; status: "Completed" | "Failed"; error?: string }) => void;
  onWorkflowFinish?: (data: { executionId: string; status: "Completed" | "Failed"; error?: string }) => void;
}

export function useWorkflowEvents({
  workflowId,
  onConnected,
  onTestWebhook,
  onNodeStart,
  onNodeFinish,
  onWorkflowFinish,
}: WorkflowLiveEventCallbacks) {
  // Store callbacks in refs to avoid tearing down and re-opening the EventSource on every parent render
  const callbacksRef = useRef({
    onConnected,
    onTestWebhook,
    onNodeStart,
    onNodeFinish,
    onWorkflowFinish,
  });

  useEffect(() => {
    callbacksRef.current = {
      onConnected,
      onTestWebhook,
      onNodeStart,
      onNodeFinish,
      onWorkflowFinish,
    };
  });

  useEffect(() => {
    if (!workflowId) return;

    let eventSource: EventSource | null = null;
    let isCleanedUp = false;

    try {
      const url = `${BACKEND_URL}/user/workflow/events/${workflowId}`;
      eventSource = new EventSource(url, { withCredentials: true });

      eventSource.addEventListener("connected", () => {
        if (!isCleanedUp) {
          callbacksRef.current.onConnected?.();
        }
      });

      eventSource.addEventListener("TEST_WEBHOOK", (event) => {
        if (isCleanedUp) return;
        try {
          const data = JSON.parse(event.data);
          callbacksRef.current.onTestWebhook?.(data.metadata);
        } catch (err) {
          console.error("[useWorkflowEvents] Error parsing TEST_WEBHOOK:", err);
        }
      });

      eventSource.addEventListener("NODE_START", (event) => {
        if (isCleanedUp) return;
        try {
          const data = JSON.parse(event.data);
          callbacksRef.current.onNodeStart?.(data);
        } catch (err) {
          console.error("[useWorkflowEvents] Error parsing NODE_START:", err);
        }
      });

      eventSource.addEventListener("NODE_FINISH", (event) => {
        if (isCleanedUp) return;
        try {
          const data = JSON.parse(event.data);
          callbacksRef.current.onNodeFinish?.(data);
        } catch (err) {
          console.error("[useWorkflowEvents] Error parsing NODE_FINISH:", err);
        }
      });

      eventSource.addEventListener("WORKFLOW_FINISH", (event) => {
        if (isCleanedUp) return;
        try {
          const data = JSON.parse(event.data);
          callbacksRef.current.onWorkflowFinish?.(data);
        } catch (err) {
          console.error("[useWorkflowEvents] Error parsing WORKFLOW_FINISH:", err);
        }
      });

      eventSource.onerror = (err) => {
        // Native EventSource automatically handles backoff and reconnect on network flickers
        console.warn("[useWorkflowEvents] SSE stream notice:", err);
      };
    } catch (err) {
      console.error("[useWorkflowEvents] Failed to instantiate EventSource:", err);
    }

    return () => {
      isCleanedUp = true;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }, [workflowId]);
}
