const SmartTaggingSystem = require('./src/smartTaggingSystem');

// Test the Smart Tagging System
async function testSmartTagging() {
  console.log('🧪 Testing Smart Tagging System...\n');
  
  const smartTagger = new SmartTaggingSystem();
  
  // Test different tweet types and content
  const testCases = [
    {
      content: 'Ethereum price just hit $3,500! DeFi protocols seeing massive volume increases.',
      type: 'price',
      description: 'Price update tweet'
    },
    {
      content: 'Layer 2 rollups are revolutionizing blockchain scalability. The future is multi-chain!',
      type: 'technical',
      description: 'Technical insight tweet'
    },
    {
      content: 'New developers should start with Solidity basics and understand smart contract security.',
      type: 'education',
      description: 'Educational content tweet'
    },
    {
      content: 'Uniswap V4 hooks will enable revolutionary DeFi innovations we haven\'t seen before.',
      type: 'ecosystem',
      description: 'Ecosystem update tweet'
    },
    {
      content: 'In 2030, Ethereum will power most of the world\'s financial infrastructure.',
      type: 'future',
      description: 'Future vision tweet'
    }
  ];
  
  for (const test of testCases) {
    console.log(`📝 ${test.description}:`);
    console.log(`Original: ${test.content}`);
    
    const taggedTweet = smartTagger.addTagsToTweet(test.content, test.type);
    console.log(`Tagged:   ${taggedTweet}`);
    
    // Show analysis
    const analysis = smartTagger.analyzeContent(test.content);
    console.log(`Analysis: Categories detected: ${analysis.categories.join(', ')}`);
    console.log(`          Event tags: ${analysis.eventTags.length > 0 ? analysis.eventTags.join(', ') : 'none'}\n`);
  }
  
  // Test influencer reply tagging
  console.log('🎯 Testing Influencer Reply Tagging:\n');
  
  const replyTests = [
    {
      content: 'Great insights on Ethereum scaling! Looking forward to more updates.',
      influencer: 'VitalikButerin',
      description: 'Reply to Vitalik'
    },
    {
      content: 'DeFi TVL numbers are impressive! Thanks for the transparency.',
      influencer: 'DefiLlama',
      description: 'Reply to DeFiLlama'
    }
  ];
  
  for (const test of replyTests) {
    console.log(`💬 ${test.description}:`);
    console.log(`Original: ${test.content}`);
    
    const taggedReply = smartTagger.getInfluencerReplyTags(test.content, test.influencer);
    console.log(`Tagged:   ${taggedReply}\n`);
  }
  
  // Show system stats
  const stats = smartTagger.getTaggingStats();
  console.log('📊 Smart Tagging System Stats:');
  console.log(`   • Total Profiles: ${stats.totalProfiles}`);
  console.log(`   • Categories: ${stats.categories}`);
  console.log(`   • Keywords: ${stats.keywords}`);
  console.log(`   • Special Events: ${stats.specialEvents}`);
  
  console.log('\n✅ Smart Tagging System testing complete!');
}

// Run the test
testSmartTagging().catch(console.error);