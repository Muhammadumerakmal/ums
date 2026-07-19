import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async Express handler so thrown errors (AppError, ZodError, …) are
 * forwarded to the centralized error middleware instead of crashing the process.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
