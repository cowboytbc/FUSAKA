const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

async function findMyUserId() {
  console.log('🔍 FINDING YOUR TWITTER USER ID');
  console.log('='.repeat(40));
  
  try {
    // Initialize Twitter client
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    // Method 1: Get current user (most reliable)
    console.log('📊 Method 1: Using currentUser() API...');
    const me = await client.v2.me();
    console.log(`✅ Your User ID: ${me.data.id}`);
    console.log(`✅ Your Username: @${me.data.username}`);
    console.log(`✅ Your Display Name: ${me.data.name}`);
    console.log();

    // Method 2: Verify with username lookup
    const username = process.env.TWITTER_USERNAME || 'fusakaai';
    console.log(`📊 Method 2: Looking up username "@${username}"...`);
    const userByName = await client.v2.userByUsername(username);
    console.log(`✅ Verified User ID: ${userByName.data.id}`);
    console.log(`✅ Verified Username: @${userByName.data.username}`);
    console.log();

    // Check if they match
    if (me.data.id === userByName.data.id) {
      console.log('✅ PERFECT MATCH! Both methods return the same User ID');
    } else {
      console.log('⚠️ WARNING: User IDs don\'t match. Check your username.');
    }

    console.log();
    console.log('🎯 COPY THIS FOR YOUR RENDER ENVIRONMENT:');
    console.log('='.repeat(40));
    console.log(`TWITTER_USER_ID=${me.data.id}`);
    console.log(`TWITTER_USERNAME=${me.data.username}`);
    console.log();
    
    // Current .env check
    console.log('📋 CURRENT .ENV VALUES:');
    console.log(`TWITTER_USER_ID=${process.env.TWITTER_USER_ID || 'NOT SET'}`);
    console.log(`TWITTER_USERNAME=${process.env.TWITTER_USERNAME || 'NOT SET'}`);
    
    if (process.env.TWITTER_USER_ID === me.data.id) {
      console.log('✅ Your local .env is CORRECT');
    } else {
      console.log('❌ Your local .env needs updating');
    }

  } catch (error) {
    console.error('❌ Error getting user info:', error.message);
    
    if (error.code === 401) {
      console.log('🔧 This means your Twitter API credentials are invalid');
    } else if (error.code === 429) {
      console.log('🔧 Rate limited - try again in a few minutes');
    }
  }
}

// Alternative methods if API doesn't work
console.log('🔍 ALTERNATIVE METHODS TO FIND YOUR USER ID:');
console.log('='.repeat(50));
console.log();
console.log('📱 Method A: Twitter Web (Easy)');
console.log('1. Go to https://twitter.com/fusakaai');
console.log('2. Right-click and "View Page Source"');
console.log('3. Search for "rest_id" - the number after it is your User ID');
console.log();
console.log('🔗 Method B: Online Tools');
console.log('1. Go to https://tweeterid.com/');
console.log('2. Enter your username: fusakaai');
console.log('3. It will show your User ID');
console.log();
console.log('📊 Method C: Browser Developer Tools');
console.log('1. Go to https://twitter.com/fusakaai');
console.log('2. Open Developer Tools (F12)');
console.log('3. Go to Network tab');
console.log('4. Refresh page');
console.log('5. Look for API calls containing your User ID');
console.log();

findMyUserId();