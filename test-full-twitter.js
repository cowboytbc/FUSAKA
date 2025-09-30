// Test Twitter bot automation thoroughly
require('dotenv').config();
const TwitterClient = require('./src/twitterClient');

async function testTwitterAutomation() {
  try {
    console.log('🔍 Testing Twitter Bot Automation Logic...\n');
    
    // Initialize Twitter client
    const twitterClient = new TwitterClient();
    
    console.log('📊 Twitter Client Config:');
    Object.entries(twitterClient.config).forEach(([key, value]) => {
      console.log(`- ${key}:`, value);
    });
    
    // Test if automation would start
    const shouldStart = twitterClient.config.autoMemeTweets || 
                       twitterClient.config.priceUpdates || 
                       twitterClient.config.marketUpdates;
    
    console.log('\n🚀 Automation Analysis:');
    console.log('Should start automated tweets:', shouldStart);
    
    if (shouldStart) {
      const intervalMs = twitterClient.config.autoTweetInterval * 60 * 1000;
      const intervalHours = intervalMs / (1000 * 60 * 60);
      console.log(`Interval: ${intervalHours} hours (${intervalMs}ms)`);
      
      // Test the startAutomatedTweets method directly
      console.log('\n🧪 Testing startAutomatedTweets method...');
      try {
        // This should set up the interval
        twitterClient.startAutomatedTweets();
        console.log('✅ startAutomatedTweets() completed without errors');
      } catch (error) {
        console.error('❌ startAutomatedTweets() failed:', error.message);
      }
    }
    
    // Test each posting method individually
    console.log('\n🎯 Testing individual posting methods:');
    
    try {
      console.log('Testing postEngagingPriceUpdate...');
      await twitterClient.postEngagingPriceUpdate();
      console.log('✅ postEngagingPriceUpdate worked');
    } catch (error) {
      console.error('❌ postEngagingPriceUpdate failed:', error.message);
    }
    
    try {
      console.log('Testing postRelevantInsight...');
      await twitterClient.postRelevantInsight();
      console.log('✅ postRelevantInsight worked');
    } catch (error) {
      console.error('❌ postRelevantInsight failed:', error.message);
    }
    
    try {
      console.log('Testing postTrendingContent...');
      await twitterClient.postTrendingContent();
      console.log('✅ postTrendingContent worked');
    } catch (error) {
      console.error('❌ postTrendingContent failed:', error.message);
    }
    
    console.log('\n🎉 All tests completed!');
    console.log('💡 If all methods work but automation is not running on Render,');
    console.log('   the issue might be with the deployment or environment variables.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testTwitterAutomation();