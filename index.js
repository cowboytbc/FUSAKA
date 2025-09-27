// Entry point for Render deployment
// Load environment variables (for local testing)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

console.log('🚀 Starting FUSAKA Telegram Bot...');
console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('- TELEGRAM_BOT_TOKEN exists:', !!process.env.TELEGRAM_BOT_TOKEN);
console.log('- GROK_API_KEY exists:', !!process.env.GROK_API_KEY);
console.log('- IDEOGRAM_API_KEY exists:', !!process.env.IDEOGRAM_API_KEY);
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
  const TelegramClient = require('./src/telegramClient');
  console.log('✅ Bot module loaded successfully');
  
  console.log('🚀 Starting FUSAKA Telegram Bot...');
  const telegramClient = new TelegramClient();
  
  // Test connection and start bot
  telegramClient.testConnection().then(success => {
    if (success) {
      console.log('🎉 FUSAKA Telegram Bot is running and ready for /ask commands!');
      console.log('🔄 Bot will continue running in polling mode...');
    } else {
      console.error('❌ Failed to start bot');
      process.exit(1);
    }
  }).catch(error => {
    console.error('❌ Error starting bot:', error);
    process.exit(1);
  });

  // Keep the process alive and handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    telegramClient.bot.stopPolling();
    process.exit(0);
  });

} catch (error) {
  console.error('❌ Failed to start bot:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}