import { tokenRefreshService } from "./token-refresh.service.js";

class TokenScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private intervalMinutes: number;

  constructor(intervalMinutes: number = 60) {
    this.intervalMinutes = intervalMinutes;
  }

  start(): void {
    console.log(`[Worker] 🚀 Token Refresh Scheduler active (Interval: every ${this.intervalMinutes} min)`);

    // Run immediately on start
    this.runRefreshJob();

    // Then run every interval
    const intervalMs = this.intervalMinutes * 60 * 1000;
    this.intervalId = setInterval(() => {
      this.runRefreshJob();
    }, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("[Worker] 🛑 Token Refresh Scheduler stopped");
    }
  }

  private async runRefreshJob(): Promise<void> {
    try {
      await tokenRefreshService.refreshAllExpiringTokens();
    } catch (error) {
      console.error("[Worker] ❌ Scheduled token refresh error:", error);
    }
  }
}

export const tokenScheduler = new TokenScheduler(60);
