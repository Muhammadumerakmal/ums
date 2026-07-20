import { Agent, run, tool, setDefaultOpenAIClient, setOpenAIAPI, setTracingDisabled } from "@openai/agents";
import OpenAI from "openai";
import { z } from "zod";
import { enrollmentService } from "../services/enrollment.service";
import { gradeService } from "../services/grade.service";
import { courseService } from "../services/course.service";
import { enrollmentModel } from "../models/enrollment.model";
import { AppError } from "../lib/errors";

/**
 * The context every tool runs under. It is derived server-side from the signed-in
 * student's session — the model NEVER supplies it — so the agent can only ever touch
 * the requesting student's own data (constitution: AI stays within RBAC).
 */
export interface StudentContext {
  studentId: string;
}

/**
 * Provider selection.
 * Priority: OpenRouter > Gemini > OpenAI
 */
const geminiKey = process.env.GEMINI_API_KEY;
const openrouterKey = process.env.OPENROUTER_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (openrouterKey) {
  setDefaultOpenAIClient(
    new OpenAI({
      apiKey: openrouterKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://uni-ums.example.com",
        "X-Title": "UMS AI Assistant",
      },
    })
  );
  setOpenAIAPI("chat_completions");
  setTracingDisabled(true);
} else if (geminiKey) {
  setDefaultOpenAIClient(
    new OpenAI({
      apiKey: geminiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    })
  );
  setOpenAIAPI("chat_completions"); // Gemini exposes Chat Completions, not the Responses API
  setTracingDisabled(true); // traces would try to export to OpenAI — turn off for Gemini
}

const usingCustomEndpoint = !!geminiKey || !!openrouterKey;
const model = process.env.AI_MODEL ?? (usingCustomEndpoint ? (openrouterKey ? "meta-llama/llama-3.1-8b-instruct" : "gemini-2.0-flash") : "gpt-4o-mini");

/** Read the scoped student id, failing loudly if the run wasn't given a context. */
function studentId(runContext?: { context: unknown }): string {
  const ctx = runContext?.context as StudentContext | undefined;
  if (!ctx?.studentId) {
    throw new AppError("INTERNAL_ERROR", "Assistant run is missing its student context.");
  }
  return ctx.studentId;
}

/** Turn a thrown service AppError into a message the model can relay to the student. */
async function guarded<T>(fn: () => Promise<T>): Promise<T | { error: string }> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AppError) return { error: err.message };
    throw err;
  }
}

const listMyEnrollments = tool({
  name: "list_my_enrollments",
  description: "List the courses the student is currently enrolled in.",
  parameters: z.object({}),
  execute: async (_input, runContext) => enrollmentService.listForStudent(studentId(runContext)),
});

const listMyGrades = tool({
  name: "list_my_grades",
  description: "List the student's grades across their enrolled courses (ungraded courses show null).",
  parameters: z.object({}),
  execute: async (_input, runContext) => gradeService.listForStudent(studentId(runContext)),
});

const listAvailableCourses = tool({
  name: "list_available_courses",
  description: "List the active course catalog the student could enrol in (code, title, teacher).",
  parameters: z.object({}),
  execute: async () => courseService.list(),
});

const enrollInCourse = tool({
  name: "enroll_in_course",
  description: "Enrol the student in a course by its course id (a UUID from the catalog).",
  parameters: z.object({ courseId: z.string().uuid() }),
  execute: async (input, runContext) =>
    guarded(async () => {
      await enrollmentService.enroll(studentId(runContext), input.courseId);
      return { ok: true, message: "Enrolled successfully." };
    }),
});

const dropCourse = tool({
  name: "drop_course",
  description: "Drop the student from a course by its course id (a UUID). No-op if not enrolled.",
  parameters: z.object({ courseId: z.string().uuid() }),
  execute: async (input, runContext) =>
    guarded(async () => {
      const sid = studentId(runContext);
      const active = await enrollmentModel.findActive(sid, input.courseId);
      if (!active) return { ok: false, message: "You are not currently enrolled in that course." };
      await enrollmentService.drop(active.id, { role: "student", studentId: sid });
      return { ok: true, message: "Dropped successfully." };
    }),
});

export const studentAssistant = new Agent<StudentContext>({
  name: "UMS Student Assistant",
  model,
  instructions: [
    "You are a concise, friendly university assistant for a signed-in student.",
    "Use the provided tools to answer questions about the student's own enrollments and grades,",
    "to browse the course catalog, and to enrol in or drop courses when asked.",
    "Never invent courses, grades, or IDs — always call a tool to get real data.",
    "To enrol or drop, first find the course id from the catalog or the student's enrollments.",
    "If a tool returns an { error } message, relay it plainly and suggest a next step.",
    "Only the signed-in student's own data is available to you. Your tools ALWAYS return that",
    "student's records and can never return another person's — so if you are asked about anyone",
    "else (by name, email, or student number), say you can only access the signed-in student's",
    "own records and stop. Never present tool output as belonging to someone other than the",
    "signed-in student.",
  ].join(" "),
  tools: [listMyEnrollments, listMyGrades, listAvailableCourses, enrollInCourse, dropCourse],
});

/** Run one assistant turn for a student. Requires OPENAI_API_KEY at runtime. */
export async function askAssistant(message: string, context: StudentContext): Promise<string> {
  if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    throw new AppError(
      "INTERNAL_ERROR",
      "The AI assistant is not configured. Set OPENROUTER_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY in the backend environment."
    );
  }
  const result = await run(studentAssistant, message, { context });
  return result.finalOutput ?? "";
}
