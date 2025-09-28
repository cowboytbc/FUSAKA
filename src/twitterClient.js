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
      marketUpdates: process.env.TWITTER_MARKET_UPDATES === 'true',
      replyToVitalik: process.env.TWITTER_REPLY_TO_VITALIK === 'true'
    };

    // Vitalik's Twitter user ID 
    this.vitalikUserId = '295218901'; // @VitalikButerin

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
      console.log('🔍 Twitter API response:', me);
      
      if (me && me.data && me.data.username) {
        console.log(`🐦 Connected to Twitter as @${me.data.username}`);
      } else if (me && me.username) {
        console.log(`🐦 Connected to Twitter as @${me.username}`);
      } else {
        console.log('🐦 Connected to Twitter (username not available in response)');
      }

      // Initialize character references
      await this.ideogramClient.initializeCharacterReferences();

      // Start automated features
      this.startAutomatedTweets();
      this.startMentionMonitoring();
      this.startVitalikMonitoring();

      console.log('🐦 Twitter bot started successfully!');
      return true;
    } catch (error) {
      console.error('❌ Failed to start Twitter bot:', error);
      return false;
    }
  }

  // Automated tweet scheduler
  startAutomatedTweets() {
    if (!this.config.autoMemeTweets && !this.config.priceUpdates && !this.config.marketUpdates) return;

    const intervalMs = this.config.autoTweetInterval * 60 * 1000;
    
    setInterval(async () => {
      try {
        const rand = Math.random();
        
        if (rand < 0.4 && this.config.autoMemeTweets) {
          // 40% chance: Post meme (if enabled)
          await this.postAutomaticMeme();
        } else if (rand < 0.7 && this.config.priceUpdates) {
          // 30% chance: Engaging price update with context (with API validation)
          await this.postEngagingPriceUpdate();
        } else if (this.config.marketUpdates) {
          // 30% chance: Relevant market insight with discussion starter (with API validation)
          await this.postRelevantInsight();
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

    // Check mentions every 10 minutes (rate limit: 75/15min)
    setInterval(async () => {
      try {
        await this.checkAndReplyToMentions();
      } catch (error) {
        if (error.code === 429) {
          console.log('⏳ Rate limited on mentions - waiting...');
        } else {
          console.error('❌ Error checking mentions:', error.message);
        }
      }
    }, 10 * 60 * 1000);

    console.log('👂 Mention monitoring started');
  }

  // Monitor Vitalik's posts and respond
  startVitalikMonitoring() {
    if (!this.config.replyToVitalik) return;

    // Check Vitalik's posts every 15 minutes (rate limit: 1500/15min)
    setInterval(async () => {
      try {
        await this.checkVitalikPosts();
      } catch (error) {
        if (error.code === 429) {
          console.log('⏳ Rate limited on Vitalik posts - waiting...');
        } else {
          console.error('❌ Error checking Vitalik posts:', error.message);
        }
      }
    }, 15 * 60 * 1000);

    console.log('👨‍💻 Vitalik monitoring started');
  }

  // Generate trending/relevant content
  async postTrendingContent() {
    try {
      const currentEvents = [
        'Bitcoin ETF news and Ethereum ETF implications',
        'Major DeFi protocol updates or governance votes',
        'Layer 2 network milestones and adoption metrics',
        'Ethereum network upgrades and EIP proposals',
        'Institutional crypto adoption announcements',
        'Regulatory developments affecting DeFi',
        'Cross-chain bridge innovations and security',
        'NFT marketplace evolution and utility growth',
        'Staking rewards optimization strategies',
        'Ethereum developer conference highlights'
      ];

      const randomEvent = currentEvents[Math.floor(Math.random() * currentEvents.length)];
      
      const prompt = `Create a viral crypto Twitter post about: ${randomEvent}. Make it relevant to today's market. Include hot takes, predictions, or pose thought-provoking questions. Be engaging and spark discussion. Use current crypto slang. Max 240 chars before hashtags.`;
      
      const trendingPost = await this.grokClient.generateResponse(prompt);
      const finalTweet = `${trendingPost}\n\n🔥 Thoughts below 👇\n\n#Ethereum #FUSAKA #Crypto #DeFi`;
      
      if (finalTweet.length <= 280) {
        await this.readWriteClient.v2.tweet({ text: finalTweet });
        console.log('✅ Posted trending content to Twitter');
      }
    } catch (error) {
      console.error('❌ Error posting trending content:', error);
    }
  }

  async checkVitalikPosts() {
    try {
      // Get Vitalik's recent tweets (last 10 minutes)
      const vitalikTweets = await this.readWriteClient.v2.userTimeline(this.vitalikUserId, {
        max_results: 5,
        'tweet.fields': ['created_at', 'text', 'public_metrics'],
        exclude: ['retweets', 'replies']
      });

      // Validate Vitalik tweets response structure
      if (!vitalikTweets || !vitalikTweets.data || !Array.isArray(vitalikTweets.data)) {
        console.log('📭 No recent Vitalik posts found');
        return;
      }

      console.log(`👨‍💻 Found ${vitalikTweets.data.length} recent Vitalik posts`);

      // Process tweets with delays to avoid rate limits
      for (let i = 0; i < vitalikTweets.data.length; i++) {
        const tweet = vitalikTweets.data[i];
        
        // Add delay between processing tweets
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
        }
        // Skip if older than 10 minutes
        const tweetTime = new Date(tweet.created_at);
        const now = new Date();
        const diffMinutes = (now - tweetTime) / (1000 * 60);
        
        if (diffMinutes > 10) continue;

        // Skip if we already replied (check if tweet is too old or has many replies already)
        if (tweet.public_metrics?.reply_count > 50) continue;

        // Generate contextual AI response
        const prompt = `Vitalik Buterin just tweeted: "${tweet.text}"\n\nAs FUSAKAAI, respond with enthusiasm and crypto knowledge. Be supportive of Ethereum ecosystem. Add relevant insights or questions. Use emojis. Keep under 240 characters. Don't be overly promotional.`;
        
        const response = await this.grokClient.generateResponse(prompt);
        
        // Add FUSAKA signature
        const finalResponse = `${response}\n\n🔥 #FUSAKA #Ethereum`;
        
        if (finalResponse.length <= 280) {
          await this.readWriteClient.v2.reply(finalResponse, tweet.id);
          console.log(`✅ Replied to Vitalik's tweet: "${tweet.text.substring(0, 50)}..."`);
          
          // Rate limit: wait between replies to avoid spam
          await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second delay
        }
      }
    } catch (error) {
      console.error('❌ Error monitoring Vitalik posts:', error);
    }
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

  async postEngagingPriceUpdate() {
    try {
      const ethPrice = await this.priceClient.getPrice('ethereum');
      
      // Validate API response and data quality
      if (ethPrice && 
          ethPrice.price && 
          !isNaN(parseFloat(ethPrice.price)) && 
          ethPrice.change24h !== null && 
          !isNaN(parseFloat(ethPrice.change24h))) {
        
        console.log('✅ Valid price data received, posting price-based content');
        
        // Generate contextual, engaging content based on price movement
        const change = parseFloat(ethPrice.change24h);
        let context = '';
        
        if (change > 5) {
          context = 'massive pump energy! 🚀 Bulls are back in control. ';
        } else if (change > 2) {
          context = 'solid green momentum! 📈 Market looking healthy. ';
        } else if (change > 0) {
          context = 'steady upward grind! 💪 Patience paying off. ';
        } else if (change > -2) {
          context = 'minor consolidation. 🎯 Perfect accumulation zone. ';
        } else if (change > -5) {
          context = 'healthy correction. 💎 Diamond hands opportunity. ';
        } else {
          context = 'major dip! 🔥 Generational buying opportunity. ';
        }

        const prompt = `Create an engaging crypto Twitter post about ETH at $${ethPrice.price} with ${ethPrice.change24h}% change. Include ${context} Add relevant market context, what this means for DeFi/L2s, or upcoming catalysts. Be bullish but analytical. Include emojis. Max 240 chars before hashtags.`;
        
        const engagingContent = await this.grokClient.generateResponse(prompt);
        const finalTweet = `${engagingContent}\n\n💰 $${ethPrice.price} | ${change > 0 ? '📈' : '📉'} ${ethPrice.change24h}%\n\n#Ethereum #FUSAKA #Crypto`;
        
        if (finalTweet.length <= 280) {
          await this.readWriteClient.v2.tweet({ text: finalTweet });
          console.log('✅ Posted engaging price update to Twitter');
        }
      } else {
        // Fallback: Post general crypto content when price API is unavailable
        console.log('⚠️ Price API unavailable, posting general crypto content instead');
        await this.postTrendingContent();
      }
    } catch (error) {
      console.error('❌ Error posting engaging price update:', error);
      // Fallback on error: Post general content
      try {
        console.log('⚠️ Falling back to general content due to price API error');
        await this.postTrendingContent();
      } catch (fallbackError) {
        console.error('❌ Fallback content also failed:', fallbackError);
      }
    }
  }

  async postRelevantInsight() {
    try {
      const ethPrice = await this.priceClient.getPrice('ethereum');
      
      // Validate API response and data quality
      if (ethPrice && 
          ethPrice.price && 
          !isNaN(parseFloat(ethPrice.price))) {
        
        console.log('✅ Valid price data received for insights');
        // Generate contextually relevant topics
        const topics = [
          'Layer 2 scaling solutions and their impact on Ethereum adoption',
          'DeFi innovation trends and total value locked growth',
          'Ethereum merge effects on energy consumption and staking',
          'Institutional adoption and ETF developments',
          'Cross-chain interoperability and Ethereum dominance',
          'NFT utility evolution and real-world applications',
          'EIP updates and network upgrade implications',
          'Ethereum development activity and GitHub commits',
          'Gas fee optimization and user experience improvements',
          'Decentralized governance trends in Ethereum ecosystem'
        ];
        
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        
        const prompt = `Create an engaging crypto Twitter thread starter about: ${randomTopic}. Reference current ETH price of $${ethPrice.price}. Include hot takes, predictions, or questions that spark discussion. Be thought-provoking and add value. Use crypto Twitter language. Max 240 chars before hashtags.`;
        
        const insight = await this.grokClient.generateResponse(prompt);
        const tweetText = `${insight}\n\n💭 What's your take? 👇\n\n#Ethereum #FUSAKA #Crypto #DeFi`;
        
        if (tweetText.length <= 280) {
          await this.readWriteClient.v2.tweet({ text: tweetText });
          console.log('✅ Posted relevant insight to Twitter');
        }
      } else {
        // Fallback: Post general insight without price reference
        console.log('⚠️ Price API unavailable, posting general insight instead');
        await this.postGeneralInsight();
      }
    } catch (error) {
      console.error('❌ Error posting relevant insight:', error);
      // Fallback on error
      try {
        console.log('⚠️ Falling back to general insight due to price API error');
        await this.postGeneralInsight();
      } catch (fallbackError) {
        console.error('❌ Fallback insight also failed:', fallbackError);
      }
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

      // Validate mentions response structure
      if (!mentions || !mentions.data || !Array.isArray(mentions.data)) {
        console.log('📭 No new mentions found');
        return;
      }

      console.log(`📬 Found ${mentions.data.length} recent mentions`);

      // Process mentions with delays to avoid rate limits
      for (let i = 0; i < mentions.data.length; i++) {
        const mention = mentions.data[i];
        
        // Add delay between processing mentions
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
        }
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

  // Fallback method for general insights without price data
  async postGeneralInsight() {
    try {
      const generalTopics = [
        'The evolution of decentralized governance and DAOs',
        'Ethereum ecosystem growth and developer adoption',
        'Layer 2 innovations reshaping blockchain scalability',
        'DeFi composability and financial innovation',
        'NFT utility beyond digital art and collectibles',
        'Web3 identity and privacy solutions',
        'Blockchain interoperability and cross-chain future',
        'Sustainable blockchain technology and energy efficiency',
        'Institutional crypto adoption trends',
        'Regulatory clarity and blockchain mainstream adoption'
      ];
      
      const randomTopic = generalTopics[Math.floor(Math.random() * generalTopics.length)];
      
      const prompt = `Create an engaging crypto Twitter thread starter about: ${randomTopic}. No price references needed. Include hot takes, predictions, or thought-provoking questions. Be insightful and spark discussion. Use crypto Twitter language. Max 240 chars before hashtags.`;
      
      const insight = await this.grokClient.generateResponse(prompt);
      const tweetText = `${insight}\n\n💭 What's your take? 👇\n\n#Ethereum #FUSAKA #Crypto #Web3`;
      
      if (tweetText.length <= 280) {
        await this.readWriteClient.v2.tweet({ text: tweetText });
        console.log('✅ Posted general insight to Twitter');
      }
    } catch (error) {
      console.error('❌ Error posting general insight:', error);
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