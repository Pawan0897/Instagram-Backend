const mongoose = require("mongoose");
const { logger } = require("../Midleware/logger");

const db_connection = async () => {
  const connectionUrl = process.env.db_url;

  const mongoConfig = {
    autoIndex: true, // needed for the TTL indexes of otp and sessions
    minPoolSize: 5, // Minimum number of connections in the pool
    maxPoolSize: 50, // Maximum number of connections in the pool
    serverSelectionTimeoutMS: 5000, // Fail fast if DB is unreachable
    socketTimeoutMS: 45000, // Avoid connection drops
    connectTimeoutMS: 10000, // Quick failures
    heartbeatFrequencyMS: 10000, // Monitoring and recovery
    waitQueueTimeoutMS: 5000, // Prevent long waits for connections in the pool
  };

  try {
    await mongoose.connect(connectionUrl, mongoConfig);
    logger.info(`✅ MongoDB Connected Successfully on URL: ${connectionUrl}`);
  } catch (error) {
    logger.error("❌ MongoDB Connection Failed", { error: error.message });
    process.exit(1); // Exit the process if DB connection fails
  }

  // MongoDB connection events
  mongoose.connection.on("disconnected", () => {
    logger.warn("⚠️ MongoDB disconnected. Retrying connection...");
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("✅ MongoDB reconnected successfully");
  });

  mongoose.connection.on("error", (error) => {
    logger.error("⚠️ MongoDB error:", error);
  });

  // Gracefully handle process termination (Docker, PM2, Kubernetes)
  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    console.log("🛑 MongoDB connection closed due to app termination");
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await mongoose.connection.close();
    console.log("🛑 MongoDB connection closed due to SIGTERM");
    process.exit(0);
  });
};

module.exports = { db_connection };
