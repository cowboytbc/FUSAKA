const axios = require('axios');

class PriceClient {
  constructor() {
    // Multiple API endpoints for reliability
    this.apis = [
      {
        name: 'CoinGecko',
        baseURL: 'https://api.coingecko.com/api/v3',
        type: 'coingecko'
      },
      {
        name: 'DexScreener',
        baseURL: 'https://api.dexscreener.com/latest',
        type: 'dexscreener'
      },
      {
        name: 'CoinPaprika',
        baseURL: 'https://api.coinpaprika.com/v1',
        type: 'coinpaprika'
      },
      {
        name: 'CryptoCompare',
        baseURL: 'https://min-api.cryptocompare.com/data',
        type: 'cryptocompare'
      }
    ];
    
    this.currentApiIndex = 0;
    console.log('✅ Multi-API price client initialized');
    console.log(`📊 Available APIs: ${this.apis.map(api => api.name).join(', ')}`);
  }

  async getPrice(coinId, vsCurrency = 'usd') {
    // Try each API in sequence until one works
    for (let i = 0; i < this.apis.length; i++) {
      const apiIndex = (this.currentApiIndex + i) % this.apis.length;
      const api = this.apis[apiIndex];
      
      try {
        console.log(`🔄 Trying ${api.name} API for ${coinId}...`);
        const result = await this.getPriceFromAPI(api, coinId, vsCurrency);
        
        if (result) {
          // Update current API index to the working one
          this.currentApiIndex = apiIndex;
          console.log(`✅ Success with ${api.name} API`);
          return result;
        }
      } catch (error) {
        console.log(`❌ ${api.name} failed: ${error.message}`);
        continue;
      }
    }
    
    console.error('❌ All price APIs failed');
    return null;
  }

  async getPriceFromAPI(api, coinId, vsCurrency = 'usd') {
    switch (api.type) {
      case 'coingecko':
        return await this.getCoinGeckoPrice(api, coinId, vsCurrency);
      case 'dexscreener':
        return await this.getDexScreenerPrice(api, coinId, vsCurrency);
      case 'coinpaprika':
        return await this.getCoinPaprikaPrice(api, coinId, vsCurrency);
      case 'cryptocompare':
        return await this.getCryptoComparePrice(api, coinId, vsCurrency);
      default:
        throw new Error(`Unknown API type: ${api.type}`);
    }
  }

  async getCoinGeckoPrice(api, coinId, vsCurrency) {
    const response = await axios.get(`${api.baseURL}/simple/price`, {
      params: {
        ids: coinId,
        vs_currencies: vsCurrency,
        include_24hr_change: true,
        include_market_cap: true,
        include_24hr_vol: true
      },
      timeout: 5000
    });

    if (!response.data[coinId]) {
      return null;
    }

    const data = response.data[coinId];
    return {
      price: data[vsCurrency],
      change24h: data[`${vsCurrency}_24h_change`],
      marketCap: data[`${vsCurrency}_market_cap`],
      volume24h: data[`${vsCurrency}_24h_vol`],
      source: 'CoinGecko'
    };
  }

  async getDexScreenerPrice(api, coinId, vsCurrency) {
    // DexScreener uses different approach - search by token
    const symbol = this.coinIdToSymbol(coinId);
    const response = await axios.get(`${api.baseURL}/dex/search`, {
      params: { q: symbol },
      timeout: 5000
    });

    if (!response.data.pairs || response.data.pairs.length === 0) {
      return null;
    }

    // Get the most liquid pair
    const pair = response.data.pairs
      .filter(p => p.quoteToken?.symbol?.toLowerCase() === 'usdc' || 
                   p.quoteToken?.symbol?.toLowerCase() === 'usdt' ||
                   p.quoteToken?.symbol?.toLowerCase() === 'weth')
      .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))[0];

    if (!pair) {
      return null;
    }

    return {
      price: parseFloat(pair.priceUsd),
      change24h: pair.priceChange?.h24,
      marketCap: null, // DexScreener doesn't provide market cap
      volume24h: pair.volume?.h24,
      source: 'DexScreener'
    };
  }

  async getCoinPaprikaPrice(api, coinId, vsCurrency) {
    // CoinPaprika uses different coin IDs
    const paprikaId = this.coinIdToPaprikaId(coinId);
    const response = await axios.get(`${api.baseURL}/tickers/${paprikaId}`, {
      timeout: 5000
    });

    if (!response.data) {
      return null;
    }

    const data = response.data;
    return {
      price: data.quotes?.USD?.price,
      change24h: data.quotes?.USD?.percent_change_24h,
      marketCap: data.quotes?.USD?.market_cap,
      volume24h: data.quotes?.USD?.volume_24h,
      source: 'CoinPaprika'
    };
  }

  async getCryptoComparePrice(api, coinId, vsCurrency) {
    const symbol = this.coinIdToSymbol(coinId).toUpperCase();
    const response = await axios.get(`${api.baseURL}/pricemultifull`, {
      params: {
        fsyms: symbol,
        tsyms: vsCurrency.toUpperCase()
      },
      timeout: 5000
    });

    const currency = vsCurrency.toUpperCase();
    if (!response.data?.RAW?.[symbol]?.[currency]) {
      return null;
    }

    const data = response.data.RAW[symbol][currency];
    return {
      price: data.PRICE,
      change24h: data.CHANGEPCT24HOUR,
      marketCap: data.MKTCAP,
      volume24h: data.VOLUME24HOUR,
      source: 'CryptoCompare'
    };
  }

  async getMultiplePrices(coinIds, vsCurrency = 'usd') {
    // For multiple prices, we'll use the working API from the current index
    const api = this.apis[this.currentApiIndex];
    
    try {
      if (api.type === 'coingecko') {
        const response = await axios.get(`${api.baseURL}/simple/price`, {
          params: {
            ids: coinIds.join(','),
            vs_currencies: vsCurrency,
            include_24hr_change: true,
            include_market_cap: true
          },
          timeout: 5000
        });
        return response.data;
      }
      // For other APIs, fall back to individual calls
      const results = {};
      for (const coinId of coinIds) {
        const price = await this.getPrice(coinId, vsCurrency);
        if (price) {
          results[coinId] = {
            [vsCurrency]: price.price,
            [`${vsCurrency}_24h_change`]: price.change24h,
            [`${vsCurrency}_market_cap`]: price.marketCap
          };
        }
      }
      return results;
    } catch (error) {
      console.error(`❌ ${api.name} Multiple Prices Error:`, error.message);
      return null;
    }
  }

  async getTrending() {
    // Try each API for trending data
    for (let i = 0; i < this.apis.length; i++) {
      const apiIndex = (this.currentApiIndex + i) % this.apis.length;
      const api = this.apis[apiIndex];
      
      try {
        console.log(`🔄 Getting trending from ${api.name}...`);
        const result = await this.getTrendingFromAPI(api);
        
        if (result && result.length > 0) {
          console.log(`✅ Trending data from ${api.name}`);
          return result;
        }
      } catch (error) {
        console.log(`❌ ${api.name} trending failed: ${error.message}`);
        continue;
      }
    }
    
    console.error('❌ All trending APIs failed');
    return [];
  }

  async getTrendingFromAPI(api) {
    switch (api.type) {
      case 'coingecko':
        const response = await axios.get(`${api.baseURL}/search/trending`, {
          timeout: 5000
        });
        return response.data.coins.slice(0, 7).map(coin => ({
          id: coin.item.id,
          name: coin.item.name,
          symbol: coin.item.symbol,
          source: 'CoinGecko'
        }));
        
      case 'coinpaprika':
        const paprikaResponse = await axios.get(`${api.baseURL}/tickers`, {
          params: { limit: 10 },
          timeout: 5000
        });
        return paprikaResponse.data.slice(0, 7).map(coin => ({
          id: coin.id.split('-')[1] || coin.symbol.toLowerCase(),
          name: coin.name,
          symbol: coin.symbol,
          source: 'CoinPaprika'
        }));
        
      default:
        // For APIs without trending, return top coins
        return [
          { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', source: api.name },
          { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', source: api.name },
          { id: 'binancecoin', name: 'BNB', symbol: 'BNB', source: api.name }
        ];
    }
  }

  async searchCoin(query) {
    // Use the current working API for search
    const api = this.apis[this.currentApiIndex];
    
    try {
      if (api.type === 'coingecko') {
        const response = await axios.get(`${api.baseURL}/search`, {
          params: { query },
          timeout: 5000
        });
        
        // Return top 3 matches
        return response.data.coins.slice(0, 3).map(coin => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol.toUpperCase()
        }));
      }
      
      // For other APIs, use simple matching
      const coinId = this.getCoinId(query);
      return [{
        id: coinId,
        name: query,
        symbol: query.toUpperCase()
      }];
      
    } catch (error) {
      console.error(`❌ ${api.name} Search Error:`, error.message);
      return null;
    }
  }

  formatPrice(price, currency = 'USD') {
    if (!price || price === null || price === undefined || isNaN(price)) {
      return 'N/A';
    }
    
    const numericPrice = Number(price);
    if (numericPrice >= 1) {
      return `$${numericPrice.toFixed(2)}`;
    } else if (numericPrice >= 0.01) {
      return `$${numericPrice.toFixed(4)}`;
    } else {
      return `$${numericPrice.toFixed(8)}`;
    }
  }

  formatChange(change) {
    if (!change && change !== 0 || change === null || change === undefined || isNaN(change)) {
      return '🟡 N/A';
    }
    
    const numericChange = Number(change);
    const emoji = numericChange >= 0 ? '🟢' : '🔴';
    const sign = numericChange >= 0 ? '+' : '';
    return `${emoji} ${sign}${numericChange.toFixed(2)}%`;
  }

  formatMarketCap(marketCap) {
    if (!marketCap || marketCap === null || marketCap === undefined || isNaN(marketCap)) {
      return 'N/A';
    }
    
    const numericCap = Number(marketCap);
    if (numericCap >= 1e12) {
      return `$${(numericCap / 1e12).toFixed(2)}T`;
    } else if (numericCap >= 1e9) {
      return `$${(numericCap / 1e9).toFixed(2)}B`;
    } else if (numericCap >= 1e6) {
      return `$${(numericCap / 1e6).toFixed(2)}M`;
    } else {
      return `$${numericCap.toFixed(0)}`;
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

  coinIdToSymbol(coinId) {
    // Convert CoinGecko coin ID to symbol for other APIs
    const symbolMap = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'binancecoin': 'BNB',
      'ripple': 'XRP',
      'cardano': 'ADA',
      'solana': 'SOL',
      'polkadot': 'DOT',
      'dogecoin': 'DOGE',
      'avalanche-2': 'AVAX',
      'matic-network': 'MATIC',
      'chainlink': 'LINK',
      'uniswap': 'UNI',
      'litecoin': 'LTC',
      'cosmos': 'ATOM',
      'stellar': 'XLM',
      'vechain': 'VET',
      'internet-computer': 'ICP',
      'filecoin': 'FIL',
      'tron': 'TRX',
      'ethereum-classic': 'ETC'
    };

    return symbolMap[coinId] || coinId.toUpperCase();
  }

  coinIdToPaprikaId(coinId) {
    // Convert CoinGecko coin ID to CoinPaprika format
    const paprikaMap = {
      'bitcoin': 'btc-bitcoin',
      'ethereum': 'eth-ethereum',
      'binancecoin': 'bnb-binance-coin',
      'ripple': 'xrp-xrp',
      'cardano': 'ada-cardano',
      'solana': 'sol-solana',
      'polkadot': 'dot-polkadot',
      'dogecoin': 'doge-dogecoin',
      'avalanche-2': 'avax-avalanche',
      'matic-network': 'matic-polygon',
      'chainlink': 'link-chainlink',
      'uniswap': 'uni-uniswap',
      'litecoin': 'ltc-litecoin',
      'cosmos': 'atom-cosmos',
      'stellar': 'xlm-stellar',
      'vechain': 'vet-vechain',
      'internet-computer': 'icp-internet-computer',
      'filecoin': 'fil-filecoin',
      'tron': 'trx-tron',
      'ethereum-classic': 'etc-ethereum-classic'
    };

    return paprikaMap[coinId] || `${coinId}-${coinId}`;
  }
}

module.exports = PriceClient;