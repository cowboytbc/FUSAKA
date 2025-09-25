require('dotenv').config();

const config = {
  twitter: {
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    bearerToken: process.env.TWITTER_BEARER_TOKEN,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
    enabled: process.env.ENABLE_TELEGRAM === 'true',
  },
  server: {
    port: parseInt(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  grok: {
    apiKey: process.env.GROK_API_KEY,
    apiUrl: process.env.GROK_API_URL,
  },
  bot: {
    username: process.env.BOT_USERNAME,
    userId: process.env.BOT_USER_ID,
    tweetInterval: parseInt(process.env.TWEET_INTERVAL_MINUTES) || 60,
    maxMentionsPerHour: parseInt(process.env.MAX_MENTIONS_PER_HOUR) || 30,
    debugMode: process.env.DEBUG_MODE === 'true',
    maxResponseLength: parseInt(process.env.MAX_RESPONSE_LENGTH) || 280,
    enableAutoReply: process.env.ENABLE_AUTO_REPLY === 'true',
    enableScheduledTweets: process.env.ENABLE_SCHEDULED_TWEETS === 'true',
  },
};

// Validate required configuration
const validateConfig = () => {
  const required = [
    'twitter.apiKey',
    'twitter.apiSecret',
    'grok.apiKey',
  ];

  for (const key of required) {
    const value = key.split('.').reduce((obj, k) => obj?.[k], config);
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }
  }
};

module.exports = { config, validateConfig };