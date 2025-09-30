class TwitterRateLimiter {
  constructor() {
    this.monthlyLimit = 500; // Twitter free tier limit
    this.currentMonth = new Date().getMonth();
    this.currentYear = new Date().getFullYear();
    this.tweetsThisMonth = 0;
    this.dailyLimit = Math.floor(this.monthlyLimit / 30); // ~16 tweets per day
    this.tweetsToday = 0;
    this.currentDay = new Date().getDate();
    
    console.log(`🚦 Twitter Rate Limiter initialized:`);
    console.log(`📊 Monthly limit: ${this.monthlyLimit} tweets`);
    console.log(`📅 Daily limit: ${this.dailyLimit} tweets`);
  }

  checkAndResetCounters() {
    const now = new Date();
    
    // Reset daily counter
    if (now.getDate() !== this.currentDay) {
      this.tweetsToday = 0;
      this.currentDay = now.getDate();
      console.log(`📅 New day - reset daily tweet counter`);
    }
    
    // Reset monthly counter
    if (now.getMonth() !== this.currentMonth || now.getFullYear() !== this.currentYear) {
      this.tweetsThisMonth = 0;
      this.currentMonth = now.getMonth();
      this.currentYear = now.getFullYear();
      console.log(`📅 New month - reset monthly tweet counter`);
    }
  }

  canTweet(type = 'automated') {
    this.checkAndResetCounters();
    
    // Always allow replies to mentions (but count them)
    if (type === 'mention_reply') {
      if (this.tweetsThisMonth >= this.monthlyLimit) {
        console.log('⚠️ Monthly limit reached - blocking mention reply');
        return false;
      }
      return true;
    }
    
    // For automated tweets, check both daily and monthly limits
    if (this.tweetsThisMonth >= this.monthlyLimit) {
      console.log(`❌ Cannot tweet: Monthly limit reached (${this.tweetsThisMonth}/${this.monthlyLimit})`);
      return false;
    }
    
    if (this.tweetsToday >= this.dailyLimit) {
      console.log(`❌ Cannot tweet: Daily limit reached (${this.tweetsToday}/${this.dailyLimit})`);
      return false;
    }
    
    return true;
  }

  recordTweet(type = 'automated') {
    this.checkAndResetCounters();
    this.tweetsThisMonth++;
    this.tweetsToday++;
    
    console.log(`📊 Tweet recorded (${type}): Daily: ${this.tweetsToday}/${this.dailyLimit}, Monthly: ${this.tweetsThisMonth}/${this.monthlyLimit}`);
  }

  getStatus() {
    this.checkAndResetCounters();
    return {
      dailyUsed: this.tweetsToday,
      dailyLimit: this.dailyLimit,
      monthlyUsed: this.tweetsThisMonth,
      monthlyLimit: this.monthlyLimit,
      canTweet: this.canTweet('automated')
    };
  }
}

module.exports = TwitterRateLimiter;