import { sql } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { users, students, teachers, courses } from "../../src/models/schema";
import { hashPassword } from "../../src/lib/password";

export const TEST_PASSWORD = "pw123456";

/** Wipe all rows between suites so each integration test starts clean. */
export async function resetDb(): Promise<void> {
  await db.execute(
    sql`TRUNCATE grades, enrollments, courses, students, teachers, users RESTART IDENTITY CASCADE`
  );
}

/**
 * Baseline fixtures: an admin, two teachers (one owns a course), two students,
 * and one course (CS101) owned by teacher #1. All users share TEST_PASSWORD.
 */
export async function createFixtures() {
  const hash = await hashPassword(TEST_PASSWORD);

  const [admin] = await db
    .insert(users)
    .values({ email: "admin@test.io", passwordHash: hash, fullName: "Admin", role: "admin" })
    .returning();

  const [t1User] = await db
    .insert(users)
    .values({ email: "teacher1@test.io", passwordHash: hash, fullName: "Teacher One", role: "teacher" })
    .returning();
  const [teacher] = await db.insert(teachers).values({ userId: t1User.id }).returning();

  const [t2User] = await db
    .insert(users)
    .values({ email: "teacher2@test.io", passwordHash: hash, fullName: "Teacher Two", role: "teacher" })
    .returning();
  const [teacher2] = await db.insert(teachers).values({ userId: t2User.id }).returning();

  const [s1User] = await db
    .insert(users)
    .values({ email: "student1@test.io", passwordHash: hash, fullName: "Student One", role: "student" })
    .returning();
  const [student1] = await db.insert(students).values({ userId: s1User.id, studentNumber: "S-1" }).returning();

  const [s2User] = await db
    .insert(users)
    .values({ email: "student2@test.io", passwordHash: hash, fullName: "Student Two", role: "student" })
    .returning();
  const [student2] = await db.insert(students).values({ userId: s2User.id, studentNumber: "S-2" }).returning();

  const [course] = await db
    .insert(courses)
    .values({ code: "CS101", title: "Intro to CS", teacherId: teacher.id })
    .returning();

  return {
    adminEmail: admin.email,
    teacher,
    teacher2,
    student1,
    student1Email: s1User.email,
    student2,
    student2Email: s2User.email,
    course,
    password: TEST_PASSWORD,
  };
}

export type Fixtures = Awaited<ReturnType<typeof createFixtures>>;
