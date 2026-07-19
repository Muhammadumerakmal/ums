/**
 * Application error taxonomy. Every thrown AppError maps to exactly one HTTP status.
 * See specs/001-core-ums/contracts/rest-api.md § Error Taxonomy.
 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE_RULE"
  | "INTERNAL_ERROR";

const STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_RULE: 422,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS[code];
  }
}

export const httpStatusForCode = (code: ErrorCode): number => STATUS[code];

// Convenience constructors
export const Unauthenticated = (m = "Authentication required.") => new AppError("UNAUTHENTICATED", m);
export const Forbidden = (m = "You do not have permission to perform this action.") => new AppError("FORBIDDEN", m);
export const NotFound = (m = "Resource not found.") => new AppError("NOT_FOUND", m);
export const Conflict = (m: string) => new AppError("CONFLICT", m);
export const UnprocessableRule = (m: string) => new AppError("UNPROCESSABLE_RULE", m);
export const ValidationError = (m: string) => new AppError("VALIDATION_ERROR", m);
