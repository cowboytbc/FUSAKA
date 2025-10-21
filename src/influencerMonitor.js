class InfluencerMonitor {
  constructor(twitterClient, grokClient, rateLimiter, smartTagger = null) {
    this.twitterClient = twitterClient;
    this.grokClient = grokClient;
    this.rateLimiter = rateLimiter;
    this.smartTagger = smartTagger;
    
    // Influential crypto accounts with their Twitter IDs and engagement strategies
    this.influencers = new Map([
      ['295218901', { 
        username: 'VitalikButerin', 
        name: 'Vitalik Buterin',
        expertise: 'Ethereum, scaling, philosophy, governance',
        responseStyle: 'technical and respectful',
        priority: 'high',
        maxRepliesPerDay: 2  // Reduced from 5 to balance with others
      }],
      ['2312333412', { 
        username: 'ethereum', 
        name: 'Ethereum',
        expertise: 'Ethereum updates, ecosystem news',
        responseStyle: 'supportive and informative',
        priority: 'high',
        maxRepliesPerDay: 2  // Reduced from 4 to balance with others
      }],
      ['18060226', { 
        username: 'josephlubin', 
        name: 'Joseph Lubin',
        expertise: 'ConsenSys, Ethereum ecosystem, Web3',
        responseStyle: 'professional and insightful',
        priority: 'medium',
        maxRepliesPerDay: 2
      }],
      ['1515871317448769538', { 
        username: 'sassal0x', 
        name: 'Sassal',
        expertise: 'Ethereum research, DeFi, technical analysis',
        responseStyle: 'technical and analytical',
        priority: 'high',
        maxRepliesPerDay: 2  // Increased for better distribution
      }],
      ['1729808723', { 
        username: 'aantonop', 
        name: 'Andreas Antonopoulos',
        expertise: 'Bitcoin, blockchain education, security',
        responseStyle: 'educational and thoughtful',
        priority: 'medium',
        maxRepliesPerDay: 2  // Increased for better coverage
      }],
      ['1206316169894912000', { 
        username: 'timbeiko_', 
        name: 'Tim Beiko',
        expertise: 'Ethereum development, EIPs, protocol upgrades',
        responseStyle: 'technical and collaborative',
        priority: 'high',
        maxRepliesPerDay: 2  // Increased for better distribution
      }],
      ['725293544137375744', { 
        username: 'RyanSAdams', 
        name: 'Ryan Sean Adams',
        expertise: 'Bankless, DeFi, Ethereum ecosystem',
        responseStyle: 'enthusiastic and bullish',
        priority: 'medium',
        maxRepliesPerDay: 2  // Increased for better coverage
      }],
      ['1721051', { 
        username: 'cdixon', 
        name: 'Chris Dixon',
        expertise: 'Web3, crypto investments, a16z',
        responseStyle: 'strategic and visionary',
        priority: 'medium',
        maxRepliesPerDay: 2  // Increased for better coverage
      }],
      ['1448014334470057985', { 
        username: 'l3olanza', 
        name: 'Leo Lanza',
        expertise: 'DeFi, yield farming, protocols',
        responseStyle: 'yield-focused and practical',
        priority: 'medium',
        maxRepliesPerDay: 2  // Increased for better coverage
      }],
      ['87853709', { 
        username: 'LauraShin', 
        name: 'Laura Shin',
        expertise: 'Crypto journalism, investigations, education',
        responseStyle: 'informative and journalistic',
        priority: 'low',
        maxRepliesPerDay: 1
      }],
      ['352886430', { 
        username: 'cobie', 
        name: 'Cobie',
        expertise: 'Trading, market analysis, crypto culture',
        responseStyle: 'witty and market-focused',
        priority: 'medium',
        maxRepliesPerDay: 1
      }],
      ['1203981560532271104', { 
        username: 'spencernoon', 
        name: 'Spencer Noon',
        expertise: 'DeFi, Ethereum ecosystem, venture capital',
        responseStyle: 'analytical and ecosystem-focused',
        priority: 'medium',
        maxRepliesPerDay: 1
      }],
      ['1438761000649113600', { 
        username: 'DefiLlama', 
        name: 'DeFiLlama',
        expertise: 'DeFi data, TVL, protocol analytics',
        responseStyle: 'data-driven and analytical',
        priority: 'high',
        maxRepliesPerDay: 2
      }],
      ['919890802494930944', { 
        username: 'hmalviya9', 
        name: 'Hasufly',
        expertise: 'DeFi research, MEV, protocol design',
        responseStyle: 'research-heavy and technical',
        priority: 'high',
        maxRepliesPerDay: 1
      }],
      ['434206456', { 
        username: 'nic__carter', 
        name: 'Nic Carter',
        expertise: 'Bitcoin, crypto analysis, ESG concerns',
        responseStyle: 'analytical and contrarian when appropriate',
        priority: 'low',
        maxRepliesPerDay: 1
      }]
    ]);
    
    // Track daily engagement per influencer
    this.dailyEngagement = new Map();
    this.lastReset = new Date().getDate();
    
    // Track processed tweets to avoid duplicate replies
    this.processedTweets = new Set(); // Store tweet IDs we've already replied to
    this.lastCleanup = Date.now(); // Track when we last cleaned up old tweet IDs
    
    // Keywords that trigger higher engagement priority
    this.highPriorityKeywords = [
      'ethereum', 'eth', 'defi', 'l2', 'layer 2', 'scaling', 'rollup', 'zk',
      'fusaka', 'eip', 'upgrade', 'merge', 'staking', 'yield', 'protocol',
      'governance', 'dao', 'nft', 'web3', 'dapp', 'smart contract'
    ];
    
    console.log(`🎯 Influencer Monitor initialized with ${this.influencers.size} accounts`);
    this.logInfluencerList();
  }
  
  logInfluencerList() {
    console.log('📋 Monitoring these influencers:');
    for (const [userId, info] of this.influencers) {
      console.log(`   🔸 @${info.username} (${info.name}) - Priority: ${info.priority}`);
    }
  }
  
  // Reset daily engagement counters
  resetDailyCounters() {
    const currentDay = new Date().getDate();
    if (currentDay !== this.lastReset) {
      this.dailyEngagement.clear();
      this.lastReset = currentDay;
      console.log('📅 Reset daily influencer engagement counters');
    }
  }
  
  // Check if we can engage with a specific influencer today
  canEngageWithInfluencer(userId) {
    this.resetDailyCounters();
    
    const influencer = this.influencers.get(userId);
    if (!influencer) return false;
    
    const todayCount = this.dailyEngagement.get(userId) || 0;
    return todayCount < influencer.maxRepliesPerDay;
  }
  
  // Record engagement with an influencer
  recordEngagement(userId) {
    this.resetDailyCounters();
    const currentCount = this.dailyEngagement.get(userId) || 0;
    this.dailyEngagement.set(userId, currentCount + 1);
  }
  
  // Analyze if a tweet is worth engaging with
  analyzeEngagementWorthiness(tweet, influencer) {
    const text = tweet.text.toLowerCase();
    
    // Check for high-priority keywords
    const hasHighPriorityKeywords = this.highPriorityKeywords.some(keyword => 
      text.includes(keyword)
    );
    
    // Check engagement metrics
    const metrics = tweet.public_metrics || {};
    const isHighEngagement = (metrics.retweet_count || 0) > 10 || 
                            (metrics.like_count || 0) > 50 ||
                            (metrics.reply_count || 0) > 5;
    
    // Prefer fresh content (2-30 minutes old) for better engagement
    const tweetAge = Date.now() - new Date(tweet.created_at).getTime();
    const isNotTooRecent = tweetAge > 2 * 60 * 1000; // 2 minutes (reduced from 5)
    
    // Don't reply to old tweets (> 2 hours) to stay relevant
    const isNotTooOld = tweetAge < 2 * 60 * 60 * 1000; // 2 hours (reduced from 4)
    
    // Avoid threads/replies
    const isOriginalTweet = !tweet.in_reply_to_user_id;
    
    const worthiness = {
      hasKeywords: hasHighPriorityKeywords,
      hasEngagement: isHighEngagement,
      rightTiming: isNotTooRecent && isNotTooOld,
      isOriginal: isOriginalTweet,
      score: 0
    };
    
    // Calculate worthiness score
    if (worthiness.hasKeywords) worthiness.score += 3;
    if (worthiness.hasEngagement) worthiness.score += 2;
    if (worthiness.rightTiming) worthiness.score += 2;
    if (worthiness.isOriginal) worthiness.score += 1;
    if (influencer.priority === 'high') worthiness.score += 2;
    if (influencer.priority === 'medium') worthiness.score += 1;
    
    return worthiness;
  }
  
  // Generate contextual response for an influencer's tweet
  async generateInfluencerResponse(tweet, influencer) {
    const prompt = `You are FUSAKAAI, responding to a tweet from @${influencer.username} (${influencer.name}), a respected figure in crypto known for ${influencer.expertise}.

Tweet: "${tweet.text}"

Generate a VIRAL, engaging ${influencer.responseStyle} response that:
1. Shows deep understanding of their expertise with specific insights
2. Adds VALUABLE perspective or asks thought-provoking questions
3. References FUSAKA project NATURALLY when relevant (not forced)
4. Matches ${influencer.name}'s energy and expertise level
5. Includes engagement hooks (questions, controversial takes, predictions)
6. Uses strategic emojis for emphasis and emotion
7. Stays under 220 characters to leave room for tags

Style: ${influencer.responseStyle} but MORE ENGAGING
Focus: ${influencer.expertise}

Be authentic, add genuine alpha, and create reply-worthy content that gets noticed!`;

    try {
      let response = await this.grokClient.generateResponse(prompt);
      
      // Add smart tags for influencer replies if available
      if (this.smartTagger) {
        response = this.smartTagger.getInfluencerReplyTags(response, influencer.username);
      }
      
      return this.truncateToFit(response, 240);
    } catch (error) {
      console.error('❌ Error generating influencer response:', error);
      return null;
    }
  }
  
  // Truncate response to fit Twitter limits (accounting for tags)
  truncateToFit(text, maxLength) {
    if (text.length <= maxLength) return text;
    
    // Reserve space for potential tags (up to 50 chars)
    const effectiveMaxLength = maxLength - 50;
    
    // Smart truncation - try to end at a sentence or word boundary
    const truncated = text.substring(0, effectiveMaxLength);
    const lastSentence = truncated.lastIndexOf('.');
    const lastSpace = truncated.lastIndexOf(' ');
    
    // Prefer complete sentences
    if (lastSentence > effectiveMaxLength * 0.6) {
      return text.substring(0, lastSentence + 1);
    } 
    // Otherwise end at word boundary without adding "..."
    else if (lastSpace > effectiveMaxLength * 0.7) {
      return truncated.substring(0, lastSpace);
    } 
    // Last resort - truncate cleanly without "..."
    else {
      return truncated;
    }
  }
  
  // Monitor a specific influencer's recent tweets
  async monitorInfluencer(userId) {
    try {
      if (!this.rateLimiter.canRead('influencer')) {
        console.log(`⏸️ Skipping influencer ${userId} due to rate limits`);
        return;
      }
      
      const influencer = this.influencers.get(userId);
      if (!influencer) return;
      
      // Check if we can engage with this influencer today
      if (!this.canEngageWithInfluencer(userId)) {
        console.log(`⏭️ Daily limit reached for @${influencer.username}`);
        return;
      }
      
      console.log(`🔍 Checking tweets from @${influencer.username}...`);
      
      // Get recent tweets from this user (increased to get more options)
      const timeline = await this.twitterClient.readWriteClient.v2.userTimeline(userId, {
        max_results: 10, // Increased from 5 to get more diverse content options
        'tweet.fields': ['created_at', 'public_metrics', 'in_reply_to_user_id', 'conversation_id'],
        exclude: ['retweets', 'replies']
      });
      
      this.rateLimiter.recordRead('influencer');
      this.rateLimiter.resetErrorTracking(); // Reset 429 tracking on success
      
      // Handle Twitter API v2 response structure
      const tweetsData = timeline._realData?.data || timeline.data;
      
      if (!tweetsData || !Array.isArray(tweetsData) || tweetsData.length === 0) {
        console.log(`📭 No recent tweets from @${influencer.username}`);
        return;
      }
      
      console.log(`📊 Found ${tweetsData.length} tweets from @${influencer.username}`);
      
      // Clean up old processed tweets periodically (every 24 hours)
      this.cleanupProcessedTweets();
      
      // Analyze each tweet for engagement potential
      for (const tweet of tweetsData) {
        // Skip if we've already replied to this tweet
        if (this.processedTweets.has(tweet.id)) {
          console.log(`⏭️ Already replied to tweet ${tweet.id} from @${influencer.username}`);
          continue;
        }
        
        const worthiness = this.analyzeEngagementWorthiness(tweet, influencer);
        
        console.log(`📊 Tweet worthiness for @${influencer.username}: ${worthiness.score}/8`);
        
        // Only engage with high-scoring tweets (5+ out of 8)
        if (worthiness.score >= 5) {
          console.log(`🎯 High-value tweet found from @${influencer.username}`);
          
          // Generate and post response
          const response = await this.generateInfluencerResponse(tweet, influencer);
          
          if (response) {
            try {
              await this.twitterClient.readWriteClient.v2.reply(response, tweet.id);
              this.rateLimiter.recordTweet('influencer_reply');
              this.recordEngagement(userId);
              
              // Mark this tweet as processed to avoid future duplicate replies
              this.processedTweets.add(tweet.id);
              
              console.log(`✅ Replied to @${influencer.username}: "${response}"`);
              
              // Wait between replies to avoid looking spammy
              await new Promise(resolve => setTimeout(resolve, 5000));
              
              // Only engage once per check
              break;
              
            } catch (replyError) {
              console.error(`❌ Error replying to @${influencer.username}:`, replyError.message);
            }
          }
        }
      }
      
    } catch (error) {
      if (error.code === 429) {
        this.rateLimiter.handle429Error();
        console.error(`❌ Rate limited @${this.influencers.get(userId)?.username} - entering cooldown`);
      } else {
        console.error(`❌ Error monitoring @${this.influencers.get(userId)?.username}:`, error.message);
      }
    }
  }
  
  // Monitor all influencers in rotation
  async monitorAllInfluencers() {
    console.log('🎯 Starting influencer monitoring cycle...');
    
    // Clean up old processed tweets
    this.cleanupProcessedTweets();
    
    // Convert to array and shuffle for random order
    const influencerIds = Array.from(this.influencers.keys());
    const shuffledIds = this.shuffleArray([...influencerIds]);
    
    // Monitor high priority first, then others, but rotate within priority levels
    const highPriority = this.shuffleArray(shuffledIds.filter(id => this.influencers.get(id).priority === 'high'));
    const mediumPriority = this.shuffleArray(shuffledIds.filter(id => this.influencers.get(id).priority === 'medium'));
    const lowPriority = this.shuffleArray(shuffledIds.filter(id => this.influencers.get(id).priority === 'low'));
    
    // Interleave priorities for better distribution
    const orderedIds = [];
    const maxLength = Math.max(highPriority.length, mediumPriority.length, lowPriority.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (i < highPriority.length) orderedIds.push(highPriority[i]);
      if (i < mediumPriority.length) orderedIds.push(mediumPriority[i]);
      if (i < lowPriority.length) orderedIds.push(lowPriority[i]);
    }
    
    // Monitor 6 influencers per cycle for comprehensive coverage (was 3)
    const toMonitor = orderedIds.slice(0, 6);
    
    for (const userId of toMonitor) {
      // Check rate limits before each influencer
      if (!this.rateLimiter.canRead('influencer')) {
        console.log('⏸️ Breaking influencer cycle - rate limit reached');
        break;
      }
      
      await this.monitorInfluencer(userId);
      
      // Reduced wait time for better coverage while staying sustainable
      await new Promise(resolve => setTimeout(resolve, 6000)); // Reduced from 10s to 6s
    }
    
    console.log('✅ Influencer monitoring cycle complete');
  }
  
  // Clean up old processed tweets to prevent memory bloat
  cleanupProcessedTweets() {
    const now = Date.now();
    // Clean up every 24 hours
    if (now - this.lastCleanup > 24 * 60 * 60 * 1000) {
      console.log('🧹 Cleaning up old processed tweets...');
      // Keep only the last 500 tweet IDs to prevent memory issues
      if (this.processedTweets.size > 500) {
        const tweetArray = Array.from(this.processedTweets);
        // Keep the most recent 300 tweets (assuming newer IDs are larger)
        const recentTweets = tweetArray.sort().slice(-300);
        this.processedTweets = new Set(recentTweets);
        console.log(`🧹 Cleaned up processed tweets, kept ${this.processedTweets.size} recent entries`);
      }
      this.lastCleanup = now;
    }
  }

  // Utility function to shuffle array
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  // Get engagement statistics
  getEngagementStats() {
    this.resetDailyCounters();
    
    const stats = {
      totalInfluencers: this.influencers.size,
      engagedToday: this.dailyEngagement.size,
      totalEngagementsToday: Array.from(this.dailyEngagement.values()).reduce((sum, count) => sum + count, 0),
      availableEngagements: 0
    };
    
    for (const [userId, influencer] of this.influencers) {
      const todayCount = this.dailyEngagement.get(userId) || 0;
      stats.availableEngagements += Math.max(0, influencer.maxRepliesPerDay - todayCount);
    }
    
    return stats;
  }
}

module.exports = InfluencerMonitor;