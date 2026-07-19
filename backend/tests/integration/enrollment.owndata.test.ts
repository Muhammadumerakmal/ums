/**
 * Enrollment own-data rules (FR-014) — T043.
 * Requires DATABASE_URL_TEST; otherwise skipped.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { resetDb, createFixtures, type Fixtures } from "../setup/fixtures";
import { enrollmentService } from "../../src/services/enrollment.service";

const hasDb = !!process.env.DATABASE_URL_TEST;

describe.skipIf(!hasDb)("enrollment own-data (FR-014)", () => {
  let fx: Fixtures;

  beforeAll(async () => {
    await resetDb();
    fx = await createFixtures();
  });

  it("lists only the requesting student's own active enrollments", async () => {
    await enrollmentService.enroll(fx.student1.id, fx.course.id);
    const mine = await enrollmentService.listForStudent(fx.student1.id);
    expect(mine).toHaveLength(1);
    const other = await enrollmentService.listForStudent(fx.student2.id);
    expect(other).toHaveLength(0);
  });

  it("prevents a student from dropping another student's enrollment", async () => {
    const e = await enrollmentService.enroll(fx.student2.id, fx.course.id);
    await expect(
      enrollmentService.drop(e.id, { role: "student", studentId: fx.student1.id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
