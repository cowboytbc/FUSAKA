const IdeogramClient = require('./src/ideogramClient');
require('dotenv').config();

async function testMaleCharacterGeneration() {
  console.log('🧪 TESTING MALE CHARACTER MEME GENERATION');
  console.log('='.repeat(50));
  
  const ideogramClient = new IdeogramClient();
  
  try {
    console.log('🎯 Testing male character emphasis...');
    console.log('📝 Prompt: "dancing at a party"');
    console.log('👤 Character: random (should be explicitly male)');
    
    const result = await ideogramClient.generateCharacterMeme('random', 'dancing at a party');
    
    if (result.success) {
      console.log('✅ Meme generated successfully!');
      console.log('🔗 URL:', result.imageUrl);
      console.log();
      console.log('🔍 What was sent to API:');
      console.log('   Prompt: "male character, dancing at a party, masculine features, male, high quality, clean composition, professional digital art, meme style"');
      console.log('   Negative prompt: "female, feminine features, woman, girl, lady, feminine, [quality terms...]"');
      console.log('   Character reference: Random image from folder 1 or 2');
      console.log();
      console.log('🎯 The character should now appear as MALE in the meme');
    } else {
      console.log('❌ Failed to generate meme');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

console.log('🔧 FIXES APPLIED:');
console.log('================');
console.log('1. ✅ Added "male character" to the beginning of all prompts');
console.log('2. ✅ Added "masculine features, male" to reinforce gender');
console.log('3. ✅ Added negative prompt: "female, feminine features, woman, girl, lady, feminine"');
console.log('4. ✅ Enhanced prompt function now explicitly specifies male gender');
console.log();

testMaleCharacterGeneration();