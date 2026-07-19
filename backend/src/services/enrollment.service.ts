import { enrollmentModel } from "../models/enrollment.model";
import { courseModel } from "../models/course.model";
import { Conflict, Forbidden, NotFound } from "../lib/errors";

export const enrollmentService = {
  listForStudent(studentId: string) {
    return enrollmentModel.listActiveForStudent(studentId);
  },

  /** Enroll a student in a course. FR-011/FR-012. */
  async enroll(studentId: string, courseId: string) {
    const course = await courseModel.findActiveById(courseId);
    if (!course) throw NotFound("Course not found or no longer available.");

    const existing = await enrollmentModel.findActive(studentId, courseId);
    if (existing) throw Conflict("You are already enrolled in this course.");

    try {
      return await enrollmentModel.create(studentId, courseId);
    } catch {
      // Partial unique index guards against a race — surface as a conflict.
      throw Conflict("You are already enrolled in this course.");
    }
  },

  /** Drop an enrollment. Students may only drop their own; admin may drop any. FR-013. */
  async drop(enrollmentId: string, actor: { role: string; studentId: string | null }) {
    const enrollment = await enrollmentModel.findById(enrollmentId);
    if (!enrollment || enrollment.droppedAt) throw NotFound("Enrollment not found.");

    if (actor.role === "student" && enrollment.studentId !== actor.studentId) {
      throw Forbidden("You can only drop your own enrollments.");
    }
    return enrollmentModel.drop(enrollmentId);
  },
};
