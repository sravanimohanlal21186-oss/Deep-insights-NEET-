const redis = require('redis');
const logger = require('../utils/logger');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  enableOfflineQueue: false,
  retryStrategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('End of retry.');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  },
});

client.on('error', (err) => {
  logger.error('Redis client error:', err);
});

client.on('connect', () => {
  logger.info('Redis client connected');
});

client.on('ready', () => {
  logger.info('Redis client ready');
});

// Promisified wrapper for async/await
const redisAsync = {
  get: (key) => new Promise((resolve, reject) => {
    client.get(key, (err, data) => err ? reject(err) : resolve(data));
  }),
  set: (key, value, ttl) => new Promise((resolve, reject) => {
    if (ttl) {
      client.setex(key, ttl, value, (err) => err ? reject(err) : resolve('OK'));
    } else {
      client.set(key, value, (err) => err ? reject(err) : resolve('OK'));
    }
  }),
  del: (key) => new Promise((resolve, reject) => {
    client.del(key, (err) => err ? reject(err) : resolve('OK'));
  }),
  ping: () => new Promise((resolve, reject) => {
    client.ping((err, reply) => err ? reject(err) : resolve(reply));
  }),
  quit: () => new Promise((resolve) => {
    client.quit(() => resolve());
  }),
};

module.exports = redisAsync;
