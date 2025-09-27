const axios = require('axios');

class IdeogramClient {
  constructor() {
    this.apiKey = process.env.IDEOGRAM_API_KEY;
    this.baseURL = 'https://api.ideogram.ai/generate';
    this.uploadURL = 'https://api.ideogram.ai/images/upload';
    
    // Character reference image IDs (will be populated after upload)
    this.characterImageRefs = {
      character1: [], // Will store uploaded image IDs for Character 1
      character2: []  // Will store uploaded image IDs for Character 2
    };
    
    if (!this.apiKey) {
      console.error('❌ IDEOGRAM_API_KEY not found in environment variables');
    } else {
      console.log('✅ Ideogram client initialized for meme generation with image references');
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
      
      // Prepare image request with reference images if available
      const imageRequest = {
        prompt: memePrompt,
        aspect_ratio: "ASPECT_1_1", // Square format perfect for memes
        model: "V_2", // V_2 supports style_type parameter
        magic_prompt_option: "AUTO", // Let Ideogram enhance the prompt
        style_type: style === 'professional' ? 'DESIGN' : 'AUTO'
      };
      
      // Add image references if we have character images uploaded
      if (this.characterImageRefs.character1.length > 0 || this.characterImageRefs.character2.length > 0) {
        imageRequest.image_references = [];
        
        // Add random Character 1 reference if available
        if (this.characterImageRefs.character1.length > 0) {
          const randomChar1 = this.characterImageRefs.character1[Math.floor(Math.random() * this.characterImageRefs.character1.length)];
          imageRequest.image_references.push({
            image_id: randomChar1,
            weight: 0.8 // Strong influence on generation
          });
        }
        
        // Add random Character 2 reference if available and prompt suggests both characters
        if (this.characterImageRefs.character2.length > 0 && (memePrompt.toLowerCase().includes('both') || memePrompt.toLowerCase().includes('together'))) {
          const randomChar2 = this.characterImageRefs.character2[Math.floor(Math.random() * this.characterImageRefs.character2.length)];
          imageRequest.image_references.push({
            image_id: randomChar2,
            weight: 0.8 // Strong influence on generation
          });
        }
      }
      
      const response = await axios.post(this.baseURL, {
        image_request: imageRequest
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

  // Upload reference images for characters
  async uploadReferenceImages() {
    try {
      console.log('📷 Uploading character reference images...');
      
      const fs = require('fs');
      const path = require('path');
      const FormData = require('form-data');
      
      // Upload Character 1 images
      const char1Dir = path.join(process.cwd(), 'meme reference images', '1');
      const char1Files = fs.readdirSync(char1Dir).filter(f => f.endsWith('.jpg'));
      
      for (const file of char1Files) {
        const filePath = path.join(char1Dir, file);
        const formData = new FormData();
        formData.append('image', fs.createReadStream(filePath));
        
        const uploadResponse = await axios.post(this.uploadURL, formData, {
          headers: {
            'Api-Key': this.apiKey,
            ...formData.getHeaders()
          },
          timeout: 30000
        });
        
        if (uploadResponse.data && uploadResponse.data.image_id) {
          this.characterImageRefs.character1.push(uploadResponse.data.image_id);
          console.log(`✅ Uploaded Character 1 reference: ${file}`);
        }
      }
      
      // Upload Character 2 images
      const char2Dir = path.join(process.cwd(), 'meme reference images', '2');
      const char2Files = fs.readdirSync(char2Dir).filter(f => f.endsWith('.jpg'));
      
      for (const file of char2Files) {
        const filePath = path.join(char2Dir, file);
        const formData = new FormData();
        formData.append('image', fs.createReadStream(filePath));
        
        const uploadResponse = await axios.post(this.uploadURL, formData, {
          headers: {
            'Api-Key': this.apiKey,
            ...formData.getHeaders()
          },
          timeout: 30000
        });
        
        if (uploadResponse.data && uploadResponse.data.image_id) {
          this.characterImageRefs.character2.push(uploadResponse.data.image_id);
          console.log(`✅ Uploaded Character 2 reference: ${file}`);
        }
      }
      
      console.log(`🎨 Character references uploaded: ${this.characterImageRefs.character1.length} for Char1, ${this.characterImageRefs.character2.length} for Char2`);
      return true;
      
    } catch (error) {
      console.error('❌ Error uploading reference images:', error.message);
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
      return await this.generateMeme(prompt, 'meme');
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