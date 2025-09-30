// Diagnostic script to check Twitter User ID configuration issue
require('dotenv').config();

console.log('🔍 TWITTER USER ID DIAGNOSTIC');
console.log('='.repeat(50));

const userId = process.env.TWITTER_USER_ID;
const username = process.env.TWITTER_USERNAME;

console.log('Raw values:');
console.log(`TWITTER_USER_ID: "${userId}"`);
console.log(`TWITTER_USERNAME: "${username}"`);
console.log();

console.log('Value analysis:');
console.log(`User ID length: ${userId ? userId.length : 'undefined'}`);
console.log(`User ID type: ${typeof userId}`);
console.log(`Contains letters: ${userId ? /[a-zA-Z]/.test(userId) : 'N/A'}`);
console.log(`Is numeric: ${userId ? /^\d+$/.test(userId) : 'N/A'}`);
console.log();

if (userId) {
  console.log('Character breakdown:');
  for (let i = 0; i < userId.length; i++) {
    const char = userId[i];
    const code = char.charCodeAt(0);
    console.log(`  [${i}] "${char}" (code: ${code})`);
  }
}

console.log();
console.log('🎯 EXPECTED VALUES:');
console.log('TWITTER_USER_ID should be: "1971049502456020998"');
console.log('TWITTER_USERNAME should be: "fusakaai"');
console.log();

console.log('❌ PROBLEM DETECTED:');
console.log('Your error shows: 1971049502456020998FusakaAi');
console.log('This suggests "FusakaAi" got appended to the user ID');
console.log();

console.log('🔧 SOLUTION:');
console.log('1. Check your Render environment variables');
console.log('2. Make sure TWITTER_USER_ID = 1971049502456020998 (numbers only)');
console.log('3. Make sure TWITTER_USERNAME = fusakaai (separate variable)');
console.log('4. No extra characters or spaces in either variable');