const TwitterApi = require('twitter-api-v2').TwitterApi;
require('dotenv').config();

async function checkRecentActivity() {
  console.log('🔍 Checking recent Twitter activity...\n');
  
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  });

  try {
    // Get recent tweets from our account
    const timeline = await client.v2.userTimeline(process.env.TWITTER_USER_ID, {
      max_results: 10,
      'tweet.fields': ['created_at', 'text', 'source']
    });

    if (timeline.data && timeline.data.length > 0) {
      console.log('📊 Recent tweets:');
      timeline.data.forEach((tweet, index) => {
        const time = new Date(tweet.created_at);
        const now = new Date();
        const hoursAgo = Math.round((now - time) / (1000 * 60 * 60));
        
        console.log(`\n${index + 1}. ${hoursAgo}h ago - ${time.toLocaleString()}`);
        console.log(`   Source: ${tweet.source || 'Unknown'}`);
        console.log(`   Text: ${tweet.text.substring(0, 100)}${tweet.text.length > 100 ? '...' : ''}`);
      });
      
      // Check for patterns
      const botTweets = timeline.data.filter(tweet => 
        tweet.source && tweet.source.includes('FusakaBot')
      );
      
      console.log(`\n📈 Analysis:`);
      console.log(`   Total recent tweets: ${timeline.data.length}`);
      console.log(`   Bot-generated tweets: ${botTweets.length}`);
      console.log(`   Manual/other tweets: ${timeline.data.length - botTweets.length}`);
      
      if (botTweets.length === 0) {
        console.log('\n⚠️  No bot-generated tweets found in recent history');
        console.log('   This suggests automated posting may not be working');
      }
    } else {
      console.log('❌ No recent tweets found');
    }

  } catch (error) {
    console.error('❌ Error checking Twitter activity:', error.message);
  }
}

checkRecentActivity();