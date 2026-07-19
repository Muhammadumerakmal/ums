import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../../src/lib/password";
import { signToken, verifyToken } from "../../src/lib/jwt";
import { AppError, httpStatusForCode, Conflict, Forbidden } from "../../src/lib/errors";

describe("password hashing", () => {
  it("hashes and verifies a correct password", async () => {
    const hash = await hashPassword("s3cret!");
    expect(hash).not.toBe("s3cret!"); // never plaintext
    expect(await verifyPassword("s3cret!", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("s3cret!");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("jwt", () => {
  it("round-trips a payload", () => {
    const token = signToken({ sub: "user-1", role: "teacher" });
    const decoded = verifyToken(token);
    expect(decoded.sub).toBe("user-1");
    expect(decoded.role).toBe("teacher");
  });

  it("rejects a tampered token", () => {
    const token = signToken({ sub: "user-1", role: "admin" });
    expect(() => verifyToken(token + "x")).toThrow();
  });
});

describe("error taxonomy", () => {
  it("maps codes to HTTP statuses", () => {
    expect(httpStatusForCode("CONFLICT")).toBe(409);
    expect(httpStatusForCode("FORBIDDEN")).toBe(403);
    expect(httpStatusForCode("UNAUTHENTICATED")).toBe(401);
    expect(httpStatusForCode("NOT_FOUND")).toBe(404);
    expect(httpStatusForCode("VALIDATION_ERROR")).toBe(422);
  });

  it("constructors carry code + status", () => {
    const c = Conflict("dup");
    expect(c).toBeInstanceOf(AppError);
    expect(c.code).toBe("CONFLICT");
    expect(c.status).toBe(409);
    expect(Forbidden().status).toBe(403);
  });
});

describe("grade letter validation (Zod)", () => {
  it("accepts A–F and rejects others", async () => {
    const { gradeSchema } = await import("../../src/validation/grade.schema");
    expect(gradeSchema.safeParse({ enrollmentId: crypto.randomUUID(), letter: "B" }).success).toBe(true);
    expect(gradeSchema.safeParse({ enrollmentId: crypto.randomUUID(), letter: "E" }).success).toBe(false);
  });
});
