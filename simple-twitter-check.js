// Simple Twitter automation test
require('dotenv').config();

console.log('🔍 Twitter Bot Configuration Check:\n');

console.log('Environment Variables:');
console.log('- TWITTER_ENABLED:', process.env.TWITTER_ENABLED);
console.log('- TWITTER_AUTO_MEME_TWEETS:', process.env.TWITTER_AUTO_MEME_TWEETS);
console.log('- TWITTER_PRICE_UPDATES:', process.env.TWITTER_PRICE_UPDATES);  
console.log('- TWITTER_MARKET_UPDATES:', process.env.TWITTER_MARKET_UPDATES);
console.log('- TWITTER_AUTO_TWEET_INTERVAL:', process.env.TWITTER_AUTO_TWEET_INTERVAL);

// Check boolean conversion
const enabled = process.env.TWITTER_ENABLED === 'true';
const memes = process.env.TWITTER_AUTO_MEME_TWEETS === 'true';
const price = process.env.TWITTER_PRICE_UPDATES === 'true';
const market = process.env.TWITTER_MARKET_UPDATES === 'true';

console.log('\nParsed Booleans:');
console.log('- enabled:', enabled);
console.log('- memes:', memes);
console.log('- price:', price);  
console.log('- market:', market);

// Check if automation should start
const shouldStart = memes || price || market;
console.log('\nAutomation Logic:');
console.log('- shouldStart:', shouldStart);

if (shouldStart && enabled) {
  console.log('✅ Bot SHOULD be posting automatically every', process.env.TWITTER_AUTO_TWEET_INTERVAL, 'minutes');
  console.log('📊 Post types enabled:');
  if (memes) console.log('  - Meme posts (40%)');
  if (price) console.log('  - Price updates (30%)');
  if (market) console.log('  - Market insights (30%)');
} else {
  console.log('❌ Bot will NOT post automatically');
  if (!enabled) console.log('  Reason: TWITTER_ENABLED is false');
  if (!shouldStart) console.log('  Reason: No post types enabled');
}