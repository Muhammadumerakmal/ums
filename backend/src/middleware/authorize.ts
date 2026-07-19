import type { Request, Response, NextFunction } from "express";
import { Forbidden, Unauthenticated } from "../lib/errors";
import type { Role } from "../models/schema";

/**
 * Deny-by-default role gate (Express middleware factory). A route MUST list the
 * roles it permits; any other role is rejected with FORBIDDEN. Fine-grained
 * ownership/own-data checks live in the service layer.
 *
 * Usage: `router.post("/", authenticate, authorize("admin"), handler)`
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(Unauthenticated());
    if (!allowedRoles.includes(req.user.role)) return next(Forbidden());
    next();
  };
}
