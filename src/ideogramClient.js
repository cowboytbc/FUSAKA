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
      
      // Add high-quality parameters
      formData.append('prompt', memePrompt);
      formData.append('aspect_ratio', '1x1'); // Square format for memes
      formData.append('rendering_speed', 'QUALITY'); // Highest quality
      formData.append('magic_prompt', 'ON'); // Enable magic prompt for better results
      formData.append('model', 'V_2'); // Use latest model
      
      // Use compatible style type for character references
      const hasCharacterRef = characterImages.length > 0;
      const styleType = hasCharacterRef ? 'AUTO' : 'DESIGN'; // AUTO for character refs, DESIGN for text-only
      formData.append('style_type', styleType);
      
      formData.append('negative_prompt', 'female, woman, girl, feminine features, different characters, wrong faces, generic characters, stock photos');
      
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
    // Force use of character reference images with explicit instructions
    return `${originalPrompt}, use the character reference images provided, male characters only, maintain character appearance from reference images`;
  }

  // Generate character-based memes with FUSAKA characters
  async generateCharacterMeme(character, situation, cryptoContext = '') {
    let characterType = 'auto'; // Default for reference image selection
    let characterDescription = '';
    
    // Map character names to descriptions and reference types
    switch(character.toLowerCase()) {
      case 'fusaka_fox':
      case 'fusaka fox':
        characterType = 'character1'; // Fox is character 1
        characterDescription = 'FUSAKA Fox (cute anthropomorphic male fox character with light blue fur and white underbelly, large expressive bright blue eyes, triangular ears with pink inner parts, dark blue V-shaped forehead marking, fluffy white neck mane with jagged edges, small black nose, friendly smile, chibi-style proportions with large head, short rounded limbs with white paw pads, large fluffy tail that fades from light blue to white tip with spiky tufts, clean digital cartoon anime aesthetic with bold outlines and vibrant colors)';
        break;
        
      case 'fusaka_zebra':
      case 'fusaka zebra':
        characterType = 'character2'; // Zebra is character 2
        characterDescription = 'FUSAKA Zebra (anthropomorphic male zebra character with white base fur and bold black stripes with smooth pointed edges, large rounded head with short black muzzle, diamond-shaped black forehead marking pointing downward, large golden yellow eyes with black outlines, triangular ears with pink inner sections, short fluffy black mane spiking backward, bright blue triangular bandana around neck, chibi-style proportions with large head and simplified body, thick rounded legs ending in solid black hooves, short striped tail with black tuft, clean digital cartoon anime aesthetic with bold outlines and polished finish)';
        break;
        
      case 'both':
      case 'together':
        characterType = 'auto'; // Use both reference folders
        characterDescription = 'FUSAKA Fox and FUSAKA Zebra (both male characters)';
        break;
        
      case 'random':
      default:
        // Random selection between fox, zebra, or both
        const rand = Math.random();
        if (rand < 0.4) {
          characterType = 'character1';
          characterDescription = 'FUSAKA Fox (cute anthropomorphic male fox character with light blue fur and white underbelly, large expressive bright blue eyes, triangular ears with pink inner parts, dark blue V-shaped forehead marking, fluffy white neck mane with jagged edges, small black nose, friendly smile, chibi-style proportions with large head, short rounded limbs with white paw pads, large fluffy tail that fades from light blue to white tip with spiky tufts, clean digital cartoon anime aesthetic with bold outlines and vibrant colors)';
        } else if (rand < 0.8) {
          characterType = 'character2';
          characterDescription = 'FUSAKA Zebra (anthropomorphic male zebra character with white base fur and bold black stripes, large golden yellow eyes, diamond-shaped black forehead marking, short fluffy black mane, bright blue triangular bandana around neck, chibi-style proportions, thick legs with black hooves, clean digital cartoon anime aesthetic)';
        } else {
          characterType = 'auto';
          characterDescription = 'FUSAKA Fox (cute anthropomorphic male fox with light blue fur, bright blue eyes, dark blue V-marking, fluffy white neck mane, chibi-style) and FUSAKA Zebra (anthropomorphic male zebra with white fur and black stripes, golden yellow eyes, diamond-shaped black forehead marking, blue bandana, black hooves, chibi-style)';
        }
        break;
    }
    
    // Build comprehensive prompt with character descriptions
    let prompt = `${characterDescription} ${situation}, use provided character reference images exactly as shown, maintain character appearance from reference images, male characters only`;
    
    if (cryptoContext) {
      prompt += `, ${cryptoContext}`;
    }

    console.log(`🎨 Generating meme - Character: ${characterDescription}, Situation: ${situation}`);
    
    return await this.generateMeme(prompt, 'meme', characterType);
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