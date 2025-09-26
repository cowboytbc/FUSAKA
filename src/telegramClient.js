const TelegramBot = require('node-telegram-bot-api');
const GrokClient = require('./grokClient');
const PriceClient = require('./priceClient');
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
    this.priceClient = new PriceClient();
    this.setupBot();
    
    console.log('🤖 FUSAKA Telegram Bot initialized in polling mode');
  }

  setupBot() {
    // Set bot commands for the suggestion bar
    this.bot.setMyCommands([
      { command: 'ask', description: 'Ask Vitalik anything about crypto, Ethereum, or technology' },
      { command: 'price', description: 'Get real-time price data for any cryptocurrency' },
      { command: 'eth', description: 'Get Ethereum price and market data' },
      { command: 'trending', description: 'See top trending cryptocurrencies' }
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

    // Handle /price command
    this.bot.onText(/\/price (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const symbol = match[1].trim();
      
      try {
        await this.bot.sendChatAction(chatId, 'typing');
        
        // First try to get the coin ID
        const coinId = this.priceClient.getCoinId(symbol);
        const priceData = await this.priceClient.getPrice(coinId);
        
        if (!priceData) {
          // Try searching for the coin
          const searchResults = await this.priceClient.searchCoin(symbol);
          if (searchResults && searchResults.length > 0) {
            const suggestions = searchResults.map(coin => 
              `• ${coin.name} (${coin.symbol})`
            ).join('\n');
            
            await this.bot.sendMessage(chatId, 
              `🔍 Couldn't find "${symbol}". Did you mean:\n\n${suggestions}\n\nTry: \`/price ${searchResults[0].symbol}\``,
              { parse_mode: 'Markdown', reply_to_message_id: msg.message_id }
            );
          } else {
            await this.bot.sendMessage(chatId, 
              `❌ Sorry, I couldn't find price data for "${symbol}". Try a different symbol or name.`,
              { reply_to_message_id: msg.message_id }
            );
          }
          return;
        }

        const message = `💰 **${symbol.toUpperCase()} Price Data**

**Price:** ${this.priceClient.formatPrice(priceData.price)}
**24h Change:** ${this.priceClient.formatChange(priceData.change24h)}
**Market Cap:** ${this.priceClient.formatMarketCap(priceData.marketCap)}
**24h Volume:** ${this.priceClient.formatMarketCap(priceData.volume24h)}

*Data from ${priceData.source || 'API'} • Multi-API Failover System*`;

        await this.bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_to_message_id: msg.message_id
        });

      } catch (error) {
        console.error('❌ Error handling /price command:', error);
        await this.bot.sendMessage(chatId, 
          "Sorry, I'm having trouble fetching price data right now. Please try again in a moment! 📊",
          { reply_to_message_id: msg.message_id }
        );
      }
    });

    // Handle /eth command (quick Ethereum price)
    this.bot.onText(/\/eth/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        await this.bot.sendChatAction(chatId, 'typing');
        
        const priceData = await this.priceClient.getPrice('ethereum');
        if (!priceData) {
          await this.bot.sendMessage(chatId, "❌ Unable to fetch Ethereum price data right now.");
          return;
        }

        const vitalikComment = priceData.change24h >= 0 
          ? "Looking good! The network effect continues to grow. 🚀"
          : "Just a short-term fluctuation. Focus on the technology, not the price action. 🔧";

        const message = `⚡ **Ethereum (ETH)**

**Price:** ${this.priceClient.formatPrice(priceData.price)}
**24h Change:** ${this.priceClient.formatChange(priceData.change24h)}
**Market Cap:** ${this.priceClient.formatMarketCap(priceData.marketCap)}

*${vitalikComment}*

*Data from ${priceData.source || 'API'} • Multi-API System*

Want to discuss Ethereum's tech? Use \`/ask\`!`;

        await this.bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_to_message_id: msg.message_id
        });

      } catch (error) {
        console.error('❌ Error handling /eth command:', error);
        await this.bot.sendMessage(chatId, 
          "Sorry, having trouble with the price oracle right now! ⚡",
          { reply_to_message_id: msg.message_id }
        );
      }
    });

    // Handle /trending command
    this.bot.onText(/\/trending/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        await this.bot.sendChatAction(chatId, 'typing');
        
        const trending = await this.priceClient.getTrending();
        if (!trending || trending.length === 0) {
          await this.bot.sendMessage(chatId, "❌ Unable to fetch trending data right now.");
          return;
        }

        const trendingList = trending.map((coin, index) => 
          `${index + 1}. **${coin.name}** (${coin.symbol})`
        ).join('\n');

        const sourceAPI = trending[0]?.source || 'API';
        const message = `🔥 **Trending Cryptocurrencies**

${trendingList}

*Data from ${sourceAPI} • Multi-API System*

Use \`/price [symbol]\` to get detailed data!`;

        await this.bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_to_message_id: msg.message_id
        });

      } catch (error) {
        console.error('❌ Error handling /trending command:', error);
        await this.bot.sendMessage(chatId, 
          "Sorry, can't fetch trending data right now! 📈",
          { reply_to_message_id: msg.message_id }
        );
      }
    });

    // Handle /start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `Hello! I'm FUSAKA AI, embodying the thoughts and perspectives of Vitalik Buterin! 🤖⚡

**What I can do:**
💬 \`/ask [question]\` - Ask me anything about crypto, tech, philosophy
💰 \`/price [symbol]\` - Get real-time crypto prices
⚡ \`/eth\` - Quick Ethereum price check
🔥 \`/trending\` - See what's trending in crypto

**Examples:**
• \`/ask What's your vision for Ethereum 2030?\`
• \`/price BTC\` or \`/price bitcoin\`
• \`/eth\` for instant ETH data

Let's explore the fascinating world of crypto and technology together! 🚀`;

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