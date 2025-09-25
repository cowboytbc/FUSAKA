# FUSAKA Bot - Telegram & Twitter Dual Platform Setup

## 🚀 Quick Start

### 1. Get Your Telegram Bot Token

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow the prompts
3. Choose a name (e.g., "FUSAKA AI Bot")
4. Choose a username (e.g., "fusaka_ai_bot")
5. Copy the bot token you receive

### 2. Update Environment Variables

Edit your `.env` file and replace:
```
TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE
```

With your actual bot token:
```
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 3. Test Locally

```bash
npm install
npm run dev
```

### 4. Deploy to Render

1. **Connect Repository:**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Deployment:**
   - **Name:** `fusaka-bot`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

3. **Set Environment Variables:**
   Copy all variables from your `.env` file to Render's environment variables section:

   ```
   TWITTER_API_KEY=your_twitter_api_key
   TWITTER_API_SECRET=your_twitter_api_secret
   TWITTER_BEARER_TOKEN=your_twitter_bearer_token
   TWITTER_ACCESS_TOKEN=your_twitter_access_token
   TWITTER_ACCESS_SECRET=your_twitter_access_secret
   
   GROK_API_KEY=your_actual_grok_api_key_here
   GROK_API_URL=https://api.x.ai/v1
   
   BOT_USERNAME=CryptoJosh53365
   BOT_USER_ID=1971042513768034304
   TWEET_INTERVAL_MINUTES=60
   MAX_MENTIONS_PER_HOUR=30
   DEBUG_MODE=false
   
   TELEGRAM_BOT_TOKEN=YOUR_ACTUAL_BOT_TOKEN
   TELEGRAM_WEBHOOK_URL=https://your-app-name.onrender.com
   ENABLE_TELEGRAM=true
   
   PORT=3000
   NODE_ENV=production
   
   MAX_RESPONSE_LENGTH=280
   ENABLE_AUTO_REPLY=true
   ENABLE_SCHEDULED_TWEETS=true
   ```

4. **Update Webhook URL:**
   After deployment, update `TELEGRAM_WEBHOOK_URL` with your actual Render URL

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete

## 🎯 Platform Control

You can control which platforms are active by setting these environment variables:

- **Twitter Only:** Set `ENABLE_TELEGRAM=false`
- **Telegram Only:** Remove Twitter credentials or set them to empty
- **Both Platforms:** Keep both sets of credentials configured

## 📱 Bot Commands (Telegram)

Once deployed, your Telegram bot supports:

- `/start` - Welcome message and introduction
- `/help` - How to interact with the bot
- `/about` - Detailed information about the bot
- `/tips` - Random Ethereum/crypto tips
- Direct messages - Chat directly with the Vitalik-inspired AI

## 🔧 Testing

### Local Testing:
```bash
npm run dev
```

### Production Testing:
1. Check health endpoint: `https://your-app.onrender.com/health`
2. Test Telegram bot by messaging it
3. Monitor Render logs for any issues

## 🚨 Important Notes

1. **Webhook vs Polling:** 
   - Production (Render) uses webhooks for better performance
   - Development uses polling for easier testing

2. **Rate Limits:**
   - Twitter: Respects Basic API limits (5min intervals)
   - Telegram: No special limits, but be reasonable

3. **Environment:**
   - Set `NODE_ENV=production` on Render
   - Set `DEBUG_MODE=false` for production

4. **Security:**
   - Never commit actual API keys to Git
   - Use Render's environment variables for all secrets

## 📊 Monitoring

The bot logs all activities:
- ✅ Successful connections
- 📱 Telegram messages received/sent
- 🐦 Twitter interactions
- ❌ Any errors or issues

Check your Render logs dashboard for real-time monitoring.

## 🎉 You're All Set!

Your FUSAKA bot now runs on both Twitter and Telegram with Vitalik Buterin's personality, ready to educate users about Ethereum while maintaining an encouraging and humorous approach!