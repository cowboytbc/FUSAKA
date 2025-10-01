const https = require('https');

// Simple log checker to verify bot status
class BotStatusChecker {
    constructor() {
        this.checkInterval = 30000; // Check every 30 seconds
        this.isRunning = false;
    }

    logWithTimestamp(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${type}] ${message}`);
    }

    // Check if the bot should be working based on current time
    checkScheduledActivity() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        this.logWithTimestamp(`Current time: ${hour}:${minute.toString().padStart(2, '0')}`);
        
        // Check if we're in a typical posting window
        if (hour >= 8 && hour <= 23) {
            this.logWithTimestamp("✓ Bot should be active during these hours", 'SUCCESS');
        } else {
            this.logWithTimestamp("⚠ Bot activity may be reduced during night hours", 'WARNING');
        }
    }

    // Simulate checking for expected log patterns
    checkExpectedActivity() {
        this.logWithTimestamp("=== FUSAKA BOT STATUS CHECK ===");
        this.logWithTimestamp("User ID should be: 1970849515512147969");
        this.logWithTimestamp("Username should be: FusakaAi");
        
        this.checkScheduledActivity();
        
        this.logWithTimestamp("\n=== WHAT TO LOOK FOR IN RENDER LOGS ===");
        this.logWithTimestamp("✓ 'Bot started successfully'");
        this.logWithTimestamp("✓ 'Twitter API connected for user: FusakaAi'");
        this.logWithTimestamp("✓ 'Scheduled tweet posted'");
        this.logWithTimestamp("✓ 'Price data fetched successfully'");
        this.logWithTimestamp("✓ 'Telegram bot connected'");
        
        this.logWithTimestamp("\n=== RED FLAGS IN LOGS ===");
        this.logWithTimestamp("❌ 'Invalid Request - User not found'");
        this.logWithTimestamp("❌ 'Unauthorized'");
        this.logWithTimestamp("❌ 'Error 409: Conflict'");
        this.logWithTimestamp("❌ Any error mentioning '1971049502456020998' (old wrong ID)");
    }

    // Manual test trigger
    async simulateActivity() {
        this.logWithTimestamp("\n=== MANUAL TEST SUGGESTIONS ===");
        this.logWithTimestamp("1. Go mention @FusakaAi on Twitter with: 'Hello FUSAKA!'");
        this.logWithTimestamp("2. Send a message to your Telegram bot");
        this.logWithTimestamp("3. Check Render logs for immediate responses");
        this.logWithTimestamp("4. Look for 'Processing mention' or 'Telegram message received'");
    }

    start() {
        if (this.isRunning) {
            this.logWithTimestamp("Status checker already running!");
            return;
        }

        this.isRunning = true;
        this.logWithTimestamp("🚀 Starting FUSAKA Bot Status Monitor...");
        
        // Initial check
        this.checkExpectedActivity();
        this.simulateActivity();

        // Set up periodic checks
        const interval = setInterval(() => {
            this.logWithTimestamp("\n--- Periodic Status Check ---");
            this.checkExpectedActivity();
        }, this.checkInterval);

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            this.logWithTimestamp("Stopping status monitor...");
            clearInterval(interval);
            this.isRunning = false;
            process.exit(0);
        });

        this.logWithTimestamp(`✓ Monitor started. Will check every ${this.checkInterval/1000} seconds.`);
        this.logWithTimestamp("Press Ctrl+C to stop monitoring");
    }
}

// Usage
if (require.main === module) {
    const checker = new BotStatusChecker();
    checker.start();
}