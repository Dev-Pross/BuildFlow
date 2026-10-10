import { Response } from "express";
import { WorkflowLiveEvent } from "@repo/kafka";

class SSEManager {
  private clientsByWorkflow: Map<string, Set<Response>> = new Map();

  /**
   * Register an active client response stream for a given workflow
   */
  public addClient(workflowId: string, res: Response): void {
    if (!this.clientsByWorkflow.has(workflowId)) {
      this.clientsByWorkflow.set(workflowId, new Set());
    }
    const clients = this.clientsByWorkflow.get(workflowId)!;
    clients.add(res);
    console.log(`[SSEManager] Client connected to workflow ${workflowId}. Total for workflow: ${clients.size}`);
  }

  /**
   * Cleanly remove a client stream on socket close/disconnect
   */
  public removeClient(workflowId: string, res: Response): void {
    const clients = this.clientsByWorkflow.get(workflowId);
    if (!clients) return;

    clients.delete(res);
    console.log(`[SSEManager] Client disconnected from workflow ${workflowId}. Remaining: ${clients.size}`);

    // Memory hygiene: prune empty sets to avoid unbounded map growth
    if (clients.size === 0) {
      this.clientsByWorkflow.delete(workflowId);
    }
  }

  /**
   * Broadcast an event to all connected clients listening to a specific workflow
   */
  public broadcastToWorkflow(workflowId: string, event: WorkflowLiveEvent): void {
    const clients = this.clientsByWorkflow.get(workflowId);
    if (!clients || clients.size === 0) {
      return;
    }

    const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;

    const deadSockets: Response[] = [];

    for (const res of clients) {
      try {
        res.write(payload);
      } catch (err) {
        console.error(`[SSEManager] Error writing to socket for workflow ${workflowId}:`, err);
        deadSockets.push(res);
      }
    }

    // Clean up any sockets that failed during write
    for (const dead of deadSockets) {
      this.removeClient(workflowId, dead);
    }
  }

  /**
   * Diagnostic helper to inspect active connection counts
   */
  public getActiveClientCount(workflowId?: string): number {
    if (workflowId) {
      return this.clientsByWorkflow.get(workflowId)?.size || 0;
    }
    let total = 0;
    for (const set of this.clientsByWorkflow.values()) {
      total += set.size;
    }
    return total;
  }
}

export const sseManager = new SSEManager();
