// Cache for Web3 data to prevent excessive RPC calls
// Supports localStorage persistence for long-lived entries (e.g. thresholds)
const LS_KEY = 'tacoscan_web3cache';
const CACHE_VERSION = 2; // Bump to invalidate stale entries

function loadFromStorage() {
  try {
    const ver = localStorage.getItem(LS_KEY + '_v');
    if (ver !== String(CACHE_VERSION)) {
      localStorage.removeItem(LS_KEY);
      localStorage.setItem(LS_KEY + '_v', String(CACHE_VERSION));
      return new Map();
    }
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return new Map();
    const entries = JSON.parse(raw);
    return new Map(entries);
  } catch { return new Map(); }
}

function saveToStorage(cache) {
  try {
    // Only persist entries with TTL >= 1h (long-lived data)
    const persistable = [];
    for (const [key, entry] of cache) {
      if (entry.ttl >= 3600000) {
        persistable.push([key, entry]);
      }
    }
    localStorage.setItem(LS_KEY, JSON.stringify(persistable));
  } catch { /* storage full or unavailable */ }
}

class Web3Cache {
  constructor() {
    this.cache = loadFromStorage();
    this.pending = new Map();
  }

  // Get cached value or fetch if expired
  async get(key, fetchFn, ttl = 60000) {
    const cached = this.cache.get(key);
    if (cached && cached.timestamp + (cached.ttl || ttl) > Date.now()) {
      return cached.value;
    }

    // If fetch is already in progress, return the same promise
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }

    // Start fetch and store the promise for deduplication
    const fetchPromise = fetchFn()
      .then((value) => {
        this.cache.set(key, { value, timestamp: Date.now(), ttl });
        this.pending.delete(key);
        if (ttl >= 3600000) saveToStorage(this.cache);
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
    try { localStorage.removeItem(LS_KEY); } catch {}
  }

  delete(key) {
    this.cache.delete(key);
    this.pending.delete(key);
  }
}

export default new Web3Cache();
