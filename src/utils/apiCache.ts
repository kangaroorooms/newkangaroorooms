/**
 * Simple in-memory API cache for frontend
 * Prevents duplicate API calls within TTL window
 * 
 * Usage:
 * const cities = await cachedFetch('cities', () => fetchCities(), 5 * 60 * 1000)
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Get or fetch data with intelligent caching
 * @param key - Unique cache key
 * @param fetchFn - Function that fetches the data
 * @param ttl - Time to live in milliseconds (default: 5 minutes)
 * @returns Cached or freshly fetched data
 */
export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 5 * 60 * 1000, // 5 minutes default
): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key);

  // Return cached data if still valid
  if (entry && now - entry.timestamp < entry.ttl) {
    return entry.data;
  }

  try {
    // Fetch fresh data
    const data = await fetchFn();

    // Store in cache
    cache.set(key, {
      data,
      timestamp: now,
      ttl,
    });

    return data;
  } catch (error) {
    // If fetch fails and we have stale cache, return it
    if (entry) {
      return entry.data;
    }
    throw error;
  }
}

/**
 * Manually clear specific cache entry
 */
export function clearCache(key: string): void {
  if (cache.has(key)) {
    cache.delete(key);
  }
}

export function clearCachePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  cache.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
      isExpired: Date.now() - entry.timestamp >= entry.ttl,
    })),
  };
}
