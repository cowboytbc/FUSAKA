const { TwitterApi } = require('twitter-api-v2');
const GrokClient = require('./grokClient');
const PriceClient = require('./priceClient');
const IdeogramClient = require('./ideogramClient');

class TwitterClient {
  constructor() {
    // Initialize Twitter API client
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    this.readWriteClient = this.client.readWrite;
    this.username = process.env.TWITTER_USERNAME || 'fusakaai';
    
    // Initialize shared clients
    this.grokClient = new GrokClient();
    this.priceClient = new PriceClient();
    this.ideogramClient = new IdeogramClient();

    // Configuration from environment
    this.config = {
      enabled: process.env.TWITTER_ENABLED === 'true',
      autoTweetInterval: parseInt(process.env.TWITTER_AUTO_TWEET_INTERVAL) || 240, // minutes
      replyToMentions: process.env.TWITTER_REPLY_TO_MENTIONS === 'true',
      autoMemeTweets: process.env.TWITTER_AUTO_MEME_TWEETS === 'true',
      priceUpdates: process.env.TWITTER_PRICE_UPDATES === 'true',
      marketUpdates: process.env.TWITTER_MARKET_UPDATES === 'true'
    };

    console.log('🐦 Twitter client initialized');
    console.log('📊 Config:', this.config);
  }

  async start() {
    if (!this.config.enabled) {
      console.log('🐦 Twitter bot disabled via environment variable');
      return;
    }

    try {
      // Test connection
      const me = await this.readWriteClient.currentUser();
      console.log(`🐦 Connected to Twitter as @${me.data.username}`);

      // Initialize character references
      await this.ideogramClient.initializeCharacterReferences();

      // Start automated features
      this.startAutomatedTweets();
      this.startMentionMonitoring();

      console.log('🐦 Twitter bot started successfully!');
      return true;
    } catch (error) {
      console.error('❌ Failed to start Twitter bot:', error);
      return false;
    }
  }

  // Automated tweet scheduler
  startAutomatedTweets() {
    if (!this.config.autoMemeTweets && !this.config.priceUpdates) return;

    const intervalMs = this.config.autoTweetInterval * 60 * 1000;
    
    setInterval(async () => {
      try {
        const rand = Math.random();
        
        if (rand < 0.4 && this.config.autoMemeTweets) {
          // 40% chance: Post meme
          await this.postAutomaticMeme();
        } else if (rand < 0.7 && this.config.priceUpdates) {
          // 30% chance: Price update
          await this.postPriceUpdate();
        } else if (this.config.marketUpdates) {
          // 30% chance: Market insight
          await this.postMarketInsight();
        }
      } catch (error) {
        console.error('❌ Error in automated tweet:', error);
      }
    }, intervalMs);

    console.log(`⏰ Automated tweets every ${this.config.autoTweetInterval} minutes`);
  }

  // Monitor mentions and reply
  startMentionMonitoring() {
    if (!this.config.replyToMentions) return;

    // Check mentions every 2 minutes
    setInterval(async () => {
      try {
        await this.checkAndReplyToMentions();
      } catch (error) {
        console.error('❌ Error checking mentions:', error);
      }
    }, 2 * 60 * 1000);

    console.log('👂 Mention monitoring started');
  }

  async postAutomaticMeme() {
    try {
      const memePrompts = [
        'diamond hands during market dip',
        'hodling through volatility',
        'when ethereum pumps',
        'buying the dip',
        'to the moon',
        'crypto winter survivor',
        'defi yields farming',
        'nft trading vibes',
        'blockchain technology',
        'decentralized future'
      ];

      const randomPrompt = memePrompts[Math.floor(Math.random() * memePrompts.length)];
      console.log(`🎨 Generating automatic meme: ${randomPrompt}`);

      const memeResult = await this.ideogramClient.generateCharacterMeme('random', randomPrompt, 'crypto');
      
      if (memeResult.success) {
        // Download image and post
        const response = await fetch(memeResult.imageUrl);
        const buffer = await response.buffer();

        const mediaId = await this.readWriteClient.v1.uploadMedia(buffer, { 
          mimeType: 'image/jpeg' 
        });

        const cryptoHashtags = ['#FUSAKA', '#Ethereum', '#Crypto', '#DeFi', '#Blockchain'];
        const randomHashtags = cryptoHashtags.slice(0, 3).join(' ');

        await this.readWriteClient.v2.tweet({
          text: `${randomHashtags}\n\n💎 ${randomPrompt} 💎`,
          media: { media_ids: [mediaId] }
        });

        console.log('✅ Posted automatic meme to Twitter');
      }
    } catch (error) {
      console.error('❌ Error posting automatic meme:', error);
    }
  }

  async postPriceUpdate() {
    try {
      const ethPrice = await this.priceClient.getPrice('ethereum');
      
      if (ethPrice.success) {
        const priceText = `🚀 $ETH Price Update\n\n💰 $${ethPrice.price}\n📈 ${ethPrice.change24h}% (24h)\n📊 Market Cap: $${ethPrice.marketCap}\n\n#Ethereum #ETH #Crypto #FUSAKA`;
        
        await this.readWriteClient.v2.tweet({ text: priceText });
        console.log('✅ Posted price update to Twitter');
      }
    } catch (error) {
      console.error('❌ Error posting price update:', error);
    }
  }

  async postMarketInsight() {
    try {
      const ethPrice = await this.priceClient.getPrice('ethereum');
      
      if (ethPrice.success) {
        const prompt = `Generate a short, insightful tweet about Ethereum at $${ethPrice.price} with ${ethPrice.change24h}% 24h change. Be bullish but analytical. Include crypto Twitter vibes. Max 240 characters.`;
        
        const insight = await this.grokClient.generateResponse(prompt);
        const tweetText = `${insight}\n\n#Ethereum #FUSAKA #Crypto`;
        
        if (tweetText.length <= 280) {
          await this.readWriteClient.v2.tweet({ text: tweetText });
          console.log('✅ Posted market insight to Twitter');
        }
      }
    } catch (error) {
      console.error('❌ Error posting market insight:', error);
    }
  }

  async checkAndReplyToMentions() {
    try {
      // Get recent mentions (last 15 minutes)
      const mentions = await this.readWriteClient.v2.userMentionTimeline(
        process.env.TWITTER_USER_ID,
        { 
          max_results: 5,
          'tweet.fields': ['created_at', 'author_id', 'text']
        }
      );

      if (!mentions.data) return;

      for (const mention of mentions.data) {
        // Skip if older than 15 minutes
        const mentionTime = new Date(mention.created_at);
        const now = new Date();
        const diffMinutes = (now - mentionTime) / (1000 * 60);
        
        if (diffMinutes > 15) continue;

        // Generate AI response
        const prompt = `Someone mentioned @${this.username} on Twitter saying: "${mention.text}"\n\nReply as FUSAKAAI with crypto enthusiasm. Be helpful, engaging, and use emojis. Keep it under 240 characters.`;
        
        const response = await this.grokClient.generateResponse(prompt);
        
        await this.readWriteClient.v2.reply(response, mention.id);
        console.log(`✅ Replied to mention from ${mention.author_id}`);
        
        // Rate limit: wait between replies
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error('❌ Error handling mentions:', error);
    }
  }

  // Manual tweet with meme
  async tweetWithMeme(text, situation = '') {
    try {
      const memeResult = await this.ideogramClient.generateCharacterMeme('random', situation || text, 'crypto');
      
      if (memeResult.success) {
        const response = await fetch(memeResult.imageUrl);
        const buffer = await response.buffer();

        const mediaId = await this.readWriteClient.v1.uploadMedia(buffer, { 
          mimeType: 'image/jpeg' 
        });

        const result = await this.readWriteClient.v2.tweet({
          text: text,
          media: { media_ids: [mediaId] }
        });

        console.log('✅ Tweet with meme posted successfully');
        return result;
      }
    } catch (error) {
      console.error('❌ Error tweeting with meme:', error);
      throw error;
    }
  }

  // Simple text tweet
  async tweet(text) {
    try {
      const result = await this.readWriteClient.v2.tweet({ text });
      console.log('✅ Tweet posted successfully');
      return result;
    } catch (error) {
      console.error('❌ Error posting tweet:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const me = await this.readWriteClient.currentUser();
      console.log(`✅ Twitter connection test successful: @${me.data.username}`);
      return true;
    } catch (error) {
      console.error('❌ Twitter connection test failed:', error);
      return false;
    }
  }
}

module.exports = TwitterClient;