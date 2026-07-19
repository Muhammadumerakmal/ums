import type { CurrentUser } from "../middleware/authenticate";

// Augment Express's Request with the authenticated user set by `authenticate`.
declare global {
  namespace Express {
    interface Request {
      user?: CurrentUser;
    }
  }
}

export {};
