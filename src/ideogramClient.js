const axios = require('axios');

class IdeogramClient {
  constructor() {
    this.apiKey = process.env.IDEOGRAM_API_KEY;
    this.baseURL = 'https://api.ideogram.ai/generate';
    
    if (!this.apiKey) {
      console.error('❌ IDEOGRAM_API_KEY not found in environment variables');
    } else {
      console.log('✅ Ideogram client initialized for meme generation');
    }
  }

  async generateMeme(prompt, style = 'meme') {
    if (!this.apiKey) {
      throw new Error('Ideogram API key not configured');
    }

    try {
      console.log(`🎨 Generating meme: "${prompt}"`);
      
      // Enhance prompt for meme generation
      const memePrompt = this.enhancePromptForMemes(prompt);
      
      const response = await axios.post(this.baseURL, {
        image_request: {
          prompt: memePrompt,
          aspect_ratio: "ASPECT_1_1", // Square format perfect for memes
          model: "V_1_5", // Cost-optimized model (50% cheaper than V_2)
          magic_prompt_option: "AUTO", // Let Ideogram enhance the prompt
          style_type: style === 'professional' ? 'DESIGN' : 'AUTO'
        }
      }, {
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // Image generation takes longer
      });

      if (response.data && response.data.data && response.data.data.length > 0) {
        const imageUrl = response.data.data[0].url;
        console.log('✅ Meme generated successfully');
        return {
          success: true,
          imageUrl: imageUrl,
          prompt: memePrompt
        };
      } else {
        throw new Error('No image data returned from Ideogram');
      }

    } catch (error) {
      console.error('❌ Ideogram API Error:', error.response?.data || error.message);
      throw new Error(`Failed to generate meme: ${error.message}`);
    }
  }

  enhancePromptForMemes(originalPrompt) {
    // Meme style enhancements
    const memeStyles = [
      "internet meme style",
      "funny meme format", 
      "viral meme aesthetic",
      "classic meme template",
      "crypto meme style"
    ];

    const cryptoMemeElements = [
      "diamond hands 💎🙌",
      "rocket ship 🚀", 
      "moon background 🌙",
      "chart patterns",
      "wojak character",
      "pepe frog",
      "doge style",
      "Chad character"
    ];

    // Check if it's FUSAKA related
    const isFusakaRelated = /fusaka|ethereum|eth|crypto|blockchain/i.test(originalPrompt);
    
    let enhancedPrompt = originalPrompt;

    // Add meme styling
    const randomStyle = memeStyles[Math.floor(Math.random() * memeStyles.length)];
    enhancedPrompt += `, ${randomStyle}`;

    // Add crypto elements if relevant
    if (isFusakaRelated) {
      const randomCryptoElement = cryptoMemeElements[Math.floor(Math.random() * cryptoMemeElements.length)];
      enhancedPrompt += `, featuring ${randomCryptoElement}`;
    }

    // Add text overlay instruction
    enhancedPrompt += ", with bold meme text overlay, high contrast, viral social media format";

    return enhancedPrompt;
  }

  // Generate character-based memes with weighted selection
  async generateCharacterMeme(character, situation, cryptoContext = '') {
    // Character selection probabilities
    const selectionWeights = {
      'both_characters': 0.50,    // 50% chance for both characters together
      'character1_solo': 0.325,   // 32.5% chance for Character 1 solo (65% of remaining 50%)
      'character2_solo': 0.175,   // 17.5% chance for Character 2 solo (35% of remaining 50%)
    };

    // If user just says "random" or doesn't specify, use weighted selection including duo option
    if (character.toLowerCase() === 'random' || character.toLowerCase() === 'any') {
      const rand = Math.random();
      
      if (rand < selectionWeights.both_characters) {
        character = 'both';
        console.log(`🎲 Weighted selection chose: BOTH characters together (${Math.round(rand * 100)}% roll)`);
      } else if (rand < selectionWeights.both_characters + selectionWeights.character1_solo) {
        character = 'character1';
        console.log(`🎲 Weighted selection chose: Character 1 solo (${Math.round(rand * 100)}% roll)`);
      } else {
        character = 'character2';
        console.log(`🎲 Weighted selection chose: Character 2 solo (${Math.round(rand * 100)}% roll)`);
      }
    }

    // Handle both characters together
    if (character.toLowerCase().includes('both') || character.toLowerCase().includes('together')) {
      const prompt = `Character 1 and Character 2 together in ${situation}`;
      if (cryptoContext) {
        prompt += ` related to ${cryptoContext}`;
      }
      prompt += ', crypto meme style, funny internet meme format, two characters interacting';
      return await this.generateMeme(prompt, 'meme');
    }

    // Character descriptions (will be updated with your reference images)
    const characterPrompts = {
      'character1': 'Character 1 from reference images with distinctive style and features',
      'character2': 'Character 2 from reference images with unique appearance and characteristics',
      'vitalik': 'Vitalik Buterin with his characteristic smile and ethereum hoodie',
      'wojak': 'Wojak character with emotional expression',
      'pepe': 'Pepe the frog character',
      'doge': 'Doge shiba inu dog with comic sans text',
      'chad': 'Gigachad character with confident pose',
      'cope': 'Cope wojak character looking distressed',
      'diamond_hands': 'Diamond hands character holding cryptocurrencies',
      'paper_hands': 'Paper hands character panic selling'
    };

    const characterDesc = characterPrompts[character.toLowerCase()] || `${character} character`;
    
    let prompt = `${characterDesc} in ${situation}`;
    
    if (cryptoContext) {
      prompt += ` related to ${cryptoContext}`;
    }

    prompt += ', crypto meme style, funny internet meme format';

    return await this.generateMeme(prompt, 'meme');
  }

  // Get weighted character recommendation
  getWeightedCharacter() {
    const rand = Math.random();
    return rand < 0.65 ? 'character1' : 'character2';
  }

  // Test the API connection
  async testConnection() {
    try {
      // Just check if we have the API key for now
      if (!this.apiKey) {
        return false;
      }
      console.log('✅ Ideogram API key configured');
      return true;
    } catch (error) {
      console.error('❌ Ideogram connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = IdeogramClient;