class SmartTaggingSystem {
  constructor() {
    // Categorized accounts for intelligent tagging based on content
    this.tagDatabase = {
      // Ethereum Core & Development
      ethereum: [
        '@VitalikButerin', '@ethereum', '@timbeiko_', '@dannyryan', '@peter_szilagyi',
        '@ultrasoundmoney', '@EthereumDenver', '@EF_ESP'
      ],
      
      // DeFi & Protocols
      defi: [
        '@DefiLlama', '@sassal0x', '@hmalviya9', '@DeFiPulse', '@spencernoon',
        '@bantg', '@kaiynne', '@rleshner', '@stanikulechov', '@haydenzadams'
      ],
      
      // Layer 2 & Scaling
      layer2: [
        '@arbitrum', '@optimismFND', '@0xPolygon', '@StarkWareLtd', '@zksync',
        '@MetisDAO', '@loopringorg', '@BuildOnBase'
      ],
      
      // Educational & Media
      education: [
        '@RyanSAdams', '@TrustlessState', '@LauraShin', '@aantonop', '@koeppelmann',
        '@econoar', '@evan_van_ness', '@weeks_in_ethereum'
      ],
      
      // Investment & Analysis
      analysis: [
        '@cobie', '@nic__carter', '@cburniske', '@ari_paul', '@CryptoCobain',
        '@pythianism', '@DegenSpartan', '@aliatiia_'
      ],
      
      // Development & Technical
      technical: [
        '@solidity_lang', '@OpenZeppelin', '@trufflesuite', '@HardhatHQ',
        '@ConsenSys', '@chainlink', '@graphprotocol', '@ENSdomains'
      ],
      
      // Governance & DAOs
      governance: [
        '@StateOfTheDApps', '@OlympusDAO', '@MakerDAO', '@compoundfinance',
        '@AaveAave', '@Uniswap', '@gitcoin', '@ethereum'
      ],
      
      // NFT & Gaming
      nft: [
        '@opensea', '@LooksRare', '@SuperRare', '@niftygateway',
        '@async_art', '@foundation', '@zora'
      ],
      
      // Infrastructure & Tools
      infrastructure: [
        '@infura_io', '@AlchemyPlatform', '@QuickNode', '@etherscan',
        '@MetaMask', '@argentHQ', '@gnosisPM', '@CoinbaseWallet'
      ]
    };

    // Keywords that trigger specific tag categories
    this.keywordMapping = {
      // Ethereum Core
      'ethereum': 'ethereum',
      'eth2': 'ethereum', 
      'beacon chain': 'ethereum',
      'consensus': 'ethereum',
      'execution': 'ethereum',
      'merge': 'ethereum',
      'proof of stake': 'ethereum',
      'staking': 'ethereum',
      'validator': 'ethereum',
      'eip': 'ethereum',
      'fork': 'ethereum',

      // DeFi
      'defi': 'defi',
      'decentralized finance': 'defi',
      'liquidity': 'defi',
      'yield': 'defi',
      'farming': 'defi',
      'lending': 'defi',
      'borrowing': 'defi',
      'amm': 'defi',
      'dex': 'defi',
      'swap': 'defi',
      'pool': 'defi',
      'tvl': 'defi',

      // Layer 2
      'layer 2': 'layer2',
      'l2': 'layer2',
      'rollup': 'layer2',
      'arbitrum': 'layer2',
      'optimism': 'layer2',
      'polygon': 'layer2',
      'zksync': 'layer2',
      'base': 'layer2',
      'scaling': 'layer2',
      'sidechain': 'layer2',

      // Technical
      'smart contract': 'technical',
      'solidity': 'technical',
      'hardhat': 'technical',
      'truffle': 'technical',
      'remix': 'technical',
      'openzeppelin': 'technical',
      'audit': 'technical',
      'security': 'technical',
      'gas': 'technical',
      'gwei': 'technical',

      // Analysis
      'price': 'analysis',
      'trading': 'analysis',
      'market': 'analysis',
      'bull': 'analysis',
      'bear': 'analysis',
      'technical analysis': 'analysis',
      'chart': 'analysis',

      // NFTs
      'nft': 'nft',
      'opensea': 'nft',
      'collection': 'nft',
      'mint': 'nft',
      'pfp': 'nft',

      // Governance
      'dao': 'governance',
      'governance': 'governance',
      'proposal': 'governance',
      'voting': 'governance',
      'community': 'governance'
    };

    // Special occasion tags
    this.eventTags = {
      'devcon': ['@EthereumDenver', '@EthereumDenver', '@VitalikButerin'],
      'ethdenver': ['@EthereumDenver', '@EthereumDenver', '@sporkDAO'],
      'consensus': ['@CoinDesk', '@ethereum', '@ConsenSys'],
      'hackathon': ['@ETHGlobal', '@gitcoin', '@ethereum']
    };

    console.log('🏷️ Smart Tagging System initialized with comprehensive tag database');
  }

  // Analyze content and determine relevant tags
  analyzeContent(content) {
    const lowerContent = content.toLowerCase();
    const detectedCategories = new Set();
    
    // Check for keyword matches
    for (const [keyword, category] of Object.entries(this.keywordMapping)) {
      if (lowerContent.includes(keyword)) {
        detectedCategories.add(category);
      }
    }

    // Check for special events
    for (const [event, tags] of Object.entries(this.eventTags)) {
      if (lowerContent.includes(event)) {
        return { categories: Array.from(detectedCategories), eventTags: tags };
      }
    }

    return { categories: Array.from(detectedCategories), eventTags: [] };
  }

  // Get smart tags based on content analysis
  getSmartTags(content, maxTags = 3) {
    const analysis = this.analyzeContent(content);
    let selectedTags = [];

    // Add event tags first (highest priority)
    if (analysis.eventTags.length > 0) {
      selectedTags.push(...analysis.eventTags.slice(0, maxTags));
      return selectedTags;
    }

    // Add category-based tags
    const shuffledCategories = this.shuffleArray(analysis.categories);
    
    for (const category of shuffledCategories) {
      if (selectedTags.length >= maxTags) break;
      
      const categoryTags = this.tagDatabase[category] || [];
      if (categoryTags.length > 0) {
        // Randomly select from category, but prefer more influential accounts
        const weightedTags = this.getWeightedTags(categoryTags, category);
        const randomTag = weightedTags[Math.floor(Math.random() * Math.min(3, weightedTags.length))];
        
        if (randomTag && !selectedTags.includes(randomTag)) {
          selectedTags.push(randomTag);
        }
      }
    }

    // If no specific categories detected, add general ethereum tags for crypto content
    if (selectedTags.length === 0 && this.isCryptoContent(content)) {
      const generalTags = ['@ethereum', '@VitalikButerin', '@DefiLlama'];
      selectedTags.push(generalTags[Math.floor(Math.random() * generalTags.length)]);
    }

    return selectedTags.slice(0, maxTags);
  }

  // Weight tags based on influence and relevance
  getWeightedTags(tags, category) {
    const weights = {
      // Higher weight = more likely to be selected
      '@VitalikButerin': 10,
      '@ethereum': 9,
      '@DefiLlama': 8,
      '@RyanSAdams': 7,
      '@sassal0x': 7,
      '@timbeiko_': 6,
      '@opensea': 6,
      '@Uniswap': 6
    };

    return tags.sort((a, b) => (weights[b] || 5) - (weights[a] || 5));
  }

  // Check if content is crypto-related
  isCryptoContent(content) {
    const cryptoKeywords = [
      'crypto', 'blockchain', 'bitcoin', 'ethereum', 'defi', 'web3',
      'token', 'coin', 'trading', 'hodl', 'dapp', 'protocol'
    ];
    
    const lowerContent = content.toLowerCase();
    return cryptoKeywords.some(keyword => lowerContent.includes(keyword));
  }

  // Shuffle array utility
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Add tags to tweet content intelligently
  addTagsToTweet(content, tweetTypeOrMaxTags = 2) {
    // Handle both tweet type (string) and maxTags (number)
    let maxTags = 2;
    let tweetType = null;
    
    if (typeof tweetTypeOrMaxTags === 'string') {
      tweetType = tweetTypeOrMaxTags;
      maxTags = 2;
    } else if (typeof tweetTypeOrMaxTags === 'number') {
      maxTags = tweetTypeOrMaxTags;
    }
    
    // Get contextual tags if tweet type is provided
    const tags = tweetType 
      ? this.getContextualTags(tweetType, content).slice(0, maxTags)
      : this.getSmartTags(content, maxTags);
    
    if (tags.length === 0) {
      return content;
    }

    // Calculate available space for tags
    const baseLength = content.length;
    const tagText = tags.join(' ');
    const totalLength = baseLength + tagText.length + 2; // +2 for spacing

    // If it fits, add tags at the end
    if (totalLength <= 280) {
      return `${content}\n\n${tagText}`;
    }

    // If it doesn't fit, try with fewer tags
    if (maxTags > 1) {
      return this.addTagsToTweet(content, maxTags - 1);
    }

    // If still doesn't fit, return without tags
    return content;
  }

  // Get contextual tags based on tweet type
  getContextualTags(tweetType, content) {
    const baseTags = this.getSmartTags(content, 1);
    
    // Add type-specific tags
    const typeSpecificTags = {
      'price': ['@DefiLlama', '@coingecko'],
      'price_update': ['@DefiLlama', '@coingecko'],
      'technical': ['@ethereum', '@VitalikButerin'],
      'technical_insight': ['@ethereum', '@VitalikButerin'],
      'ecosystem': ['@ethereum', '@EthereumDenver'],
      'ecosystem_update': ['@ethereum', '@EthereumDenver'],
      'education': ['@RyanSAdams', '@aantonop'],
      'educational_content': ['@RyanSAdams', '@aantonop'],
      'future': ['@VitalikButerin', '@ethereum'],
      'future_vision': ['@VitalikButerin', '@ethereum'],
      'mention_reply': ['@ethereum', '@DefiLlama']
    };

    const specificTags = typeSpecificTags[tweetType] || [];
    const combinedTags = [...baseTags];

    // Add one type-specific tag if there's room
    for (const tag of specificTags) {
      if (combinedTags.length < 2 && !combinedTags.includes(tag)) {
        combinedTags.push(tag);
        break;
      }
    }

    return combinedTags.slice(0, 2); // Limit to 2 tags total
  }

  // Special tagging for influencer replies
  getInfluencerReplyTags(replyContent, originalAuthor) {
    // When replying to influencers, we might tag other relevant people in that space
    const influencerNetwork = {
      'VitalikButerin': ['@ethereum', '@timbeiko_'],
      'DefiLlama': ['@sassal0x', '@spencernoon'],
      'RyanSAdams': ['@TrustlessState', '@ethereum'],
      'cobie': ['@DegenSpartan', '@nic__carter'],
      'josephlubin': ['@ConsenSys', '@ethereum'],
      'ethereum': ['@VitalikButerin', '@EthereumDenver'],
      'Uniswap': ['@haydenzadams', '@ethereum'],
      'AaveAave': ['@StaniKulechov', '@ethereum']
    };

    const network = influencerNetwork[originalAuthor] || [];
    const contentTags = this.getSmartTags(replyContent, 1);

    // Combine network tags with content tags, but be conservative for replies
    const combinedTags = [...contentTags, ...network].slice(0, 1);
    
    // Add tags to reply content if any are found
    if (combinedTags.length > 0) {
      return `${replyContent} ${combinedTags.join(' ')}`;
    }
    
    return replyContent;
  }

  // Get engagement stats
  getTaggingStats() {
    const totalProfiles = Object.values(this.tagDatabase).flat().length;
    const categories = Object.keys(this.tagDatabase).length;
    const keywords = Object.keys(this.keywordMapping).length;

    return {
      totalProfiles,
      categories,
      keywords,
      specialEvents: Object.keys(this.eventTags).length
    };
  }
}

module.exports = SmartTaggingSystem;