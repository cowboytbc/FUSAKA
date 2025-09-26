const axios = require('axios');

class PriceClient {
  constructor() {
    this.baseURL = 'https://api.coingecko.com/api/v3';
    console.log('✅ Price client initialized (CoinGecko API)');
  }

  async getPrice(coinId, vsCurrency = 'usd') {
    try {
      const response = await axios.get(`${this.baseURL}/simple/price`, {
        params: {
          ids: coinId,
          vs_currencies: vsCurrency,
          include_24hr_change: true,
          include_market_cap: true,
          include_24hr_vol: true
        }
      });

      if (!response.data[coinId]) {
        return null;
      }

      const data = response.data[coinId];
      return {
        price: data[vsCurrency],
        change24h: data[`${vsCurrency}_24h_change`],
        marketCap: data[`${vsCurrency}_market_cap`],
        volume24h: data[`${vsCurrency}_24h_vol`]
      };
    } catch (error) {
      console.error('❌ Price API Error:', error.message);
      return null;
    }
  }

  async getMultiplePrices(coinIds, vsCurrency = 'usd') {
    try {
      const response = await axios.get(`${this.baseURL}/simple/price`, {
        params: {
          ids: coinIds.join(','),
          vs_currencies: vsCurrency,
          include_24hr_change: true,
          include_market_cap: true
        }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Price API Error:', error.message);
      return null;
    }
  }

  async getTrending() {
    try {
      const response = await axios.get(`${this.baseURL}/search/trending`);
      return response.data.coins.slice(0, 5); // Top 5 trending
    } catch (error) {
      console.error('❌ Trending API Error:', error.message);
      return null;
    }
  }

  async searchCoin(query) {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: { query }
      });
      
      // Return top 3 matches
      return response.data.coins.slice(0, 3).map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase()
      }));
    } catch (error) {
      console.error('❌ Search API Error:', error.message);
      return null;
    }
  }

  formatPrice(price, currency = 'USD') {
    if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(8)}`;
    }
  }

  formatChange(change) {
    const emoji = change >= 0 ? '🟢' : '🔴';
    const sign = change >= 0 ? '+' : '';
    return `${emoji} ${sign}${change.toFixed(2)}%`;
  }

  formatMarketCap(marketCap) {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    } else {
      return `$${marketCap.toFixed(0)}`;
    }
  }

  // Common coin ID mappings
  getCoinId(symbol) {
    const commonCoins = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'SOL': 'solana',
      'DOT': 'polkadot',
      'DOGE': 'dogecoin',
      'AVAX': 'avalanche-2',
      'MATIC': 'matic-network',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'LTC': 'litecoin',
      'ATOM': 'cosmos',
      'XLM': 'stellar',
      'VET': 'vechain',
      'ICP': 'internet-computer',
      'FIL': 'filecoin',
      'TRX': 'tron',
      'ETC': 'ethereum-classic'
    };

    return commonCoins[symbol.toUpperCase()] || symbol.toLowerCase();
  }
}

module.exports = PriceClient;