// Quick Twitter ID lookup
const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

async function getMyTwitterID() {
  try {
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    const me = await client.v2.me();
    
    console.log('🎯 YOUR TWITTER DETAILS:');
    console.log('========================');
    console.log(`User ID: ${me.data.id}`);
    console.log(`Username: @${me.data.username}`);
    console.log(`Display Name: ${me.data.name}`);
    console.log();
    console.log('📋 COPY THIS FOR RENDER:');
    console.log(`TWITTER_USER_ID=${me.data.id}`);
    
  } catch (error) {
    console.log('❌ API Error - use online tools instead');
    console.log('🔗 Go to: https://tweeterid.com/');
    console.log('📝 Enter username: fusakaai');
  }
}

getMyTwitterID();