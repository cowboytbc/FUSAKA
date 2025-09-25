const TelegramBot = require('node-telegram-bot-api');
const { config } = require('../config/config');

class TelegramClient {
  constructor() {
    this.bot = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the Telegram bot
   */
  async initialize() {
    if (!config.telegram.botToken) {
      console.log('⚠️ Telegram bot token not provided, skipping Telegram integration');
      return false;
    }

    try {
      // Create bot instance with webhook support for Render
      this.bot = new TelegramBot(config.telegram.botToken, { 
        webHook: {
          port: config.server.port || 3000,
          host: '0.0.0.0'
        }
      });

      // Set webhook if URL is provided (for Render deployment)
      if (config.telegram.webhookUrl) {
        await this.bot.setWebHook(`${config.telegram.webhookUrl}/bot${config.telegram.botToken}`);
        console.log('✅ Telegram webhook set for Render deployment');
      }

      // Set bot commands for the suggestion bar
      await this.bot.setMyCommands([
        {
          command: 'ask',
          description: 'Ask me anything about Ethereum, DeFi, or crypto!'
        }
      ]);

      this.isInitialized = true;
      console.log('✅ Telegram bot initialized successfully');
      console.log('✅ Bot commands set for suggestion bar');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Telegram bot:', error);
      return false;
    }
  }

  /**
   * Set up message handlers
   * @param {Function} messageHandler - Function to handle incoming messages
   * @param {Object} grokClient - Grok client for AI responses
   */
  setupMessageHandlers(messageHandler, grokClient) {
    if (!this.isInitialized) return;
    
    this.grok = grokClient; // Store reference to Grok client

    // Handle text messages (non-commands)
    this.bot.on('message', async (msg) => {
      if (msg.text && !msg.text.startsWith('/')) {
        await messageHandler(msg);
      }
    });

    // Handle /ask command
    this.bot.onText(/\/ask (.+)/, async (msg, match) => {
      const userQuestion = match[1]; // Extract the question after /ask
      const chatId = msg.chat.id;
      const userName = msg.from.first_name || msg.from.username || 'friend';

      if (config.bot.debugMode) {
        console.log(`📱 Received /ask from ${userName}: ${userQuestion}`);
      }

      // Generate AI response using the question
      const aiResponse = await this.grok.generateResponse(
        `Telegram user ${userName} asks: ${userQuestion}`,
        'telegram_chat'
      );

      if (aiResponse) {
        await this.sendMessage(chatId, aiResponse);
        console.log(`✅ Answered ${userName}'s question on Telegram`);
      } else {
        await this.sendMessage(chatId, 
          "Sorry, I'm having trouble thinking right now. Please try again in a moment! 🤔");
      }
    });

    // Handle /ask without question
    this.bot.onText(/^\/ask$/, async (msg) => {
      const helpMessage = `🤖 **How to use /ask:**

Type your question after the command like this:
\`/ask What is Ethereum?\`
\`/ask How do smart contracts work?\`
\`/ask What's the latest on Layer 2s?\`

I'm here to help with all things Ethereum and crypto! 🚀`;

      await this.sendMessage(msg.chat.id, helpMessage);
    });

    console.log('✅ Telegram message handlers set up');
  }

  /**
   * Send a message to a chat
   * @param {number} chatId - Chat ID to send message to
   * @param {string} text - Message text
   * @param {Object} options - Additional options
   */
  async sendMessage(chatId, text, options = {}) {
    if (!this.isInitialized) return null;

    try {
      const response = await this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...options
      });

      if (config.bot.debugMode) {
        console.log(`📱 Sent Telegram message to ${chatId}`);
      }

      return response;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return null;
    }
  }

  /**
   * Get bot information
   */
  async getBotInfo() {
    if (!this.isInitialized) return null;

    try {
      return await this.bot.getMe();
    } catch (error) {
      console.error('Error getting bot info:', error);
      return null;
    }
  }

  /**
   * Stop the bot
   */
  async stop() {
    if (this.isInitialized && this.bot) {
      await this.bot.stopPolling();
      console.log('🛑 Telegram bot stopped');
    }
  }
}

module.exports = TelegramClient;