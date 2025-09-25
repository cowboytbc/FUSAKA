# FUSAKA BOT

An AI-powered Twitter bot using Grok API for intelligent responses and content generation.

## Features

- 🤖 AI-powered responses using Grok API
- 📱 Automatic reply to mentions
- 📅 Scheduled tweet posting
- 📈 Trending topic integration
- 💬 Intelligent conversation handling
- 🔒 Secure API key management
- 📊 Built-in analytics and rate limiting

## Setup

### 1. Prerequisites
- Node.js (v14 or higher)
- Twitter Developer Account with API access
- Grok API access

### 2. Installation
```bash
npm install
```

### 3. Configuration
1. Copy the `.env` file and fill in your API credentials:
   - `TWITTER_API_KEY` - Your Twitter API Key ✅
   - `TWITTER_API_SECRET` - Your Twitter API Secret ✅
   - `TWITTER_BEARER_TOKEN` - Your Twitter Bearer Token (needed)
   - `TWITTER_ACCESS_TOKEN` - Your Twitter Access Token (needed)
   - `TWITTER_ACCESS_SECRET` - Your Twitter Access Token Secret (needed)
   - `GROK_API_KEY` - Your Grok API Key (needed)
   - `GROK_API_URL` - Your Grok API Endpoint (needed)

### 4. Getting Missing Twitter Credentials

You have the API Key and Secret! Now you need:

#### Bearer Token:
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Select your app
3. Go to "Keys and tokens" tab
4. Under "Bearer Token" click "Generate"

#### Access Token & Secret:
1. In the same "Keys and tokens" section
2. Under "Access Token and Secret" click "Generate"
3. Make sure your app has "Read and Write" permissions

### 5. Grok API Setup
You'll need to provide:
- Your Grok API key
- The Grok API endpoint URL

## Usage

### Start the bot:
```bash
npm start
```

### Development mode (with auto-restart):
```bash
npm run dev
```

## Bot Configuration

Edit the `.env` file to customize:

- `TWEET_INTERVAL_MINUTES` - How often to post scheduled tweets (default: 60)
- `MAX_MENTIONS_PER_HOUR` - Rate limit for replies (default: 30)
- `ENABLE_AUTO_REPLY` - Enable/disable auto-replies (default: true)
- `ENABLE_SCHEDULED_TWEETS` - Enable/disable scheduled tweets (default: true)

## Bot Capabilities

### Auto-Reply System
- Monitors mentions every 2 minutes
- Generates intelligent replies using Grok
- Rate limited to prevent spam
- Maintains conversation context

### Scheduled Tweets
- Posts original content at configured intervals
- Incorporates trending topics
- AI-generated engaging content
- Customizable themes and topics

### Smart Features
- Sentiment analysis
- Trend integration
- Character limit optimization
- Graceful error handling
- Connection health monitoring

## File Structure

```
FUSAKA BOT/
├── src/
│   ├── index.js          # Main entry point
│   ├── fusakaBot.js      # Core bot logic
│   ├── twitterClient.js  # Twitter API wrapper
│   └── grokClient.js     # Grok API wrapper
├── config/
│   └── config.js         # Configuration management
├── .env                  # Environment variables (keep secure!)
├── .gitignore           # Git ignore rules
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## Security Notes

⚠️ **Important**: 
- Never commit your `.env` file to version control
- Keep your API keys secure
- The `.gitignore` file is configured to protect your credentials
- Consider using environment-specific configurations for production

## Troubleshooting

### Common Issues:
1. **"Missing required configuration"** - Check your `.env` file
2. **API connection errors** - Verify your credentials
3. **Rate limiting** - Adjust the rate limit settings
4. **Grok API errors** - Check your Grok API key and endpoint

### Debug Mode:
Set `DEBUG_MODE=true` in your `.env` file for detailed logging.

## Next Steps

1. ✅ Get your missing Twitter API credentials
2. ✅ Add your Grok API details
3. ✅ Test the bot with `npm start`
4. 🎯 Customize the bot personality in `grokClient.js`
5. 📈 Monitor performance and adjust settings

## Support

For issues or questions:
1. Check the console logs for error details
2. Verify all API credentials are correct
3. Ensure your Twitter app has proper permissions
4. Test API connections independently

---

🤖 **FUSAKA BOT** - Powered by Grok AI