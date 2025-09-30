// Reset Telegram bot webhook to fix conflicts
const https = require('https');

const TELEGRAM_TOKEN = '8365163254:AAHSPm8loly-_8Eyp7jBhZbIpf2kpCnJAHA';

// Delete webhook and pending updates
const resetUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/deleteWebhook?drop_pending_updates=true`;

https.get(resetUrl, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('✅ Telegram webhook reset:', JSON.parse(data));
    console.log('🔄 Your Render deployment should work now!');
  });
}).on('error', (err) => {
  console.error('❌ Error:', err.message);
});