// Debug price data structure
require('dotenv').config();

const PriceClient = require('./src/priceClient');

async function debugPriceData() {
  try {
    console.log('🔍 Debugging price data structure...');
    
    const priceClient = new PriceClient();
    const ethPrice = await priceClient.getPrice('ethereum');
    
    console.log('📊 Full price response:');
    console.log(JSON.stringify(ethPrice, null, 2));
    
    console.log('\n🔍 Validation checks:');
    console.log('- success:', ethPrice.success);
    console.log('- price exists:', !!ethPrice.price);
    console.log('- price value:', ethPrice.price);
    console.log('- price is number:', !isNaN(parseFloat(ethPrice.price)));
    console.log('- change24h exists:', ethPrice.change24h !== null);
    console.log('- change24h value:', ethPrice.change24h);
    console.log('- change24h is number:', !isNaN(parseFloat(ethPrice.change24h)));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugPriceData();