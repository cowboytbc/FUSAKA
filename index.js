// Entry point for Render deployment
console.log('🚀 Starting FUSAKA Telegram Bot on Render...');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the bot
try {
  require('./src/telegramClient');
} catch (error) {
  console.error('❌ Failed to start bot:', error);
  process.exit(1);
}