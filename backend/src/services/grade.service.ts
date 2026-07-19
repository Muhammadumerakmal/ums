import { gradeModel } from "../models/grade.model";
import { enrollmentModel } from "../models/enrollment.model";
import { courseModel } from "../models/course.model";
import { Forbidden, NotFound, UnprocessableRule } from "../lib/errors";
import type { GradeLetter } from "../models/schema";

export const gradeService = {
  /**
   * Record or update a grade. Enforces:
   *  - owning-teacher only (FR-017)
   *  - the enrollment must be active / student actually enrolled (FR-018)
   * Letter domain (FR-016) is enforced by Zod at the boundary.
   */
  async setGrade(enrollmentId: string, letter: GradeLetter, teacherId: string) {
    const enrollment = await enrollmentModel.findById(enrollmentId);
    if (!enrollment) throw NotFound("Enrollment not found.");
    if (enrollment.droppedAt) {
      throw UnprocessableRule("Cannot grade a student who is not actively enrolled.");
    }

    const course = await courseModel.findActiveById(enrollment.courseId);
    if (!course) throw NotFound("Course not found.");
    if (course.teacherId !== teacherId) {
      throw Forbidden("You can only grade students in courses you own.");
    }

    return gradeModel.upsert(enrollmentId, letter, teacherId);
  },

  /** A student's own grades across enrolled courses (ungraded → null). FR-019. */
  listForStudent(studentId: string) {
    return gradeModel.listForStudent(studentId);
  },
};
