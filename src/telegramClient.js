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

  setupBot() {
    // Set bot commands for the suggestion bar
    this.bot.setMyCommands([
      { command: 'ask', description: 'Ask FUSAKA AI about crypto, Ethereum, DeFi, and tech' },
      { command: 'fusaka', description: 'Get FUSAKA token price and contract info' },
      { command: 'price', description: 'Get real-time price data for any cryptocurrency' },
      { command: 'eth', description: 'Get Ethereum price with Fusaka upgrade insights' },
      { command: 'trending', description: 'See top trending cryptocurrencies' },
      { command: 'explain', description: 'Get detailed explanations of blockchain concepts' },
      { command: 'gas', description: 'Check current Ethereum gas prices and optimization tips' },
      { command: 'defi', description: 'Get DeFi protocol information and yield opportunities' },
      { command: 'security', description: 'Learn about smart contract security best practices' },
      { command: 'help', description: 'Get help with using FUSAKAAI commands' }
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
          ? "FUSAKA is pumping! The Ethereum upgrade excitement is building! 🚀🎭"
          : "Diamond hands! The Fusaka upgrade will change everything on Dec 3rd! 💎⚡";

        const message = `🎭 **FUSAKA Token**

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
          "Sorry, having trouble fetching FUSAKA data right now! 🎭",
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
🎭 \`/fusaka\` - Get FUSAKA token price and contract info
💰 \`/price [symbol]\` - Get real-time crypto prices for any token
⚡ \`/eth\` - Quick Ethereum price check with upgrade insights
🔥 \`/trending\` - See what's trending in crypto
📚 \`/explain [concept]\` - Deep technical explanations
⛽ \`/gas\` - Gas prices and optimization tips
🏦 \`/defi [protocol]\` - DeFi analysis and yields
🛡️ \`/security [topic]\` - Smart contract security
❓ \`/help\` - Full command guide

**Examples:**
• \`/ask How does the EVM execute smart contracts?\`
• \`/explain zero-knowledge proofs\`
• \`/defi uniswap\` - Analyze Uniswap protocol
• \`/security reentrancy\` - Learn about reentrancy attacks
• \`/gas\` - Check current gas situation
• \`/ask What's the math behind zk-rollups?\`

Join our community celebrating both cutting-edge tech AND the memecoin revolution! 🚀🎭`;

      await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    });

    // Handle /explain command - Deep blockchain concept explanations
    this.bot.onText(/\/explain (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const concept = match[1];
      
      try {
        console.log(`📚 /explain request for: ${concept}`);
        const explanation = await this.grokClient.callGrok(
          `Explain "${concept}" in blockchain/Ethereum context with technical depth, examples, and practical applications. Be comprehensive but accessible.`
        );
        
        await this.bot.sendMessage(chatId, explanation, { 
          reply_to_message_id: msg.message_id,
          parse_mode: 'Markdown'
        });
      } catch (error) {
        console.error('❌ Error handling /explain command:', error);
        await this.bot.sendMessage(chatId, 
          "Sorry, I had trouble explaining that concept. Try rephrasing or ask about Ethereum, DeFi, smart contracts, or consensus mechanisms! 📚",
          { reply_to_message_id: msg.message_id }
        );
      }
    });

    // Handle /gas command - Ethereum gas prices and optimization
    this.bot.onText(/\/gas/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        console.log('⛽ /gas request');
        const gasInfo = await this.grokClient.callGrok(
          `Provide current Ethereum gas situation, optimization tips, and when to transact. Include Layer 2 alternatives and practical advice.`
        );
        
        await this.bot.sendMessage(chatId, gasInfo, { 
          reply_to_message_id: msg.message_id,
          parse_mode: 'Markdown'
        });
      } catch (error) {
        console.error('❌ Error handling /gas command:', error);
        await this.bot.sendMessage(chatId, 
          "Sorry, can't fetch gas data right now! Use Layer 2s like Arbitrum, Optimism, or Polygon for cheaper transactions! ⛽",
          { reply_to_message_id: msg.message_id }
        );
      }
    });

    // Handle /defi command - DeFi protocols and opportunities
    this.bot.onText(/\/defi(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const protocol = match?.[1] || '';
      
      try {
        console.log(`🏦 /defi request${protocol ? ' for: ' + protocol : ''}`);
        const defiInfo = await this.grokClient.callGrok(
          protocol 
            ? `Analyze the DeFi protocol "${protocol}" - how it works, risks, yields, tokenomics, and recent developments.`
            : `Overview of current DeFi landscape: top protocols, yield opportunities, risks, and trends. Focus on Ethereum ecosystem.`
        );
        
        await this.bot.sendMessage(chatId, defiInfo, { 
          reply_to_message_id: msg.message_id,
          parse_mode: 'Markdown'
        });
      } catch (error) {
        console.error('❌ Error handling /defi command:', error);
        await this.bot.sendMessage(chatId, 
          "Sorry, can't fetch DeFi data right now! Try asking about specific protocols like Uniswap, Aave, or Compound! 🏦",
          { reply_to_message_id: msg.message_id }
        );
      }
    });

    // Handle /security command - Smart contract security
    this.bot.onText(/\/security(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const topic = match?.[1] || '';
      
      try {
        console.log(`🛡️ /security request${topic ? ' for: ' + topic : ''}`);
        const securityInfo = await this.grokClient.callGrok(
          topic 
            ? `Explain smart contract security topic: "${topic}" - vulnerabilities, mitigation strategies, and best practices.`
            : `Smart contract security overview: common vulnerabilities, audit practices, development best practices, and security tools.`
        );
        
        await this.bot.sendMessage(chatId, securityInfo, { 
          reply_to_message_id: msg.message_id,
          parse_mode: 'Markdown'
        });
      } catch (error) {
        console.error('❌ Error handling /security command:', error);
        await this.bot.sendMessage(chatId, 
          "Sorry, can't fetch security info right now! Always audit your contracts and follow best practices! 🛡️",
          { reply_to_message_id: msg.message_id }
        );
      }
    });

    // Handle /help command - Comprehensive help
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      
      const helpMessage = `🤖 **FUSAKAAI Command Guide**

**Core Commands:**
• \`/ask [question]\` - Ask anything about Ethereum, crypto, DeFi, governance
• \`/fusaka\` - FUSAKA token info and contract details
• \`/price [symbol]\` - Real-time crypto prices
• \`/eth\` - Ethereum price with upgrade insights

**Advanced Features:**
• \`/explain [concept]\` - Deep technical explanations
• \`/gas\` - Current gas prices and optimization tips
• \`/defi [protocol]\` - DeFi protocol analysis and yields
• \`/security [topic]\` - Smart contract security guidance
• \`/trending\` - Top trending cryptocurrencies

**Example Questions:**
• "How does MEV work and how can I protect against it?"
• "Explain zero-knowledge proofs in simple terms"
• "What are the trade-offs between different Layer 2 solutions?"
• "How would you build a yield farming strategy?"
• "What security considerations are important for DeFi protocols?"

**I'm trained on:**
🔹 EVM internals & assembly language
🔹 Consensus mechanisms & validator economics  
🔹 Layer 2 scaling & ZK-rollup mathematics
🔹 DeFi protocols & yield strategies
🔹 Smart contract security & auditing
🔹 MEV, gas optimization, and performance
🔹 Cross-chain bridges & interoperability
🔹 Governance mechanisms & DAO structures
🔹 Current ecosystem developments

Ready to dive deep into any blockchain topic! 🚀`;

      await this.bot.sendMessage(chatId, helpMessage, { 
        reply_to_message_id: msg.message_id,
        parse_mode: 'Markdown'
      });
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
              
              await this.bot.sendMessage(chatId, response, { 
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