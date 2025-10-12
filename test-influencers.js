const TwitterClient = require('./src/twitterClient');
require('dotenv').config();

async function testInfluencerMonitoring() {
  console.log('🎯 Testing influencer monitoring system...');
  
  const twitterClient = new TwitterClient();
  
  try {
    // Test connection first
    const me = await twitterClient.readWriteClient.currentUser();
    console.log('✅ Twitter connection successful');
    console.log('User ID:', process.env.TWITTER_USER_ID);
    console.log('Username:', me.screen_name || me.username || me.data?.username);
    
    // Test influencer monitoring
    console.log('\n🎯 Testing influencer monitoring...');
    
    // Get engagement stats
    const stats = twitterClient.influencerMonitor.getEngagementStats();
    console.log('📊 Engagement Statistics:');
    console.log(`   • Total influencers: ${stats.totalInfluencers}`);
    console.log(`   • Engaged today: ${stats.engagedToday}`);
    console.log(`   • Total engagements today: ${stats.totalEngagementsToday}`);
    console.log(`   • Available engagements: ${stats.availableEngagements}`);
    
    // Test monitoring one high-priority influencer (Vitalik)
    console.log('\n🔍 Testing Vitalik monitoring...');
    await twitterClient.influencerMonitor.monitorInfluencer('295218901');
    
    // Test monitoring DeFiLlama
    console.log('\n🔍 Testing DeFiLlama monitoring...');
    await twitterClient.influencerMonitor.monitorInfluencer('1438761000649113600');
    
    console.log('\n✅ Influencer monitoring test complete!');
    
  } catch (error) {
    console.error('❌ Error testing influencer monitoring:', error);
    
    if (error.code === 401) {
      console.log('🔑 Authentication issue - check API credentials');
    } else if (error.code === 429) {
      console.log('⏳ Rate limited - try again later');
    } else if (error.code === 403) {
      console.log('🚫 Forbidden - check app permissions');
    }
  }
}

testInfluencerMonitoring();