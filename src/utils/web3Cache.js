// Cache for Web3 data to prevent excessive RPC calls
class Web3Cache {
  constructor() {
    this.cache = new Map();
    this.pending = new Map();
  }

  // Get cached value or fetch if expired
  async get(key, fetchFn, ttl = 60000) {
    const cached = this.cache.get(key);
    if (cached && cached.timestamp + ttl > Date.now()) {
      return cached.value;
    }

    // If fetch is already in progress, return the same promise
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }

    // Start fetch and store the promise for deduplication
    const fetchPromise = fetchFn()
      .then((value) => {
        this.cache.set(key, { value, timestamp: Date.now() });
        this.pending.delete(key);
        return value;
      })
      .catch((error) => {
        this.pending.delete(key);
        throw error;
      });

    this.pending.set(key, fetchPromise);
    return fetchPromise;
  }

  clear() {
    this.cache.clear();
    this.pending.clear();
  }

  delete(key) {
    this.cache.delete(key);
    this.pending.delete(key);
  }
}

export default new Web3Cache();
