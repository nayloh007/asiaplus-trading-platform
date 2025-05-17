import { CryptoCurrency } from "@shared/schema";

// Cache mechanism to reduce API calls
const cache = {
  marketData: null as CryptoCurrency[] | null,
  lastFetched: 0,
  cacheTime: 60000, // 1 minute
};

// CoinGecko API URLs
const API_BASE_URL = "https://api.coingecko.com/api/v3";
const MARKET_DATA_URL = `${API_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h`;

// Handle rate limiting with exponential backoff
const fetchWithRetry = async (url: string, retries = 3, backoff = 1000) => {
  try {
    const response = await fetch(url);
    
    if (response.status === 429) {
      // Rate limited
      if (retries === 0) throw new Error("Rate limit exceeded");
      
      console.log(`Rate limited, retrying in ${backoff}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      
      return fetchWithRetry(url, retries - 1, backoff * 2);
    }
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error("Error fetching cryptocurrency data:", error);
    throw error;
  }
};

// Fetch a specific cryptocurrency directly from the API
async function fetchCryptoDirectly(id: string): Promise<CryptoCurrency | null> {
  try {
    const url = `${API_BASE_URL}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`;
    const data = await fetchWithRetry(url);
    
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      image: data.image.large,
      current_price: data.market_data.current_price.usd,
      price_change_percentage_24h: data.market_data.price_change_percentage_24h,
      sparkline_in_7d: {
        price: data.market_data.sparkline_7d?.price || []
      }
    };
  } catch (error) {
    console.error(`Error directly fetching crypto data for ${id}:`, error);
    return null;
  }
}

// Make sure Bitcoin Cash (BCH) is included in our market data
async function ensureBitcoinCash(marketData: CryptoCurrency[]): Promise<CryptoCurrency[]> {
  // Check if BCH is already in the market data
  const hasBCH = marketData.some(crypto => crypto.id === 'bitcoin-cash');
  
  if (hasBCH) {
    return marketData; // BCH already exists, no need to add it
  }
  
  try {
    // Fetch BCH data specifically, without using getCryptoById to avoid circular dependency
    const bchData = await fetchCryptoDirectly('bitcoin-cash');
    
    if (bchData) {
      // Add BCH to the market data
      return [...marketData, bchData];
    }
    
    return marketData; // If we couldn't fetch BCH data, return original data
  } catch (error) {
    console.error("Error fetching Bitcoin Cash data:", error);
    return marketData; // Return original data on error
  }
}

export async function getMarketData(): Promise<CryptoCurrency[]> {
  const now = Date.now();
  
  // Return cached data if available and not expired
  if (cache.marketData && now - cache.lastFetched < cache.cacheTime) {
    return cache.marketData;
  }
  
  try {
    const data = await fetchWithRetry(MARKET_DATA_URL);
    
    // Add Bitcoin Cash if not already present
    const dataWithBCH = await ensureBitcoinCash(data);
    
    // Update cache
    cache.marketData = dataWithBCH;
    cache.lastFetched = now;
    
    return dataWithBCH;
  } catch (error) {
    // If we have cached data, return it even if expired
    if (cache.marketData) {
      console.log("Using expired cache due to API error");
      return cache.marketData;
    }
    
    throw error;
  }
}

export async function getCryptoById(id: string): Promise<CryptoCurrency | null> {
  try {
    // Try to find it in the cache first
    const marketData = await getMarketData();
    const crypto = marketData.find(c => c.id === id);
    
    if (crypto) return crypto;
    
    // If not in cache, fetch directly using the reusable function
    return await fetchCryptoDirectly(id);
  } catch (error) {
    console.error(`Error fetching crypto data for ${id}:`, error);
    return null;
  }
}
