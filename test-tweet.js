const TwitterClient = require('./src/twitterClient');

async function testTweet() {
  try {
    console.log('🔍 Testing Twitter posting...');
    
    const client = new TwitterClient();
    
    // Test simple tweet
    const testMessage = `🤖 FUSAKA AI Test Tweet - ${new Date().toLocaleTimeString()}

Testing automated posting functionality!

#FUSAKA #Test`;

    console.log('📝 Test tweet content:');
    console.log(testMessage);
    console.log(`📏 Length: ${testMessage.length} characters`);
    
    if (testMessage.length <= 280) {
      console.log('✅ Character count OK, posting...');
      const result = await client.readWriteClient.v2.tweet({ text: testMessage });
      console.log('🎉 Tweet posted successfully!');
      console.log('📊 Result:', result.data);
    } else {
      console.log('❌ Tweet too long!');
    }
    
  } catch (error) {
    console.error('❌ Error testing tweet:', error);
    console.error('Error details:', error.message);
    if (error.errors) {
      console.error('API errors:', error.errors);
    }
  }
}

testTweet();