// Test Twitter bot with rate-limit safe operations
require('dotenv').config();

const TwitterClient = require('./src/twitterClient');

async function testRateLimitSafeBot() {
  try {
    console.log('🧪 Testing Twitter Bot (Rate Limit Safe)...');
    
    const twitterClient = new TwitterClient();
    
    console.log('\n🔍 Testing connection...');
    
    // Test basic connection without API-heavy operations
    console.log('✅ Twitter client initialized successfully!');
    console.log('📊 Config:', twitterClient.config);
    
    console.log('\n🎯 Testing price update (single post)...');
    
    // Test one price update post
    await twitterClient.postEngagingPriceUpdate();
    
    console.log('\n✅ Test completed successfully!');
    console.log('🔗 Check your Twitter @FusakaAi for the new post!');
    
  } catch (error) {
    if (error.code === 429) {
      console.error('⏳ Rate limited - try again in a few minutes');
    } else {
      console.error('❌ Test failed:', error.message);
    }
  }
}

testRateLimitSafeBot();