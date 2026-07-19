/**
 * Admin CRUD + integrity rules (FR-008/009/022) — T035, T036.
 * Requires DATABASE_URL_TEST; otherwise skipped.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { resetDb, createFixtures, type Fixtures } from "../setup/fixtures";
import { studentService } from "../../src/services/student.service";
import { courseService } from "../../src/services/course.service";
import { courseModel } from "../../src/models/course.model";

const hasDb = !!process.env.DATABASE_URL_TEST;

describe.skipIf(!hasDb)("admin CRUD + integrity", () => {
  let fx: Fixtures;

  beforeAll(async () => {
    await resetDb();
    fx = await createFixtures();
  });

  it("rejects a duplicate student email with CONFLICT (FR-009)", async () => {
    await studentService.create({ fullName: "Dup A", email: "dup@test.io", password: "pw123456", studentNumber: "S-100" });
    await expect(
      studentService.create({ fullName: "Dup B", email: "dup@test.io", password: "pw123456", studentNumber: "S-101" })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("rejects assigning a non-existent teacher to a course (FR-008)", async () => {
    await expect(
      courseService.create({ code: "X1", title: "Bad", teacherId: crypto.randomUUID() })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("soft-deletes a course so it leaves active listings (FR-022)", async () => {
    const c = await courseService.create({ code: "SD1", title: "To Delete", teacherId: fx.teacher.id });
    await courseService.softDelete(c.id);
    const active = await courseModel.listActive();
    expect(active.find((x) => x.id === c.id)).toBeUndefined();
  });
});
