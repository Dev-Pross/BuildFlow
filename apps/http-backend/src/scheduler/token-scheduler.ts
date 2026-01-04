import { tokenRefreshService } from "../services/token-refresh.service.js";

class TokenScheduler {
    private intervalId: NodeJS.Timeout | null = null;
    private intervalMinutes: number;

    constructor(intervalMinutes: number = 60) {
        this.intervalMinutes = intervalMinutes;
    }

    /**
     * Start the token refresh scheduler
     */
    start(): void {
        console.log(`\n🚀 Token Refresh Scheduler started`);
        console.log(`   Interval: Every ${this.intervalMinutes} minutes`);
        console.log(`   Next run: Immediately + every ${this.intervalMinutes} min\n`);

        // Run immediately on start
        this.runRefreshJob();

        // Then run at specified interval
        const intervalMs = this.intervalMinutes * 60 * 1000;
        this.intervalId = setInterval(() => {
            this.runRefreshJob();
        }, intervalMs);
    }

    /**
     * Stop the scheduler
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('🛑 Token Refresh Scheduler stopped');
        }
    }

    /**
     * Run the refresh job
     */
    private async runRefreshJob(): Promise<void> {
        try {
            const timestamp = new Date().toISOString();
            console.log(`\n⏱️  [${timestamp}] Running scheduled token refresh...`);
            
            await tokenRefreshService.refreshAllExpiringTokens();
            
        } catch (error) {
            console.error('❌ Scheduled token refresh failed:', error);
        }
    }

    /**
     * Manually trigger a refresh (useful for testing or on-demand refresh)
     */
    async triggerManualRefresh(): Promise<void> {
        console.log('\n🔧 Manual token refresh triggered...');
        await this.runRefreshJob();
    }
}

// Default scheduler instance - runs every 30 minutes
export const tokenScheduler = new TokenScheduler(60);

// Export class for custom configurations
export { TokenScheduler };
