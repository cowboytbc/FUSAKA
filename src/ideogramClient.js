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

  async generateMeme(prompt, style = 'meme', characterType = 'auto') {
    if (!this.apiKey) {
      throw new Error('Ideogram API key not configured');
    }

    try {
      // Enhance prompt for meme generation
      const memePrompt = this.enhancePromptForMemes(prompt);
      
      // Create FormData for multipart request
      const formData = new FormData();
      
      // Get character reference images first
      const characterImages = this.getCharacterReferenceFiles(characterType);
      
      // Add basic parameters
      formData.append('prompt', memePrompt);
      formData.append('aspect_ratio', '1x1'); // Square format for memes
      formData.append('rendering_speed', 'QUALITY'); // Higher quality generation
      formData.append('magic_prompt', 'OFF'); // Disable magic prompt to keep our specific descriptions
      
      // Use compatible style type for character references
      const hasCharacterRef = characterImages.length > 0;
      const styleType = hasCharacterRef ? 'AUTO' : 'GENERAL'; // AUTO is compatible with character references
      formData.append('style_type', styleType);
      
      formData.append('negative_prompt', 'extra arms, extra legs, multiple arms, multiple legs, third arm, fourth leg, too many limbs, extra limbs, missing limbs, more than two arms, more than two legs, six limbs, eight limbs, spider legs, multiple appendages, boring, corporate, traditional finance, banks, suit and tie, formal business, anti-crypto, regulatory, serious corporate headshot, human hands, fingers, distorted anatomy, deformed face, ugly, blurry, low quality, bad proportions, mutated, disfigured, poorly drawn, amateur art, sketch, draft');
      
      // Add character reference images if available
      if (characterImages.length > 0) {
        for (const imagePath of characterImages) {
          if (fs.existsSync(imagePath)) {
            formData.append('character_reference_images', fs.createReadStream(imagePath), {
              filename: path.basename(imagePath),
              contentType: 'image/jpeg'
            });
          }
        }
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
        return {
          success: true,
          imageUrl: imageUrl
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
  getCharacterReferenceFiles(characterType = 'auto') {
    const referenceFiles = [];
    const baseDir = path.join(process.cwd(), 'meme reference images');
    
    try {
      if (characterType === 'auto') {
        // For auto, randomly pick from Character 1 directory as default
        const char1Dir = path.join(baseDir, '1');
        if (fs.existsSync(char1Dir)) {
          const char1Files = fs.readdirSync(char1Dir)
            .filter(f => f.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/));
          if (char1Files.length > 0) {
            const randomChar1 = char1Files[Math.floor(Math.random() * char1Files.length)];
            referenceFiles.push(path.join(char1Dir, randomChar1));
          }
        }
      } else if (characterType === 'character1') {
        const char1Dir = path.join(baseDir, '1');
        if (fs.existsSync(char1Dir)) {
          const char1Files = fs.readdirSync(char1Dir)
            .filter(f => f.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/));
          if (char1Files.length > 0) {
            const randomChar1 = char1Files[Math.floor(Math.random() * char1Files.length)];
            referenceFiles.push(path.join(char1Dir, randomChar1));
          }
        }
      } else if (characterType === 'character2') {
        const char2Dir = path.join(baseDir, '2');
        if (fs.existsSync(char2Dir)) {
          const char2Files = fs.readdirSync(char2Dir)
            .filter(f => f.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/));
          if (char2Files.length > 0) {
            const randomChar2 = char2Files[Math.floor(Math.random() * char2Files.length)];
            referenceFiles.push(path.join(char2Dir, randomChar2));
          }
        }
      }
      
    } catch (error) {
      // Silent fallback
    }
    
    return referenceFiles;
  }

  // Initialize character references (now done during generation)
  async initializeCharacterReferences() {
    console.log('📷 Character reference system ready - using direct file uploads with Ideogram v3');
    
    // Check all reference directories
    const baseDir = path.join(process.cwd(), 'meme reference images');
    const folders = ['1', '2', '3'];
    let totalImages = 0;
    
    folders.forEach(folder => {
      const dir = path.join(baseDir, folder);
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/));
        totalImages += files.length;
        console.log(`📁 Folder ${folder}: ${files.length} images`);
      }
    });
    
    if (totalImages > 0) {
      console.log('✅ Character reference system ACTIVE - memes will use your images!');
      console.log('💡 Tip: Use folder 3 for images with both characters together');
      return true;
    } else {
      console.log('💭 No character reference images found - using text-only generation');
      return false;
    }
  }

  enhancePromptForMemes(originalPrompt) {
    // Add crypto meme culture elements
    let enhancedPrompt = originalPrompt;
    
    // Crypto meme culture elements
    const cryptoElements = [
      "crypto meme style",
      "internet meme aesthetic", 
      "wojak energy",
      "pepe vibes",
      "diamond hands attitude",
      "to the moon energy",
      "degen culture",
      "crypto Twitter aesthetic"
    ];
    
    const randomCryptoElement = cryptoElements[Math.floor(Math.random() * cryptoElements.length)];
    enhancedPrompt += `, ${randomCryptoElement}`;
    
    // Add quality and crypto-specific style modifiers with anatomy emphasis
    enhancedPrompt += ", meme template style, viral social media format, crypto community approved, high quality digital art, bold and expressive, internet culture, memeable character design, sharp focus, correct anatomy with exactly two arms and two legs, proper limb count, four limbs total";

    return enhancedPrompt;
  }

  // Generate character-based memes with weighted selection
  async generateCharacterMeme(character, situation, cryptoContext = '') {
    // If user just says "random" or doesn't specify, use 50/50 selection between characters
    if (character.toLowerCase() === 'random' || character.toLowerCase() === 'any') {
      const rand = Math.random();
      character = rand < 0.5 ? 'character1' : 'character2';
    }

    // Custom FUSAKA character descriptions based on reference images
    const characterPrompts = {
      'character1': 'FUSAKA crypto mascot character with paws, exactly two arms and two legs, proper anatomy with four limbs total, meme-ready design, expressive face perfect for reactions, crypto community vibes, bold personality, diamond hands energy, memeable and relatable, high quality digital art',
      'character2': 'FUSAKA crypto mascot character with hooves, exactly two arms and two legs, proper anatomy with four limbs total, meme-ready design, expressive face perfect for reactions, crypto community vibes, bold personality, to the moon attitude, memeable and relatable, high quality digital art',
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

    return await this.generateMeme(prompt, 'meme', character);
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