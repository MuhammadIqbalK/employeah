import Redis from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config({
    path: './.env',
});

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  // Memory optimization settings
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
  // Connection pooling
  lazyConnect: true,
  keepAlive: 30000,
  // Compression settings
  compression: 'gzip',
  // Performance tuning
  connectTimeout: 10000,
  commandTimeout: 5000,
});

redis.on('error', (error) => {
  // Silent error handling for performance
});

redis.on('connect', () => {
  // Configure Redis for optimal performance
  configureRedisOptimizations();
});

async function configureRedisOptimizations() {
  try {
    // Set memory optimization policies (only if supported)
    try {
      await redis.config('SET', 'maxmemory-policy', 'allkeys-lru');
    } catch (e) {
      // Silent fallback
    }
    
    try {
      await redis.config('SET', 'maxmemory', '536870912'); // 512MB in bytes
    } catch (e) {
      // Silent fallback
    }
    
    // Enable compression for data structures
    try {
      await redis.config('SET', 'hash-max-ziplist-entries', '512');
      await redis.config('SET', 'hash-max-ziplist-value', '64');
      await redis.config('SET', 'zset-max-ziplist-entries', '128');
      await redis.config('SET', 'zset-max-ziplist-value', '64');
    } catch (e) {
      // Silent fallback
    }
  } catch (error) {
    // Silent error handling for performance
  }
}

// Cache keys and TTL
export const CACHE_KEYS = {
  DASHBOARD_STATS: 'dashboard:stats',
  RECORD_SEARCH: 'records:search',
  COUNTRY_LIST: 'countries:list',
  USER_SESSION: 'user:session',
} as const;

export const CACHE_TTL = {
  DASHBOARD_STATS: 300, // 5 minutes
  RECORD_SEARCH: 60, // 1 minute
  DATASET: 1800, // 30 minutes - full dataset cache
  COUNTRY_LIST: 3600, // 1 hour
  USER_SESSION: 86400, // 24 hours
} as const;
