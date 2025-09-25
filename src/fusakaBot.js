const cron = require('node-cron');
const TwitterClient = require('./twitterClient');
const TelegramClient = require('./telegramClient');
const GrokClient = require('./grokClient');
const { config, validateConfig } = require('../config/config');

class FusakaBot {
  constructor() {
    this.twitter = new TwitterClient();
    this.telegram = new TelegramClient();
    this.grok = new GrokClient();
    this.isRunning = false;
    this.lastMentionCheck = new Date();
    this.processedMentions = new Set();
    this.mentionCount = 0;
    this.hourlyReset = new Date();
    this.activePlatforms = [];
  }

  /**
   * Initialize and start the bot
   */
  async start() {
    try {
      console.log('🚀 Starting FUSAKA BOT...');
      
      // Validate configuration
      validateConfig();
      console.log('✅ Configuration validated');

      // Test API connections
      await this.testConnections();
      
      this.isRunning = true;
      console.log('🤖 FUSAKA BOT is now running!');

      // Start monitoring mentions
      if (config.bot.enableAutoReply) {
        this.startMentionMonitoring();
      }

      // Start scheduled tweet posting
      if (config.bot.enableScheduledTweets) {
        this.startScheduledTweets();
      }

      // Reset hourly counters
      this.startHourlyReset();

    } catch (error) {
      console.error('❌ Failed to start bot:', error.message);
      process.exit(1);
    }
  }

  /**
   * Test API connections and initialize platforms
   */
  async testConnections() {
    console.log('🔧 Testing API connections...');
    
    try {
      // Test Grok connection
      const grokWorking = await this.grok.testConnection();
      if (grokWorking) {
        console.log('✅ Grok API connection successful');
      } else {
        throw new Error('Grok API connection failed');
      }

      // Initialize Twitter if enabled
      if (config.twitter.apiKey) {
        try {
          const userInfo = await this.twitter.getUserByUsername(config.bot.username || 'twitter');
          console.log('✅ Twitter API connection successful');
          this.activePlatforms.push('twitter');
        } catch (error) {
          console.warn('⚠️ Twitter connection failed, continuing without Twitter:', error.message);
        }
      } else {
        console.log('ℹ️ Twitter credentials not provided, skipping Twitter integration');
      }

      // Initialize Telegram if enabled
      if (config.telegram.enabled && config.telegram.botToken) {
        try {
          const telegramWorking = await this.telegram.initialize();
          if (telegramWorking) {
            console.log('✅ Telegram API connection successful');
            this.activePlatforms.push('telegram');
            this.setupTelegramHandlers();
          }
        } catch (error) {
          console.warn('⚠️ Telegram connection failed, continuing without Telegram:', error.message);
        }
      } else {
        console.log('ℹ️ Telegram not enabled or token missing, skipping Telegram integration');
      }

      if (this.activePlatforms.length === 0) {
        throw new Error('No platforms successfully initialized');
      }

      console.log(`🎯 Active platforms: ${this.activePlatforms.join(', ')}`);
      
    } catch (error) {
      console.error('❌ API connection test failed:', error.message);
      throw error;
    }
  }

  /**
   * Setup Telegram message handlers
   */
  setupTelegramHandlers() {
    this.telegram.setupMessageHandlers(async (msg) => {
      try {
        const userMessage = msg.text;
        const chatId = msg.chat.id;
        const userName = msg.from.first_name || msg.from.username || 'friend';

        if (config.bot.debugMode) {
          console.log(`📱 Received Telegram message from ${userName}: ${userMessage}`);
        }

        // Generate AI response
        const aiResponse = await this.grok.generateResponse(
          `Telegram user ${userName} asks: ${userMessage}`,
          'telegram_chat'
        );

        if (aiResponse) {
          await this.telegram.sendMessage(chatId, aiResponse);
          console.log(`✅ Replied to ${userName} on Telegram`);
        } else {
          await this.telegram.sendMessage(chatId, 
            "Sorry, I'm having trouble thinking right now. Please try again in a moment! 🤔");
        }

      } catch (error) {
        console.error('Error handling Telegram message:', error);
        if (msg.chat.id) {
          await this.telegram.sendMessage(msg.chat.id, 
            "Oops! Something went wrong on my end. Please try again! 🔧");
        }
      }
    }, this.grok);
  }

  /**
   * Start monitoring mentions for auto-replies (Twitter only)
   */
  startMentionMonitoring() {
    if (!this.activePlatforms.includes('twitter')) {
      console.log('ℹ️ Twitter not active, skipping mention monitoring');
      return;
    }

    console.log('👂 Starting Twitter mention monitoring...');
    
    // Check for mentions every 5 minutes to respect Basic API limits
    cron.schedule('*/5 * * * *', async () => {
      if (!this.isRunning) return;
      
      try {
        await this.checkAndReplyToMentions();
      } catch (error) {
        console.error('Error in mention monitoring:', error);
      }
    });
  }

  /**
   * Start scheduled tweet posting (Twitter only)
   */
  startScheduledTweets() {
    if (!this.activePlatforms.includes('twitter')) {
      console.log('ℹ️ Twitter not active, skipping scheduled tweets');
      return;
    }

    console.log('📅 Starting scheduled tweets...');
    
    // Post a tweet every configured interval
    cron.schedule(`*/${config.bot.tweetInterval} * * * *`, async () => {
      if (!this.isRunning) return;
      
      try {
        await this.postScheduledTweet();
      } catch (error) {
        console.error('Error posting scheduled tweet:', error);
      }
    });
  }

  /**
   * Reset hourly counters
   */
  startHourlyReset() {
    cron.schedule('0 * * * *', () => {
      this.mentionCount = 0;
      this.hourlyReset = new Date();
      console.log('🔄 Hourly counters reset');
    });
  }

  /**
   * Check for mentions and reply to them
   */
  async checkAndReplyToMentions() {
    if (this.mentionCount >= config.bot.maxMentionsPerHour) {
      if (config.bot.debugMode) {
        console.log('⏸️ Mention limit reached for this hour');
      }
      return;
    }

    try {
      const mentions = await this.twitter.getMentions(10);
      
      for (const mention of mentions) {
        // Skip if already processed
        if (this.processedMentions.has(mention.id)) {
          continue;
        }

        // Skip if older than our last check (avoid processing old mentions on startup)
        const mentionDate = new Date(mention.created_at);
        if (mentionDate < this.lastMentionCheck) {
          continue;
        }

        // Check rate limit
        if (this.mentionCount >= config.bot.maxMentionsPerHour) {
          break;
        }

        await this.replyToMention(mention);
        this.processedMentions.add(mention.id);
        this.mentionCount++;

        // Add delay between replies to avoid rate limiting
        await this.delay(5000); // 5 second delay
      }

      this.lastMentionCheck = new Date();
      
    } catch (error) {
      console.error('Error checking mentions:', error);
    }
  }

  /**
   * Reply to a specific mention
   * @param {Object} mention - The mention object
   */
  async replyToMention(mention) {
    try {
      const authorUsername = mention.author_id; // Note: You might need to expand this to get actual username
      const tweetText = mention.text;

      if (config.bot.debugMode) {
        console.log(`💬 Replying to mention: ${tweetText}`);
      }

      // Generate reply using Grok
      const reply = await this.grok.generateReply(tweetText, authorUsername);
      
      // Post the reply
      await this.twitter.replyToTweet(reply, mention.id);
      
      console.log(`✅ Replied to mention from ${authorUsername}`);
      
    } catch (error) {
      console.error('Error replying to mention:', error);
    }
  }

  /**
   * Post a scheduled tweet
   */
  async postScheduledTweet() {
    try {
      console.log('📝 Generating scheduled tweet...');
      
      // Get trending topics for inspiration
      const trends = await this.twitter.getTrends();
      
      // Generate tweet content
      const tweetContent = await this.grok.generateTweet(trends.slice(0, 3));
      
      // Post the tweet
      const response = await this.twitter.postTweet(tweetContent);
      
      console.log(`✅ Posted scheduled tweet: ${tweetContent}`);
      
    } catch (error) {
      console.error('Error posting scheduled tweet:', error);
    }
  }

  /**
   * Manually post a tweet
   * @param {string} content - Tweet content
   * @returns {Promise<Object>} Tweet response
   */
  async tweet(content) {
    try {
      const response = await this.twitter.postTweet(content);
      console.log(`✅ Manual tweet posted: ${content}`);
      return response;
    } catch (error) {
      console.error('Error posting manual tweet:', error);
      throw error;
    }
  }

  /**
   * Get bot statistics
   * @returns {Object} Bot stats
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      processedMentions: this.processedMentions.size,
      mentionCountThisHour: this.mentionCount,
      lastMentionCheck: this.lastMentionCheck,
      hourlyResetTime: this.hourlyReset,
      config: {
        autoReplyEnabled: config.bot.enableAutoReply,
        scheduledTweetsEnabled: config.bot.enableScheduledTweets,
        tweetInterval: config.bot.tweetInterval,
        maxMentionsPerHour: config.bot.maxMentionsPerHour,
      }
    };
  }

  /**
   * Stop the bot
   */
  stop() {
    this.isRunning = false;
    console.log('🛑 FUSAKA BOT stopped');
  }

  /**
   * Utility function to add delays
   * @param {number} ms - Milliseconds to wait
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = FusakaBot;