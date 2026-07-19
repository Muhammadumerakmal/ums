import jwt from "jsonwebtoken";
import type { Role } from "../models/schema";

const secret = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRES_IN ?? "1h";

/** Name of the HttpOnly cookie carrying the session JWT. */
export const COOKIE_NAME = "token";

if (!secret && process.env.NODE_ENV !== "test") {
  // Fail loudly outside tests; tests set a fixed secret in the global setup.
  // (Do not throw at import time in test env to keep unit tests hermetic.)
}

export interface TokenPayload {
  sub: string; // user id
  role: Role;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, secret ?? "test-secret", {
    algorithm: "HS256",
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, secret ?? "test-secret", { algorithms: ["HS256"] });
  const { sub, role } = decoded as jwt.JwtPayload & { role: Role };
  if (typeof sub !== "string" || !role) {
    throw new Error("Malformed token payload");
  }
  return { sub, role };
}
