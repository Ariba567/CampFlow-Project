import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JwtPayload } from "../utils/jwt";

// Extend Express Request with the authenticated user payload
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * authenticate
 * Verifies the Bearer token in the Authorization header.
 * Attaches the decoded payload to req.user on success.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required. No token provided." });
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err: unknown) {
    const isExpired =
      err instanceof Error && err.name === "TokenExpiredError";
    res.status(401).json({
      error: isExpired
        ? "Token expired. Please log in again."
        : "Invalid token. Please log in again.",
    });
  }
}

/**
 * optionalAuthenticate
 * Like authenticate but does not reject unauthenticated requests.
 * Useful for public routes that return richer data for logged-in users.
 */
export function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      req.user = verifyAccessToken(token);
    } catch {
      // Ignore invalid tokens on optional routes
    }
  }
  next();
}
