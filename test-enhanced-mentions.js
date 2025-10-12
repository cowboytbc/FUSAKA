const TwitterClient = require('./src/twitterClient');
require('dotenv').config();

async function testEnhancedMentions() {
  console.log('💬 Testing enhanced mention and reply system...');
  
  const twitterClient = new TwitterClient();
  
  try {
    // Test connection first
    const me = await twitterClient.readWriteClient.currentUser();
    console.log('✅ Twitter connection successful');
    console.log('User ID:', process.env.TWITTER_USER_ID);
    console.log('Username:', me.screen_name || me.username || me.data?.username);
    
    // Test mention detection with enhanced system
    console.log('\n💬 Testing enhanced mention detection...');
    await twitterClient.checkAndReplyToMentions();
    
    // Test reply monitoring with mention prioritization
    console.log('\n💬 Testing reply monitoring with mention priority...');
    await twitterClient.checkAndReplyToComments();
    
    // Show processed mention stats
    console.log('\n📊 Mention Processing Statistics:');
    console.log(`   • Processed mentions tracked: ${twitterClient.processedMentions.size}`);
    console.log(`   • Recent tweets tracked: ${twitterClient.recentTweets.length}`);
    console.log(`   • Tweet reply counts: ${twitterClient.tweetReplyCounts.size}`);
    
    console.log('\n✅ Enhanced mention system test complete!');
    
  } catch (error) {
    console.error('❌ Error testing enhanced mentions:', error);
    
    if (error.code === 401) {
      console.log('🔑 Authentication issue - check API credentials');
    } else if (error.code === 429) {
      console.log('⏳ Rate limited - try again later');
    } else if (error.code === 403) {
      console.log('🚫 Forbidden - check app permissions');
    }
  }
}

testEnhancedMentions();