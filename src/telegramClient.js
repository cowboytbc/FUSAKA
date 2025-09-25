const TelegramBot = require('node-telegram-bot-api');
const GrokClient = require('./grokClient');
require('dotenv').config();

class TelegramClient {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.botUsername = process.env.BOT_USERNAME || 'fusakaai';
    
    if (!this.token) {
      console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
      process.exit(1);
    }

    // Initialize bot with polling for background worker
    this.bot = new TelegramBot(this.token, { 
      polling: true,
      request: {
        agentOptions: {
          keepAlive: true,
          family: 4
        }
      }
    });
    
    this.grokClient = new GrokClient();
    this.setupBot();
    
    console.log('🤖 FUSAKA Telegram Bot initialized in polling mode');
  }

  setupBot() {
    // Set bot commands for the suggestion bar
    this.bot.setMyCommands([
      { command: 'ask', description: 'Ask Vitalik anything about crypto, Ethereum, or technology' }
    ]).catch(console.error);

    // Handle /ask command
    this.bot.onText(/\/ask (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const question = match[1];
      const userId = msg.from.id;
      const username = msg.from.username || msg.from.first_name || 'Anonymous';
      
      console.log(`📨 Question from @${username} (${userId}): ${question}`);
      
      try {
        // Send typing indicator
        await this.bot.sendChatAction(chatId, 'typing');
        
        // Generate response using Grok with Vitalik personality
        const response = await this.grokClient.generateResponse(question, 'telegram');
        
        // Send the response
        await this.bot.sendMessage(chatId, response, {
          parse_mode: 'Markdown',
          reply_to_message_id: msg.message_id
        });
        
        console.log(`✅ Response sent to @${username}`);
        
      } catch (error) {
        console.error('❌ Error handling /ask command:', error);
        await this.bot.sendMessage(chatId, 
          "Sorry, I'm having some technical difficulties! As Vitalik would say, even decentralized systems have bugs sometimes. 😅 Please try again!", 
          { reply_to_message_id: msg.message_id }
        );
      }
    });

    // Handle /start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `Hello! I'm FUSAKA AI, embodying the thoughts and perspectives of Vitalik Buterin! 🤖⚡

I can discuss:
• Ethereum and blockchain technology
• Cryptocurrency and DeFi
• Programming and computer science  
• Economics and governance
• Philosophy and coordination problems
• And much more!

Just use: \`/ask [your question]\`

Example: \`/ask What do you think about the future of decentralized governance?\`

Let's explore the fascinating world of crypto together! 🚀`;

      await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    });

    // Handle errors
    this.bot.on('error', (error) => {
      console.error('❌ Telegram Bot Error:', error);
    });

    // Handle polling errors
    this.bot.on('polling_error', (error) => {
      console.error('❌ Polling Error:', error);
    });

    console.log('✅ Telegram bot commands and handlers set up');
  }

  async testConnection() {
    try {
      const me = await this.bot.getMe();
      console.log('✅ Telegram Bot Connected:', me.username);
      return true;
    } catch (error) {
      console.error('❌ Telegram connection failed:', error.message);
      return false;
    }
  }
}

// Start the bot if this file is run directly
if (require.main === module) {
  console.log('🚀 Starting FUSAKA Telegram Bot...');
  
  const telegramClient = new TelegramClient();
  
  // Test connection
  telegramClient.testConnection().then(success => {
    if (success) {
      console.log('🎉 FUSAKA Telegram Bot is running and ready for /ask commands!');
    } else {
      console.error('❌ Failed to start bot');
      process.exit(1);
    }
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('🛑 Shutting down FUSAKA Telegram Bot...');
    telegramClient.bot.stopPolling();
    process.exit(0);
  });
}

module.exports = TelegramClient;