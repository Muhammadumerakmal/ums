import { and, eq, isNull } from "drizzle-orm";
import { db } from "../lib/db";
import { courses, enrollments, type Enrollment } from "./schema";

export const enrollmentModel = {
  /** The current active enrollment (if any) for a student in a course. */
  async findActive(studentId: string, courseId: string): Promise<Enrollment | undefined> {
    const rows = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.courseId, courseId),
          isNull(enrollments.droppedAt)
        )
      )
      .limit(1);
    return rows[0];
  },

  async findById(id: string): Promise<Enrollment | undefined> {
    const rows = await db.select().from(enrollments).where(eq(enrollments.id, id)).limit(1);
    return rows[0];
  },

  /** Active enrollments for a student, with course info. */
  async listActiveForStudent(studentId: string) {
    return db
      .select({
        id: enrollments.id,
        courseId: courses.id,
        code: courses.code,
        title: courses.title,
        enrolledAt: enrollments.enrolledAt,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(and(eq(enrollments.studentId, studentId), isNull(enrollments.droppedAt)));
  },

  async create(studentId: string, courseId: string): Promise<Enrollment> {
    const rows = await db.insert(enrollments).values({ studentId, courseId }).returning();
    return rows[0];
  },

  async drop(id: string): Promise<Enrollment | undefined> {
    const rows = await db
      .update(enrollments)
      .set({ droppedAt: new Date() })
      .where(eq(enrollments.id, id))
      .returning();
    return rows[0];
  },
};
