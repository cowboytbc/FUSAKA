const { TwitterApi } = require('twitter-api-v2');
const GrokClient = require('./grokClient');
const PriceClient = require('./priceClient');
const IdeogramClient = require('./ideogramClient');
const TwitterRateLimiter = require('./twitterRateLimiter');
const InfluencerMonitor = require('./influencerMonitor');

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
    this.rateLimiter = new TwitterRateLimiter();
    this.influencerMonitor = new InfluencerMonitor(this, this.grokClient, this.rateLimiter);
    
    // Content tracking for smart distribution
    this.lastPriceUpdate = 0; // Track last price update timestamp
    this.dailyContentTypes = []; // Track content types used today
    this.recentTweets = []; // Track recent tweets for reply monitoring
    this.tweetReplyCounts = new Map(); // Track reply counts per tweet
    this.processedMentions = new Set(); // Track processed mentions to avoid duplicates
    this.lastMentionCheck = Date.now(); // Track last mention check timestamp

    // Configuration from environment
    this.config = {
      enabled: process.env.TWITTER_ENABLED === 'true',
      autoTweetInterval: parseInt(process.env.TWITTER_AUTO_TWEET_INTERVAL) || 240, // minutes
      replyToMentions: process.env.TWITTER_REPLY_TO_MENTIONS === 'true',
      autoMemeTweets: process.env.TWITTER_AUTO_MEME_TWEETS === 'true',
      priceUpdates: process.env.TWITTER_PRICE_UPDATES === 'true',
      marketUpdates: process.env.TWITTER_MARKET_UPDATES === 'true',
      replyToVitalik: process.env.TWITTER_REPLY_TO_VITALIK === 'true',
      influencerEngagement: process.env.TWITTER_INFLUENCER_ENGAGEMENT !== 'false' // Default enabled
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
      
      if (me && me.screen_name) {
        console.log(`🐦 Connected to Twitter as @${me.screen_name}`);
      } else if (me && me.data && me.data.username) {
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
      this.startReplyMonitoring();
      this.startInfluencerMonitoring();

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
    
    // Post initial tweet immediately when bot starts
    setTimeout(async () => {
      try {
        console.log('🚀 Posting initial startup tweet...');
        await this.postEducationalContent();
        console.log('✅ Initial startup tweet posted successfully!');
      } catch (error) {
        console.error('❌ Error posting initial tweet:', error);
      }
    }, 5000); // Wait 5 seconds for everything to initialize
    
    setInterval(async () => {
      try {
        // Check rate limits before posting
        if (!this.rateLimiter.canTweet('automated')) {
          console.log('⏸️ Skipping automated tweet due to rate limits');
          return;
        }
        
        // Smart content distribution - educational focus
        const contentType = this.selectContentType();
        
        switch(contentType) {
          case 'price':
            await this.postDailyPriceUpdate();
            break;
          case 'technical':
            await this.postTechnicalInsight();
            break;
          case 'ecosystem':
            await this.postEcosystemUpdate();
            break;
          case 'education':
            await this.postEducationalContent();
            break;
          case 'future':
            await this.postFutureVision();
            break;
          default:
            await this.postTechnicalInsight();
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

    // Check mentions every 15 minutes with Basic plan limits for maximum responsiveness
    setInterval(async () => {
      try {
        if (!this.rateLimiter.canRead('mentions')) {
          console.log('⏸️ Skipping mention check due to read limits');
          return;
        }
        await this.checkAndReplyToMentions();
      } catch (error) {
        if (error.code === 429) {
          console.log('⏳ Rate limited on mentions - waiting...');
        } else {
          console.error('❌ Error checking mentions:', error.message);
        }
      }
    }, 15 * 60 * 1000); // 15 minutes for maximum responsiveness

    console.log('👂 Mention monitoring started (every 15 minutes - Maximum responsiveness)');
    
    // Check mentions immediately on startup (after 10 seconds)
    setTimeout(async () => {
      try {
        if (this.rateLimiter.canRead('mentions')) {
          console.log('🔄 Checking for mentions on startup...');
          await this.checkAndReplyToMentions();
        }
      } catch (error) {
        console.error('❌ Error in startup mention check:', error.message);
      }
    }, 10000); // 10 seconds after startup
  }

  // Monitor Vitalik's posts and respond
  startVitalikMonitoring() {
    if (!this.config.replyToVitalik) return;

    // Check Vitalik every 6 hours with Basic plan limits
    setInterval(async () => {
      try {
        if (!this.rateLimiter.canRead('vitalik')) {
          console.log('⏸️ Skipping Vitalik check due to read limits');
          return;
        }
        await this.checkVitalikPosts();
      } catch (error) {
        if (error.code === 429) {
          console.log('⏳ Rate limited on Vitalik posts - waiting...');
        } else {
          console.error('❌ Error checking Vitalik posts:', error.message);
        }
      }
    }, 6 * 60 * 60 * 1000); // Every 6 hours

    console.log('👨‍💻 Vitalik monitoring started (every 6 hours - Basic plan)');
  }

  // Monitor replies to our own tweets and respond to up to 3 per tweet
  startReplyMonitoring() {
    // Check for replies every hour with Basic plan limits for better engagement
    setInterval(async () => {
      try {
        if (!this.rateLimiter.canRead('replies')) {
          console.log('⏸️ Skipping reply check due to read limits');
          return;
        }
        await this.checkAndReplyToComments();
      } catch (error) {
        if (error.code === 429) {
          console.log('⏳ Rate limited on reply checks - waiting...');
        } else {
          console.error('❌ Error checking replies:', error.message);
        }
      }
    }, 1 * 60 * 60 * 1000); // Every hour

    console.log('💬 Reply monitoring started (every hour - Enhanced engagement)');
  }

  // Monitor influential crypto accounts and engage strategically
  startInfluencerMonitoring() {
    if (!this.config.influencerEngagement) {
      console.log('🎯 Influencer monitoring disabled via config');
      return;
    }
    // Check influencers every 45 minutes for strategic engagement
    setInterval(async () => {
      try {
        if (!this.rateLimiter.canRead('influencer')) {
          console.log('⏸️ Skipping influencer check due to rate limits');
          return;
        }
        await this.influencerMonitor.monitorAllInfluencers();
      } catch (error) {
        if (error.code === 429) {
          console.log('⏳ Rate limited on influencer monitoring - waiting...');
        } else {
          console.error('❌ Error in influencer monitoring:', error.message);
        }
      }
    }, 45 * 60 * 1000); // Every 45 minutes

    console.log('🎯 Influencer monitoring started (every 45 minutes - Strategic engagement)');
    
    // Initial check after 2 minutes to let other services start first
    setTimeout(async () => {
      try {
        if (this.rateLimiter.canRead('influencer')) {
          console.log('🎯 Running initial influencer check...');
          await this.influencerMonitor.monitorAllInfluencers();
        }
      } catch (error) {
        console.error('❌ Error in startup influencer check:', error.message);
      }
    }, 120000); // 2 minutes after startup
  }

  // Check and respond to comments on our tweets
  async checkAndReplyToComments() {
    try {
      console.log('💬 Checking for replies to our tweets...');

      // Get our recent tweets (last 24 hours) to check for replies
      const me = await this.readWriteClient.currentUser();
      let userId;
      
      if (me.data?.id) {
        userId = me.data.id;
      } else if (me.id_str) {
        userId = me.id_str;
      } else {
        console.log('❌ Could not get user ID for reply monitoring');
        return;
      }

      // Get our recent tweets
      const tweets = await this.readWriteClient.v2.userTimeline(userId, {
        max_results: 10,
        'tweet.fields': ['created_at', 'public_metrics', 'conversation_id'],
        exclude: ['retweets', 'replies']
      });

      if (!tweets.data) {
        console.log('📭 No recent tweets found');
        return;
      }

      // Check each tweet for replies
      for (const tweet of tweets.data) {
        const tweetAge = Date.now() - new Date(tweet.created_at).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        // Only check tweets from last 24 hours
        if (tweetAge > twentyFourHours) continue;

        // Skip if we already replied 3 times to this tweet
        const replyCount = this.tweetReplyCounts.get(tweet.id) || 0;
        if (replyCount >= 3) {
          console.log(`⏭️ Already replied 3 times to tweet ${tweet.id}`);
          continue;
        }

        // Search for replies to this tweet, prioritizing mentions of our bot
        const mentionQuery = `conversation_id:${tweet.conversation_id} @${this.username} -from:${this.username}`;
        const generalQuery = `conversation_id:${tweet.conversation_id} -from:${this.username}`;
        
        try {
          // First, prioritize mentions of our bot in the conversation
          const mentionReplies = await this.readWriteClient.v2.search(mentionQuery, {
            max_results: 20,
            'tweet.fields': ['created_at', 'author_id', 'conversation_id', 'text'],
            'user.fields': ['username']
          });

          let allReplies = [];
          
          // Add mention replies (highest priority)
          if (mentionReplies.data) {
            allReplies = [...mentionReplies.data.map(r => ({...r, isMention: true}))];
          }

          // If we have room for more replies, get general replies
          if (allReplies.length < 3) {
            const generalReplies = await this.readWriteClient.v2.search(generalQuery, {
              max_results: 10,
              'tweet.fields': ['created_at', 'author_id', 'conversation_id', 'text'],
              'user.fields': ['username']
            });

            if (generalReplies.data) {
              // Add non-mention replies that we haven't already included
              const existingIds = new Set(allReplies.map(r => r.id));
              const newGeneralReplies = generalReplies.data
                .filter(r => !existingIds.has(r.id))
                .map(r => ({...r, isMention: false}));
              
              allReplies = [...allReplies, ...newGeneralReplies];
            }
          }

          if (allReplies.length > 0) {
            console.log(`📊 Found ${allReplies.length} replies (${allReplies.filter(r => r.isMention).length} mentions)`);

            // Filter and sort replies - mentions first, then by engagement/recency
            const validReplies = allReplies
              .filter(reply => {
                const replyAge = Date.now() - new Date(reply.created_at).getTime();
                return replyAge < twentyFourHours && reply.author_id !== userId;
              })
              .sort((a, b) => {
                // Mentions first
                if (a.isMention && !b.isMention) return -1;
                if (!a.isMention && b.isMention) return 1;
                // Then by recency
                return new Date(b.created_at) - new Date(a.created_at);
              })
              .slice(0, 3 - replyCount);

            // Respond to selected replies
            for (const reply of validReplies) {
              if (replyCount >= 3) break;

              try {
                const replyType = reply.isMention ? 'mention in thread' : 'general comment';
                console.log(`💬 Responding to ${replyType}: "${reply.text}"`);

                const prompt = reply.isMention 
                  ? `Someone mentioned @${this.username} in a reply thread saying: "${reply.text}"\n\nReply as FUSAKAAI with crypto enthusiasm and helpful insights. Show appreciation for the mention. Be engaging and use relevant emojis. Keep it under 240 characters. Focus on Ethereum, DeFi, or blockchain technology.`
                  : `Someone replied to our Twitter post saying: "${reply.text}"\n\nReply as FUSAKAAI with helpful crypto insights. Be engaging, educational, and use relevant emojis. Keep it under 240 characters. Focus on Ethereum, DeFi, or blockchain technology.`;
                
                const response = await this.grokClient.generateResponse(prompt);
                const finalResponse = this.truncateToFit(response, 240);

                await this.readWriteClient.v2.reply(finalResponse, reply.id);
                
                // Update reply count
                const newReplyCount = (this.tweetReplyCounts.get(tweet.id) || 0) + 1;
                this.tweetReplyCounts.set(tweet.id, newReplyCount);
                
                console.log(`✅ Replied to ${replyType} on tweet ${tweet.id}`);
                
                // Record the operation for rate limiting
                this.rateLimiter.recordTweet('reply');

                // Wait between replies to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 2000));

              } catch (replyError) {
                console.error('❌ Error replying to comment:', replyError.message);
              }
            }
          }
        } catch (searchError) {
          console.log(`⚠️ Could not search replies for tweet ${tweet.id}:`, searchError.message);
        }
      }

    } catch (error) {
      console.error('❌ Error in reply monitoring:', error);
      this.rateLimiter.recordRead('replies');
    }
  }

  // Track our tweets for reply monitoring
  trackTweet(tweetId) {
    if (tweetId) {
      this.recentTweets.push({
        id: tweetId,
        timestamp: Date.now()
      });
      
      // Keep only last 50 tweets to prevent memory bloat
      if (this.recentTweets.length > 50) {
        this.recentTweets = this.recentTweets.slice(-50);
      }
      
      console.log(`📝 Tracking tweet ${tweetId} for reply monitoring`);
    }
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
      // Get Vitalik's recent tweets (limited due to API quotas)
      const vitalikTweets = await this.readWriteClient.v2.userTimeline(this.vitalikUserId, {
        max_results: 5,
        'tweet.fields': ['created_at', 'text', 'public_metrics'],
        exclude: ['retweets', 'replies']
      });

      // Record the API read
      this.rateLimiter.recordRead('vitalik');

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
        
        console.log(`📏 Tweet length: ${finalTweet.length}/280 characters`);
        console.log(`📝 Tweet content: ${finalTweet}`);
        
        if (finalTweet.length <= 280) {
          const result = await this.readWriteClient.v2.tweet({ text: finalTweet });
          this.rateLimiter.recordTweet('price_update');
          console.log('✅ Posted engaging price update to Twitter');
          console.log(`🐦 Tweet ID: ${result.data.id}`);
        } else {
          console.log('❌ Tweet too long! Smart truncating and trying again...');
          // Smart truncation - find natural breakpoints
          const maxContent = 280 - 80; // Reserve space for price info and hashtags
          const truncatedContent = this.smartTruncate(engagingContent, maxContent);
          const truncatedTweet = `${truncatedContent}\n\n💰 $${ethPrice.price} | ${change > 0 ? '📈' : '📉'} ${ethPrice.change24h}%\n\n#Ethereum #FUSAKA #Crypto`;
          
          console.log(`📏 Truncated length: ${truncatedTweet.length}/280 characters`);
          const result = await this.readWriteClient.v2.tweet({ text: truncatedTweet });
          this.rateLimiter.recordTweet('price_update');
          console.log('✅ Posted truncated engaging price update to Twitter');
          console.log(`🐦 Tweet ID: ${result.data.id}`);
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
      console.log('🔍 Checking for recent mentions...');
      
      // Get recent mentions (increased limit for comprehensive coverage)
      const mentions = await this.readWriteClient.v2.userMentionTimeline(
        process.env.TWITTER_USER_ID,
        { 
          max_results: 50, // Increased from 20 to ensure we catch all mentions
          'tweet.fields': ['created_at', 'author_id', 'text', 'conversation_id', 'in_reply_to_user_id'],
          'user.fields': ['username']
        }
      );
      
      // Record the API read
      this.rateLimiter.recordRead('mentions');
      
      // Validate mentions response structure
      if (!mentions || !mentions.data || !Array.isArray(mentions.data)) {
        console.log('📭 No new mentions found');
        return;
      }
      
      console.log(`📬 Found ${mentions.data.length} recent mentions`);

      // Process mentions with deduplication and priority handling
      let processedCount = 0;
      
      for (let i = 0; i < mentions.data.length; i++) {
        const mention = mentions.data[i];
        
        // Skip if we've already processed this mention
        if (this.processedMentions.has(mention.id)) {
          console.log(`⏭️ Already processed mention ${mention.id}`);
          continue;
        }
        
        // Add delay between processing mentions (except first)
        if (processedCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
        }
        
        // Skip if older than 15 minutes (since we check every 15 minutes)
        const mentionTime = new Date(mention.created_at);
        const now = new Date();
        const diffMinutes = (now - mentionTime) / (1000 * 60);
        
        if (diffMinutes > 15) {
          console.log(`⏰ Skipping old mention (${Math.round(diffMinutes)} minutes old)`);
          continue;
        }

        console.log(`💬 Processing new mention: "${mention.text}"`);

        // Determine if this is a mention in our thread or a general mention
        const isInOurThread = this.recentTweets.some(tweet => 
          tweet.id === mention.conversation_id || 
          mention.text.includes('RT @' + this.username) ||
          mention.in_reply_to_user_id === process.env.TWITTER_USER_ID
        );

        // Generate context-aware AI response
        const prompt = isInOurThread 
          ? `Someone mentioned @${this.username} in a reply to our tweet saying: "${mention.text}"\n\nReply as FUSAKAAI with appreciation and helpful crypto insights. Be engaging, grateful for the interaction, and use relevant emojis. Keep it under 240 characters. Focus on Ethereum, DeFi, or helpful blockchain insights.`
          : `Someone mentioned @${this.username} on Twitter saying: "${mention.text}"\n\nReply as FUSAKAAI with crypto enthusiasm. Be helpful, engaging, and use emojis. Keep it under 240 characters. Focus on Ethereum, DeFi, or helpful crypto insights.`;
        
        try {
          const response = await this.grokClient.generateResponse(prompt);
          const finalResponse = this.truncateToFit(response, 240);
          
          await this.readWriteClient.v2.reply(finalResponse, mention.id);
          this.rateLimiter.recordTweet('mention_reply');
          
          // Mark as processed
          this.processedMentions.add(mention.id);
          processedCount++;
          
          const contextType = isInOurThread ? 'thread mention' : 'general mention';
          console.log(`✅ Replied to ${contextType} from ${mention.author_id}`);
          
          // Limit to 5 replies per batch to avoid overwhelming
          if (processedCount >= 5) {
            console.log('📊 Reached reply limit for this batch (5 mentions)');
            break;
          }
          
        } catch (replyError) {
          console.error(`❌ Error replying to mention ${mention.id}:`, replyError.message);
        }
      }
      
      // Clean up old processed mentions (older than 24 hours)
      this.cleanupOldProcessedMentions();
    } catch (error) {
      console.error('❌ Error handling mentions:', error);
    }
  }

  // Clean up old processed mentions to prevent memory bloat
  cleanupOldProcessedMentions() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    // Note: Since Set doesn't store timestamps, we'll limit size instead
    if (this.processedMentions.size > 1000) {
      console.log('🧹 Cleaning up old processed mentions...');
      // Keep only the most recent 500 processed mentions
      const mentionsArray = Array.from(this.processedMentions);
      this.processedMentions.clear();
      mentionsArray.slice(-500).forEach(id => this.processedMentions.add(id));
      console.log(`📊 Cleaned up processed mentions (kept ${this.processedMentions.size})`);
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

  // Smart content type selection
  selectContentType() {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Reset daily content tracking if it's a new day
    const today = new Date().toDateString();
    const lastUpdateDay = new Date(this.lastPriceUpdate).toDateString();
    if (today !== lastUpdateDay) {
      this.dailyContentTypes = [];
    }
    
    // Price update: Only once per day
    if (now - this.lastPriceUpdate > twentyFourHours && !this.dailyContentTypes.includes('price')) {
      return 'price';
    }
    
    // Distribute other content types evenly
    const contentTypes = ['technical', 'ecosystem', 'education', 'future'];
    const availableTypes = contentTypes.filter(type => !this.dailyContentTypes.includes(type));
    
    if (availableTypes.length === 0) {
      // Reset if all types used, pick random
      this.dailyContentTypes = [];
      return contentTypes[Math.floor(Math.random() * contentTypes.length)];
    }
    
    return availableTypes[Math.floor(Math.random() * availableTypes.length)];
  }

  // Daily price update with deep context
  async postDailyPriceUpdate() {
    try {
      console.log('💰 Posting daily ETH price update with analysis...');
      const ethPrice = await this.priceClient.getPrice('ethereum');
      
      if (ethPrice && ethPrice.price && !isNaN(parseFloat(ethPrice.price))) {
        const change = parseFloat(ethPrice.change24h);
        const context = change > 5 ? 'major rally' : change > 0 ? 'bullish momentum' : change > -5 ? 'consolidation' : 'correction territory';
        
        const prompt = `Create a comprehensive ETH analysis tweet. Current price: $${ethPrice.price}, 24h change: ${ethPrice.change24h}%. Context: ${context}. Include: 1) Technical perspective 2) What this means for DeFi ecosystem 3) Upcoming catalysts or concerns 4) Historical comparison. Be analytical but engaging. Max 200 chars before price data.`;
        
        const analysis = await this.grokClient.generateResponse(prompt);
        const finalTweet = `${analysis}\n\n💰 ETH: $${ethPrice.price} | ${change > 0 ? '📈' : '📉'} ${ethPrice.change24h}%\n\n#Ethereum #ETH #DeFi #Analysis`;
        
        console.log(`📏 Tweet length: ${finalTweet.length}/280 characters`);
        
        if (finalTweet.length <= 280) {
          const result = await this.readWriteClient.v2.tweet({ text: finalTweet });
          this.rateLimiter.recordTweet('daily_price');
          this.lastPriceUpdate = Date.now();
          this.dailyContentTypes.push('price');
          this.trackTweet(result.data.id);
          console.log('✅ Posted daily price analysis to Twitter');
          console.log(`🐦 Tweet ID: ${result.data.id}`);
        } else {
          const truncatedContent = this.smartTruncate(analysis, 180);
          const truncatedTweet = `${truncatedContent}\n\n💰 ETH: $${ethPrice.price} | ${change > 0 ? '📈' : '📉'} ${ethPrice.change24h}%\n\n#Ethereum #ETH #Analysis`;
          
          const result = await this.readWriteClient.v2.tweet({ text: truncatedTweet });
          this.rateLimiter.recordTweet('daily_price');
          this.lastPriceUpdate = Date.now();
          this.trackTweet(result.data.id);
          this.dailyContentTypes.push('price');
          console.log('✅ Posted truncated daily price analysis to Twitter');
          console.log(`🐦 Tweet ID: ${result.data.id}`);
        }
      } else {
        // Fallback to technical insight if price unavailable
        await this.postTechnicalInsight();
      }
    } catch (error) {
      console.error('❌ Error posting daily price update:', error);
      // Fallback to educational content
      await this.postEducationalContent();
    }
  }

  // Technical insights about Ethereum's architecture
  async postTechnicalInsight() {
    try {
      console.log('🔧 Posting technical Ethereum insight...');
      
      const topics = [
        'Ethereum Virtual Machine (EVM) and its role in smart contract execution',
        'Proof of Stake consensus mechanism and validator economics',
        'Gas optimization techniques and why they matter for users',
        'Layer 2 scaling solutions: Optimistic vs ZK rollups comparison',
        'MEV (Maximal Extractable Value) and its impact on transaction ordering',
        'Account abstraction and how it will change wallet UX',
        'The merge to PoS and its environmental impact reduction',
        'Ethereum\'s roadmap: sharding, statelessness, and the endgame',
        'Smart contract composability: the "money legos" concept',
        'Ethereum Name Service (ENS) as decentralized identity infrastructure',
        'EIP-1559 and how it changed Ethereum\'s fee market forever',
        'Cross-chain bridges: risks, benefits, and the multi-chain future'
      ];
      
      const topic = topics[Math.floor(Math.random() * topics.length)];
      const prompt = `Write an insightful Twitter thread starter about: ${topic}. Make it accessible yet technical. Include a thought-provoking question or controversial take. Explain WHY this matters for Ethereum's future. Be engaging and educational. Max 240 chars.`;
      
      const insight = await this.grokClient.generateResponse(prompt);
      const tweetText = `${insight}\n\n🧵 Thoughts? 👇\n\n#Ethereum #Blockchain #Tech`;
      
      if (tweetText.length <= 280) {
        const result = await this.readWriteClient.v2.tweet({ text: tweetText });
        this.rateLimiter.recordTweet('technical');
        this.dailyContentTypes.push('technical');
        this.trackTweet(result.data.id);
        console.log('✅ Posted technical insight to Twitter');
        console.log(`🐦 Tweet ID: ${result.data.id}`);
      } else {
        const truncatedContent = this.smartTruncate(insight, 240);
        const truncatedTweet = `${truncatedContent}\n\n🧵 Thoughts? 👇\n\n#Ethereum #Tech`;
        
        const result = await this.readWriteClient.v2.tweet({ text: truncatedTweet });
        this.rateLimiter.recordTweet('technical');
        this.dailyContentTypes.push('technical');
        this.trackTweet(result.data.id);
        console.log('✅ Posted truncated technical insight to Twitter');
        console.log(`🐦 Tweet ID: ${result.data.id}`);
      }
    } catch (error) {
      console.error('❌ Error posting technical insight:', error);
    }
  }

  // Ethereum ecosystem updates and project spotlights
  async postEcosystemUpdate() {
    try {
      console.log('🌐 Posting Ethereum ecosystem update...');
      
      const topics = [
        'DeFi protocol innovations and total value locked (TVL) trends',
        'NFT marketplaces evolving beyond art: utility and programmability',
        'DAOs governance models and their real-world impact',
        'Ethereum-based social media: decentralized alternatives emerging',
        'Institutional adoption: major corporations building on Ethereum',
        'Developer tooling improvements: making Web3 development easier',
        'Ethereum ETF implications for mainstream crypto adoption',
        'Gaming on Ethereum: play-to-earn and NFT integration',
        'Real World Assets (RWA) tokenization on Ethereum',
        'Privacy solutions: zk-SNARKs and private transactions',
        'Carbon negative Ethereum: environmental initiatives post-merge',
        'Ethereum in developing economies: financial inclusion stories'
      ];
      
      const topic = topics[Math.floor(Math.random() * topics.length)];
      const prompt = `Create an engaging tweet about: ${topic}. Focus on recent developments, real impact, and future implications. Include specific examples or data points when possible. Make it informative but conversational. Ask a question to drive engagement. Max 240 chars.`;
      
      const update = await this.grokClient.generateResponse(prompt);
      const tweetText = `${update}\n\n💭 What's your take?\n\n#Ethereum #Web3 #DeFi`;
      
      if (tweetText.length <= 280) {
        const result = await this.readWriteClient.v2.tweet({ text: tweetText });
        this.rateLimiter.recordTweet('ecosystem');
        this.dailyContentTypes.push('ecosystem');
        this.trackTweet(result.data.id);
        console.log('✅ Posted ecosystem update to Twitter');
        console.log(`🐦 Tweet ID: ${result.data.id}`);
      } else {
        const truncatedContent = this.smartTruncate(update, 240);
        const truncatedTweet = `${truncatedContent}\n\n💭 Your take?\n\n#Ethereum #Web3`;
        
        const result = await this.readWriteClient.v2.tweet({ text: truncatedTweet });
        this.rateLimiter.recordTweet('ecosystem');
        this.dailyContentTypes.push('ecosystem');
        this.trackTweet(result.data.id);
        console.log('✅ Posted truncated ecosystem update to Twitter');
        console.log(`🐦 Tweet ID: ${result.data.id}`);
      }
    } catch (error) {
      console.error('❌ Error posting ecosystem update:', error);
    }
  }

  // Educational content for newcomers
  async postEducationalContent() {
    try {
      console.log('📚 Posting educational Ethereum content...');
      
      const topics = [
        'What makes Ethereum different from Bitcoin? Programmable money explained',
        'Smart contracts 101: How code becomes law on the blockchain',
        'Gas fees demystified: Why transactions cost what they do',
        'Wallet security basics: Seed phrases, private keys, and best practices',
        'DeFi explained: Traditional finance vs decentralized alternatives',
        'NFTs beyond art: Utility, membership, and digital ownership',
        'Staking Ethereum: How to earn rewards and secure the network',
        'Layer 2 solutions: Faster, cheaper transactions explained simply',
        'Decentralization vs centralization: Why it matters for your money',
        'Blockchain trilemma: Security, scalability, and decentralization trade-offs',
        'Web3 vs Web2: What changes when users own their data',
        'Cryptocurrency volatility: Understanding market cycles and psychology'
      ];
      
      const topic = topics[Math.floor(Math.random() * topics.length)];
      const prompt = `Write an educational tweet about: ${topic}. Make it beginner-friendly but not dumbed down. Use analogies or real-world examples. End with an actionable tip or interesting fact. Be encouraging to newcomers. Max 240 chars.`;
      
      const education = await this.grokClient.generateResponse(prompt);
      const tweetText = `${education}\n\n📖 Learn more 👇\n\n#LearnEthereum #Web3Education #Crypto`;
      
      if (tweetText.length <= 280) {
        const result = await this.readWriteClient.v2.tweet({ text: tweetText });
        this.rateLimiter.recordTweet('education');
        this.dailyContentTypes.push('education');
        this.trackTweet(result.data.id);
        console.log('✅ Posted educational content to Twitter');
        console.log(`🐦 Tweet ID: ${result.data.id}`);
      } else {
        const truncatedContent = this.smartTruncate(education, 240);
        const truncatedTweet = `${truncatedContent}\n\n📖 More 👇\n\n#Ethereum #Education`;
        
        const result = await this.readWriteClient.v2.tweet({ text: truncatedTweet });
        this.rateLimiter.recordTweet('education');
        this.dailyContentTypes.push('education');
        this.trackTweet(result.data.id);
        console.log('✅ Posted truncated educational content to Twitter');
        console.log(`🐦 Tweet ID: ${result.data.id}`);
      }
    } catch (error) {
      console.error('❌ Error posting educational content:', error);
    }
  }

  // Future vision and predictions
  async postFutureVision() {
    try {
      console.log('🔮 Posting Ethereum future vision...');
      
      const topics = [
        'Ethereum in 2030: What will the ecosystem look like?',
        'Mass adoption scenarios: When will your grandmother use DeFi?',
        'The flippening: Ethereum market cap vs Bitcoin predictions',
        'Quantum computing threats to blockchain: How Ethereum is preparing',
        'Global CBDC landscape: How will they interact with Ethereum?',
        'The metaverse economy: Ethereum as the backbone of virtual worlds',
        'AI meets blockchain: Smart contracts that learn and adapt',
        'Carbon neutrality: Ethereum leading the green blockchain revolution',
        'Financial inclusion: Ethereum banking the unbanked globally',
        'Regulation predictions: How governments will embrace or restrict ETH',
        'Ethereum as world computer: Running the internet\'s backend',
        'Post-scarcity economics: What happens when everything is tokenized?'
      ];
      
      const topic = topics[Math.floor(Math.random() * topics.length)];
      const prompt = `Write a thought-provoking tweet about: ${topic}. Be optimistic but realistic. Include a bold prediction or controversial opinion. Make people think about the bigger picture. Reference current trends leading to this future. Max 240 chars.`;
      
      const vision = await this.grokClient.generateResponse(prompt);
      const tweetText = `${vision}\n\n🚀 Bold take?\n\n#EthereumFuture #Web3 #Innovation`;
      
      if (tweetText.length <= 280) {
        const result = await this.readWriteClient.v2.tweet({ text: tweetText });
        this.rateLimiter.recordTweet('future');
        this.dailyContentTypes.push('future');
        this.trackTweet(result.data.id);
        console.log('✅ Posted future vision to Twitter');
        console.log(`🐦 Tweet ID: ${result.data.id}`);
      } else {
        const truncatedContent = this.smartTruncate(vision, 240);
        const truncatedTweet = `${truncatedContent}\n\n🚀 Agree?\n\n#Ethereum #Future`;
        
        const result = await this.readWriteClient.v2.tweet({ text: truncatedTweet });
        this.rateLimiter.recordTweet('future');
        this.dailyContentTypes.push('future');
        this.trackTweet(result.data.id);
        console.log('✅ Posted truncated future vision to Twitter');
        console.log(`🐦 Tweet ID: ${result.data.id}`);
      }
    } catch (error) {
      console.error('❌ Error posting future vision:', error);
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

  // Smart truncation that preserves sentence integrity
  smartTruncate(text, maxLength) {
    if (text.length <= maxLength) {
      return text;
    }
    
    // Try to find natural breakpoints in order of preference
    const breakpoints = [
      '! ', '. ', '? ',  // End of sentences
      '; ', ': ',        // Mid-sentence breaks
      ', ',              // Comma breaks
      ' and ', ' but ', ' or ', ' so ', // Conjunction breaks
      ' '                // Last resort: any space
    ];
    
    let bestCut = 0;
    
    for (const breakpoint of breakpoints) {
      const lastIndex = text.lastIndexOf(breakpoint, maxLength);
      if (lastIndex > bestCut && lastIndex > maxLength * 0.7) { // Don't cut too early
        bestCut = lastIndex + breakpoint.length;
        break;
      }
    }
    
    // If no good breakpoint found, cut at word boundary
    if (bestCut === 0) {
      bestCut = text.lastIndexOf(' ', maxLength);
      if (bestCut === -1) bestCut = maxLength;
    }
    
    let result = text.substring(0, bestCut).trim();
    
    // Add appropriate ending punctuation if needed
    if (!result.match(/[.!?]$/)) {
      // If it ends with a comma or incomplete thought, remove it
      result = result.replace(/[,;:]$/, '');
      
      // Add period if it's a complete thought, exclamation if bullish
      if (result.match(/\b(bullish|moon|pump|strong|solid|rising)\b/i)) {
        result += '!';
      } else {
        result += '.';
      }
    }
    
    return result;
  }
}

module.exports = TwitterClient;