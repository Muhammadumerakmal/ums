import type { Request, Response, NextFunction } from "express";
import { verifyToken, COOKIE_NAME } from "../lib/jwt";
import { Unauthenticated } from "../lib/errors";
import type { Role } from "../models/schema";

export interface CurrentUser {
  userId: string;
  role: Role;
}

/**
 * Express middleware: reads the session JWT from the HttpOnly cookie (or a
 * `Authorization: Bearer <token>` header) and attaches `req.user`.
 * Forwards UNAUTHENTICATED to the error handler when missing/invalid/expired.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = req.cookies?.[COOKIE_NAME] ?? bearer;

  if (!token) return next(Unauthenticated());
  try {
    const { sub, role } = verifyToken(token);
    req.user = { userId: sub, role };
    next();
  } catch {
    next(Unauthenticated("Invalid or expired session."));
  }
}
