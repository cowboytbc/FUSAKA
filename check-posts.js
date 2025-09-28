// Check recent Twitter posts to verify if posts are going through
require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

async function checkRecentPosts() {
  try {
    console.log('🔍 Checking recent posts on @FusakaAi...');
    
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    // Get the last 5 tweets from your account
    const tweets = await client.readWrite.v2.userTimeline(process.env.TWITTER_USER_ID, {
      max_results: 5,
      'tweet.fields': ['created_at', 'text', 'public_metrics']
    });

    if (tweets.data && tweets.data.length > 0) {
      console.log('\n📊 Recent posts:');
      tweets.data.forEach((tweet, index) => {
        const time = new Date(tweet.created_at);
        const timeAgo = Math.round((new Date() - time) / (1000 * 60)); // minutes ago
        console.log(`\n${index + 1}. Posted ${timeAgo} minutes ago:`);
        console.log(`   Text: ${tweet.text.substring(0, 100)}...`);
        console.log(`   Likes: ${tweet.public_metrics.like_count} | Retweets: ${tweet.public_metrics.retweet_count}`);
      });
    } else {
      console.log('❌ No recent posts found');
    }

    // Test posting a simple tweet now
    console.log('\n🐦 Testing new post...');
    const testTweet = await client.readWrite.v2.tweet({
      text: `🧪 FUSAKA Bot Test ${new Date().toLocaleTimeString()} - ETH vibes only! 🔥 #FUSAKA #Test`
    });
    
    console.log('✅ New test tweet posted!');
    console.log('🔗 Tweet ID:', testTweet.data.id);
    console.log('📱 Check @FusakaAi now!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 429) {
      console.log('⏳ Rate limited - wait a few minutes and try again');
    }
  }
}

checkRecentPosts();