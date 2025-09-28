// Simple Twitter connection test
require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

async function testTwitterConnection() {
  console.log('🔍 Testing Twitter API credentials...');
  
  try {
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    console.log('📋 Credentials loaded:');
    console.log('- API Key:', process.env.TWITTER_API_KEY?.substring(0, 10) + '...');
    console.log('- Access Token:', process.env.TWITTER_ACCESS_TOKEN?.substring(0, 10) + '...');

    // Test basic connection
    const me = await client.readWrite.currentUser();
    console.log('✅ Connection successful!');
    console.log('📊 User data:', JSON.stringify(me, null, 2));

    // Test a simple tweet
    console.log('🐦 Attempting to post test tweet...');
    const tweet = await client.readWrite.v2.tweet('🧪 FUSAKA Bot Test - ' + new Date().toLocaleTimeString());
    console.log('✅ Tweet posted successfully!');
    console.log('🔗 Tweet ID:', tweet.data.id);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) console.error('📋 Error code:', error.code);
    if (error.data) console.error('📋 Error data:', JSON.stringify(error.data, null, 2));
  }
}

testTwitterConnection();