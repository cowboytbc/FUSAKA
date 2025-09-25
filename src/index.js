const FusakaBot = require('./fusakaBot');

// Create bot instance
const bot = new FusakaBot();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  bot.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  bot.stop();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  bot.stop();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  bot.stop();
  process.exit(1);
});

// Start the bot
async function main() {
  try {
    await bot.start();
    
    // Keep the process running
    console.log('✨ Bot is running. Press Ctrl+C to stop.');
    
    // Optional: Log stats every 30 minutes
    setInterval(() => {
      const stats = bot.getStats();
      console.log('📊 Bot Stats:', JSON.stringify(stats, null, 2));
    }, 30 * 60 * 1000); // 30 minutes
    
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Run the bot
main();