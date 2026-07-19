import { and, eq, isNull } from "drizzle-orm";
import { db } from "../lib/db";
import { students, users, type Student } from "./schema";

export const studentModel = {
  /** Active students (not soft-deleted) joined with their user identity. */
  async listActive() {
    return db
      .select({
        id: students.id,
        userId: students.userId,
        studentNumber: students.studentNumber,
        fullName: users.fullName,
        email: users.email,
      })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(isNull(students.deletedAt));
  },

  async findById(id: string): Promise<Student | undefined> {
    const rows = await db.select().from(students).where(eq(students.id, id)).limit(1);
    return rows[0];
  },

  async findActiveById(id: string): Promise<Student | undefined> {
    const rows = await db
      .select()
      .from(students)
      .where(and(eq(students.id, id), isNull(students.deletedAt)))
      .limit(1);
    return rows[0];
  },

  async findByUserId(userId: string): Promise<Student | undefined> {
    const rows = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
    return rows[0];
  },

  async create(userId: string, studentNumber: string): Promise<Student> {
    const rows = await db.insert(students).values({ userId, studentNumber }).returning();
    return rows[0];
  },

  async update(id: string, data: Partial<{ studentNumber: string }>): Promise<Student | undefined> {
    const rows = await db
      .update(students)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return rows[0];
  },

  /** Soft delete. */
  async softDelete(id: string): Promise<Student | undefined> {
    const rows = await db
      .update(students)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return rows[0];
  },
};
