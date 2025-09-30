// Test improved meme generation
require('dotenv').config();

const IdeogramClient = require('./src/ideogramClient');

async function testImprovedMemes() {
  try {
    console.log('🎨 Testing improved meme generation...');
    
    const ideogram = new IdeogramClient();
    
    // Test different types of memes
    const testPrompts = [
      'diamond hands HODLing through the dip',
      'celebrating ETH hitting new ATH',
      'when you buy the dip and it keeps dipping',
      'explaining crypto to normies',
      'checking portfolio after market crash'
    ];
    
    for (let i = 0; i < testPrompts.length; i++) {
      const prompt = testPrompts[i];
      console.log(`\n🎯 Test ${i + 1}: "${prompt}"`);
      
      try {
        const result = await ideogram.generateCharacterMeme('character1', prompt, 'crypto');
        
        if (result.success) {
          console.log('✅ Meme generated successfully!');
          console.log('🔗 URL:', result.imageUrl);
          console.log('💡 Try opening this URL to see the quality improvement!');
        } else {
          console.log('❌ Meme generation failed');
        }
        
        // Wait between tests to avoid rate limits
        if (i < testPrompts.length - 1) {
          console.log('⏳ Waiting 10 seconds before next test...');
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
        
      } catch (error) {
        console.error(`❌ Error with test ${i + 1}:`, error.message);
      }
    }
    
    console.log('\n🎉 Meme quality test completed!');
    console.log('💡 The new settings should produce much cleaner, professional-looking memes');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testImprovedMemes();