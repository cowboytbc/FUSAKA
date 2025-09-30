// Entry point for Render deployment
// Load environment variables (for local testing)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

console.log('🚀 Starting FUSAKA Multi-Platform Bot...');
console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('- TELEGRAM_BOT_TOKEN exists:', !!process.env.TELEGRAM_BOT_TOKEN);
console.log('- TWITTER_API_KEY exists:', !!process.env.TWITTER_API_KEY);
console.log('- TWITTER_ENABLED:', process.env.TWITTER_ENABLED);
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

// Start both bots
async function startBots() {
  try {
    console.log('📦 Loading bot clients...');
    const TelegramClient = require('./src/telegramClient');
    const TwitterClient = require('./src/twitterClient');
    console.log('✅ Bot modules loaded successfully');

    // Initialize clients
    const telegramClient = new TelegramClient();
    const twitterClient = new TwitterClient();

    // TEMPORARILY DISABLE Telegram bot (to test Twitter)
    console.log('⏸️  SKIPPING Telegram Bot (testing Twitter only)...');
    const telegramSuccess = false; // Disabled for testing
    
    // if (telegramSuccess) {
    //   console.log('🎉 FUSAKA Telegram Bot is running and ready for /ask commands!');
    //   console.log('🔄 Bot will continue running in polling mode...');
    // } else {
    //   console.error('❌ Failed to start Telegram bot');
    // }

    // Start Twitter bot (if enabled)
    console.log('🐦 Starting FUSAKA Twitter Bot...');
    const twitterSuccess = await twitterClient.start();
    
    if (twitterSuccess) {
      console.log('🎉 FUSAKA Twitter Bot is running and ready for automated tweets!');
    } else {
      console.log('⚠️ Twitter bot not started (may be disabled or missing credentials)');
    }

    // Success if at least one bot started
    if (telegramSuccess || twitterSuccess) {
      console.log('🔄 FUSAKA AI is now running on all enabled platforms...');
    } else {
      console.error('❌ No bots started successfully');
      process.exit(1);
    }

    // Keep the process alive and handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Received SIGTERM, shutting down gracefully...');
      if (telegramClient && telegramClient.bot) {
        telegramClient.bot.stopPolling();
      }
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error starting bots:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Start the bots
startBots();