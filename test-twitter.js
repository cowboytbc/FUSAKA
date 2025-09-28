// Test Twitter bot only (avoid Telegram conflicts)
require('dotenv').config();

console.log('🧪 Testing Twitter Bot Only...');
console.log('Environment check:');
console.log('- TWITTER_API_KEY exists:', !!process.env.TWITTER_API_KEY);
console.log('- TWITTER_ACCESS_TOKEN exists:', !!process.env.TWITTER_ACCESS_TOKEN);
console.log('- TWITTER_ENABLED:', process.env.TWITTER_ENABLED);
console.log('- GROK_API_KEY exists:', !!process.env.GROK_API_KEY);

const TwitterClient = require('./src/twitterClient');

async function testTwitterBot() {
  try {
    console.log('\n🐦 Initializing Twitter Client...');
    const twitterClient = new TwitterClient();
    
    console.log('\n🔍 Testing Twitter connection...');
    const success = await twitterClient.start();
    
    if (success) {
      console.log('\n✅ Twitter bot started successfully!');
      console.log('🔍 Testing price API...');
      
      // Test a price update
      await twitterClient.postEngagingPriceUpdate();
      
      console.log('\n🎉 Test completed! Check your Twitter @fusakaai for the post');
    } else {
      console.log('\n❌ Twitter bot failed to start');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testTwitterBot();