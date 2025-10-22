const { TwitterApi } = require('twitter-api-v2');
const GrokClient = require('./grokClient');
const PriceClient = require('./priceClient');
const IdeogramClient = require('./ideogramClient');
const TwitterRateLimiter = require('./twitterRateLimiter');
const InfluencerMonitor = require('./influencerMonitor');
const SmartTaggingSystem = require('./smartTaggingSystem');

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
    this.influencerMonitor = new InfluencerMonitor(this, this.grokClient, this.rateLimiter, this.smartTagger);
    this.smartTagger = new SmartTaggingSystem();
    
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
      autoTweetInterval: parseInt(process.env.TWITTER_AUTO_TWEET_INTERVAL) || 120, // minutes - 2 hours for sustainable growth
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
    
    // Post immediately on startup (after 30 seconds)
    setTimeout(async () => {
      try {
        console.log('🚀 Posting startup tweet...');
        await this.postTechnicalInsight();
      } catch (error) {
        console.error('❌ Error in startup tweet:', error);
      }
    }, 30000); // 30 seconds after startup
    
    setInterval(async () => {
      try {
        console.log(`🔄 Automated tweet cycle triggered at ${new Date().toLocaleTimeString()}`);
        
        // Check rate limits before posting
        if (!this.rateLimiter.canTweet('automated')) {
          console.log('⏸️ Skipping automated tweet due to rate limits');
          return;
        }
        
        // Check for market reactions first (high priority)
        const ethPrice = await this.priceClient.getPrice('ethereum');
        if (ethPrice && ethPrice.change24h) {
          const change = parseFloat(ethPrice.change24h);
          console.log(`💰 Current ETH change: ${change}% (threshold: ±3%)`);
          if (Math.abs(change) >= 3) {
            console.log(`🎢 VIRAL MOMENT! Significant movement detected! Posting market reaction...`);
            await this.postMarketReaction(ethPrice);
            
            // VIRAL BOOST: Post extra content during volatile times!
            if (Math.abs(change) >= 5) {
              console.log(`🚀 EXTREME VOLATILITY! Posting follow-up viral content...`);
              setTimeout(async () => {
                try {
                  await this.postHotTake(); // Double down on viral content!
                } catch (error) {
                  console.error('❌ Error in volatility follow-up:', error);
                }
              }, 300000); // 5 minutes later
            }
            return;
          }
        }
        
        // VIRAL content distribution - engagement focus
        const contentType = this.selectViralContentType();
        console.log(`� Selected VIRAL content type: ${contentType}`);
        
        switch(contentType) {
          case 'price':
            await this.postDailyPriceUpdate();
            break;
          case 'viral_prediction':
            await this.postViralPrediction();
            break;
          case 'controversial_take':
            await this.postControversialTake();
            break;
          case 'viral_education':
            await this.postViralEducation();
            break;
          case 'success_story':
            await this.postSuccessStory();
            break;
          case 'community_callout':
            await this.postCommunityCallout();
            break;
          case 'viral_thread':
            await this.postViralThread();
            break;
          case 'hot_take':
            await this.postHotTake();
            break;
          case 'weekend_inspiration':
            await this.postWeekendInspiration();
            break;
          case 'community_story':
            await this.postCommunityStory();
            break;
          case 'viral_technical':
            await this.postViralTechnical();
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
            await this.postHotTake(); // Default to viral content!
        }
      } catch (error) {
        console.error('❌ Error in automated tweet:', error);
      }
    }, intervalMs);

    console.log(`⏰ Automated tweets every ${this.config.autoTweetInterval} minutes (${Math.round(24*60/this.config.autoTweetInterval)} tweets/day)`);
  }

  // Monitor mentions and reply
  startMentionMonitoring() {
    if (!this.config.replyToMentions) return;

    // Check mentions every 10 minutes for good responsiveness (was 15 min - too slow for mentions)
    setInterval(async () => {
      try {
        if (!this.rateLimiter.canRead('mentions')) {
          console.log('⏸️ Skipping mention check due to rate limits - preserving quota');
          return;
        }
        await this.checkAndReplyToMentions();
      } catch (error) {
        if (error.code === 429) {
          console.log('⏳ Rate limited on mentions - entering cooldown...');
          this.rateLimiter.handle429Error();
        } else {
          console.error('❌ Error checking mentions:', error.message);
        }
      }
    }, 10 * 60 * 1000); // 10 minutes for responsive mention handling

    console.log('👂 Mention monitoring started (every 10 minutes - Responsive mention handling)');
    
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
    // Check for replies every 30 minutes for better responsiveness (was 1 hour)
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
          this.rateLimiter.handle429Error();
        } else {
          console.error('❌ Error checking replies:', error.message);
        }
      }
    }, 30 * 60 * 1000); // Every 30 minutes for better responsiveness

    console.log('💬 Reply monitoring started (every 30 minutes - Enhanced engagement)');
  }

  // Monitor influential crypto accounts and engage strategically
  startInfluencerMonitoring() {
    if (!this.config.influencerEngagement) {
      console.log('🎯 Influencer monitoring disabled via config');
      return;
    }
    // Check influencers every 60 minutes for better coverage (was 90 min - too slow)
    setInterval(async () => {
      try {
        if (!this.rateLimiter.canRead('influencer')) {
          console.log('⏸️ Skipping influencer check due to rate limits - preserving quota');
          return;
        }
        await this.influencerMonitor.monitorAllInfluencers();
      } catch (error) {
        if (error.code === 429) {
          console.log('⏳ Rate limited on influencer monitoring - extending delay...');
          this.rateLimiter.handle429Error();
        } else {
          console.error('❌ Error in influencer monitoring:', error.message);
        }
      }
    }, 60 * 60 * 1000); // Every 60 minutes for better coverage

    console.log('🎯 Influencer monitoring started (every 60 minutes - Enhanced coverage)');
    
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
      let userId;
      
      try {
        const me = await this.readWriteClient.currentUser();
        if (me.data?.id) {
          userId = me.data.id;
        } else if (me.id_str) {
          userId = me.id_str;
        } else {
          userId = process.env.TWITTER_USER_ID;
        }
      } catch (userError) {
        console.log('⚠️ Could not get current user, using fallback ID');
        userId = process.env.TWITTER_USER_ID;
      }

      if (!userId) {
        console.log('❌ Could not get user ID for reply monitoring');
        return;
      }

      // Get our recent tweets with error handling
      let tweets;
      try {
        tweets = await this.readWriteClient.v2.userTimeline(userId, {
          max_results: 10,
          'tweet.fields': ['created_at', 'public_metrics', 'conversation_id'],
          exclude: ['retweets', 'replies']
        });
      } catch (timelineError) {
        console.log('⚠️ Error fetching timeline for reply monitoring:', timelineError.message);
        return;
      }

      if (!tweets || !tweets.data || !Array.isArray(tweets.data)) {
        console.log('📭 No recent tweets found or invalid response');
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
                const finalResponse = this.smartTruncate(response, 240);

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
      console.log('🔍 Checking for recent mentions and @fusakaai tags...');
      
      // Get recent mentions (balanced limit for good coverage)
      const mentions = await this.readWriteClient.v2.userMentionTimeline(
        process.env.TWITTER_USER_ID,
        { 
          max_results: 50, // Increased from 25 for better mention coverage
          'tweet.fields': ['created_at', 'author_id', 'text', 'conversation_id', 'in_reply_to_user_id'],
          'user.fields': ['username', 'name']
        }
      );
      
      this.rateLimiter.recordRead('mentions');
      
      // Also search for @fusakaai mentions (limited to avoid API abuse)
      let searchMentions = null;
      try {
        if (this.rateLimiter.canRead('search')) {
          searchMentions = await this.readWriteClient.v2.search('@fusakaai -is:retweet', {
            max_results: 10, // Conservative limit
            'tweet.fields': ['created_at', 'author_id', 'text', 'conversation_id'],
            'user.fields': ['username'],
            sort_order: 'recency'
          });
          this.rateLimiter.recordRead('search');
          console.log(`🔎 Found ${searchMentions?.data?.length || 0} @fusakaai search results`);
        }
      } catch (searchError) {
        console.log('⚠️ Search mentions failed, using timeline only');
      }
      
      // Combine mentions from both sources
      let allMentions = [];
      
      // Add timeline mentions
      if (mentions && mentions.data && Array.isArray(mentions.data)) {
        allMentions.push(...mentions.data);
        console.log(`📬 Found ${mentions.data.length} timeline mentions`);
      }
      
      // Add search mentions (avoiding duplicates)
      if (searchMentions && searchMentions.data && Array.isArray(searchMentions.data)) {
        const searchResults = searchMentions.data.filter(tweet => 
          !allMentions.some(existing => existing.id === tweet.id)
        );
        allMentions.push(...searchResults);
        console.log(`🔎 Added ${searchResults.length} unique search mentions`);
      }
      
      if (allMentions.length === 0) {
        console.log('📭 No new mentions found');
        return;
      }
      
      console.log(`📬 Total mentions to process: ${allMentions.length}`);

      // Process mentions with deduplication and priority handling
      let processedCount = 0;
      
      for (let i = 0; i < allMentions.length; i++) {
        const mention = allMentions[i];
        
        // Skip if we've already processed this mention
        if (this.processedMentions.has(mention.id)) {
          console.log(`⏭️ Already processed mention ${mention.id}`);
          continue;
        }
        
        // Add delay between processing mentions (except first)
        if (processedCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
        }
        
        // Skip if older than 45 minutes (allow longer window for comprehensive coverage)
        const mentionTime = new Date(mention.created_at);
        const now = new Date();
        const diffMinutes = (now - mentionTime) / (1000 * 60);
        
        if (diffMinutes > 45) {
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
          ? `Someone mentioned @${this.username} in a reply thread saying: "${mention.text}"\n\nReply as FUSAKAAI with VIRAL energy! Show appreciation, drop valuable alpha, and create engaging conversation. Include questions or controversial takes to drive more engagement. Use strategic emojis. Be grateful but bold. Keep it under 220 characters. Focus on Ethereum insights that make people want to follow.`
          : `Someone mentioned @${this.username} saying: "${mention.text}"\n\nReply as FUSAKAAI with MAXIMUM crypto enthusiasm! Drop alpha, share insights, ask engaging questions, make bold predictions. Create content people want to like/retweet/reply to. Use emojis strategically. Be helpful but VIRAL. Keep it under 220 characters. Focus on Ethereum/DeFi insights that get attention.`;
        
        try {
          let response = await this.grokClient.generateResponse(prompt);
          
          // Add smart tags for mention replies
          response = this.smartTagger.addTagsToTweet(response, 'mention_reply');
          
          const finalResponse = this.smartTruncate(response, 240);
          
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

  // VIRAL content type selection with marketing psychology
  selectViralContentType() {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    const isWeekend = [0, 6].includes(day);
    const isFriday = day === 5;
    const isPeakHours = (hour >= 18 && hour <= 21); // Peak engagement hours
    
    // VIRAL TIMING STRATEGY
    if (hour >= 9 && hour <= 11) {
      // Morning energy - controversial takes and predictions
      return Math.random() < 0.6 ? 'viral_prediction' : 'controversial_take';
    } else if (hour >= 12 && hour <= 14) {
      // Lunch time - digestible education with hooks
      return Math.random() < 0.7 ? 'viral_education' : 'success_story';
    } else if (hour >= 15 && hour <= 17) {
      // Afternoon - market analysis and community engagement
      return Math.random() < 0.5 ? 'price' : 'community_callout';
    } else if (hour >= 18 && hour <= 21) {
      // Peak engagement hours - maximum viral content
      return Math.random() < 0.4 ? 'viral_thread' : 'hot_take';
    } else if (isFriday && hour >= 16) {
      // Friday evening - weekend hype mode!
      return Math.random() < 0.7 ? 'hot_take' : 'viral_prediction';
    } else if (isWeekend) {
      // Weekend vibes - inspiration and community with extra spice
      return Math.random() < 0.4 ? 'weekend_inspiration' : Math.random() < 0.5 ? 'community_story' : 'controversial_take';
    }
    
    // Fallback to regular content but with viral spin
    return Math.random() < 0.3 ? 'viral_technical' : 'ecosystem';
  }

  // Original content type selection
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
        let finalTweet = `${analysis}\n\n💰 ETH: $${ethPrice.price} | ${change > 0 ? '📈' : '📉'} ${ethPrice.change24h}%\n\n#Ethereum #ETH #DeFi #Analysis`;
        
        // Add smart tags for price analysis
        finalTweet = this.smartTagger.addTagsToTweet(finalTweet, 'price');
        
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
          let truncatedTweet = `${truncatedContent}\n\n💰 ETH: $${ethPrice.price} | ${change > 0 ? '📈' : '📉'} ${ethPrice.change24h}%\n\n#Ethereum #ETH #Analysis`;
          
          // Add smart tags to truncated version
          truncatedTweet = this.smartTagger.addTagsToTweet(truncatedTweet, 'price');
          
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

  // Market reaction to significant price movements
  async postMarketReaction(priceData) {
    try {
      const change = parseFloat(priceData.change24h);
      const absChange = Math.abs(change);
      
      // Only react to significant movements (>3%)
      if (absChange < 3) return;
      
      console.log(`💥 Posting market reaction to ${change > 0 ? 'pump' : 'dump'}: ${change}%`);
      
      const reactionType = change > 0 ? 'bullish' : 'bearish';
      const intensity = absChange > 10 ? 'extreme' : absChange > 7 ? 'major' : 'significant';
      
      const prompt = `ETH just moved ${change}% in 24h to $${priceData.price}! Write a VIRAL ${reactionType} market reaction. Context: ${intensity} ${reactionType === 'bullish' ? 'rally' : 'correction'}. Include: 1) What triggered this 2) Why this matters MORE than people think 3) Bold prediction for next move 4) Engagement hook question. Be confident and exciting. Max 200 chars.`;
      
      const reaction = await this.grokClient.generateResponse(prompt);
      let tweetText = `${reaction}\n\n🎢 ETH: $${priceData.price} | ${change > 0 ? '🚀🚀🚀' : '📉💥'} ${change}%\n\n${change > 0 ? '#EthereumRally #ToTheMoon' : '#EthereumDip #BuyTheBlood'} #MarketAlert`;
      
      // Add smart tags for market reactions
      tweetText = this.smartTagger.addTagsToTweet(tweetText, 'price');
      
      if (tweetText.length <= 280) {
        const result = await this.readWriteClient.v2.tweet({ text: tweetText });
        this.rateLimiter.recordTweet('market_reaction');
        this.trackTweet(result.data.id);
        console.log(`✅ Posted ${reactionType} market reaction to Twitter`);
        console.log(`🐦 Tweet ID: ${result.data.id}`);
      }
    } catch (error) {
      console.error('❌ Error posting market reaction:', error);
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
      let tweetText = `${insight}\n\n🧵 Thoughts? 👇\n\n#Ethereum #Blockchain #Tech`;
      
      // Add smart tags for technical content
      tweetText = this.smartTagger.addTagsToTweet(tweetText, 'technical');
      
      if (tweetText.length <= 280) {
        const result = await this.readWriteClient.v2.tweet({ text: tweetText });
        this.rateLimiter.recordTweet('technical');
        this.dailyContentTypes.push('technical');
        this.trackTweet(result.data.id);
        console.log('✅ Posted technical insight to Twitter');
        console.log(`🐦 Tweet ID: ${result.data.id}`);
      } else {
        const truncatedContent = this.smartTruncate(insight, 240);
        let truncatedTweet = `${truncatedContent}\n\n🧵 Thoughts? 👇\n\n#Ethereum #Tech`;
        
        // Add smart tags to truncated version
        truncatedTweet = this.smartTagger.addTagsToTweet(truncatedTweet, 'technical');
        
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
      let tweetText = `${update}\n\n💭 What's your take?\n\n#Ethereum #Web3 #DeFi`;
      
      // Add smart tags for ecosystem content
      tweetText = this.smartTagger.addTagsToTweet(tweetText, 'ecosystem');
      
      if (tweetText.length <= 280) {
        const result = await this.readWriteClient.v2.tweet({ text: tweetText });
        this.rateLimiter.recordTweet('ecosystem');
        this.dailyContentTypes.push('ecosystem');
        this.trackTweet(result.data.id);
        console.log('✅ Posted ecosystem update to Twitter');
        console.log(`🐦 Tweet ID: ${result.data.id}`);
      } else {
        const truncatedContent = this.smartTruncate(update, 240);
        let truncatedTweet = `${truncatedContent}\n\n💭 Your take?\n\n#Ethereum #Web3`;
        
        // Add smart tags to truncated version
        truncatedTweet = this.smartTagger.addTagsToTweet(truncatedTweet, 'ecosystem');
        
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
      let tweetText = `${education}\n\n📖 Learn more 👇\n\n#LearnEthereum #Web3Education #Crypto`;
      
      // Add smart tags for educational content
      tweetText = this.smartTagger.addTagsToTweet(tweetText, 'education');
      
      if (tweetText.length <= 280) {
        const result = await this.readWriteClient.v2.tweet({ text: tweetText });
        this.rateLimiter.recordTweet('education');
        this.dailyContentTypes.push('education');
        this.trackTweet(result.data.id);
        console.log('✅ Posted educational content to Twitter');
        console.log(`🐦 Tweet ID: ${result.data.id}`);
      } else {
        const truncatedContent = this.smartTruncate(education, 240);
        let truncatedTweet = `${truncatedContent}\n\n📖 More 👇\n\n#Ethereum #Education`;
        
        // Add smart tags to truncated version
        truncatedTweet = this.smartTagger.addTagsToTweet(truncatedTweet, 'education');
        
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
      let tweetText = `${vision}\n\n🚀 Bold take?\n\n#EthereumFuture #Web3 #Innovation`;
      
      // Add smart tags for future vision content
      tweetText = this.smartTagger.addTagsToTweet(tweetText, 'future');
      
      if (tweetText.length <= 280) {
        const result = await this.readWriteClient.v2.tweet({ text: tweetText });
        this.rateLimiter.recordTweet('future');
        this.dailyContentTypes.push('future');
        this.trackTweet(result.data.id);
        console.log('✅ Posted future vision to Twitter');
        console.log(`🐦 Tweet ID: ${result.data.id}`);
      } else {
        const truncatedContent = this.smartTruncate(vision, 240);
        let truncatedTweet = `${truncatedContent}\n\n🚀 Agree?\n\n#Ethereum #Future`;
        
        // Add smart tags to truncated version
        truncatedTweet = this.smartTagger.addTagsToTweet(truncatedTweet, 'future');
        
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

  // 🔥 VIRAL MARKETING METHODS 🔥

  // Viral prediction - bold market calls
  async postViralPrediction() {
    try {
      console.log('🔮 Posting VIRAL prediction...');
      
      const predictions = [
        'ETH will flip BTC market cap before 2026. Here\'s why the data supports this bold claim:',
        'Gas fees will drop 99% by 2025. Layer 2s are about to change everything:',
        'The next bull run will be driven by institutional DeFi adoption, not retail FOMO:',
        'Ethereum will process 1 million TPS by 2027. The scaling roadmap is already here:',
        'Real World Assets on Ethereum will hit $1 trillion TVL. Traditional finance is waking up:',
        'AI + Blockchain convergence will create the first trillionaire. Ethereum is the foundation:',
        'The flippening happens when ETH staking rewards beat traditional bonds:',
        'Web3 gaming will onboard 100 million users to Ethereum in 18 months:'
      ];
      
      const prediction = predictions[Math.floor(Math.random() * predictions.length)];
      const prompt = `Create a viral Twitter thread starter: "${prediction}" Make it compelling with specific data points, controversial angles, and strong conviction. Include 2-3 specific reasons why this will happen. Be bold but credible. End with engagement hook. Max 240 chars.`;
      
      const content = await this.grokClient.generateResponse(prompt);
      let tweetText = `${content}\n\n🧵 Thread below 👇\n\n#Ethereum #BoldPrediction #Web3`;
      
      tweetText = this.smartTagger.addTagsToTweet(tweetText, 'viral');
      
      const result = await this.readWriteClient.v2.tweet({ text: tweetText });
      this.rateLimiter.recordTweet('viral_prediction');
      this.trackTweet(result.data.id);
      console.log('✅ Posted VIRAL prediction to Twitter');
      console.log(`🐦 Tweet ID: ${result.data.id}`);
    } catch (error) {
      console.error('❌ Error posting viral prediction:', error);
    }
  }

  // Controversial take - engagement magnet
  async postControversialTake() {
    try {
      console.log('💥 Posting controversial take...');
      
      const controversialTopics = [
        'Most "DeFi" protocols are just glorified yield farms. Real DeFi looks different:',
        'NFTs aren\'t dead - they just haven\'t found their true use case yet:',
        'Layer 2s are fragmenting Ethereum more than helping it scale:',
        'Proof of Stake made Ethereum less decentralized, not more:',
        'Most crypto "influencers" have never built anything on-chain:',
        'The merge was overhyped. The real game-changer is coming with sharding:',
        'Retail investors are still early to Ethereum. Institutions barely understand it:',
        'Gas fees are actually a feature, not a bug. Here\'s the unpopular truth:'
      ];
      
      const take = controversialTopics[Math.floor(Math.random() * controversialTopics.length)];
      const prompt = `Create a controversial but thoughtful crypto take: "${take}" Be contrarian but back it with solid reasoning. Make people want to argue or agree strongly. Include specific examples. End with "Change my mind 🤔" Max 240 chars.`;
      
      const content = await this.grokClient.generateResponse(prompt);
      let tweetText = `${content}\n\nChange my mind 🤔\n\n#Ethereum #UnpopularOpinion #ChangeMyMind`;
      
      tweetText = this.smartTagger.addTagsToTweet(tweetText, 'controversial');
      
      const result = await this.readWriteClient.v2.tweet({ text: tweetText });
      this.rateLimiter.recordTweet('controversial');
      this.trackTweet(result.data.id);
      console.log('✅ Posted controversial take to Twitter');
      console.log(`🐦 Tweet ID: ${result.data.id}`);
    } catch (error) {
      console.error('❌ Error posting controversial take:', error);
    }
  }

  // Viral education - make learning addictive
  async postViralEducation() {
    try {
      console.log('📚 Posting VIRAL education...');
      
      const hooks = [
        'This ONE concept will make you understand Ethereum better than 95% of crypto Twitter:',
        'Most people get this wrong about smart contracts. Here\'s what they really are:',
        'The biggest misconception about gas fees (and why it matters for your wallet):',
        'Why Ethereum is called "programmable money" in 60 seconds:',
        'The difference between Layer 1 and Layer 2 that nobody explains properly:',
        'How MEV works and why it\'s either Ethereum\'s biggest problem OR feature:',
        'What "composability" actually means and why it\'s crypto\'s secret weapon:',
        'The real reason why Ethereum switched to Proof of Stake (hint: not just energy):'
      ];
      
      const hook = hooks[Math.floor(Math.random() * hooks.length)];
      const prompt = `Create engaging educational content: "${hook}" Explain complex Ethereum concepts simply but not dumbed down. Use analogies, examples, and clear benefits. Make people feel smart for learning. End with "Save this tweet!" Max 240 chars.`;
      
      const content = await this.grokClient.generateResponse(prompt);
      let tweetText = `${content}\n\n💡 Save this tweet!\n\n#EthereumEducation #LearnWeb3 #SmartContracts`;
      
      tweetText = this.smartTagger.addTagsToTweet(tweetText, 'education');
      
      const result = await this.readWriteClient.v2.tweet({ text: tweetText });
      this.rateLimiter.recordTweet('viral_education');
      this.trackTweet(result.data.id);
      console.log('✅ Posted viral education to Twitter');
      console.log(`🐦 Tweet ID: ${result.data.id}`);
    } catch (error) {
      console.error('❌ Error posting viral education:', error);
    }
  }

  // Success story - inspire and motivate
  async postSuccessStory() {
    try {
      console.log('🏆 Posting success story...');
      
      const successFrameworks = [
        'From zero to DeFi whale: How understanding Ethereum changed everything',
        'This developer built on Ethereum for 6 months. The results will shock you:',
        'How learning smart contracts landed a $200k Web3 job in 8 months:',
        'The Ethereum trade that turned $1k into $100k (and the lesson behind it):',
        'Why choosing Ethereum over other chains was the best decision ever made:',
        'From traditional finance to DeFi: A conversion story worth reading:',
        'The compound effect of learning one Ethereum concept per day for a year:',
        'How building on Ethereum during the bear market set up generational wealth:'
      ];
      
      const framework = successFrameworks[Math.floor(Math.random() * successFrameworks.length)];
      const prompt = `Create an inspiring success story: "${framework}" Focus on transformation, specific outcomes, and actionable lessons. Make people want to start their own journey. Include numbers and timeline. End with motivational CTA. Max 240 chars.`;
      
      const content = await this.grokClient.generateResponse(prompt);
      let tweetText = `${content}\n\n🚀 Your turn?\n\n#EthereumSuccess #Web3Journey #BUIDLing`;
      
      tweetText = this.smartTagger.addTagsToTweet(tweetText, 'success');
      
      const result = await this.readWriteClient.v2.tweet({ text: tweetText });
      this.rateLimiter.recordTweet('success_story');
      this.trackTweet(result.data.id);
      console.log('✅ Posted success story to Twitter');
      console.log(`🐦 Tweet ID: ${result.data.id}`);
    } catch (error) {
      console.error('❌ Error posting success story:', error);
    }
  }

  // Community callout - build tribe
  async postCommunityCallout() {
    try {
      console.log('📢 Posting community callout...');
      
      const callouts = [
        'Ethereum builders, what\'s the most underrated protocol you\'re watching?',
        'DeFi degens: Drop your best alpha in the replies (but DYOR first 👀)',
        'Web3 developers: What\'s your biggest technical challenge right now?',
        'Ethereum holders: What got you started in crypto? Share your origin story 👇',
        'Layer 2 maxis: Rank your favorites and explain why (spicy takes welcome)',
        'NFT creators on Ethereum: What\'s your next big project? Let\'s see it!',
        'Smart contract auditors: What\'s the weirdest bug you\'ve found?',
        'Ethereum researchers: What breakthrough are you most excited about?'
      ];
      
      const callout = callouts[Math.floor(Math.random() * callouts.length)];
      const prompt = `Expand this community engagement post: "${callout}" Add context, show genuine interest, and create space for diverse opinions. Make people feel seen and heard. Include relevant emojis. Max 240 chars.`;
      
      const content = await this.grokClient.generateResponse(prompt);
      let tweetText = `${content}\n\n💬 Comments = Alpha\n\n#EthereumCommunity #Web3 #Discussion`;
      
      tweetText = this.smartTagger.addTagsToTweet(tweetText, 'community');
      
      const result = await this.readWriteClient.v2.tweet({ text: tweetText });
      this.rateLimiter.recordTweet('community_callout');
      this.trackTweet(result.data.id);
      console.log('✅ Posted community callout to Twitter');
      console.log(`🐦 Tweet ID: ${result.data.id}`);
    } catch (error) {
      console.error('❌ Error posting community callout:', error);
    }
  }

  // Hot take - maximum engagement
  async postHotTake() {
    try {
      console.log('🌶️ Posting HOT TAKE...');
      
      const hotTakes = [
        'ETH is still massively undervalued and here\'s the math to prove it:',
        'Most people are using DeFi wrong. The real alpha is in composability:',
        'Ethereum\'s biggest competitor isn\'t another blockchain - it\'s traditional finance:',
        'The bear market was the best thing that happened to Ethereum development:',
        'Web3 gaming will fail until it stops trying to be "crypto gaming":',
        'DAOs are still governance theater. Real decentralization looks different:',
        'Ethereum will eat traditional cloud computing. AWS should be worried:',
        'The next crypto cycle will be built on utility, not speculation:'
      ];
      
      const take = hotTakes[Math.floor(Math.random() * hotTakes.length)];
      const prompt = `Create a spicy hot take: "${take}" Be bold, confident, and slightly controversial. Include 2-3 strong supporting points. Make people want to quote tweet with their opinion. End with fire emoji. Max 240 chars.`;
      
      const content = await this.grokClient.generateResponse(prompt);
      let tweetText = `${content}\n\n🔥🔥🔥\n\n#EthereumHotTake #Web3 #Controversial`;
      
      tweetText = this.smartTagger.addTagsToTweet(tweetText, 'hottake');
      
      const result = await this.readWriteClient.v2.tweet({ text: tweetText });
      this.rateLimiter.recordTweet('hot_take');
      this.trackTweet(result.data.id);
      console.log('✅ Posted HOT TAKE to Twitter');
      console.log(`🐦 Tweet ID: ${result.data.id}`);
    } catch (error) {
      console.error('❌ Error posting hot take:', error);
    }
  }

  // Weekend inspiration - feel-good content
  async postWeekendInspiration() {
    try {
      console.log('✨ Posting weekend inspiration...');
      
      const inspirations = [
        'Weekend reminder: You\'re building the future of finance. Keep going 💪',
        'Saturday motivation: Every line of Solidity code you write matters',
        'Sunday reflection: Ethereum has changed more lives than any technology in decades',
        'Weekend vibes: The best time to plant a tree was 20 years ago. The second best time is now 🌱',
        'Saturday energy: Bear markets build character. Bull markets build wealth',
        'Weekend wisdom: Focus on learning, not just earning. Knowledge compounds',
        'Sunday thoughts: Every expert was once a beginner. Your journey matters',
        'Weekend motivation: The blockchain never sleeps, but you should. Rest and recharge'
      ];
      
      const inspiration = inspirations[Math.floor(Math.random() * inspirations.length)];
      const prompt = `Create uplifting weekend content: "${inspiration}" Make it motivational but authentic. Connect to broader Ethereum/crypto journey. Include personal growth angle. Add relevant emojis. Max 240 chars.`;
      
      const content = await this.grokClient.generateResponse(prompt);
      let tweetText = `${content}\n\n🌟 Have a great weekend!\n\n#WeekendVibes #Ethereum #Motivation`;
      
      tweetText = this.smartTagger.addTagsToTweet(tweetText, 'inspiration');
      
      const result = await this.readWriteClient.v2.tweet({ text: tweetText });
      this.rateLimiter.recordTweet('weekend_inspiration');
      this.trackTweet(result.data.id);
      console.log('✅ Posted weekend inspiration to Twitter');
      console.log(`🐦 Tweet ID: ${result.data.id}`);
    } catch (error) {
      console.error('❌ Error posting weekend inspiration:', error);
    }
  }

  // Viral technical content
  async postViralTechnical() {
    try {
      console.log('⚡ Posting VIRAL technical content...');
      
      const viralTech = [
        'This ONE line of Solidity code could save you thousands in gas fees:',
        'Why smart contracts are actually dumb (and how to make them smarter):',
        'The optimization that increased our DApp performance by 400%:',
        'Most developers get this wrong about Ethereum state management:',
        'The security vulnerability hiding in 90% of smart contracts:',
        'How we reduced deployment costs by 80% with this simple trick:',
        'The design pattern that makes composability actually work:',
        'Why your DApp is slow (and how Layer 2s fix it):'
      ];
      
      const tech = viralTech[Math.floor(Math.random() * viralTech.length)];
      const prompt = `Create viral technical content: "${tech}" Make complex concepts accessible but impressive. Include specific examples or code snippets. Appeal to developers and non-developers. End with "Bookmark for later!" Max 240 chars.`;
      
      const content = await this.grokClient.generateResponse(prompt);
      let tweetText = `${content}\n\n🔖 Bookmark for later!\n\n#EthereumDev #Solidity #Web3Development`;
      
      tweetText = this.smartTagger.addTagsToTweet(tweetText, 'technical');
      
      const result = await this.readWriteClient.v2.tweet({ text: tweetText });
      this.rateLimiter.recordTweet('viral_technical');
      this.trackTweet(result.data.id);
      console.log('✅ Posted viral technical content to Twitter');
      console.log(`🐦 Tweet ID: ${result.data.id}`);
    } catch (error) {
      console.error('❌ Error posting viral technical content:', error);
    }
  }

  // Viral thread starter (placeholder - can expand to full thread logic)
  async postViralThread() {
    try {
      console.log('🧵 Posting viral thread starter...');
      
      const threadTopics = [
        'Why Ethereum will win the smart contract wars (10 reasons):',
        'The DeFi summer timeline that nobody talks about:',
        'How to go from zero to Ethereum developer in 90 days:',
        'The Layer 2 wars explained (and who will win):',
        'Why institutional money is quietly flooding into Ethereum:',
        'The untold story of how Ethereum survived the bear market:',
        'Breaking down Ethereum\'s roadmap in simple terms:',
        'How Ethereum became the world computer (a timeline):'
      ];
      
      const topic = threadTopics[Math.floor(Math.random() * threadTopics.length)];
      const prompt = `Create a compelling thread starter: "${topic}" Make it irresistible to click. Promise specific value and insights. Include numbers or timeline. End with "Let's dive in 👇" Max 240 chars.`;
      
      const content = await this.grokClient.generateResponse(prompt);
      let tweetText = `${content}\n\nLet's dive in 👇\n\n🧵 THREAD (1/10)\n\n#EthereumThread #Web3Education`;
      
      tweetText = this.smartTagger.addTagsToTweet(tweetText, 'thread');
      
      const result = await this.readWriteClient.v2.tweet({ text: tweetText });
      this.rateLimiter.recordTweet('viral_thread');
      this.trackTweet(result.data.id);
      console.log('✅ Posted viral thread starter to Twitter');
      console.log(`🐦 Tweet ID: ${result.data.id}`);
    } catch (error) {
      console.error('❌ Error posting viral thread:', error);
    }
  }

  // Community story - human connection
  async postCommunityStory() {
    try {
      console.log('❤️ Posting community story...');
      
      const stories = [
        'Met someone at EthCC who quit their job to build on Ethereum full-time. Inspiring AF',
        'Just watched a 16-year-old demo their first smart contract. The future is bright',
        'Teacher in Nigeria using Ethereum to send money home. This is why we build',
        'Grandmother learning DeFi to help her retirement. Web3 is for everyone',
        'Developer with no CS degree just got hired at a top Web3 company. Skills > credentials',
        'Artist selling NFTs to fund their art school. Ethereum democratizing creativity',
        'Small business owner accepting ETH payments. Adoption happening everywhere',
        'Student paying for college with DeFi yields. Financial sovereignty in action'
      ];
      
      const story = stories[Math.floor(Math.random() * stories.length)];
      const prompt = `Expand this human story: "${story}" Make it relatable and emotional. Show the real-world impact of Ethereum. Include universal themes like hope, growth, opportunity. End with community question. Max 240 chars.`;
      
      const content = await this.grokClient.generateResponse(prompt);
      let tweetText = `${content}\n\n💭 What's your Web3 story?\n\n#EthereumStories #Web3Community #RealWorldImpact`;
      
      tweetText = this.smartTagger.addTagsToTweet(tweetText, 'community');
      
      const result = await this.readWriteClient.v2.tweet({ text: tweetText });
      this.rateLimiter.recordTweet('community_story');
      this.trackTweet(result.data.id);
      console.log('✅ Posted community story to Twitter');
      console.log(`🐦 Tweet ID: ${result.data.id}`);
    } catch (error) {
      console.error('❌ Error posting community story:', error);
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