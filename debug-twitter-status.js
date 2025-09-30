// Debug Twitter bot status and connectivity
require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

async function debugTwitterBot() {
  try {
    console.log('🔍 Debugging Twitter bot status...\n');
    
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log('- TWITTER_ENABLED:', process.env.TWITTER_ENABLED);
    console.log('- TWITTER_API_KEY exists:', !!process.env.TWITTER_API_KEY);
    console.log('- TWITTER_ACCESS_TOKEN exists:', !!process.env.TWITTER_ACCESS_TOKEN);
    console.log('- TWITTER_AUTO_TWEET_INTERVAL:', process.env.TWITTER_AUTO_TWEET_INTERVAL);
    console.log('- TWITTER_PRICE_UPDATES:', process.env.TWITTER_PRICE_UPDATES);
    console.log('- TWITTER_MARKET_UPDATES:', process.env.TWITTER_MARKET_UPDATES);
    
    if (!process.env.TWITTER_API_KEY) {
      console.log('❌ Missing Twitter API credentials!');
      return;
    }

    // Test Twitter connection
    console.log('\n🔗 Testing Twitter API connection...');
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    // Get current user info
    const me = await client.readWrite.currentUser();
    console.log('✅ Connected to Twitter successfully!');
    console.log('📊 Account:', me.screen_name || me.data?.username || 'Username not available');
    console.log('👥 Followers:', me.followers_count);
    console.log('📝 Tweet count:', me.statuses_count);
    
    // Check recent tweets
    console.log('\n📱 Checking recent activity...');
    const tweets = await client.readWrite.v2.userTimeline(me.id_str, {
      max_results: 5,
      'tweet.fields': ['created_at', 'public_metrics']
    });
    
    if (tweets.data && tweets.data.length > 0) {
      console.log('📊 Recent tweets found:');
      tweets.data.forEach((tweet, i) => {
        const time = new Date(tweet.created_at);
        const hoursAgo = Math.round((new Date() - time) / (1000 * 60 * 60));
        console.log(`${i + 1}. ${hoursAgo}h ago: "${tweet.text.substring(0, 50)}..."`);
      });
    } else {
      console.log('❌ No recent tweets found');
    }
    
    // Test posting capability
    console.log('\n🧪 Testing posting capability...');
    const testTweet = await client.readWrite.v2.tweet({
      text: `🔧 FUSAKA Bot Debug Test - ${new Date().toLocaleString()} #FUSAKA #BotTest`
    });
    console.log('✅ Test tweet posted successfully!');
    console.log('🔗 Tweet ID:', testTweet.data.id);
    
  } catch (error) {
    console.error('❌ Twitter Debug Error:', error.message);
    if (error.code === 429) {
      console.log('⏳ Rate limited - bot may be posting too frequently');
    } else if (error.code === 403) {
      console.log('🔑 Permission denied - check app permissions and tokens');
    } else if (error.code === 401) {
      console.log('🔐 Unauthorized - tokens may be invalid');
    }
  }
}

debugTwitterBot();