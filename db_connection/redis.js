const { createClient } = require("redis");

let redisClient;

/**************** Redis connection (not started by app.js, same as the original project) */
const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.redis_url || "redis://localhost:6379/1",
      socket: {
        connectTimeout: 10000, // Timeout for initial connection (10 seconds)
        keepAlive: 30000, // Keep connection alive (30 seconds)
        reconnectStrategy: (retries) => {
          const delay = Math.min(retries * 100, 3000);
          console.log(`Retrying Redis connection in ${delay} ms`);
          return delay; // backoff with max delay of 3 seconds
        },
      },
    });

    redisClient.on("connect", () => console.log("Connected to Redis successfully."));
    redisClient.on("ready", () => console.log("Redis is ready to use."));
    redisClient.on("error", (error) => console.error("Redis connection error:", error));
    redisClient.on("reconnecting", () => console.warn("Reconnecting to Redis..."));
    redisClient.on("end", () => console.warn("Redis connection closed."));

    await redisClient.connect();
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    process.exit(1);
  }
};

module.exports = { connectRedis, getRedisClient: () => redisClient };
