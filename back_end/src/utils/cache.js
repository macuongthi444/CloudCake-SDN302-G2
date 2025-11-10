// In-memory cache utility for faster response times
// Tối ưu: Cache dữ liệu thường xuyên truy cập để giảm query DB

class Cache {
    constructor(defaultTTL = 300000) { // 5 minutes default
        this.cache = new Map();
        this.defaultTTL = defaultTTL;
    }

    // Get value from cache
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        // Check if expired
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    // Set value in cache
    set(key, value, ttl = null) {
        const expiry = Date.now() + (ttl || this.defaultTTL);
        this.cache.set(key, { value, expiry });
    }

    // Delete specific key
    delete(key) {
        this.cache.delete(key);
    }

    // Clear all cache
    clear() {
        this.cache.clear();
    }

    // Clear cache by pattern (e.g., all user-related cache)
    clearPattern(pattern) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    // Get or set pattern (useful for caching async operations)
    async getOrSet(key, fetchFn, ttl = null) {
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }
        
        const value = await fetchFn();
        this.set(key, value, ttl);
        return value;
    }

    // Clean expired entries
    cleanExpired() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
            }
        }
    }
}

// Create singleton instance
const cache = new Cache();

// Auto-clean expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        cache.cleanExpired();
    }, 300000); // 5 minutes
}

module.exports = cache;










