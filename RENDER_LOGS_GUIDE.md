# How to Monitor Twitter Bot Activity via Render Logs

## Accessing Render Logs

1. **Go to your Render dashboard** (render.com)
2. **Find your FUSAKA BOT service**
3. **Click on the service name**
4. **Click the "Logs" tab**

## What to Look For in Logs

### 🟢 Bot Started Successfully
```
✅ Twitter client initialized successfully
✅ Telegram bot started successfully  
🚀 FUSAKA Bot is running...
Twitter automation: enabled, posting every 240 minutes
```

### 🟡 Twitter Configuration Status
```
📊 Twitter Configuration:
   Enabled: true
   Auto Meme Tweets: false
   Price Updates: true
   Market Updates: true
   Auto Tweet Interval: 240 minutes
   Reply to Mentions: true
```

### 🟢 Successful Twitter Posts
```
🐦 Posted engaging price update: [Tweet ID: 1234567890]
🐦 Posted market insight: [Tweet ID: 1234567891]
✅ Tweet posted successfully
```

### 🔵 Twitter API Rate Limiting (Normal)
```
⏱️ Rate limited, waiting 15 minutes before retry...
🔄 Retrying Twitter API call after rate limit...
```

### 🟡 Automated Tweet Attempts
```
🔄 Attempting automated tweet... (40% meme chance)
🔄 Attempting automated tweet... (30% price chance)
🔄 Attempting automated tweet... (30% market chance)
🎯 Selected: Price update tweet
🎯 Selected: Market insight tweet
```

### ❌ Error Messages to Watch For

#### Missing Environment Variables:
```
❌ Error: Twitter API credentials not found
❌ Error: TWITTER_ENABLED is not set
❌ Missing required environment variable: GROK_API_KEY
```

#### API Authentication Issues:
```
❌ Twitter authentication failed
❌ Error posting tweet: Unauthorized (401)
❌ Invalid Twitter API credentials
```

#### Network/API Errors:
```
❌ Error in automated tweet: Request failed with code 429
❌ Twitter API error: Too Many Requests
❌ Network error connecting to Twitter API
```

#### Bot Logic Issues:
```
❌ Error generating price update
❌ Error fetching market data
❌ Grok API error: Unable to generate content
```

## Key Log Patterns for Troubleshooting

### 1. **Bot Not Posting at All**
Look for:
- `❌ Twitter authentication failed`
- `❌ Error: TWITTER_ENABLED is not set`
- Missing initialization messages

**Fix**: Check environment variables on Render

### 2. **Bot Posts Manually But Not Automatically**
Look for:
- `✅ Twitter client initialized successfully` (good)
- Missing `🔄 Attempting automated tweet...` messages
- `Twitter automation: disabled` in config

**Fix**: Verify `TWITTER_ENABLED=true` on Render

### 3. **Frequent Rate Limiting**
Look for:
- Multiple `⏱️ Rate limited` messages
- `429` error codes

**Fix**: Normal behavior, bot handles this automatically

### 4. **API Errors**
Look for:
- `401 Unauthorized` (bad credentials)
- `403 Forbidden` (permissions issue)
- `500 Internal Server Error` (Twitter API issue)

## Real-Time Monitoring Commands

You can also check if logs are flowing by looking for:

```
[Timestamp] 🔄 Checking Twitter mentions...
[Timestamp] 📊 Fetching crypto prices...
[Timestamp] 💭 Generating response with Grok...
```

These show the bot is active and processing.

## Timeline for Automated Posts

With your current settings (`TWITTER_AUTO_TWEET_INTERVAL=240`):
- Bot attempts to post **every 4 hours**
- **60% chance** something gets posted (since memes are disabled)
- So expect roughly **1-2 posts per day**

## Quick Health Check

**Healthy logs should show:**
1. ✅ Initialization messages
2. 🔄 Regular automated tweet attempts every 4 hours  
3. 🐦 Successful posts occasionally
4. ⏱️ Some rate limiting (normal)

**Unhealthy logs show:**
1. ❌ Authentication errors
2. Missing automated tweet attempts
3. Constant API errors
4. No activity for hours

## Pro Tips

- **Refresh logs frequently** - they update in real-time
- **Look at the last 24 hours** - automated posts are infrequent
- **Check timestamps** - ensure bot is making attempts every 4 hours
- **Search for specific keywords** - use browser Ctrl+F to find "automated tweet" or "Error"