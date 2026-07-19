/**
 * Seed script — run with `npm run db:seed`.
 * Creates one user per role, a teacher-owned course, and one active enrollment.
 * Idempotent: skips creation if the admin already exists.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // fall back to .env

import { db } from "../lib/db";
import { users, students, teachers, courses, enrollments } from "./schema";
import { hashPassword } from "../lib/password";
import { eq } from "drizzle-orm";

async function main() {
  const existing = await db.select().from(users).where(eq(users.email, "admin@uni.edu")).limit(1);
  if (existing.length > 0) {
    console.log("Seed skipped — admin@uni.edu already exists.");
    return;
  }

  const [adminHash, teacherHash, studentHash] = await Promise.all([
    hashPassword("admin1234"),
    hashPassword("teacher1234"),
    hashPassword("student1234"),
  ]);

  // Admin
  await db.insert(users).values({
    email: "admin@uni.edu",
    passwordHash: adminHash,
    fullName: "Alice Admin",
    role: "admin",
  });

  // Teacher + profile
  const [teacherUser] = await db
    .insert(users)
    .values({ email: "teacher@uni.edu", passwordHash: teacherHash, fullName: "Tom Teacher", role: "teacher" })
    .returning();
  const [teacher] = await db
    .insert(teachers)
    .values({ userId: teacherUser.id, department: "Computer Science" })
    .returning();

  // Students + profiles
  const [janeUser] = await db
    .insert(users)
    .values({ email: "jane@uni.edu", passwordHash: studentHash, fullName: "Jane Doe", role: "student" })
    .returning();
  const [jane] = await db
    .insert(students)
    .values({ userId: janeUser.id, studentNumber: "S-1001" })
    .returning();

  const [johnUser] = await db
    .insert(users)
    .values({ email: "john@uni.edu", passwordHash: studentHash, fullName: "John Roe", role: "student" })
    .returning();
  await db.insert(students).values({ userId: johnUser.id, studentNumber: "S-1002" });

  // Course owned by the teacher
  const [course] = await db
    .insert(courses)
    .values({ code: "CS101", title: "Intro to Computer Science", teacherId: teacher.id })
    .returning();

  // One active enrollment: Jane in CS101
  await db.insert(enrollments).values({ studentId: jane.id, courseId: course.id });

  console.log("Seed complete: admin/teacher/2 students, 1 course (CS101), 1 enrollment.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
