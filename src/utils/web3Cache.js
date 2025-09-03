// Cache for Web3 data to prevent excessive RPC calls
class Web3Cache {
  constructor() {
    this.cache = new Map();
    this.timeouts = new Map();
  }

  // Get cached value or fetch if expired
  async get(key, fetchFn, ttl = 60000) { // Default 60 second TTL
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && cached.timestamp + ttl > now) {
      return cached.value;
    }

    // If fetch is already in progress, wait for it
    if (this.timeouts.has(key)) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const cached = this.cache.get(key);
          if (cached && cached.timestamp + ttl > now) {
            clearInterval(checkInterval);
            resolve(cached.value);
          }
        }, 100);
      });
    }

    // Mark as fetching
    this.timeouts.set(key, true);
    
    try {
      const value = await fetchFn();
      this.cache.set(key, { value, timestamp: now });
      return value;
    } finally {
      this.timeouts.delete(key);
    }
  }

  // Clear cache
  clear() {
    this.cache.clear();
    this.timeouts.clear();
  }

  // Clear specific key
  delete(key) {
    this.cache.delete(key);
    this.timeouts.delete(key);
  }
}

export default new Web3Cache();