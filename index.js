// Entry point for Render deployment
console.log('🚀 Starting FUSAKA Telegram Bot on Render...');
console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- TELEGRAM_BOT_TOKEN exists:', !!process.env.TELEGRAM_BOT_TOKEN);
console.log('- GROK_API_KEY exists:', !!process.env.GROK_API_KEY);
console.log('- BOT_USERNAME:', process.env.BOT_USERNAME);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Keep process alive
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Start the bot
try {
  console.log('📦 Loading telegramClient...');
  require('./src/telegramClient');
  console.log('✅ Bot module loaded successfully');
} catch (error) {
  console.error('❌ Failed to start bot:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}