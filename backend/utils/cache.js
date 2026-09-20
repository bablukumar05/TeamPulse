class MemoryCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 500;
    this.defaultTTL = (options.defaultTTLSeconds || 300) * 1000;
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key, value, ttlSeconds) {
    const ttl = (ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL);
    const expiresAt = Date.now() + ttl;

    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
        this.stats.evictions++;
      }
    }

    this.cache.set(key, { value, expiresAt });
    this.stats.sets++;
    return value;
  }

  del(key) {
    return this.cache.delete(key);
  }

  flush() {
    const count = this.cache.size;
    this.cache.clear();
    return count;
  }

  async getOrSet(key, fetcher, ttlSeconds) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const freshData = await fetcher();
    this.set(key, freshData, ttlSeconds);
    return freshData;
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) : '0.0';
    return {
      entries: this.cache.size,
      maxSize: this.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`,
      sets: this.stats.sets,
      evictions: this.stats.evictions
    };
  }
}

const cache = new MemoryCache({ maxSize: 1000, defaultTTLSeconds: 300 });

module.exports = cache;
