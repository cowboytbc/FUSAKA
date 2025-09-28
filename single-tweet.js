// Simple single tweet test (minimal API calls)
require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

async function postSingleTweet() {
  try {
    console.log('🐦 Posting single test tweet...');
    
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    const tweetText = `🚀 FUSAKA AI is LIVE! 

ETH looking strong at current levels 💪 

The future of crypto is decentralized, and we're here for every pump! 

#FUSAKA #Ethereum #Crypto #AI`;

    const result = await client.readWrite.v2.tweet({ text: tweetText });
    
    console.log('✅ Tweet posted successfully!');
    console.log('🔗 Tweet ID:', result.data.id);
    console.log('📱 Check https://twitter.com/FusakaAi for the new post!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 429) {
      console.log('⏳ Still rate limited - wait 15 minutes');
    } else if (error.code === 403) {
      console.log('🔑 Permission issue - check if app has write access');
    }
  }
}

postSingleTweet();