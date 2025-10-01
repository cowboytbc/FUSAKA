# How to Check if Your FUSAKA Bot is Working

## 1. Render Dashboard Logs

### Access:
1. Go to https://dashboard.render.com
2. Click on your FUSAKA bot service
3. Click on "Logs" tab

### What to Look For:

#### ✅ GOOD SIGNS (Bot Working):
```
✓ Bot started successfully
✓ Twitter API connected for user: FusakaAi (1970849515512147969)
✓ Telegram bot connected
✓ Scheduled tweet posted successfully
✓ Price alert sent
✓ Mention responded to
```

#### ❌ BAD SIGNS (Bot Not Working):
```
❌ Invalid Request - User not found (means wrong User ID)
❌ Unauthorized (means API credentials issue)
❌ Rate limit exceeded
❌ Error 409: Conflict (duplicate bot instances)
❌ Cannot read properties of undefined
```

#### 🔄 NORMAL ACTIVITY LOGS:
```
[INFO] Bot initialized
[INFO] Checking for mentions...
[INFO] Fetching crypto prices...
[INFO] Scheduling next tweet...
[INFO] Processing Telegram message...
```

## 2. Key Environment Variables to Verify in Render:
- TWITTER_USER_ID=1970849515512147969
- TWITTER_USERNAME=FusakaAi
- All API keys are set correctly

## 3. Expected Bot Activities:

### Automated Tweets:
- Should post every few hours with crypto updates
- Look for "Tweet posted successfully" messages

### Mention Responses:
- When someone mentions @FusakaAi
- Look for "Responding to mention" messages

### Telegram Integration:
- Meme generation requests
- Price check commands
- Look for "Telegram message processed" logs

## 4. Troubleshooting Log Patterns:

### If you see "User not found":
- User ID is wrong in environment variables
- Need to update TWITTER_USER_ID in Render

### If you see "Unauthorized":
- Twitter API keys are incorrect
- Check TWITTER_BEARER_TOKEN, TWITTER_API_KEY, etc.

### If you see "409 Conflict":
- Multiple bot instances running
- Stop duplicate deployments

### If you see rate limit errors:
- Bot is working but hitting Twitter limits
- Normal for active bots

## 5. Manual Test Commands:
You can also check if the bot responds to manual triggers by:
- Mentioning @FusakaAi on Twitter
- Sending commands to your Telegram bot
- Looking for immediate log responses