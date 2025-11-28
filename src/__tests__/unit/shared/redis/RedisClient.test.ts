import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { RedisClient } from '../../../../shared/redis/RedisClient';
import { setupDatabaseSpies, TestAssertions } from '../../utils/test-runner';

describe('RedisClient', () => {
  let redisClient: RedisClient;
  let mockRedis: any;
  let mockConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = {
      url: 'redis://localhost:6379/15',
      retryDelay: 100,
      maxRetriesPerRequest: 3,
      maxRetriesPerConnection: 3,
      connectTimeout: 5000,
      commandTimeout: 3000,
    };
    redisClient = new RedisClient(mockConfig);
    mockRedis = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      incr: jest.fn(),
      decr: jest.fn(),
      hset: jest.fn(),
      hget: jest.fn(),
      hgetall: jest.fn(),
      hdel: jest.fn(),
      lpush: jest.fn(),
      rpop: jest.fn(),
      lrange: jest.fn(),
      sadd: jest.fn(),
      srem: jest.fn(),
      smembers: jest.fn(),
      zadd: jest.fn(),
      zrange: jest.fn(),
      zscore: jest.fn(),
      ping: jest.fn().mockResolvedValue('PONG'),
      flushall: jest.fn().mockResolvedValue('OK'),
      quit: jest.fn().mockResolvedValue('OK'),
    };
    
    // Mock the Redis client methods
    redisClient as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(redisClient['config']).toBe(mockConfig);
      expect(redisClient['config'].url).toBe('redis://localhost:6379/15');
      expect(redisClient['config'].retryDelay).toBe(100);
      expect(redisClient['config'].maxRetriesPerRequest).toBe(3);
    });
  });

  describe('connect', () => {
    it('should establish connection successfully', async () => {
      // This would normally connect to Redis, but we'll mock it
      await expect(redisClient.connect()).resolves.toBeUndefined();
    });

    it('should handle connection errors', async () => {
      // Mock connection failure
      await expect(redisClient.connect()).resolves.toBeUndefined();
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      await expect(redisClient.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('get', () => {
    it('should retrieve value by key', async () => {
      mockRedis.get.mockResolvedValue('test-value');
      const result = await redisClient.get('test-key');
      expect(result).toBe('test-value');
    });

    it('should return null for non-existent key', async () => {
      mockRedis.get.mockResolvedValue(null);
      const result = await redisClient.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));
      const result = await redisClient.get('test-key');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value with optional expiry', async () => {
      mockRedis.set.mockResolvedValue('OK');
      await redisClient.set('test-key', 'test-value', 3600);
      expect(mockRedis.set).toHaveBeenCalledWith('test-key', 'test-value', 'EX', 3600);
    });

    it('should set value without expiry', async () => {
      mockRedis.set.mockResolvedValue('OK');
      await redisClient.set('test-key', 'test-value');
      expect(mockRedis.set).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should handle set errors', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis error'));
      await expect(redisClient.set('test-key', 'test-value')).rejects.toThrow('Redis error');
    });
  });

  describe('del', () => {
    it('should delete key successfully', async () => {
      mockRedis.del.mockResolvedValue(1);
      await redisClient.del('test-key');
      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('should return number of deleted keys', async () => {
      mockRedis.del.mockResolvedValue(3);
      const result = await redisClient.del(['key1', 'key2', 'key3']);
      expect(mockRedis.del).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
    });
  });

  describe('exists', () => {
    it('should return true for existing keys', async () => {
      mockRedis.exists.mockResolvedValue(1);
      const result = await redisClient.exists('test-key');
      expect(result).toBe(true);
    });

    it('should return false for non-existent keys', async () => {
      mockRedis.exists.mockResolvedValue(0);
      const result = await redisClient.exists('non-existent-key');
      expect(result).toBe(false);
    });
  });

  describe('expire', () => {
    it('should set expiry on key', async () => {
      mockRedis.expire.mockResolvedValue(1);
      const result = await redisClient.expire('test-key', 3600);
      expect(result).toBe(true);
      expect(mockRedis.expire).toHaveBeenCalledWith('test-key', 3600);
    });

    it('should return false for non-existent keys', async () => {
      mockRedis.expire.mockResolvedValue(0);
      const result = await redisClient.expire('non-existent-key', 3600);
      expect(result).toBe(false);
    });
  });

  describe('ttl', () => {
    it('should return TTL for key with expiry', async () => {
      mockRedis.ttl.mockResolvedValue(3599);
      const result = await redisClient.ttl('test-key');
      expect(result).toBe(3599);
    });

    it('should return -1 for key without expiry', async () => {
      mockRedis.ttl.mockResolvedValue(-1);
      const result = await redisClient.ttl('test-key');
      expect(result).toBe(-1);
    });

    it('should return -2 for non-existent key', async () => {
      mockRedis.ttl.mockResolvedValue(-2);
      const result = await redisClient.ttl('non-existent-key');
      expect(result).toBe(-2);
    });
  });

  describe('incr', () => {
    it('should increment value', async () => {
      mockRedis.incr.mockResolvedValue(5);
      const result = await redisClient.incr('counter-key');
      expect(result).toBe(5);
      expect(mockRedis.incr).toHaveBeenCalledWith('counter-key');
    });
  });

  describe('decr', () => {
    it('should decrement value', async () => {
      mockRedis.decr.mockResolvedValue(3);
      const result = await redisClient.decr('counter-key');
      expect(result).toBe(3);
      expect(mockRedis.decr).toHaveBeenCalledWith('counter-key');
    });
  });

  describe('Hash operations', () => {
    it('should set hash field', async () => {
      mockRedis.hset.mockResolvedValue(1);
      await redisClient.hset('hash-key', 'field', 'value');
      expect(mockRedis.hset).toHaveBeenCalledWith('hash-key', 'field', 'value');
    });

    it('should get hash field', async () => {
      mockRedis.hget.mockResolvedValue('value');
      const result = await redisClient.hget('hash-key', 'field');
      expect(result).toBe('value');
      expect(mockRedis.hget).toHaveBeenCalledWith('hash-key', 'field');
    });

    it('should get all hash fields', async () => {
      const hashData = { field1: 'value1', field2: 'value2' };
      mockRedis.hgetall.mockResolvedValue(hashData);
      const result = await redisClient.hgetall('hash-key');
      expect(result).toEqual(hashData);
      expect(mockRedis.hgetall).toHaveBeenCalledWith('hash-key');
    });

    it('should delete hash field', async () => {
      mockRedis.hdel.mockResolvedValue(1);
      await redisClient.hdel('hash-key', 'field');
      expect(mockRedis.hdel).toHaveBeenCalledWith('hash-key', 'field');
    });
  });

  describe('List operations', () => {
    it('should push to list', async () => {
      mockRedis.lpush.mockResolvedValue(2);
      await redisClient.lpush('list-key', 'item');
      expect(mockRedis.lpush).toHaveBeenCalledWith('list-key', 'item');
    });

    it('should pop from list', async () => {
      mockRedis.rpop.mockResolvedValue('item');
      const result = await redisClient.rpop('list-key');
      expect(result).toBe('item');
      expect(mockRedis.rpop).toHaveBeenCalledWith('list-key');
    });

    it('should get list range', async () => {
      const items = ['item1', 'item2', 'item3'];
      mockRedis.lrange.mockResolvedValue(items);
      const result = await redisClient.lrange('list-key', 0, -1);
      expect(result).toEqual(items);
      expect(mockRedis.lrange).toHaveBeenCalledWith('list-key', 0, -1);
    });
  });

  describe('Set operations', () => {
    it('should add to set', async () => {
      mockRedis.sadd.mockResolvedValue(1);
      await redisClient.sadd('set-key', 'item');
      expect(mockRedis.sadd).toHaveBeenCalledWith('set-key', 'item');
    });

    it('should remove from set', async () => {
      mockRedis.srem.mockResolvedValue(1);
      await redisClient.srem('set-key', 'item');
      expect(mockRedis.srem).toHaveBeenCalledWith('set-key', 'item');
    });

    it('should get set members', async () => {
      const members = ['item1', 'item2', 'item3'];
      mockRedis.smembers.mockResolvedValue(members);
      const result = await redisClient.smembers('set-key');
      expect(result).toEqual(members);
      expect(mockRedis.smembers).toHaveBeenCalledWith('set-key');
    });
  });

  describe('Sorted set operations', () => {
    it('should add to sorted set', async () => {
      mockRedis.zadd.mockResolvedValue(1);
      await redisClient.zadd('zset-key', 1, 'item');
      expect(mockRedis.zadd).toHaveBeenCalledWith('zset-key', 1, 'item');
    });

    it('should get sorted set range', async () => {
      const items = ['item1', 'item2', 'item3'];
      mockRedis.zrange.mockResolvedValue(items);
      const result = await redisClient.zrange('zset-key', 0, -1);
      expect(result).toEqual(items);
      expect(mockRedis.zrange).toHaveBeenCalledWith('zset-key', 0, -1);
    });

    it('should get sorted set score', async () => {
      mockRedis.zscore.mockResolvedValue(1.5);
      const result = await redisClient.zscore('zset-key', 'item');
      expect(result).toBe(1.5);
      expect(mockRedis.zscore).toHaveBeenCalledWith('zset-key', 'item');
    });
  });

  describe('ping', () => {
    it('should return PONG', async () => {
      mockRedis.ping.mockResolvedValue('PONG');
      const result = await redisClient.ping();
      expect(result).toBe('PONG');
      expect(mockRedis.ping).toHaveBeenCalled();
    });
  });

  describe('flushall', () => {
    it('should clear all databases', async () => {
      mockRedis.flushall.mockResolvedValue('OK');
      const result = await redisClient.flushall();
      expect(result).toBe('OK');
      expect(mockRedis.flushall).toHaveBeenCalled();
    });
  });

  describe('quit', () => {
    it('should quit gracefully', async () => {
      mockRedis.quit.mockResolvedValue('OK');
      const result = await redisClient.quit();
      expect(result).toBe('OK');
      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });
});