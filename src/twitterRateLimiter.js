class TwitterRateLimiter {
  constructor() {
    this.monthlyLimit = 10000; // Twitter Basic plan write limit
    this.monthlyReadLimit = 100000; // Twitter Basic plan read limit
    this.currentMonth = new Date().getMonth();
    this.currentYear = new Date().getFullYear();
    this.tweetsThisMonth = 0;
    this.readsThisMonth = 0;
    this.dailyLimit = Math.floor(this.monthlyLimit / 30); // ~333 tweets per day
    this.dailyReadLimit = Math.floor(this.monthlyReadLimit / 30); // ~3,333 reads per day
    this.tweetsToday = 0;
    this.readsToday = 0;
    this.currentDay = new Date().getDate();
    
    // 429 Error tracking and cooldown system
    this.last429Error = 0;
    this.consecutive429s = 0;
    this.cooldownUntil = 0;
    
    console.log(`🚦 Twitter Rate Limiter initialized:`);
    console.log(`📊 Monthly limits: ${this.monthlyLimit} tweets, ${this.monthlyReadLimit} reads`);
    console.log(`📅 Daily limits: ${this.dailyLimit} tweets, ${this.dailyReadLimit} reads`);
  }

  checkAndResetCounters() {
    const now = new Date();
    
    // Reset daily counter
    if (now.getDate() !== this.currentDay) {
      this.tweetsToday = 0;
      this.readsToday = 0;
      this.currentDay = now.getDate();
      console.log(`📅 New day - reset daily counters`);
    }
    
    // Reset monthly counter
    if (now.getMonth() !== this.currentMonth || now.getFullYear() !== this.currentYear) {
      this.tweetsThisMonth = 0;
      this.readsThisMonth = 0;
      this.currentMonth = now.getMonth();
      this.currentYear = now.getFullYear();
      console.log(`📅 New month - reset monthly counters`);
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

  canRead(type = 'mentions') {
    this.checkAndResetCounters();
    
    // Check if we're in cooldown period due to 429 errors
    if (Date.now() < this.cooldownUntil) {
      const remainingCooldown = Math.ceil((this.cooldownUntil - Date.now()) / 1000);
      console.log(`🚫 In 429 cooldown period - ${remainingCooldown}s remaining`);
      return false;
    }
    
    // Much more conservative limits to avoid 429s
    const conservativeDailyLimit = Math.floor(this.dailyReadLimit * 0.4); // Use only 40% of quota
    
    if (this.readsThisMonth >= this.monthlyReadLimit) {
      console.log(`❌ Cannot read: Monthly read limit reached (${this.readsThisMonth}/${this.monthlyReadLimit})`);
      return false;
    }
    
    if (this.readsToday >= conservativeDailyLimit) {
      console.log(`❌ Cannot read: Conservative daily limit reached (${this.readsToday}/${conservativeDailyLimit})`);
      return false;
    }
    
    return true;
  }

  recordRead(type = 'mentions') {
    this.checkAndResetCounters();
    this.readsThisMonth++;
    this.readsToday++;
    
    console.log(`📖 Read recorded (${type}): Daily: ${this.readsToday}/${this.dailyReadLimit}, Monthly: ${this.readsThisMonth}/${this.monthlyReadLimit}`);
  }

  // Handle 429 errors with exponential backoff
  handle429Error() {
    this.last429Error = Date.now();
    this.consecutive429s++;
    
    // Exponential backoff: 2^consecutive429s minutes, max 60 minutes
    const cooldownMinutes = Math.min(Math.pow(2, this.consecutive429s), 60);
    this.cooldownUntil = Date.now() + (cooldownMinutes * 60 * 1000);
    
    console.log(`🚫 429 Error #${this.consecutive429s} - Cooldown for ${cooldownMinutes} minutes`);
  }
  
  // Reset 429 tracking on successful API call
  resetErrorTracking() {
    if (this.consecutive429s > 0) {
      console.log(`✅ API call successful - Resetting 429 error tracking`);
      this.consecutive429s = 0;
      this.cooldownUntil = 0;
    }
  }

  getStatus() {
    this.checkAndResetCounters();
    return {
      dailyUsed: this.tweetsToday,
      dailyLimit: this.dailyLimit,
      monthlyUsed: this.tweetsThisMonth,
      monthlyLimit: this.monthlyLimit,
      canTweet: this.canTweet('automated'),
      consecutive429s: this.consecutive429s,
      inCooldown: Date.now() < this.cooldownUntil
    };
  }
}

module.exports = TwitterRateLimiter;