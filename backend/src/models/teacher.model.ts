import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { teachers, users, type Teacher } from "./schema";

export const teacherModel = {
  /** All teachers with their user identity (for admin course assignment). */
  async listAll() {
    return db
      .select({
        id: teachers.id,
        fullName: users.fullName,
        email: users.email,
        department: teachers.department,
      })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id));
  },

  async findById(id: string): Promise<Teacher | undefined> {
    const rows = await db.select().from(teachers).where(eq(teachers.id, id)).limit(1);
    return rows[0];
  },

  async findByUserId(userId: string): Promise<Teacher | undefined> {
    const rows = await db.select().from(teachers).where(eq(teachers.userId, userId)).limit(1);
    return rows[0];
  },

  async create(userId: string, department?: string): Promise<Teacher> {
    const rows = await db.insert(teachers).values({ userId, department }).returning();
    return rows[0];
  },
};
