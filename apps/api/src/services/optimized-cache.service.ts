import { redis, CACHE_KEYS, CACHE_TTL } from '../../src/config/redis';
import { db } from '../../src/db';
import { trxEmployee } from '../../src/db/schema';
import { eq, and, or, like, gte, lte, desc, asc, count, sql } from 'drizzle-orm';

/**
 * Optimized Redis Caching Service
 * Implements cursor-based pagination, compression, and smart invalidation
 */
export class OptimizedCacheService {
  
  /**
   * Cache full dataset as sorted set for cursor-based pagination
   * Key: records:dataset:hash
   * Structure: Sorted Set (score = id, member = JSON data)
   */
  static async cacheFullDataset() {
    try {
      const datasetKey = `${CACHE_KEYS.RECORD_SEARCH}:dataset`;
      
      // Check if dataset is already cached
      const exists = await redis.exists(datasetKey);
      if (exists) {
        return datasetKey;
      }
      
      // Get all records in batches to avoid memory issues
      const batchSize = 1000;
      let offset = 0;
      let totalCached = 0;

      while (true) {
        const records = await db
          .select()
          .from(trxEmployee)
          .orderBy(asc(trxEmployee.id))
          .limit(batchSize)
          .offset(offset);

        if (records.length === 0) break;

        // Add to sorted set (score = id, member = compressed JSON)
        const pipeline = redis.pipeline();
        
        for (const record of records) {
          const compressedData = this.compressRecord(record);
          pipeline.zadd(datasetKey, record.id, compressedData);
        }
        
        await pipeline.exec();
        
        totalCached += records.length;
        offset += batchSize;
      }

      // Set TTL for dataset
      await redis.expire(datasetKey, CACHE_TTL.DATASET);
      
      return datasetKey;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get records using cursor-based pagination
   */
  static async getRecordsWithCursor(
    cursor: number = 0,
    limit: number = 50,
    filters: any = {}
  ) {
    try {
      const datasetKey = `${CACHE_KEYS.RECORD_SEARCH}:dataset`;
      
      // Ensure dataset is cached
      await this.cacheFullDataset();
      
      // Get records from sorted set
      const records = await redis.zrangebyscore(
        datasetKey,
        cursor + 1, // Start after cursor
        '+inf',
        'LIMIT',
        0,
        limit
      );

      // Decompress records
      const decompressedRecords = records.map(record => 
        this.decompressRecord(record)
      );

      // Get total count
      const totalCount = await redis.zcard(datasetKey);
      
      // Calculate next cursor
      const lastRecord = decompressedRecords[decompressedRecords.length - 1];
      const nextCursor = lastRecord ? lastRecord.id : null;

      return {
        records: decompressedRecords,
        pagination: {
          cursor,
          limit,
          total: totalCount,
          hasNext: nextCursor !== null && decompressedRecords.length === limit,
          nextCursor
        },
        cached: true,
        cacheStrategy: 'cursor-based'
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Compress record data to save memory
   */
  static compressRecord(record: any): string {
    // Remove unnecessary fields and compress
    const compressed = {
      i: record.id,
      f: record.firstname,
      l: record.lastname,
      g: record.gender,
      c: record.country,
      a: record.age,
      d: record.date,
      ca: record.createdAt,
      ua: record.updatedAt
    };
    
    return JSON.stringify(compressed);
  }

  /**
   * Decompress record data
   */
  static decompressRecord(compressedData: string): any {
    const compressed = JSON.parse(compressedData);
    
    return {
      id: compressed.i,
      firstname: compressed.f,
      lastname: compressed.l,
      gender: compressed.g,
      country: compressed.c,
      age: compressed.a,
      date: compressed.d,
      createdAt: compressed.ca,
      updatedAt: compressed.ua
    };
  }

  /**
   * Smart cache invalidation
   */
  static async invalidateCache(invalidationType: 'full' | 'partial' | 'record' = 'full', recordId?: number) {
    try {
      if (invalidationType === 'full') {
        // Clear all cache keys
        const keys = await redis.keys(`${CACHE_KEYS.RECORD_SEARCH}:*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else if (invalidationType === 'partial') {
        // Clear dataset cache only
        const datasetKey = `${CACHE_KEYS.RECORD_SEARCH}:dataset`;
        await redis.del(datasetKey);
      } else if (invalidationType === 'record' && recordId) {
        // Remove specific record from dataset
        const datasetKey = `${CACHE_KEYS.RECORD_SEARCH}:dataset`;
        await redis.zrem(datasetKey, recordId);
      }
    } catch (error) {
      // Silent error handling for performance
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats() {
    try {
      const datasetKey = `${CACHE_KEYS.RECORD_SEARCH}:dataset`;
      
      // Get basic info without problematic MEMORY commands
      const memoryInfo = await redis.info('memory');
      const statsInfo = await redis.info('stats');
      
      const stats = {
        dataset: {
          exists: await redis.exists(datasetKey),
          size: await redis.zcard(datasetKey),
          // Skip memory usage for specific key as it's not supported in all Redis versions
          memory: 'N/A'
        },
        memory: {
          used: memoryInfo.match(/used_memory:(\d+)/)?.[1] || 'N/A',
          peak: memoryInfo.match(/used_memory_peak:(\d+)/)?.[1] || 'N/A',
          fragmentation: memoryInfo.match(/mem_fragmentation_ratio:([\d.]+)/)?.[1] || 'N/A'
        },
        stats: {
          totalConnections: statsInfo.match(/total_connections_received:(\d+)/)?.[1] || 'N/A',
          commandsProcessed: statsInfo.match(/total_commands_processed:(\d+)/)?.[1] || 'N/A',
          keyspaceHits: statsInfo.match(/keyspace_hits:(\d+)/)?.[1] || 'N/A',
          keyspaceMisses: statsInfo.match(/keyspace_misses:(\d+)/)?.[1] || 'N/A'
        }
      };

      return stats;
    } catch (error) {
      return {
        dataset: { exists: false, size: 0, memory: 'Error' },
        memory: { used: 'Error', peak: 'Error', fragmentation: 'Error' },
        stats: { totalConnections: 'Error', commandsProcessed: 'Error', keyspaceHits: 'Error', keyspaceMisses: 'Error' }
      };
    }
  }
}

export default OptimizedCacheService;
