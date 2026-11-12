import { createClient } from "redis";
import { logger } from "./logger";

type RedisClient = ReturnType<typeof createClient>;

const globalForRedis = globalThis as typeof globalThis & {
  _redisClient?: RedisClient;
  _redisConnection?: Promise<RedisClient>;
};

const redisClient =
  globalForRedis._redisClient ??
  (globalForRedis._redisClient = createClient({
    url: process.env.REDIS_URI || "redis://localhost:6379",
  }));

redisClient.on("error", (err) => logger.error({ err }, "Redis client error"));

export async function getRedisClient() {
  if (redisClient.isOpen) {
    return redisClient;
  }

  const connection =
    globalForRedis._redisConnection ??
    (globalForRedis._redisConnection = redisClient.connect().then(() => redisClient));

  try {
    return await connection;
  } finally {
    if (globalForRedis._redisConnection === connection) {
      globalForRedis._redisConnection = undefined;
    }
  }
}
