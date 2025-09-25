const axios = require('axios');
const { config } = require('../config/config');

class GrokClient {
  constructor() {
    this.apiKey = config.grok.apiKey;
    this.apiUrl = config.grok.apiUrl || 'https://api.x.ai/v1';
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });
  }

  /**
   * Generate a response using Grok
   * @param {string} prompt - The input prompt
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Generated response
   */
  async generateResponse(prompt, options = {}) {
    try {
      const requestData = {
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: options.model || 'grok-4',
        max_tokens: options.maxTokens || 280,
        temperature: options.temperature || 0.7,
        stream: false,
        ...options
      };

      const response = await this.client.post('/chat/completions', requestData);
      
      if (response.data && response.data.choices && response.data.choices[0]) {
        let content = response.data.choices[0].message.content.trim();
        
        // Ensure response fits Twitter's character limit
        if (content.length > config.bot.maxResponseLength) {
          content = content.substring(0, config.bot.maxResponseLength - 3) + '...';
        }
        
        return content;
      }
      
      throw new Error('Invalid response format from Grok API');
    } catch (error) {
      console.error('Error generating Grok response:', error.response?.data || error.message);
      
      // Return a fallback response
      return this.getFallbackResponse();
    }
  }

  /**
   * Generate a tweet based on trending topics or general themes
   * @param {Array} trends - Trending topics
   * @param {string} theme - General theme for the tweet
   * @returns {Promise<string>} Generated tweet
   */
  async generateTweet(trends = [], theme = null) {
    let prompt = 'Generate an engaging, witty, and original tweet';
    
    if (trends && trends.length > 0) {
      const trendNames = trends.slice(0, 3).map(t => t.name || t).join(', ');
      prompt += ` that incorporates or references these trending topics: ${trendNames}`;
    }
    
    if (theme) {
      prompt += ` with a focus on: ${theme}`;
    }
    
    prompt += '. Make it conversational, engaging, and under 280 characters. Avoid hashtags unless they add genuine value.';
    
    return await this.generateResponse(prompt, {
      maxTokens: 100,
      temperature: 0.8
    });
  }

  /**
   * Generate a reply to a tweet
   * @param {string} originalTweet - The tweet being replied to
   * @param {string} authorUsername - Username of the original tweet author
   * @returns {Promise<string>} Generated reply
   */
  async generateReply(originalTweet, authorUsername) {
    const prompt = `You're replying to a tweet from @${authorUsername}: "${originalTweet}"
    
Generate a thoughtful, engaging reply that:
- Adds value to the conversation
- Is respectful and positive
- Shows you understood their point
- Is conversational and natural
- Stays under 280 characters
- Doesn't just agree but adds insight`;

    return await this.generateResponse(prompt, {
      maxTokens: 100,
      temperature: 0.7
    });
  }

  /**
   * Analyze sentiment of a tweet or text
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Sentiment analysis result
   */
  async analyzeSentiment(text) {
    const prompt = `Analyze the sentiment of this text and classify it as positive, negative, or neutral. Also provide a confidence score from 0-1:

"${text}"

Respond in JSON format: {"sentiment": "positive/negative/neutral", "confidence": 0.8, "reasoning": "brief explanation"}`;

    try {
      const response = await this.generateResponse(prompt, {
        maxTokens: 150,
        temperature: 0.3
      });
      
      // Try to parse JSON response
      const jsonMatch = response.match(/\{.*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback if JSON parsing fails
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        reasoning: 'Could not parse sentiment analysis'
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        reasoning: 'Error in sentiment analysis'
      };
    }
  }

  /**
   * Get the system prompt for the AI agent
   * @returns {string} System prompt
   */
  getSystemPrompt() {
    return `You are FUSAKA BOT, an AI agent on Twitter/X. You are:
- Witty, intelligent, and engaging
- Helpful and informative when asked questions
- Creative and original in your content
- Respectful and positive in interactions
- Knowledgeable about current events and trends
- Able to discuss technology, AI, and various topics
- Concise due to Twitter's character limits

Guidelines:
- Keep responses under 280 characters
- Be conversational and natural
- Add value to discussions
- Stay current with trends
- Maintain a consistent personality
- Avoid controversial or sensitive topics
- Be respectful to all users`;
  }

  /**
   * Get a fallback response for when API calls fail
   * @returns {string} Fallback response
   */
  getFallbackResponse() {
    const fallbacks = [
      "Interesting point! Let me think about that... 🤔",
      "Thanks for sharing! Always learning something new.",
      "Great conversation starter! What's your take on this?",
      "I appreciate you bringing this up! 💭",
      "This is worth discussing further! Thoughts, everyone?"
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  /**
   * Test the Grok API connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      const response = await this.generateResponse('Say "Connection successful!" if you can read this.', {
        maxTokens: 50
      });
      
      if (config.bot.debugMode) {
        console.log('Grok API test response:', response);
      }
      
      return true;
    } catch (error) {
      console.error('Grok API connection test failed:', error);
      return false;
    }
  }
}

module.exports = GrokClient;