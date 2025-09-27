const TelegramBot = require('node-telegram-bot-api');
const GrokClient = require('./grokClient');
const PriceClient = require('./priceClient');
const IdeogramClient = require('./ideogramClient');
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
    this.ideogramClient = new IdeogramClient();
    
    // Initialize character reference images on startup
    this.initializeCharacterReferences();
    
    // Track organic responses to prevent spam
    this.recentResponses = new Map(); // chatId -> timestamp of last organic response
    this.responseCooldown = 30000; // 30 seconds between organic responses per chat
    
    this.setupBot();
    
    // Clean up old cooldown entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [chatId, timestamp] of this.recentResponses.entries()) {
        if (now - timestamp > this.responseCooldown * 2) {
          this.recentResponses.delete(chatId);
        }
      }
    }, 5 * 60 * 1000);
    
    console.log('🤖 FUSAKA Telegram Bot initialized in polling mode');
  }

  // Helper method to split long messages
  async sendLongMessage(chatId, message, options = {}) {
    const MAX_LENGTH = 4000; // Telegram's limit is 4096, use 4000 for safety
    
    // Clean message of any potential encoding issues
    const cleanMessage = message.replace(/[\u{80}-\u{10FFFF}]/gu, '').trim();
    
    if (cleanMessage.length <= MAX_LENGTH) {
      return await this.bot.sendMessage(chatId, cleanMessage, options);
    }
    
    // Split message into chunks at natural break points
    const chunks = [];
    let currentChunk = '';
    const sentences = cleanMessage.split(/(?<=[.!?])\s+/);
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length + 1 <= MAX_LENGTH) {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk.trim());
        
        // If single sentence is too long, split at word boundaries
        if (sentence.length > MAX_LENGTH) {
          const words = sentence.split(' ');
          let tempChunk = '';
          
          for (const word of words) {
            if (tempChunk.length + word.length + 1 <= MAX_LENGTH) {
              tempChunk += (tempChunk ? ' ' : '') + word;
            } else {
              if (tempChunk) chunks.push(tempChunk.trim());
              tempChunk = word;
            }
          }
          currentChunk = tempChunk;
        } else {
          currentChunk = sentence;
        }
      }
    }
    
    if (currentChunk) chunks.push(currentChunk.trim());
    
    // Send chunks with small delay between them
    for (let i = 0; i < chunks.length; i++) {
      const chunkOptions = i === 0 ? options : {}; // Only apply options to first message
      await this.bot.sendMessage(chatId, chunks[i], chunkOptions);
      
      // Small delay between chunks to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  setupBot() {
    // Set bot commands for the suggestion bar
    this.bot.setMyCommands([
      { command: 'ask', description: 'Ask FUSAKA AI about crypto, Ethereum, DeFi, and tech' },
      { command: 'fusaka', description: 'Get FUSAKA token price and contract info' },
      { command: 'price', description: 'Get real-time price data for any cryptocurrency' },
      { command: 'eth', description: 'Get Ethereum price with Fusaka upgrade insights' },
      { command: 'trending', description: 'See top trending cryptocurrencies' },
      { command: 'meme', description: '🎨 Generate crypto memes with AI (e.g., /meme vitalik happy)' }
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
        
        // Send the response (with chunking for long messages)
        await this.sendLongMessage(chatId, response, {
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

*Data from ${priceData.source || 'CoinGecko'}*`;

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

    // Handle /fusaka command (FUSAKA token info)
    this.bot.onText(/\/fusaka/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        await this.bot.sendChatAction(chatId, 'typing');
        
        const priceData = await this.priceClient.getPrice('fusaka');
        if (!priceData) {
          await this.bot.sendMessage(chatId, "❌ Unable to fetch FUSAKA token data right now.");
          return;
        }

        const fusakaComment = priceData.change24h >= 0 
          ? "FUSAKA is pumping! The Ethereum upgrade excitement is building! 🚀💎"
          : "Diamond hands! The Fusaka upgrade will change everything on Dec 3rd! 💎⚡";

        const message = `💎 **FUSAKA Token**

**Price:** ${this.priceClient.formatPrice(priceData.price)}
**24h Change:** ${this.priceClient.formatChange(priceData.change24h)}
**Market Cap:** ${this.priceClient.formatMarketCap(priceData.marketCap)}
**24h Volume:** ${this.priceClient.formatMarketCap(priceData.volume24h)}

**Contract:** \`0x7607546645655d4e93ea6839a55339263b3e4986\`
**Chain:** Ethereum
**Supply:** 420.69B FUSAKA

*${fusakaComment}*

*Data from ${priceData.source || 'CoinGecko'}*

💡 **Named after the revolutionary Ethereum upgrade!**`;

        await this.bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_to_message_id: msg.message_id
        });

      } catch (error) {
        console.error('❌ Error handling /fusaka command:', error);
        await this.bot.sendMessage(chatId, 
          "Sorry, having trouble fetching FUSAKA data right now! 💎",
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
          ? "Looking good! The Fusaka upgrade on Dec 3rd will make this even better. 🚀"
          : "Short-term price, long-term revolution. The Fusaka upgrade changes everything! 🔧";

        const message = `⚡ **Ethereum (ETH)**

**Price:** ${this.priceClient.formatPrice(priceData.price)}
**24h Change:** ${this.priceClient.formatChange(priceData.change24h)}
**Market Cap:** ${this.priceClient.formatMarketCap(priceData.marketCap)}

*${vitalikComment}*

*Data from ${priceData.source || 'CoinGecko'}*

💡 **Fusaka Upgrade coming Dec 3rd!** Check \`/price FUSAKA\` for our token!`;

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

*Data from ${sourceAPI}*

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
      const welcomeMessage = `Hello! I'm FUSAKAAI, your expert guide to Ethereum and blockchain technology! 🤖⚡

I represent the FUSAKA token community and I'm deeply trained in ALL things Ethereum - from building blockchains from scratch to the latest DeFi protocols. I can explain everything from EVM opcodes to Layer 2 mathematics, while celebrating our amazing memecoin named after the revolutionary Fusaka upgrade!

**What I can do:**
💬 \`/ask [question]\` - Discuss Fusaka upgrade, crypto, tech, DeFi, governance
💎 \`/fusaka\` - Get FUSAKA token price and contract info
💰 \`/price [symbol]\` - Get real-time crypto prices for any token
⚡ \`/eth\` - Quick Ethereum price check with upgrade insights
🔥 \`/trending\` - See what's trending in crypto
🎨 \`/meme [character] [situation]\` - Generate viral crypto memes!

**Examples:**
• \`/ask How does the EVM execute smart contracts?\`
• \`/ask Explain zero-knowledge proofs in detail\`
• \`/ask What are the best DeFi protocols right now?\`
• \`/meme vitalik celebrating\` - Generate Vitalik meme
• \`/meme wojak diamond hands\` - Create diamond hands meme
• \`/fusaka\` to check our token and contract details!

Join our community celebrating both cutting-edge tech AND the memecoin revolution! 🚀💎`;

      await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    });

    // Handle /meme command - AI meme generation
    this.bot.onText(/\/meme(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const memeInput = match?.[1]?.trim();
      const username = msg.from.username || msg.from.first_name || 'fren';
      
      try {
        if (!memeInput) {
          await this.bot.sendMessage(chatId, 
            "🎨 **Meme Generator Help**\n\n" +
            "**Usage:** `/meme [situation]`\n\n" +
            "**How it works:**\n" +
            "• 50% chance - Both FUSAKA characters together\n" +
            "• 32.5% chance - Main character solo\n" +
            "• 17.5% chance - Secondary character solo\n" +
            "• Automatic smart selection!\n\n" +
            "**Examples:**\n" +
            "• `/meme celebrating FUSAKA launch`\n" +
            "• `/meme diamond hands forever`\n" +
            "• `/meme rocket to the moon`\n" +
            "• `/meme happy about gains`\n" +
            "• `/meme hodling through the dip`",
            { 
              reply_to_message_id: msg.message_id,
              parse_mode: 'Markdown'
            }
          );
          return;
        }

        console.log(`🎨 /meme request from ${username}: "${memeInput}"`);
        
        // Send "generating" message
        const generatingMsg = await this.bot.sendMessage(chatId, 
          "🎨 Generating your meme... This might take 30-60 seconds! ⏳",
          { reply_to_message_id: msg.message_id }
        );

        // Use the entire input as situation, let AI choose characters automatically
        const situation = memeInput || 'crypto trading';

        // Generate meme with automatic weighted character selection
        const result = await this.ideogramClient.generateCharacterMeme(
          'random', // Always use weighted selection
          situation, 
          'FUSAKA and Ethereum'
        );

        if (result.success) {
          // Delete generating message
          await this.bot.deleteMessage(chatId, generatingMsg.message_id);
          
          // Send the meme
          await this.bot.sendPhoto(chatId, result.imageUrl, {
            caption: `💎 **${result.selectedCharacter} MEME**\n\n` +
                    `Situation: *${situation}*\n` +
                    `Generated by FUSAKAAI 🤖\n\n` +
                    `Prompt: \`${result.prompt}\``,
            parse_mode: 'Markdown',
            reply_to_message_id: msg.message_id
          });
          
          console.log(`✅ Meme sent to ${username}`);
        } else {
          throw new Error('Meme generation failed');
        }

      } catch (error) {
        console.error('❌ Error handling /meme command:', error);
        
        // Try to delete generating message if it exists
        try {
          if (generatingMsg) {
            await this.bot.deleteMessage(chatId, generatingMsg.message_id);
          }
        } catch (deleteError) {
          // Ignore delete errors
        }
        
        await this.bot.sendMessage(chatId, 
          "Sorry, I couldn't generate that meme right now! 😅\n\n" +
          "This could be because:\n" +
          "• The image generator is overloaded\n" +
          "• The prompt needs to be adjusted\n" +
          "• API limits reached\n\n" +
          "Try again in a few minutes or try a different character/situation! 🎨",
          { 
            reply_to_message_id: msg.message_id,
            parse_mode: 'Markdown'
          }
        );
      }
    });

    // Organic conversation - respond to FUSAKA/ETH mentions (2 out of 5 times)
    this.bot.on('message', async (msg) => {
      // Skip if it's a command or from a bot
      if (msg.text && !msg.text.startsWith('/') && !msg.from.is_bot) {
        const text = msg.text.toLowerCase();
        const chatId = msg.chat.id;
        const username = msg.from.username || msg.from.first_name || 'fren';
        
        // Check for FUSAKA or ETH mentions (case insensitive)
        const hasFusaka = /fusaka|fusaca|fusuka/i.test(msg.text);
        const hasEth = /\beth\b|\bethereum\b/i.test(msg.text);
        
        if (hasFusaka || hasEth) {
          // Check cooldown - don't spam responses
          const now = Date.now();
          const lastResponse = this.recentResponses.get(chatId) || 0;
          
          if (now - lastResponse < this.responseCooldown) {
            console.log(`⏰ Organic response on cooldown for chat ${chatId}`);
            return;
          }
          
          // 2 out of 5 chance (40% probability)
          const shouldRespond = Math.random() < 0.4;
          
          if (shouldRespond) {
            try {
              console.log(`💬 Organic response triggered for ${username}: "${msg.text.substring(0, 50)}..."`);
              
              // Record response time to enforce cooldown
              this.recentResponses.set(chatId, now);
              
              let context = '';
              if (hasFusaka) {
                context = 'FUSAKA token was mentioned';
              } else if (hasEth) {
                context = 'Ethereum was mentioned';
              }
              
              // Create a prompt for organic, engaging response
              const responsePrompt = `Someone mentioned ${context} in chat. Their message: "${msg.text}"

Respond naturally as FUSAKAAI with one of these approaches:
1. If they said something accurate - acknowledge and add insight
2. If they said something inaccurate - playfully correct them with facts  
3. If they're being overly bearish - counter with technical optimism
4. If they're being overly bullish - add some realistic perspective
5. If it's a simple mention - add relevant context or fun fact
6. If they're asking a question - answer helpfully but casually
7. If they're making a joke - play along with humor

Keep it conversational (1-3 sentences), engaging, and show your expertise. Use emojis appropriately. Don't be preachy - be like a knowledgeable friend joining the conversation. Sometimes be a bit cheeky or playful.

Current context: Today is ${new Date().toLocaleDateString('en-US')}`;

              const response = await this.grokClient.callGrok(responsePrompt);
              
              // Add a small delay to make it feel more natural (1-3 seconds)
              const delay = Math.random() * 2000 + 1000;
              await new Promise(resolve => setTimeout(resolve, delay));
              
              await this.sendLongMessage(chatId, response, { 
                reply_to_message_id: msg.message_id 
              });
              
            } catch (error) {
              console.error('❌ Error in organic response:', error);
              // Remove from cooldown if response failed
              this.recentResponses.delete(chatId);
              // Fail silently for organic responses - don't spam error messages
            }
          }
        }
      }
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

  // Initialize character reference images
  async initializeCharacterReferences() {
    try {
      console.log('📸 Initializing FUSAKA character reference images...');
      const success = await this.ideogramClient.uploadReferenceImages();
      if (success) {
        console.log('🎨 Character references ready for accurate meme generation!');
      } else {
        console.log('⚠️ Using text descriptions as fallback for meme generation');
      }
    } catch (error) {
      console.error('❌ Error initializing character references:', error.message);
      console.log('📝 Falling back to text-based character descriptions');
    }
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