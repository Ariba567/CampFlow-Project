import mongoose from "mongoose";
import { logger } from "../lib/logger";
import { env } from "./env";

const RETRY_INTERVAL_MS = 5_000;
const MAX_RETRIES = 12; // ~1 minute of attempts before giving up

export async function connectDB(attempt = 1): Promise<void> {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8_000,
      tls: true,
    });
    logger.info({ host: conn.connection.host }, "MongoDB connected");
  } catch (err) {
    logger.error({ err, attempt }, "MongoDB connection failed");

    if (attempt >= MAX_RETRIES) {
      logger.error("Max MongoDB connection retries reached — exiting.");
      process.exit(1);
    }

    logger.warn(
      { nextAttemptIn: `${RETRY_INTERVAL_MS / 1000}s`, attempt },
      "Retrying MongoDB connection…",
    );
    await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
    return connectDB(attempt + 1);
  }
}

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  logger.error({ err }, "MongoDB error");
});
