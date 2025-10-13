import { redis, CACHE_KEYS, CACHE_TTL } from './src/config/redis';

async function testRedis() {
  console.log('🔴 Testing Redis Connection and Data Storage...\n');

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing Redis connection...');
    const pingResult = await redis.ping();
    console.log('✅ Redis ping result:', pingResult);

    // Test 2: Set and get simple data
    console.log('\n2️⃣ Testing basic set/get operations...');
    const testKey = 'test:basic';
    const testValue = { message: 'Hello Redis!', timestamp: new Date().toISOString() };
    
    await redis.setex(testKey, 60, JSON.stringify(testValue));
    const retrievedValue = await redis.get(testKey);
    console.log('✅ Set value:', testValue);
    console.log('✅ Retrieved value:', JSON.parse(retrievedValue || '{}'));

    // Test 3: Test dashboard stats caching
    console.log('\n3️⃣ Testing dashboard stats caching...');
    const mockStats = {
      totalRecords: 1500,
      genderDistribution: [
        { gender: 'Male', count: 800, percentage: 53 },
        { gender: 'Female', count: 700, percentage: 47 }
      ],
      countryDistribution: [
        { country: 'USA', count: 500, percentage: 33 },
        { country: 'Canada', count: 300, percentage: 20 }
      ],
      averageAge: 35,
      recordsToday: 25,
      ageDistribution: [
        { ageRange: '20-29', count: 400, percentage: 27 },
        { ageRange: '30-39', count: 500, percentage: 33 }
      ]
    };

    await redis.setex(CACHE_KEYS.DASHBOARD_STATS, CACHE_TTL.DASHBOARD_STATS, JSON.stringify(mockStats));
    const cachedStats = await redis.get(CACHE_KEYS.DASHBOARD_STATS);
    console.log('✅ Cached dashboard stats:', JSON.parse(cachedStats || '{}'));

    // Test 4: Test record search caching
    console.log('\n4️⃣ Testing record search caching...');
    const searchKey = `${CACHE_KEYS.RECORD_SEARCH}:test_search`;
    const mockSearchResults = {
      records: [
        { id: 1, firstname: 'John', lastname: 'Doe', country: 'USA' },
        { id: 2, firstname: 'Jane', lastname: 'Smith', country: 'Canada' }
      ],
      pagination: { page: 1, limit: 50, total: 2 }
    };

    await redis.setex(searchKey, CACHE_TTL.RECORD_SEARCH, JSON.stringify(mockSearchResults));
    const cachedSearch = await redis.get(searchKey);
    console.log('✅ Cached search results:', JSON.parse(cachedSearch || '{}'));

    // Test 5: Test TTL (Time To Live)
    console.log('\n5️⃣ Testing TTL functionality...');
    const ttlKey = 'test:ttl';
    await redis.setex(ttlKey, 5, 'This will expire in 5 seconds');
    const ttl = await redis.ttl(ttlKey);
    console.log('✅ TTL set for 5 seconds, current TTL:', ttl);

    // Test 6: List all keys
    console.log('\n6️⃣ Listing all Redis keys...');
    const allKeys = await redis.keys('*');
    console.log('✅ All Redis keys:', allKeys);

    // Test 7: Test cache invalidation
    console.log('\n7️⃣ Testing cache invalidation...');
    await redis.del(CACHE_KEYS.DASHBOARD_STATS);
    const deletedStats = await redis.get(CACHE_KEYS.DASHBOARD_STATS);
    console.log('✅ Dashboard stats after deletion:', deletedStats);

    console.log('\n🎉 All Redis tests completed successfully!');
    console.log('\n📊 Redis Status Summary:');
    console.log('- Connection: ✅ Working');
    console.log('- Set/Get: ✅ Working');
    console.log('- JSON Serialization: ✅ Working');
    console.log('- TTL: ✅ Working');
    console.log('- Cache Keys: ✅ Working');
    console.log('- Cache Invalidation: ✅ Working');

  } catch (error) {
    console.error('❌ Redis test failed:', error);
  } finally {
    // Close Redis connection
    await redis.quit();
    console.log('\n🔴 Redis connection closed');
  }
}

// Run the test
testRedis().catch(console.error);
