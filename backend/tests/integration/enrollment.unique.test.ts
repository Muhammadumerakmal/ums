/**
 * Business-rule integration test — FR-012: at most one ACTIVE enrollment per
 * (student, course); re-enrolling after a drop is allowed.
 *
 * Requires a real test database. Set DATABASE_URL_TEST (a Neon branch or local
 * Postgres) and run migrations against it, then `npm test`. Without it, this
 * suite is skipped so the unit suite still runs green.
 */
import { describe, it, expect, beforeAll } from "vitest";

const hasTestDb = !!process.env.DATABASE_URL_TEST;

describe.skipIf(!hasTestDb)("enrollment uniqueness (FR-012)", () => {
  let enrollmentService: typeof import("../../src/services/enrollment.service")["enrollmentService"];
  let userModel: typeof import("../../src/models/user.model")["userModel"];
  let studentModel: typeof import("../../src/models/student.model")["studentModel"];
  let teacherModel: typeof import("../../src/models/teacher.model")["teacherModel"];
  let courseModel: typeof import("../../src/models/course.model")["courseModel"];
  let enrollmentModel: typeof import("../../src/models/enrollment.model")["enrollmentModel"];

  let studentId: string;
  let courseId: string;

  beforeAll(async () => {
    ({ enrollmentService } = await import("../../src/services/enrollment.service"));
    ({ userModel } = await import("../../src/models/user.model"));
    ({ studentModel } = await import("../../src/models/student.model"));
    ({ teacherModel } = await import("../../src/models/teacher.model"));
    ({ courseModel } = await import("../../src/models/course.model"));
    ({ enrollmentModel } = await import("../../src/models/enrollment.model"));

    const suffix = Date.now();
    const tUser = await userModel.create({ email: `t${suffix}@x.io`, passwordHash: "x", fullName: "T", role: "teacher" });
    const teacher = await teacherModel.create(tUser.id);
    const sUser = await userModel.create({ email: `s${suffix}@x.io`, passwordHash: "x", fullName: "S", role: "student" });
    const student = await studentModel.create(sUser.id, `S-${suffix}`);
    const course = await courseModel.create({ code: `C${suffix}`, title: "Test", teacherId: teacher.id });
    studentId = student.id;
    courseId = course.id;
  });

  it("allows a first enrollment, rejects a duplicate, then allows re-enrol after drop", async () => {
    const first = await enrollmentService.enroll(studentId, courseId);
    expect(first.id).toBeTruthy();

    await expect(enrollmentService.enroll(studentId, courseId)).rejects.toMatchObject({ code: "CONFLICT" });

    await enrollmentModel.drop(first.id);

    const second = await enrollmentService.enroll(studentId, courseId);
    expect(second.id).toBeTruthy();
    expect(second.id).not.toBe(first.id);
  });
});
