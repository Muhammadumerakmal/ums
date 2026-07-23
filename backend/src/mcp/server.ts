import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // fall back to .env

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { authService } from "../services/auth.service";
import { enrollmentService } from "../services/enrollment.service";
import { gradeService } from "../services/grade.service";
import { courseService } from "../services/course.service";
import { studentService } from "../services/student.service";
import { enrollmentModel } from "../models/enrollment.model";
import { teacherModel } from "../models/teacher.model";
import { AppError } from "../lib/errors";
import type { Role } from "../models/schema";

/**
 * UMS Model Context Protocol server.
 *
 * Exposes the University Management System over MCP (stdio) so any MCP client
 * (Claude Desktop, Claude Code, the MCP Inspector, …) can query and act on UMS
 * through the SAME backend services and business rules as the REST API.
 *
 * Identity & RBAC — the server authenticates ONCE at startup as a real UMS user
 * using `UMS_MCP_EMAIL` / `UMS_MCP_PASSWORD` (verified with bcrypt via authService).
 * It then advertises only the tools that user's role is permitted to use
 * (deny-by-default, least privilege) and every tool operates scoped to that
 * identity — the client can never widen its own access by naming another user.
 */

/** The signed-in principal every tool runs under. Resolved server-side, never from the client. */
export interface McpIdentity {
  userId: string;
  fullName: string;
  role: Role;
  /** students.id / teachers.id; null for admins. */
  profileId: string | null;
}

/** A tool ready to register: name + MCP config + handler. Kept as data so it is unit-testable. */
interface ToolDef {
  name: string;
  config: {
    title: string;
    description: string;
    inputSchema: z.ZodRawShape;
  };
  handler: (args: Record<string, unknown>) => Promise<CallToolResult>;
}

/* ------------------------------------------------------------------ helpers */

/** Serialize any tool payload as MCP text content. */
function ok(data: unknown): CallToolResult {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: "text", text }] };
}

/** Surface a failure as an MCP tool error (not a transport crash). */
function fail(message: string): CallToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

/**
 * Run a tool body, translating a thrown service AppError (validation, RBAC,
 * conflict, …) into a clean tool error the model can relay. Unexpected errors
 * are logged to STDERR (stdout is reserved for the JSON-RPC stream) and reported
 * generically so we never leak internals.
 */
async function run(fn: () => Promise<unknown>): Promise<CallToolResult> {
  try {
    return ok(await fn());
  } catch (err) {
    if (err instanceof AppError) return fail(err.message);
    console.error("[ums-mcp] unexpected tool error:", err);
    return fail("An unexpected error occurred.");
  }
}

/** Require a resolved profile id (student/teacher) or fail the tool cleanly. */
function requireProfile(identity: McpIdentity): string {
  if (!identity.profileId) {
    throw new AppError("FORBIDDEN", `No ${identity.role} profile is linked to this account.`);
  }
  return identity.profileId;
}

/* --------------------------------------------------------------- tool sets */

/** Tools available to any authenticated role. */
function sharedTools(identity: McpIdentity): ToolDef[] {
  return [
    {
      name: "whoami",
      config: {
        title: "Who am I",
        description: "Return the identity and role the MCP server is authenticated as.",
        inputSchema: {},
      },
      handler: async () =>
        ok({
          userId: identity.userId,
          fullName: identity.fullName,
          role: identity.role,
          profileId: identity.profileId,
        }),
    },
    {
      name: "list_courses",
      config: {
        title: "List courses",
        description: "List the active course catalog (id, code, title, owning teacher).",
        inputSchema: {},
      },
      handler: async () => run(() => courseService.list()),
    },
    {
      name: "get_course",
      config: {
        title: "Get course",
        description: "Fetch a single active course by its course id (UUID).",
        inputSchema: { courseId: z.string().uuid() },
      },
      handler: async (args) => run(() => courseService.getById(args.courseId as string)),
    },
  ];
}

/** Tools available only to a student, scoped to their own records. */
function studentTools(identity: McpIdentity): ToolDef[] {
  return [
    {
      name: "list_my_enrollments",
      config: {
        title: "List my enrollments",
        description: "List the courses the signed-in student is currently enrolled in.",
        inputSchema: {},
      },
      handler: async () => run(() => enrollmentService.listForStudent(requireProfile(identity))),
    },
    {
      name: "list_my_grades",
      config: {
        title: "List my grades",
        description: "List the signed-in student's grades (ungraded courses show null).",
        inputSchema: {},
      },
      handler: async () => run(() => gradeService.listForStudent(requireProfile(identity))),
    },
    {
      name: "enroll_in_course",
      config: {
        title: "Enroll in a course",
        description: "Enroll the signed-in student in a course by its course id (UUID).",
        inputSchema: { courseId: z.string().uuid() },
      },
      handler: async (args) =>
        run(async () => {
          await enrollmentService.enroll(requireProfile(identity), args.courseId as string);
          return { ok: true, message: "Enrolled successfully." };
        }),
    },
    {
      name: "drop_course",
      config: {
        title: "Drop a course",
        description: "Drop the signed-in student from a course by its course id (UUID).",
        inputSchema: { courseId: z.string().uuid() },
      },
      handler: async (args) =>
        run(async () => {
          const studentId = requireProfile(identity);
          const active = await enrollmentModel.findActive(studentId, args.courseId as string);
          if (!active) return { ok: false, message: "You are not currently enrolled in that course." };
          await enrollmentService.drop(active.id, { role: "student", studentId });
          return { ok: true, message: "Dropped successfully." };
        }),
    },
  ];
}

/** Tools available only to a teacher, scoped to courses they own. */
function teacherTools(identity: McpIdentity): ToolDef[] {
  return [
    {
      name: "course_roster",
      config: {
        title: "Course roster",
        description: "List the roster (students + grades) for a course you own, by course id (UUID).",
        inputSchema: { courseId: z.string().uuid() },
      },
      handler: async (args) =>
        run(() =>
          courseService.getRoster(
            args.courseId as string,
            { userId: identity.userId, role: "teacher" },
            requireProfile(identity)
          )
        ),
    },
    {
      name: "set_grade",
      config: {
        title: "Set grade",
        description:
          "Record or update a grade (A/B/C/D/F) for an enrollment in a course you own, by enrollment id (UUID).",
        inputSchema: {
          enrollmentId: z.string().uuid(),
          letter: z.enum(["A", "B", "C", "D", "F"]),
        },
      },
      handler: async (args) =>
        run(() =>
          gradeService.setGrade(
            args.enrollmentId as string,
            args.letter as "A" | "B" | "C" | "D" | "F",
            requireProfile(identity)
          )
        ),
    },
  ];
}

/** Tools available only to an admin. */
function adminTools(_identity: McpIdentity): ToolDef[] {
  return [
    {
      name: "list_students",
      config: {
        title: "List students",
        description: "List all active students (id, student number, name, email).",
        inputSchema: {},
      },
      handler: async () => run(() => studentService.list()),
    },
    {
      name: "list_teachers",
      config: {
        title: "List teachers",
        description: "List all teachers (id, name, email, department).",
        inputSchema: {},
      },
      handler: async () => run(() => teacherModel.listAll()),
    },
    {
      name: "create_course",
      config: {
        title: "Create course",
        description: "Create a course with a unique code, a title, and an owning teacher id (UUID).",
        inputSchema: {
          code: z.string().min(1),
          title: z.string().min(1),
          teacherId: z.string().uuid(),
        },
      },
      handler: async (args) =>
        run(() =>
          courseService.create({
            code: args.code as string,
            title: args.title as string,
            teacherId: args.teacherId as string,
          })
        ),
    },
  ];
}

/** The full, role-filtered tool set for an identity (deny-by-default). Exported for tests. */
export function toolsForIdentity(identity: McpIdentity): ToolDef[] {
  const tools = [...sharedTools(identity)];
  if (identity.role === "student") tools.push(...studentTools(identity));
  else if (identity.role === "teacher") tools.push(...teacherTools(identity));
  else if (identity.role === "admin") tools.push(...adminTools(identity));
  return tools;
}

/* ------------------------------------------------------------ construction */

/** Build a configured (but not yet connected) MCP server for the given identity. */
export function buildUmsMcpServer(identity: McpIdentity): McpServer {
  const server = new McpServer({ name: "ums-mcp", version: "0.1.0" });
  for (const t of toolsForIdentity(identity)) {
    // The handler is uniformly (args) => Promise<CallToolResult>; the SDK's per-schema
    // callback typing is satisfied structurally at the registration boundary.
    server.registerTool(t.name, t.config, t.handler as never);
  }
  return server;
}

/** Authenticate as the configured UMS user, or throw a clear, actionable error. */
export async function resolveIdentity(): Promise<McpIdentity> {
  const email = process.env.UMS_MCP_EMAIL;
  const password = process.env.UMS_MCP_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "UMS MCP server is not configured: set UMS_MCP_EMAIL and UMS_MCP_PASSWORD (a real UMS user) in the environment."
    );
  }
  const { user } = await authService.login(email, password);
  return { userId: user.id, fullName: user.fullName, role: user.role, profileId: user.profileId };
}

/** Entry point: authenticate, wire tools for that role, and serve over stdio. */
async function main(): Promise<void> {
  const identity = await resolveIdentity();
  const server = buildUmsMcpServer(identity);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdout is the JSON-RPC channel — everything human-facing goes to stderr.
  console.error(
    `[ums-mcp] serving as ${identity.fullName} (${identity.role}) — ${toolsForIdentity(identity).length} tools`
  );
}

// Run only as an entry point, never when imported by tests.
if (process.env.NODE_ENV !== "test") {
  main().catch((err) => {
    console.error("[ums-mcp] fatal:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
