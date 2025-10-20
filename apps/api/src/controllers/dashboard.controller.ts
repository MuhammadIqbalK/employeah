import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from '../db';
import { trxEmployee } from '../db/schema';
import { redis, CACHE_KEYS, CACHE_TTL } from '../config/redis';
import { count, sql, desc } from 'drizzle-orm';
import { ApiResponse } from '../types/api.types';

const dashboardController = new Hono();

// Enable CORS
dashboardController.use('*', cors());

/**
 * Get dashboard statistics
 */
dashboardController.get('/stats', async (c) => {
  try {
    // Try to get from cache first
    const cachedStats = await redis.get(CACHE_KEYS.DASHBOARD_STATS);
    if (cachedStats) {
      const stats = JSON.parse(cachedStats);
      return c.json(ApiResponse.success('Dashboard stats retrieved from cache', stats));
    }

    // Get total records count
    const totalRecordsResult = await db
      .select({ count: count() })
      .from(trxEmployee);
    
    const totalRecords = totalRecordsResult[0].count;

    // Get gender distribution
    const genderDistribution = await db
      .select({
        gender: trxEmployee.gender,
        count: count(),
      })
      .from(trxEmployee)
      .groupBy(trxEmployee.gender);

    // Get country distribution (top 10)
    const countryDistribution = await db
      .select({
        country: trxEmployee.country,
        count: count(),
      })
      .from(trxEmployee)
      .groupBy(trxEmployee.country)
      .orderBy(desc(count()))
      .limit(10);

    // Get average age
    const averageAgeResult = await db
      .select({
        averageAge: sql<number>`AVG(${trxEmployee.age})`,
      })
      .from(trxEmployee);
    
    const averageAge = Math.round(averageAgeResult[0].averageAge || 0);

    // Get records added today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const recordsTodayResult = await db
      .select({ count: count() })
      .from(trxEmployee)
      .where(sql`DATE(${trxEmployee.createdAt}) = DATE(${today})`);
    
    const recordsToday = recordsTodayResult[0].count;

    // Get age distribution
    const ageDistribution = await db
      .select({
        ageRange: sql<string>`CASE 
          WHEN ${trxEmployee.age} < 20 THEN 'Under 20'
          WHEN ${trxEmployee.age} BETWEEN 20 AND 29 THEN '20-29'
          WHEN ${trxEmployee.age} BETWEEN 30 AND 39 THEN '30-39'
          WHEN ${trxEmployee.age} BETWEEN 40 AND 49 THEN '40-49'
          WHEN ${trxEmployee.age} BETWEEN 50 AND 59 THEN '50-59'
          WHEN ${trxEmployee.age} BETWEEN 60 AND 69 THEN '60-69'
          ELSE '70+'
        END`,
        count: count(),
      })
      .from(trxEmployee)
      .groupBy(sql`CASE 
        WHEN ${trxEmployee.age} < 20 THEN 'Under 20'
        WHEN ${trxEmployee.age} BETWEEN 20 AND 29 THEN '20-29'
        WHEN ${trxEmployee.age} BETWEEN 30 AND 39 THEN '30-39'
        WHEN ${trxEmployee.age} BETWEEN 40 AND 49 THEN '40-49'
        WHEN ${trxEmployee.age} BETWEEN 50 AND 59 THEN '50-59'
        WHEN ${trxEmployee.age} BETWEEN 60 AND 69 THEN '60-69'
        ELSE '70+'
      END`);

    const stats = {
      totalRecords,
      genderDistribution: genderDistribution.map(item => ({
        gender: item.gender,
        count: item.count,
        percentage: Math.round((item.count / totalRecords) * 100),
      })),
      countryDistribution: countryDistribution.map(item => ({
        country: item.country,
        count: item.count,
        percentage: Math.round((item.count / totalRecords) * 100),
      })),
      averageAge,
      recordsToday,
      ageDistribution: ageDistribution.map(item => ({
        ageRange: item.ageRange,
        count: item.count,
        percentage: Math.round((item.count / totalRecords) * 100),
      })),
    };

    // Cache the results
    await redis.setex(CACHE_KEYS.DASHBOARD_STATS, CACHE_TTL.DASHBOARD_STATS, JSON.stringify(stats));

    return c.json(ApiResponse.success('Dashboard stats retrieved successfully', stats));

  } catch (error: unknown) {
    console.error('Dashboard stats error:', error);
    return c.json(ApiResponse.error('Failed to fetch dashboard statistics', error instanceof Error ? error.message : 'Unknown error'), 500);
  }
});

/**
 * Get chart data by type
 */
dashboardController.get('/charts/:type', async (c) => {
  try {
    const type = c.req.param('type');
    
    switch (type) {
      case 'gender':
        const genderData = await db
          .select({
            gender: trxEmployee.gender,
            count: count(),
          })
          .from(trxEmployee)
          .groupBy(trxEmployee.gender);
        
        return c.json(ApiResponse.success('Gender chart data retrieved successfully', {
          type: 'pie',
          data: genderData.map(item => ({
            label: item.gender,
            value: item.count,
          })),
        }));

      case 'country':
        const countryData = await db
          .select({
            country: trxEmployee.country,
            count: count(),
          })
          .from(trxEmployee)
          .groupBy(trxEmployee.country)
          .orderBy(desc(count()))
          .limit(15);
        
        return c.json(ApiResponse.success('Country chart data retrieved successfully', {
          type: 'bar',
          data: countryData.map(item => ({
            label: item.country,
            value: item.count,
          })),
        }));

      case 'age':
        const ageData = await db
          .select({
            ageRange: sql<string>`CASE 
              WHEN ${trxEmployee.age} < 20 THEN 'Under 20'
              WHEN ${trxEmployee.age} BETWEEN 20 AND 29 THEN '20-29'
              WHEN ${trxEmployee.age} BETWEEN 30 AND 39 THEN '30-39'
              WHEN ${trxEmployee.age} BETWEEN 40 AND 49 THEN '40-49'
              WHEN ${trxEmployee.age} BETWEEN 50 AND 59 THEN '50-59'
              WHEN ${trxEmployee.age} BETWEEN 60 AND 69 THEN '60-69'
              ELSE '70+'
            END`,
            count: count(),
          })
          .from(trxEmployee)
          .groupBy(sql`CASE 
            WHEN ${trxEmployee.age} < 20 THEN 'Under 20'
            WHEN ${trxEmployee.age} BETWEEN 20 AND 29 THEN '20-29'
            WHEN ${trxEmployee.age} BETWEEN 30 AND 39 THEN '30-39'
            WHEN ${trxEmployee.age} BETWEEN 40 AND 49 THEN '40-49'
            WHEN ${trxEmployee.age} BETWEEN 50 AND 59 THEN '50-59'
            WHEN ${trxEmployee.age} BETWEEN 60 AND 69 THEN '60-69'
            ELSE '70+'
          END`);
        
        return c.json(ApiResponse.success('Age chart data retrieved successfully', {
          type: 'histogram',
          data: ageData.map(item => ({
            label: item.ageRange,
            value: item.count,
          })),
        }));

      case 'timeline':
        // Get records added over the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const timelineData = await db
          .select({
            date: sql<string>`DATE(${trxEmployee.createdAt})`,
            count: count(),
          })
          .from(trxEmployee)
          .where(sql`${trxEmployee.createdAt} >= ${thirtyDaysAgo}`)
          .groupBy(sql`DATE(${trxEmployee.createdAt})`)
          .orderBy(sql`DATE(${trxEmployee.createdAt})`);
        
        return c.json(ApiResponse.success('Timeline chart data retrieved successfully', {
          type: 'line',
          data: timelineData.map(item => ({
            label: item.date,
            value: item.count,
          })),
        }));

      default:
        return c.json(ApiResponse.error('Invalid chart type', 'Chart type must be one of: gender, country, age, timeline'), 400);
    }

  } catch (error) {
    console.error('Chart data error:', error);
    return c.json(ApiResponse.error('Failed to fetch chart data', error instanceof Error ? error.message : 'Unknown error'), 500);
  }
});

/**
 * Get unique countries list
 */
dashboardController.get('/countries', async (c) => {
  try {
    // Try to get from cache first
    const cachedCountries = await redis.get(CACHE_KEYS.COUNTRY_LIST);
    if (cachedCountries) {
      const countries = JSON.parse(cachedCountries);
      return c.json(ApiResponse.success('Countries retrieved from cache', countries));
    }

    const countries = await db
      .selectDistinct({ country: trxEmployee.country })
      .from(trxEmployee)
      .orderBy(trxEmployee.country);

    const countryList = countries.map(item => item.country);

    // Cache the results
    await redis.setex(CACHE_KEYS.COUNTRY_LIST, CACHE_TTL.COUNTRY_LIST, JSON.stringify(countryList));

    return c.json(ApiResponse.success('Countries retrieved successfully', countryList));

  } catch (error) {
    console.error('Countries list error:', error);
    return c.json(ApiResponse.error('Failed to fetch countries list', error instanceof Error ? error.message : 'Unknown error'), 500);
  }
});

export default dashboardController;
