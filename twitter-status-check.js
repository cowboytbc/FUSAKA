const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

async function checkTwitterStatus() {
  console.log('🐦 CHECKING TWITTER BOT STATUS');
  console.log('='.repeat(40));
  
  try {
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    // Test connection with corrected User ID
    const me = await client.v2.me();
    console.log('✅ Twitter API Connection: Working');
    console.log(`👤 Account: @${me.data.username} (${me.data.name})`);
    console.log(`🆔 User ID: ${me.data.id}`);
    console.log();

    // Check recent tweets to see if automated posting is working
    console.log('📊 Checking recent tweets...');
    const timeline = await client.v2.userTimeline(me.data.id, {
      max_results: 5,
      'tweet.fields': ['created_at', 'source']
    });

    if (timeline.data && timeline.data.length > 0) {
      console.log('🐦 Recent tweets:');
      timeline.data.forEach((tweet, index) => {
        const time = new Date(tweet.created_at);
        const hoursAgo = Math.round((Date.now() - time.getTime()) / (1000 * 60 * 60));
        console.log(`${index + 1}. ${hoursAgo}h ago - ${tweet.text.substring(0, 80)}...`);
      });
      
      // Look for recent automated posts (less than 24 hours)
      const recentAutomated = timeline.data.filter(tweet => {
        const tweetTime = new Date(tweet.created_at);
        const hoursAgo = (Date.now() - tweetTime.getTime()) / (1000 * 60 * 60);
        return hoursAgo < 24;
      });
      
      console.log();
      if (recentAutomated.length > 0) {
        console.log('✅ Recent activity detected in last 24 hours');
        console.log(`📈 ${recentAutomated.length} tweets in last 24h`);
      } else {
        console.log('⚠️ No tweets in last 24 hours');
        console.log('   This could be normal given 4-hour intervals and 60% posting chance');
      }
    }

    console.log();
    console.log('🎯 CURRENT CONFIGURATION:');
    console.log(`TWITTER_ENABLED: ${process.env.TWITTER_ENABLED}`);
    console.log(`TWITTER_AUTO_MEME_TWEETS: ${process.env.TWITTER_AUTO_MEME_TWEETS}`);
    console.log(`TWITTER_PRICE_UPDATES: ${process.env.TWITTER_PRICE_UPDATES}`);
    console.log(`TWITTER_MARKET_UPDATES: ${process.env.TWITTER_MARKET_UPDATES}`);
    console.log(`TWITTER_AUTO_TWEET_INTERVAL: ${process.env.TWITTER_AUTO_TWEET_INTERVAL} minutes`);
    console.log();
    
    // Calculate expected posting frequency
    const memeChance = process.env.TWITTER_AUTO_MEME_TWEETS === 'true' ? 40 : 0;
    const priceChance = process.env.TWITTER_PRICE_UPDATES === 'true' ? 30 : 0;
    const marketChance = process.env.TWITTER_MARKET_UPDATES === 'true' ? 30 : 0;
    const totalChance = memeChance + priceChance + marketChance;
    
    console.log('📊 EXPECTED POSTING FREQUENCY:');
    console.log(`Every ${process.env.TWITTER_AUTO_TWEET_INTERVAL} minutes, ${totalChance}% chance of posting`);
    console.log(`That's roughly ${(totalChance/100 * 24/4).toFixed(1)} posts per day`);
    
    if (totalChance === 0) {
      console.log('❌ NO POSTING CONFIGURED - All tweet types disabled!');
    }

  } catch (error) {
    console.error('❌ Twitter Error:', error.message);
    
    if (error.code === 401) {
      console.log('🔧 Authentication failed - check your Twitter API credentials');
    } else if (error.code === 429) {
      console.log('🔧 Rate limited - this is normal, bot handles it automatically');
    } else if (error.message.includes('Invalid Request')) {
      console.log('🔧 Invalid Request - check if User ID is still correct on Render');
    }
  }
}

checkTwitterStatus();