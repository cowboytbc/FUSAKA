// Simple Twitter config test
require('dotenv').config();

console.log('🔍 Twitter Environment Variables:');
console.log('TWITTER_ENABLED:', process.env.TWITTER_ENABLED);
console.log('TWITTER_AUTO_MEME_TWEETS:', process.env.TWITTER_AUTO_MEME_TWEETS);
console.log('TWITTER_PRICE_UPDATES:', process.env.TWITTER_PRICE_UPDATES);
console.log('TWITTER_MARKET_UPDATES:', process.env.TWITTER_MARKET_UPDATES);
console.log('TWITTER_AUTO_TWEET_INTERVAL:', process.env.TWITTER_AUTO_TWEET_INTERVAL);

// Test boolean conversion
const priceUpdates = process.env.TWITTER_PRICE_UPDATES === 'true';
const marketUpdates = process.env.TWITTER_MARKET_UPDATES === 'true';
const memeUpdates = process.env.TWITTER_AUTO_MEME_TWEETS === 'true';

console.log('\n📊 Parsed Config:');
console.log('priceUpdates:', priceUpdates);
console.log('marketUpdates:', marketUpdates);
console.log('memeUpdates:', memeUpdates);

const shouldStart = memeUpdates || priceUpdates || marketUpdates;
console.log('shouldStart automated tweets:', shouldStart);