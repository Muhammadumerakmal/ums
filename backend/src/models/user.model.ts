import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { users, type NewUser, type User } from "./schema";

export const userModel = {
  async findByEmail(email: string): Promise<User | undefined> {
    const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    return rows[0];
  },

  async findById(id: string): Promise<User | undefined> {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0];
  },

  async create(data: Omit<NewUser, "email"> & { email: string }): Promise<User> {
    const rows = await db
      .insert(users)
      .values({ ...data, email: data.email.toLowerCase() })
      .returning();
    return rows[0];
  },
};
