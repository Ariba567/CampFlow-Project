import { Request, Response, NextFunction } from "express";
import { UserRole } from "../models/User";

/**
 * authorize(...roles)
 * Role-based access control middleware.
 * Must be used AFTER the `authenticate` middleware.
 *
 * Usage:
 *   router.delete("/users/:id", authenticate, authorize("admin"), deleteUser);
 *   router.patch("/sites/:id", authenticate, authorize("manager", "admin"), updateSite);
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    const userRole = req.user.role as UserRole;

    if (!roles.includes(userRole)) {
      res.status(403).json({
        error: `Access denied. Required role(s): ${roles.join(", ")}. Your role: ${userRole}.`,
      });
      return;
    }

    next();
  };
}

/**
 * authorizeOwnerOrRoles
 * Passes if the authenticated user is the resource owner OR has one of the given roles.
 *
 * Usage:
 *   router.delete("/reservations/:id", authenticate,
 *     authorizeOwnerOrRoles(getOwnerId, "admin", "manager"), handler);
 *
 * @param getOwnerId  Function that extracts the owner ID from the request.
 * @param roles       Admin/manager roles that can bypass ownership check.
 */
export function authorizeOwnerOrRoles(
  getOwnerId: (req: Request) => string | undefined,
  ...roles: UserRole[]
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    const userRole = req.user.role as UserRole;

    // Privileged roles bypass ownership check
    if (roles.includes(userRole)) {
      next();
      return;
    }

    // Otherwise must be the owner
    const ownerId = getOwnerId(req);
    if (ownerId && ownerId === req.user.id) {
      next();
      return;
    }

    res.status(403).json({ error: "Access denied. You do not own this resource." });
  };
}
