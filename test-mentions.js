const TwitterClient = require('./src/twitterClient');
require('dotenv').config();

async function testMentions() {
  console.log('🔍 Testing mention detection...');
  
  const twitterClient = new TwitterClient();
  
  try {
    // Test connection first
    const me = await twitterClient.readWriteClient.currentUser();
    console.log('✅ Twitter connection successful');
    console.log('User ID:', process.env.TWITTER_USER_ID);
    console.log('Username:', me.screen_name || me.username || me.data?.username);
    
    // Test mention detection
    await twitterClient.checkAndReplyToMentions();
    
  } catch (error) {
    console.error('❌ Error testing mentions:', error);
    
    if (error.code === 401) {
      console.log('🔑 Authentication issue - check API credentials');
    } else if (error.code === 429) {
      console.log('⏳ Rate limited - try again later');
    } else if (error.code === 403) {
      console.log('🚫 Forbidden - check app permissions');
    }
  }
}

testMentions();