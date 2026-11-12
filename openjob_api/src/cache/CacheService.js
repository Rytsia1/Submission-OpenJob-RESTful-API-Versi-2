// [Dikerjakan oleh: Distania_9]

const { createClient } = require('redis');

const DEFAULT_EXPIRATION = 3600; // 1 jam

class CacheService {
  constructor() {
    this._client = createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT || 6379,
      },
      // Gagal cepat saat Redis mati, supaya request tetap dilayani dari database
      disableOfflineQueue: true,
    });

    this._client.on('error', (error) => console.error('Redis error:', error.message));
    this._client.connect().catch(() => {});
  }

  async get(key) {
    if (!this._client.isReady) return null;
    try {
      const value = await this._client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error.message);
      return null;
    }
  }

  async set(key, value, expirationInSeconds = DEFAULT_EXPIRATION) {
    if (!this._client.isReady) return;
    try {
      await this._client.set(key, JSON.stringify(value), { EX: expirationInSeconds });
    } catch (error) {
      console.error('Redis set error:', error.message);
    }
  }

  async delete(...keys) {
    if (!this._client.isReady) return;
    try {
      await this._client.del(keys);
    } catch (error) {
      console.error('Redis delete error:', error.message);
    }
  }
}

module.exports = CacheService;
