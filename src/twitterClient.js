const { TwitterApi } = require('twitter-api-v2');
const { config } = require('../config/config');

class TwitterClient {
  constructor() {
    this.client = new TwitterApi({
      appKey: config.twitter.apiKey,
      appSecret: config.twitter.apiSecret,
      accessToken: config.twitter.accessToken,
      accessSecret: config.twitter.accessSecret,
    });

    // Read-write client for posting tweets
    this.rwClient = this.client.readWrite;
  }

  /**
   * Post a tweet
   * @param {string} text - Tweet content
   * @param {Object} options - Additional options (reply_to, media, etc.)
   * @returns {Promise<Object>} Tweet response
   */
  async postTweet(text, options = {}) {
    try {
      if (text.length > config.bot.maxResponseLength) {
        text = text.substring(0, config.bot.maxResponseLength - 3) + '...';
      }

      const tweetOptions = {
        text: text,
        ...options
      };

      const response = await this.rwClient.v2.tweet(tweetOptions);
      
      if (config.bot.debugMode) {
        console.log('Tweet posted successfully:', response.data.id);
      }
      
      return response;
    } catch (error) {
      console.error('Error posting tweet:', error);
      throw error;
    }
  }

  /**
   * Reply to a tweet
   * @param {string} text - Reply content
   * @param {string} tweetId - ID of tweet to reply to
   * @returns {Promise<Object>} Reply response
   */
  async replyToTweet(text, tweetId) {
    try {
      return await this.postTweet(text, {
        reply: { in_reply_to_tweet_id: tweetId }
      });
    } catch (error) {
      console.error('Error replying to tweet:', error);
      throw error;
    }
  }

  /**
   * Get mentions of the bot
   * @param {number} maxResults - Maximum number of mentions to fetch
   * @returns {Promise<Array>} Array of mentions
   */
  async getMentions(maxResults = 10) {
    try {
      // Search for mentions instead of using userMentionTimeline
      const query = `@${config.bot.username.replace('@', '')} -is:retweet`;
      const response = await this.rwClient.v2.search(query, {
        max_results: Math.min(maxResults, 10), // Basic API limit
        'tweet.fields': ['created_at', 'author_id', 'conversation_id', 'in_reply_to_user_id'],
        expansions: ['author_id'],
        'user.fields': ['username', 'name']
      });

      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching mentions:', error);
      return [];
    }
  }

  /**
   * Get user information
   * @param {string} username - Username to look up
   * @returns {Promise<Object>} User information
   */
  async getUserByUsername(username) {
    try {
      const response = await this.rwClient.v2.userByUsername(username.replace('@', ''));
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /**
   * Search for tweets
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum results
   * @returns {Promise<Array>} Array of tweets
   */
  async searchTweets(query, maxResults = 10) {
    try {
      const response = await this.rwClient.v2.search(query, {
        max_results: maxResults,
        'tweet.fields': ['created_at', 'author_id', 'public_metrics'],
        expansions: ['author_id'],
        'user.fields': ['username', 'name']
      });

      return response.data?.data || [];
    } catch (error) {
      console.error('Error searching tweets:', error);
      return [];
    }
  }

  /**
   * Get trending topics
   * @param {string} location - Location ID (1 for worldwide)
   * @returns {Promise<Array>} Array of trending topics
   */
  async getTrends(location = 1) {
    try {
      const response = await this.client.v1.trendsAvailable();
      const trends = await this.client.v1.trends({ id: location });
      return trends[0]?.trends || [];
    } catch (error) {
      console.error('Error fetching trends:', error);
      return [];
    }
  }
}

module.exports = TwitterClient;