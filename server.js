const express = require('express');
const { config } = require('./config/config');
const FusakaBot = require('./src/fusakaBot');

const app = express();
app.use(express.json());

// Initialize the bot
const bot = new FusakaBot();

// Health check endpoint for Render
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'FUSAKA Bot is running!',
    platforms: bot.activePlatforms || [],
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    platforms: bot.activePlatforms || []
  });
});

// Webhook endpoint for Telegram (if using webhooks)
app.post(`/bot${config.telegram.botToken}`, (req, res) => {
  if (bot.telegram && bot.telegram.bot) {
    bot.telegram.bot.processUpdate(req.body);
  }
  res.sendStatus(200);
});

// Start the server and bot
const PORT = config.server.port || 3000;

async function startServer() {
  try {
    // Start the bot
    await bot.start();
    
    // Start the Express server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`🎯 Environment: ${config.server.nodeEnv}`);
      
      if (config.server.nodeEnv === 'production') {
        console.log('✅ Production mode - using webhooks for Telegram');
      } else {
        console.log('🔧 Development mode - using polling for Telegram');
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  if (bot.telegram) {
    await bot.telegram.stop();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  if (bot.telegram) {
    await bot.telegram.stop();
  }
  process.exit(0);
});

startServer();