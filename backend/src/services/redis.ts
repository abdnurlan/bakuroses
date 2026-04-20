import IORedis from 'ioredis';

export const redis = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 500, 2000);
  },
});

redis.on('error', (err) => {
  console.warn('⚠️  Redis connection error (email queue disabled):', err.message);
});
