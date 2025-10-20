import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from '../db';
import { trxEmployee } from '../db/schema';
import { redis, CACHE_KEYS, CACHE_TTL } from '../config/redis';
import { eq, and, or, like, gte, lte, desc, asc, count, sql } from 'drizzle-orm';
import { OptimizedCacheService } from '../services/optimized-cache.service';
import { ApiResponse } from '../types/api.types';

const recordsController = new Hono();

// Enable CORS
recordsController.use('*', cors());

/**
 * Helper function to clear all records cache
 */
async function clearRecordsCache() {
  try {
    const keys = await redis.keys(`${CACHE_KEYS.RECORD_SEARCH}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    // Silent error handling for performance
  }
}

/**
 * Cache status endpoint with detailed metrics
 */
recordsController.get('/cache-status', async (c) => {
  try {
    const stats = await OptimizedCacheService.getCacheStats();
    const recordCacheKeys = await redis.keys(`${CACHE_KEYS.RECORD_SEARCH}:*`);
    const dashboardCache = await redis.get(CACHE_KEYS.DASHBOARD_STATS);
    const countryCache = await redis.get(CACHE_KEYS.COUNTRY_LIST);
    
    return c.json({
      cache: {
        records: {
          keys: recordCacheKeys,
          count: recordCacheKeys.length
        },
        dashboard: {
          exists: !!dashboardCache,
          data: dashboardCache ? JSON.parse(dashboardCache) : null
        },
        countries: {
          exists: !!countryCache,
          data: countryCache ? JSON.parse(countryCache) : null
        }
      },
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache status error:', error);
    return c.json({ error: 'Failed to get cache status' }, 500);
  }
});

/**
 * Cache performance metrics endpoint
 */
recordsController.get('/cache-metrics', async (c) => {
  try {
    const memoryInfo = await redis.info('memory');
    const statsInfo = await redis.info('stats');
    
    // Calculate hit rate
    const hits = parseInt(statsInfo.match(/keyspace_hits:(\d+)/)?.[1] || '0');
    const misses = parseInt(statsInfo.match(/keyspace_misses:(\d+)/)?.[1] || '0');
    const hitRate = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(2) : '0';
    
    return c.json({
      memory: {
        used: memoryInfo.match(/used_memory:(\d+)/)?.[1] || 'N/A',
        peak: memoryInfo.match(/used_memory_peak:(\d+)/)?.[1] || 'N/A',
        fragmentation: memoryInfo.match(/mem_fragmentation_ratio:([\d.]+)/)?.[1] || 'N/A',
        humanReadable: {
          used: formatBytes(parseInt(memoryInfo.match(/used_memory:(\d+)/)?.[1] || '0')),
          peak: formatBytes(parseInt(memoryInfo.match(/used_memory_peak:(\d+)/)?.[1] || '0'))
        }
      },
      stats: {
        totalConnections: statsInfo.match(/total_connections_received:(\d+)/)?.[1] || 'N/A',
        commandsProcessed: statsInfo.match(/total_commands_processed:(\d+)/)?.[1] || 'N/A',
        keyspaceHits: hits,
        keyspaceMisses: misses,
        hitRate: `${hitRate}%`
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache metrics error:', error);
    return c.json({ error: 'Failed to get cache metrics' }, 500);
  }
});

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Test cache endpoint - force cache some data
 */
recordsController.get('/test-cache', async (c) => {
  try {
    const testKey = `${CACHE_KEYS.RECORD_SEARCH}:test`;
    const testData = {
      records: [
        { id: 1, firstname: 'Test', lastname: 'User', country: 'Test Country' }
      ],
      pagination: { page: 1, limit: 10, total: 1 },
      cached: false,
      cacheKey: testKey,
      testTime: new Date().toISOString()
    };

    // Store test data in cache
    await redis.setex(testKey, 60, JSON.stringify(testData));
    
    // Retrieve test data
    const retrieved = await redis.get(testKey);
    
    // Get all cache keys
    const allKeys = await redis.keys(`${CACHE_KEYS.RECORD_SEARCH}:*`);
    
    return c.json({
      success: true,
      testData: JSON.parse(retrieved || '{}'),
      allCacheKeys: allKeys,
      cacheKeyCount: allKeys.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test cache error:', error);
    return c.json({ error: 'Failed to test cache' }, 500);
  }
});

/**
 * Test small dataset caching
 */
recordsController.get('/test-small-cache', async (c) => {
  try {
    // Request with small limit to ensure caching
    const page = 1;
    const limit = 5; // Small limit to ensure caching
    const offset = (page - 1) * limit;

    const cacheParams = {
      page, limit, search: '', gender: '', country: '', ageMin: '', ageMax: '', 
      dateFrom: '', dateTo: '', sortBy: 'id', sortOrder: 'asc'
    };
    const cacheKey = `${CACHE_KEYS.RECORD_SEARCH}:${JSON.stringify(cacheParams)}`;

    // Get small dataset
    const records = await db
      .select()
      .from(trxEmployee)
      .orderBy(asc(trxEmployee.id))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: count() })
      .from(trxEmployee);
    
    const total = totalResult[0].count;

    const result = {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      cached: false,
      cacheKey,
      testTime: new Date().toISOString()
    };

    // Cache the small result
    await redis.setex(cacheKey, 60, JSON.stringify(result));
    
    // Get all cache keys
    const allKeys = await redis.keys(`${CACHE_KEYS.RECORD_SEARCH}:*`);
    
    return c.json({
      success: true,
      result,
      allCacheKeys: allKeys,
      cacheKeyCount: allKeys.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test small cache error:', error);
    return c.json({ error: 'Failed to test small cache' }, 500);
  }
});

/**
 * Clear all cache endpoint
 */
recordsController.post('/clear-cache', async (c) => {
  try {
    await clearRecordsCache();
    await redis.del(CACHE_KEYS.DASHBOARD_STATS);
    await redis.del(CACHE_KEYS.COUNTRY_LIST);
    
    return c.json({
      message: 'All cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    return c.json({ error: 'Failed to clear cache' }, 500);
  }
});

/**
 * Get records with optimized cursor-based pagination
 */
recordsController.get('/', async (c) => {
  try {
    const cursor = parseInt(c.req.query('cursor') || '0');
    const limit = parseInt(c.req.query('limit') || '50');
    const useCursor = c.req.query('use_cursor') === 'true';
    
    // For backward compatibility, support page-based pagination
    const page = parseInt(c.req.query('page') || '0');
    const search = c.req.query('search') || '';
    const gender = c.req.query('gender') || '';
    const country = c.req.query('country') || '';
    const ageMin = c.req.query('age_min') || '';
    const ageMax = c.req.query('age_max') || '';
    const dateFrom = c.req.query('date_from') || '';
    const dateTo = c.req.query('date_to') || '';
    const sortBy = c.req.query('sort_by') || 'id';
    const sortOrder = c.req.query('sort_order') || 'asc';

    // Use cursor-based pagination for better performance
    if (useCursor || page === 0) {
      const filters = { search, gender, country, ageMin, ageMax, dateFrom, dateTo, sortBy, sortOrder };
      const result = await OptimizedCacheService.getRecordsWithCursor(cursor, limit, filters);
      return c.json(ApiResponse.success('Records retrieved successfully', result));
    }

    // Fallback to traditional pagination for complex filters
    const offset = (page - 1) * limit;

    // Create cache key based on all parameters
    const cacheParams = {
      page, limit, search, gender, country, ageMin, ageMax, dateFrom, dateTo, sortBy, sortOrder
    };
    const cacheKey = `${CACHE_KEYS.RECORD_SEARCH}:${JSON.stringify(cacheParams)}`;
    
    // Try to get from cache first
    const cachedResult = await redis.get(cacheKey);
    if (cachedResult) {
      const result = JSON.parse(cachedResult);
      result.cached = true;
      return c.json(ApiResponse.success('Records retrieved from cache', result));
    }

    // Build where conditions
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(trxEmployee.firstname, `%${search}%`),
          like(trxEmployee.lastname, `%${search}%`),
          like(trxEmployee.country, `%${search}%`)
        )
      );
    }
    
    if (gender) {
      conditions.push(eq(trxEmployee.gender, gender));
    }
    
    if (country) {
      conditions.push(eq(trxEmployee.country, country));
    }
    
    if (ageMin) {
      conditions.push(gte(trxEmployee.age, parseInt(ageMin)));
    }
    
    if (ageMax) {
      conditions.push(lte(trxEmployee.age, parseInt(ageMax)));
    }
    
    if (dateFrom) {
      conditions.push(gte(trxEmployee.date, dateFrom));
    }
    
    if (dateTo) {
      conditions.push(lte(trxEmployee.date, dateTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(trxEmployee)
      .where(whereClause);
    
    const total = totalResult[0].count;

    // Get records
    const getOrderByColumn = (sortBy: string) => {
      switch (sortBy) {
        case 'id': return trxEmployee.id;
        case 'firstname': return trxEmployee.firstname;
        case 'lastname': return trxEmployee.lastname;
        case 'gender': return trxEmployee.gender;
        case 'country': return trxEmployee.country;
        case 'age': return trxEmployee.age;
        case 'date': return trxEmployee.date;
        case 'createdAt': return trxEmployee.createdAt;
        case 'updatedAt': return trxEmployee.updatedAt;
        default: return trxEmployee.id;
      }
    };
    
    const orderByColumn = getOrderByColumn(sortBy);
    const orderBy = sortOrder === 'desc' ? desc(orderByColumn) : asc(orderByColumn);
    
    const records = await db
      .select()
      .from(trxEmployee)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const result = {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      cached: false,
      cacheKey,
    };

    // Cache the result with smart strategy
    const shouldCache = records.length <= 1000; // Cache based on returned records, not total
    
    if (shouldCache) {
      try {
        await redis.setex(cacheKey, CACHE_TTL.RECORD_SEARCH, JSON.stringify(result));
      } catch (cacheError) {
        // Silent error handling for performance
      }
    }

    return c.json(ApiResponse.success('Records retrieved successfully', result));

  } catch (error) {
    console.error('Records fetch error:', error);
    return c.json(ApiResponse.error('Failed to fetch records', error instanceof Error ? error.message : 'Unknown error'), 500);
  }
});

/**
 * Get record by ID
 */
recordsController.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid record ID' }, 400);
    }

    const record = await db
      .select()
      .from(trxEmployee)
      .where(eq(trxEmployee.id, id))
      .limit(1);

    if (record.length === 0) {
      return c.json({ error: 'Record not found' }, 404);
    }

    return c.json(record[0]);

  } catch (error) {
    console.error('Record fetch error:', error);
    return c.json({ error: 'Failed to fetch record' }, 500);
  }
});

/**
 * Update record
 */
recordsController.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid record ID' }, 400);
    }

    const body = await c.req.json();
    
    // Validate required fields
    const { firstname, lastname, gender, country, age, date } = body;
    
    if (!firstname || !lastname || !gender || !country || !age || !date) {
      return c.json({ error: 'All fields are required' }, 400);
    }

    // Validate field lengths
    if (firstname.length > 10 || lastname.length > 10) {
      return c.json({ error: 'Name fields must be 10 characters or less' }, 400);
    }
    
    if (gender.length > 6) {
      return c.json({ error: 'Gender must be 6 characters or less' }, 400);
    }
    
    if (country.length > 20) {
      return c.json({ error: 'Country must be 20 characters or less' }, 400);
    }
    
    if (age < 0 || age > 99) {
      return c.json({ error: 'Age must be between 0 and 99' }, 400);
    }

    const updatedRecord = await db
      .update(trxEmployee)
      .set({
        firstname,
        lastname,
        gender,
        country,
        age,
        date: date,
        updatedAt: new Date(),
      })
      .where(eq(trxEmployee.id, id))
      .returning();

    if (updatedRecord.length === 0) {
      return c.json({ error: 'Record not found' }, 404);
    }

    // Clear cache with optimized strategy
    await redis.del(CACHE_KEYS.DASHBOARD_STATS);
    await OptimizedCacheService.invalidateCache('partial');

    return c.json(updatedRecord[0]);

  } catch (error) {
    console.error('Record update error:', error);
    return c.json({ error: 'Failed to update record' }, 500);
  }
});

/**
 * Delete record
 */
recordsController.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid record ID' }, 400);
    }

    const deletedRecord = await db
      .delete(trxEmployee)
      .where(eq(trxEmployee.id, id))
      .returning();

    if (deletedRecord.length === 0) {
      return c.json({ error: 'Record not found' }, 404);
    }

    // Clear cache
    await redis.del(CACHE_KEYS.DASHBOARD_STATS);
    
    // Clear records cache
    await clearRecordsCache();

    return c.json({ message: 'Record deleted successfully' });

  } catch (error) {
    console.error('Record delete error:', error);
    return c.json({ error: 'Failed to delete record' }, 500);
  }
});

/**
 * Bulk update records
 */
recordsController.post('/bulk-update', async (c) => {
  try {
    const body = await c.req.json();
    const { recordIds, updates } = body;

    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return c.json({ error: 'Record IDs are required' }, 400);
    }

    if (!updates || Object.keys(updates).length === 0) {
      return c.json({ error: 'Updates are required' }, 400);
    }

    // Validate updates
    if (updates.firstname && updates.firstname.length > 10) {
      return c.json({ error: 'First name must be 10 characters or less' }, 400);
    }
    
    if (updates.lastname && updates.lastname.length > 10) {
      return c.json({ error: 'Last name must be 10 characters or less' }, 400);
    }
    
    if (updates.gender && updates.gender.length > 6) {
      return c.json({ error: 'Gender must be 6 characters or less' }, 400);
    }
    
    if (updates.country && updates.country.length > 20) {
      return c.json({ error: 'Country must be 20 characters or less' }, 400);
    }
    
    if (updates.age && (updates.age < 0 || updates.age > 99)) {
      return c.json({ error: 'Age must be between 0 and 99' }, 400);
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.firstname) updateData.firstname = updates.firstname;
    if (updates.lastname) updateData.lastname = updates.lastname;
    if (updates.gender) updateData.gender = updates.gender;
    if (updates.country) updateData.country = updates.country;
    if (updates.age) updateData.age = updates.age;
    if (updates.date) updateData.date = updates.date;

    // Perform bulk update
    const updatedRecords = await db
      .update(trxEmployee)
      .set(updateData)
      .where(sql`${trxEmployee.id} = ANY(${recordIds})`)
      .returning();

    // Clear cache
    await redis.del(CACHE_KEYS.DASHBOARD_STATS);
    
    // Clear records cache
    await clearRecordsCache();

    return c.json({
      message: `${updatedRecords.length} records updated successfully`,
      updatedCount: updatedRecords.length,
    });

  } catch (error) {
    console.error('Bulk update error:', error);
    return c.json({ error: 'Failed to update records' }, 500);
  }
});

export default recordsController;
