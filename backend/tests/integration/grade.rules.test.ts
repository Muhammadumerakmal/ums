/**
 * Grading business rules (FR-016/017/018/019) — T050, T051, T055.
 * Requires DATABASE_URL_TEST; otherwise skipped.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { resetDb, createFixtures, type Fixtures } from "../setup/fixtures";
import { enrollmentService } from "../../src/services/enrollment.service";
import { enrollmentModel } from "../../src/models/enrollment.model";
import { gradeService } from "../../src/services/grade.service";

const hasDb = !!process.env.DATABASE_URL_TEST;

describe.skipIf(!hasDb)("grading rules", () => {
  let fx: Fixtures;
  let enrollmentId: string;

  beforeAll(async () => {
    await resetDb();
    fx = await createFixtures();
    const e = await enrollmentService.enroll(fx.student1.id, fx.course.id);
    enrollmentId = e.id;
  });

  it("lets the owning teacher record and then update a grade in place (FR-016)", async () => {
    await gradeService.setGrade(enrollmentId, "B", fx.teacher.id);
    let list = await gradeService.listForStudent(fx.student1.id);
    expect(list.find((g) => g.courseId === fx.course.id)?.grade).toBe("B");

    await gradeService.setGrade(enrollmentId, "A", fx.teacher.id);
    list = await gradeService.listForStudent(fx.student1.id);
    expect(list.find((g) => g.courseId === fx.course.id)?.grade).toBe("A");
  });

  it("forbids a non-owning teacher from grading (FR-017)", async () => {
    await expect(gradeService.setGrade(enrollmentId, "C", fx.teacher2.id)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects grading a student who is not actively enrolled (FR-018)", async () => {
    const dropped = await enrollmentService.enroll(fx.student2.id, fx.course.id);
    await enrollmentModel.drop(dropped.id);
    await expect(gradeService.setGrade(dropped.id, "B", fx.teacher.id)).rejects.toMatchObject({
      code: "UNPROCESSABLE_RULE",
    });
  });

  it("reports null for an enrolled-but-ungraded course (FR-019, Story 5)", async () => {
    await enrollmentService.enroll(fx.student2.id, fx.course.id); // active, no grade
    const list = await gradeService.listForStudent(fx.student2.id);
    expect(list.some((g) => g.grade === null)).toBe(true);
  });
});
