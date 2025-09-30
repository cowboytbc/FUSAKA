// Test meme generation directly
require('dotenv').config();

const IdeogramClient = require('./src/ideogramClient');

async function testMemeGeneration() {
  try {
    console.log('🧪 Testing Telegram meme generation...\n');
    
    const ideogram = new IdeogramClient();
    
    // Test the exact call that Telegram makes
    console.log('🎨 Testing generateCharacterMeme with "random"...');
    
    const result = await ideogram.generateCharacterMeme(
      'random', // Same as Telegram bot uses
      'diamond hands forever', // Test situation
      'FUSAKA and Ethereum' // Test crypto context
    );
    
    console.log('\n📊 Result:');
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('✅ Meme generated successfully!');
      console.log('🔗 Image URL:', result.imageUrl);
      console.log('💡 The meme should be working in Telegram');
    } else {
      console.log('❌ Meme generation failed');
      console.log('Error details:', result);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    
    // Check for specific error types
    if (error.message.includes('API key')) {
      console.log('🔑 Issue: Ideogram API key problem');
    } else if (error.message.includes('Failed to generate')) {
      console.log('🎨 Issue: Ideogram API error');
    } else if (error.message.includes('reference')) {
      console.log('📁 Issue: Character reference files problem');
    }
  }
}

testMemeGeneration();