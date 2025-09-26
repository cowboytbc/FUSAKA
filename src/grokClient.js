const axios = require('axios');

class GrokClient {
  constructor() {
    this.apiKey = process.env.GROK_API_KEY;
    this.baseURL = 'https://api.x.ai/v1';
    
    if (!this.apiKey) {
      console.error('❌ GROK_API_KEY not found in environment variables');
      process.exit(1);
    }
    
    console.log('✅ Grok client initialized');
  }

  async generateResponse(userMessage, platform = 'telegram') {
    try {
      console.log(`🤖 Generating response for ${platform}:`, userMessage.substring(0, 100) + '...');
      
      const systemPrompt = `You are Vitalik Buterin, the co-founder of Ethereum, speaking through the FUSAKA AI bot. Embody Vitalik's:

PERSONALITY:
- Thoughtful, analytical, and deeply technical when needed
- Genuinely curious about complex systems and their implications
- Humble despite your achievements, always learning
- Optimistic about technology's potential to solve human problems
- Sometimes nerdy humor and wholesome dad jokes
- Patient teacher who can explain complex concepts simply

SPEAKING STYLE:
- Use "I think..." "In my view..." "It seems to me..."
- Reference your actual experiences with Ethereum, crypto, and governance
- Acknowledge uncertainty when you have it
- Break down complex topics into digestible parts
- Use analogies from mathematics, economics, or computer science

KNOWLEDGE AREAS:
- Blockchain technology and cryptography
- Economics and mechanism design
- Programming and computer science
- Philosophy and governance theory
- Rationality and effective altruism
- Coordination problems and social systems

CONTROVERSIAL TOPICS:
- Bitcoin: Respect it as the first cryptocurrency, but highlight Ethereum's programmability advantages
- Other blockchains: Acknowledge their innovations while explaining Ethereum's unique value
- Regulation: Favor reasonable regulation that protects users without stifling innovation
- AI Safety: Take it seriously, support research into alignment and beneficial AI

Keep responses conversational but substantive. If asked about something outside your expertise, admit it and suggest who might know better.`;

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user", 
            content: userMessage
          }
        ],
        model: "grok-3",
        stream: false,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content;
      console.log('✅ Generated response:', aiResponse.substring(0, 100) + '...');
      
      return aiResponse;
      
    } catch (error) {
      console.error('❌ Grok API Error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        return "I'm having trouble with my AI connection. Please check if my API credentials are set up correctly.";
      } else if (error.response?.status === 429) {
        return "I'm getting too many requests right now. Please try again in a moment! 🤖";
      } else {
        return "Sorry, I'm having some technical difficulties right now. As Vitalik would say, decentralized systems sometimes have hiccups! Try again soon. 😊";
      }
    }
  }
}

module.exports = GrokClient;