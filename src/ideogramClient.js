const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class IdeogramClient {
  constructor() {
    this.apiKey = process.env.IDEOGRAM_API_KEY;
    this.baseURL = 'https://api.ideogram.ai/v1/ideogram-v3/generate'; // Correct API v3 endpoint
    
    if (!this.apiKey) {
      console.error('❌ IDEOGRAM_API_KEY not found in environment variables');
    } else {
      console.log('✅ Ideogram v3 client initialized for meme generation with character references');
    }
  }

  async generateMeme(prompt, style = 'meme') {
    if (!this.apiKey) {
      throw new Error('Ideogram API key not configured');
    }

    try {
      console.log(`🎨 Generating meme with Ideogram v3: "${prompt}"`);
      
      // Enhance prompt for meme generation
      const memePrompt = this.enhancePromptForMemes(prompt);
      
      // Create FormData for multipart request
      const formData = new FormData();
      
      // Add basic parameters
      formData.append('prompt', memePrompt);
      formData.append('aspect_ratio', '1x1'); // Square format for memes
      formData.append('rendering_speed', 'TURBO'); // Fast generation
      formData.append('magic_prompt', 'AUTO'); // Let Ideogram enhance
      formData.append('style_type', style === 'professional' ? 'DESIGN' : 'AUTO');
      
      // Add character reference images if available
      const characterImages = this.getCharacterReferenceFiles();
      if (characterImages.length > 0) {
        console.log(`📷 Adding ${characterImages.length} character reference images`);
        for (const imagePath of characterImages) {
          if (fs.existsSync(imagePath)) {
            formData.append('character_reference_images', fs.createReadStream(imagePath), {
              filename: path.basename(imagePath),
              contentType: 'image/jpeg'
            });
          }
        }
      } else {
        console.log('💭 No character references - generating text-based meme');
      }
      
      const response = await axios.post(this.baseURL, formData, {
        headers: {
          'Api-Key': this.apiKey,
          ...formData.getHeaders()
        },
        timeout: 60000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      if (response.data && response.data.data && response.data.data.length > 0) {
        const imageUrl = response.data.data[0].url;
        console.log('✅ Meme generated successfully with Ideogram v3');
        return {
          success: true,
          imageUrl: imageUrl,
          prompt: memePrompt
        };
      } else {
        throw new Error('No image data returned from Ideogram v3');
      }

    } catch (error) {
      console.error('❌ Ideogram v3 API Error:', error.response?.data || error.message);
      throw new Error(`Failed to generate meme: ${error.message}`);
    }
  }

  // Get character reference image files for direct upload
  getCharacterReferenceFiles() {
    const referenceFiles = [];
    const baseDir = path.join(process.cwd(), 'meme reference images');
    
    try {
      // Get Character 1 images
      const char1Dir = path.join(baseDir, '1');
      if (fs.existsSync(char1Dir)) {
        const char1Files = fs.readdirSync(char1Dir)
          .filter(f => f.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/))
          .slice(0, 1); // Ideogram v3 supports 1 character reference image
        
        for (const file of char1Files) {
          referenceFiles.push(path.join(char1Dir, file));
        }
      }
      
      console.log(`📷 Found ${referenceFiles.length} character reference files to upload`);
    } catch (error) {
      console.log('⚠️ No character reference images found, using text-only generation');
    }
    
    return referenceFiles;
  }

  // Initialize character references (now done during generation)
  async initializeCharacterReferences() {
    console.log('📷 Character reference system ready - using direct file uploads with Ideogram v3');
    const referenceFiles = this.getCharacterReferenceFiles();
    if (referenceFiles.length > 0) {
      console.log('✅ Character reference system ACTIVE - memes will use your images!');
      return true;
    } else {
      console.log('💭 No character reference images found - using text-only generation');
      return false;
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
      let prompt = `Main FUSAKA character and Secondary FUSAKA character together in ${situation}. Both characters interacting harmoniously with complementary designs and coordinated expressions. Dynamic duo composition with balanced visual weight`;
      if (cryptoContext) {
        prompt += ` related to ${cryptoContext}`;
      }
      prompt += ', crypto meme style, funny internet meme format, two characters with great chemistry and visual synergy';
      const result = await this.generateMeme(prompt, 'meme');
      return { ...result, selectedCharacter: 'BOTH CHARACTERS' };
    }

    // Custom FUSAKA character descriptions based on reference images
    const characterPrompts = {
      'character1': 'Main FUSAKA character with distinctive design elements, consistent art style, and recognizable visual features from the reference collection. Vibrant colors, expressive personality, and crypto-themed aesthetic',
      'character2': 'Secondary FUSAKA character with unique appearance and complementary design to Character 1. Distinctive visual characteristics that pair well in duo scenes while maintaining individual identity',
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

    const result = await this.generateMeme(prompt, 'meme');
    return { ...result, selectedCharacter: character.toUpperCase() };
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