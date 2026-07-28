import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Sign a short-lived access token.
 */
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE as jwt.SignOptions["expiresIn"],
  });
}

/**
 * Sign a long-lived refresh token.
 */
export function signRefreshToken(payload: Pick<JwtPayload, "id">): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRE as jwt.SignOptions["expiresIn"],
  });
}

/**
 * Verify and decode an access token.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

/**
 * Verify and decode a refresh token.
 */
export function verifyRefreshToken(token: string): Pick<JwtPayload, "id"> {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as Pick<JwtPayload, "id">;
}
