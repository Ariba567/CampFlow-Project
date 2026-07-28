/**
 * Centralised environment configuration.
 * Validated at startup – the server will refuse to boot if required vars are missing.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  NODE_ENV: optionalEnv("NODE_ENV", "development"),
  PORT: optionalEnv("PORT", "5000"),

  // MongoDB
  MONGODB_URI: requireEnv("MONGODB_URI"),

  // JWT
  JWT_SECRET: requireEnv("JWT_SECRET"),
  JWT_EXPIRE: optionalEnv("JWT_EXPIRE", "7d"),
  JWT_REFRESH_SECRET: requireEnv("JWT_REFRESH_SECRET"),
  JWT_REFRESH_EXPIRE: optionalEnv("JWT_REFRESH_EXPIRE", "30d"),

  // CORS
  CLIENT_URL: optionalEnv("CLIENT_URL", "http://localhost:3000"),
} as const;
