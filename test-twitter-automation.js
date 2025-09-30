// Test Twitter bot automated posting logic
require('dotenv').config();
const TwitterClient = require('./src/twitterClient');

async function testAutomatedLogic() {
  try {
    console.log('🧪 Testing Twitter automated posting logic...\n');
    
    // Initialize Twitter client
    const twitterClient = new TwitterClient();
    
    console.log('📊 Current Config:');
    console.log('- enabled:', twitterClient.config.enabled);
    console.log('- autoMemeTweets:', twitterClient.config.autoMemeTweets);
    console.log('- priceUpdates:', twitterClient.config.priceUpdates);
    console.log('- marketUpdates:', twitterClient.config.marketUpdates);
    console.log('- autoTweetInterval:', twitterClient.config.autoTweetInterval, 'minutes');
    
    // Check if automated tweets would start
    const shouldStart = twitterClient.config.autoMemeTweets || 
                       twitterClient.config.priceUpdates || 
                       twitterClient.config.marketUpdates;
    
    console.log('\n🔍 Automated Tweet Analysis:');
    console.log('- Should start automated tweets:', shouldStart);
    
    if (shouldStart) {
      const intervalMs = twitterClient.config.autoTweetInterval * 60 * 1000;
      const intervalHours = intervalMs / (1000 * 60 * 60);
      console.log(`- Would post every ${intervalHours} hours`);
      
      // Simulate the random logic
      console.log('\n🎲 Simulating post type selection (10 tests):');
      for (let i = 0; i < 10; i++) {
        const rand = Math.random();
        let postType;
        
        if (rand < 0.4 && twitterClient.config.autoMemeTweets) {
          postType = 'Meme Post (40%)';
        } else if (rand < 0.7 && twitterClient.config.priceUpdates) {
          postType = 'Price Update (30%)';
        } else if (twitterClient.config.marketUpdates) {
          postType = 'Market Insight (30%)';
        } else {
          postType = 'No post (conditions not met)';
        }
        
        console.log(`${i + 1}. Random: ${rand.toFixed(3)} → ${postType}`);
      }
    } else {
      console.log('❌ Automated tweets would NOT start - all posting types disabled');
    }
    
    // Test a single post manually
    console.log('\n🚀 Testing manual price post...');
    await twitterClient.postEngagingPriceUpdate();
    console.log('✅ Manual post test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAutomatedLogic();