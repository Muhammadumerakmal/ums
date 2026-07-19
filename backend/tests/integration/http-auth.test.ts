/**
 * HTTP-level auth + RBAC (FR-001/003/004) — T026, T027.
 * Requires DATABASE_URL_TEST; otherwise the suite is skipped.
 */
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";
import { resetDb, createFixtures, TEST_PASSWORD, type Fixtures } from "../setup/fixtures";

const hasDb = !!process.env.DATABASE_URL_TEST;
const app = createApp();

describe.skipIf(!hasDb)("auth + RBAC over HTTP", () => {
  let fx: Fixtures;

  beforeAll(async () => {
    await resetDb();
    fx = await createFixtures();
  });

  it("logs in a valid user and returns their role + sets a cookie (FR-001)", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: fx.adminEmail, password: TEST_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("admin");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects invalid credentials with 401 UNAUTHENTICATED", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: fx.adminEmail, password: "wrong" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("rejects unauthenticated access to a protected route (FR-004)", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("denies a student access to an admin-only route (FR-003, deny-by-default)", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({ email: fx.student1Email, password: TEST_PASSWORD });
    const res = await agent.get("/api/students");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});
