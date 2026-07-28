import app from "./app";
import { logger } from "./lib/logger";
import { connectDB } from "./config/db";
import { env } from "./config/env";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Bind the port immediately so the workflow health-check passes,
// then connect to MongoDB in the background with retries.
app.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port, env: env.NODE_ENV }, "CampFlow API server listening");

  // Non-blocking — the server is already accepting requests.
  // Requests that require DB will fail gracefully until connected.
  connectDB().catch((err) => {
    logger.error({ err }, "Fatal: could not establish MongoDB connection");
    process.exit(1);
  });
});
