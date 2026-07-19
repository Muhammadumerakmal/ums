import { and, eq, isNull } from "drizzle-orm";
import { db } from "../lib/db";
import { courses, enrollments, grades, students, users, type Grade, type GradeLetter } from "./schema";

export const gradeModel = {
  async findByEnrollment(enrollmentId: string): Promise<Grade | undefined> {
    const rows = await db.select().from(grades).where(eq(grades.enrollmentId, enrollmentId)).limit(1);
    return rows[0];
  },

  /** Upsert: one grade per enrollment; updating replaces the letter. */
  async upsert(enrollmentId: string, letter: GradeLetter, gradedBy: string): Promise<Grade> {
    const existing = await this.findByEnrollment(enrollmentId);
    if (existing) {
      const rows = await db
        .update(grades)
        .set({ letter, gradedBy, updatedAt: new Date() })
        .where(eq(grades.enrollmentId, enrollmentId))
        .returning();
      return rows[0];
    }
    const rows = await db.insert(grades).values({ enrollmentId, letter, gradedBy }).returning();
    return rows[0];
  },

  /** Roster for a course: active enrollments + current grade (null if ungraded). */
  async rosterForCourse(courseId: string) {
    return db
      .select({
        enrollmentId: enrollments.id,
        studentId: students.id,
        fullName: users.fullName,
        studentNumber: students.studentNumber,
        grade: grades.letter,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .innerJoin(users, eq(students.userId, users.id))
      .leftJoin(grades, eq(grades.enrollmentId, enrollments.id))
      .where(and(eq(enrollments.courseId, courseId), isNull(enrollments.droppedAt)));
  },

  /** A student's grades across their active enrollments (null when not yet graded). */
  async listForStudent(studentId: string) {
    return db
      .select({
        courseId: courses.id,
        code: courses.code,
        title: courses.title,
        grade: grades.letter,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(grades, eq(grades.enrollmentId, enrollments.id))
      .where(and(eq(enrollments.studentId, studentId), isNull(enrollments.droppedAt)));
  },
};
