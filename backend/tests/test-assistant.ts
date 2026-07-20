/**
 * Manual smoke test for the AI student assistant — NOT part of `npm test`
 * (vitest only picks up `tests/**\/*.test.ts`), because it makes real LLM calls.
 *
 * Run with:  npx tsx tests/test-assistant.ts  [-- "your question"]
 * Requires:  a seeded database (`npm run db:seed`) and one of
 *            OPENROUTER_API_KEY / GEMINI_API_KEY / OPENAI_API_KEY in .env
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { askAssistant } from "../src/ai/agent";
import { db } from "../src/lib/db";
import { students, users } from "../src/models/schema";

const SEED_STUDENT_EMAIL = "jane@uni.edu";

/** Resolve the seeded student's *profile* id (not the user id — tools are scoped by student id). */
async function resolveStudentId(): Promise<string> {
  const [row] = await db
    .select({ studentId: students.id })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(users.email, SEED_STUDENT_EMAIL))
    .limit(1);

  if (!row) {
    throw new Error(`No student found for ${SEED_STUDENT_EMAIL}. Run \`npm run db:seed\` first.`);
  }
  return row.studentId;
}

async function main() {
  const question = process.argv.slice(2).join(" ") || "What courses am I enrolled in?";
  const studentId = await resolveStudentId();

  console.log(`Provider model: ${process.env.AI_MODEL || "(default)"}`);
  console.log(`Student:        ${SEED_STUDENT_EMAIL} (${studentId})`);
  console.log(`Question:       ${question}\n`);

  const answer = await askAssistant(question, { studentId });
  console.log(`Answer:         ${answer}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Assistant test failed:", err);
    process.exit(1);
  });
