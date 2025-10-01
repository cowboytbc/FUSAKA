require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

async function debugTwitterNow() {
    console.log('🔍 TWITTER DEBUG - FINDING THE EXACT PROBLEM 🔍\n');
    
    // 1. CHECK ENVIRONMENT VARIABLES
    console.log('📋 STEP 1: Environment Variables Check');
    console.log('=====================================');
    
    const requiredVars = [
        'TWITTER_API_KEY',
        'TWITTER_API_SECRET', 
        'TWITTER_ACCESS_TOKEN',
        'TWITTER_ACCESS_TOKEN_SECRET',
        'TWITTER_BEARER_TOKEN',
        'TWITTER_USER_ID',
        'TWITTER_USERNAME'
    ];
    
    let missingVars = [];
    requiredVars.forEach(varName => {
        if (process.env[varName]) {
            console.log(`✅ ${varName}: ${process.env[varName].substring(0, 10)}...`);
        } else {
            console.log(`❌ ${varName}: MISSING!`);
            missingVars.push(varName);
        }
    });
    
    if (missingVars.length > 0) {
        console.log(`\n🚨 PROBLEM FOUND: Missing variables: ${missingVars.join(', ')}`);
        return;
    }
    
    // 2. CHECK USER ID FORMAT
    console.log('\n📋 STEP 2: User ID Validation');
    console.log('===============================');
    const userId = process.env.TWITTER_USER_ID;
    const username = process.env.TWITTER_USERNAME;
    
    console.log(`User ID: ${userId}`);
    console.log(`Username: ${username}`);
    
    if (userId === '1971049502456020998') {
        console.log('❌ PROBLEM FOUND: You still have the OLD WRONG User ID!');
        console.log('✅ SOLUTION: Change TWITTER_USER_ID to 1970849515512147969');
        return;
    }
    
    if (userId === '1970849515512147969') {
        console.log('✅ User ID is correct!');
    } else {
        console.log('⚠️  User ID might be wrong. Expected: 1970849515512147969');
    }
    
    // 3. TEST TWITTER API CONNECTION
    console.log('\n📋 STEP 3: Twitter API Connection Test');
    console.log('=======================================');
    
    try {
        const client = new TwitterApi({
            appKey: process.env.TWITTER_API_KEY,
            appSecret: process.env.TWITTER_API_SECRET,
            accessToken: process.env.TWITTER_ACCESS_TOKEN,
            accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
        });
        
        console.log('🔄 Testing API connection...');
        
        // Test 1: Verify credentials
        try {
            const me = await client.v2.me();
            console.log('✅ API Connection: SUCCESS');
            console.log(`✅ Authenticated as: ${me.data.username} (${me.data.id})`);
            
            if (me.data.id !== userId) {
                console.log('❌ PROBLEM FOUND: API credentials belong to different user!');
                console.log(`   API User ID: ${me.data.id}`);
                console.log(`   Expected: ${userId}`);
                return;
            }
            
        } catch (error) {
            console.log('❌ API Connection: FAILED');
            console.log(`   Error: ${error.message}`);
            
            if (error.message.includes('Unauthorized')) {
                console.log('🚨 PROBLEM: Invalid API credentials');
                console.log('   Check your Twitter API keys in .env file');
                return;
            }
        }
        
        // Test 2: Try to get recent tweets
        console.log('\n🔄 Testing tweet retrieval...');
        try {
            const tweets = await client.v2.userTimeline(userId, { max_results: 5 });
            if (tweets.data && tweets.data.length > 0) {
                console.log(`✅ Found ${tweets.data.length} recent tweets`);
                console.log(`   Latest: "${tweets.data[0].text.substring(0, 50)}..."`);
            } else {
                console.log('⚠️  No recent tweets found');
            }
        } catch (error) {
            console.log('❌ Tweet retrieval failed');
            console.log(`   Error: ${error.message}`);
        }
        
        // Test 3: Check rate limits
        console.log('\n🔄 Checking rate limits...');
        try {
            const rateLimits = await client.v1.getRateLimitStatuses();
            const tweetLimit = rateLimits.resources.statuses['/statuses/update'];
            console.log(`✅ Tweet rate limit: ${tweetLimit.remaining}/${tweetLimit.limit} remaining`);
            
            if (tweetLimit.remaining === 0) {
                const resetTime = new Date(tweetLimit.reset * 1000);
                console.log(`⚠️  Rate limited until: ${resetTime}`);
            }
        } catch (error) {
            console.log('⚠️  Could not check rate limits');
        }
        
        // Test 4: Try a test tweet (DRY RUN)
        console.log('\n🔄 Testing tweet creation (dry run)...');
        const testTweet = `🤖 FUSAKA Bot Test ${Date.now()}`;
        console.log(`   Test tweet would be: "${testTweet}"`);
        console.log('   (Not actually posting - this is just a test)');
        
    } catch (error) {
        console.log('❌ CRITICAL ERROR in Twitter API setup');
        console.log(`   Error: ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
    }
    
    // 4. CHECK FOR COMMON ISSUES
    console.log('\n📋 STEP 4: Common Issues Check');
    console.log('===============================');
    
    // Check if running locally vs production
    if (process.env.NODE_ENV !== 'production') {
        console.log('⚠️  Running in development mode');
        console.log('   Make sure Render environment variables are set correctly');
    }
    
    // Check for missing dependencies
    try {
        require('twitter-api-v2');
        console.log('✅ twitter-api-v2 package installed');
    } catch (error) {
        console.log('❌ twitter-api-v2 package missing');
        console.log('   Run: npm install twitter-api-v2');
    }
}

// Run the debug
console.log('Starting comprehensive Twitter debug...\n');
debugTwitterNow()
    .then(() => {
        console.log('\n🏁 DEBUG COMPLETE');
        console.log('Check the results above to identify the issue.');
    })
    .catch(error => {
        console.log('\n💥 DEBUG SCRIPT ERROR:');
        console.log(error);
    });