import { and, eq, isNull } from "drizzle-orm";
import { db } from "../lib/db";
import { courses, teachers, users, type Course } from "./schema";

export const courseModel = {
  /** Active courses (not soft-deleted) with owning teacher name. */
  async listActive() {
    return db
      .select({
        id: courses.id,
        code: courses.code,
        title: courses.title,
        teacherId: courses.teacherId,
        teacherName: users.fullName,
      })
      .from(courses)
      .innerJoin(teachers, eq(courses.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(isNull(courses.deletedAt));
  },

  async findActiveById(id: string): Promise<Course | undefined> {
    const rows = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, id), isNull(courses.deletedAt)))
      .limit(1);
    return rows[0];
  },

  async findByCode(code: string): Promise<Course | undefined> {
    const rows = await db.select().from(courses).where(eq(courses.code, code)).limit(1);
    return rows[0];
  },

  async create(data: { code: string; title: string; teacherId: string }): Promise<Course> {
    const rows = await db.insert(courses).values(data).returning();
    return rows[0];
  },

  async update(
    id: string,
    data: Partial<{ code: string; title: string; teacherId: string }>
  ): Promise<Course | undefined> {
    const rows = await db
      .update(courses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return rows[0];
  },

  async softDelete(id: string): Promise<Course | undefined> {
    const rows = await db
      .update(courses)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return rows[0];
  },
};
