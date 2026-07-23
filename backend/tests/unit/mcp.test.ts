import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { Forbidden, NotFound } from "../../src/lib/errors";

// Mock every backend service the MCP tools call, so these are true unit tests
// (no DB) that verify the wiring: role scoping, identity scoping, error surfacing.
vi.mock("../../src/services/enrollment.service", () => ({
  enrollmentService: { listForStudent: vi.fn(), enroll: vi.fn(), drop: vi.fn() },
}));
vi.mock("../../src/services/grade.service", () => ({
  gradeService: { listForStudent: vi.fn(), setGrade: vi.fn() },
}));
vi.mock("../../src/services/course.service", () => ({
  courseService: { list: vi.fn(), getById: vi.fn(), getRoster: vi.fn(), create: vi.fn() },
}));
vi.mock("../../src/services/student.service", () => ({
  studentService: { list: vi.fn() },
}));
vi.mock("../../src/models/enrollment.model", () => ({
  enrollmentModel: { findActive: vi.fn() },
}));
vi.mock("../../src/models/teacher.model", () => ({
  teacherModel: { listAll: vi.fn() },
}));

import { toolsForIdentity, type McpIdentity } from "../../src/mcp/server";
import { enrollmentService } from "../../src/services/enrollment.service";
import { gradeService } from "../../src/services/grade.service";
import { courseService } from "../../src/services/course.service";
import { enrollmentModel } from "../../src/models/enrollment.model";

const student: McpIdentity = { userId: "u1", fullName: "Jane", role: "student", profileId: "stu1" };
const teacher: McpIdentity = { userId: "u2", fullName: "Tom", role: "teacher", profileId: "tea1" };
const admin: McpIdentity = { userId: "u3", fullName: "Ada", role: "admin", profileId: null };

const names = (id: McpIdentity) => toolsForIdentity(id).map((t) => t.name);
const tool = (id: McpIdentity, name: string) => {
  const t = toolsForIdentity(id).find((x) => x.name === name);
  if (!t) throw new Error(`tool ${name} not registered for ${id.role}`);
  return t;
};
const textOf = (r: CallToolResult) => (r.content[0] as { text: string }).text;

beforeEach(() => vi.clearAllMocks());

describe("MCP role scoping (deny-by-default, least privilege)", () => {
  it("gives every role the shared tools", () => {
    for (const id of [student, teacher, admin]) {
      expect(names(id)).toEqual(expect.arrayContaining(["whoami", "list_courses", "get_course"]));
    }
  });

  it("exposes student tools only to a student", () => {
    expect(names(student)).toEqual(expect.arrayContaining(["list_my_enrollments", "enroll_in_course", "drop_course"]));
    expect(names(teacher)).not.toContain("enroll_in_course");
    expect(names(admin)).not.toContain("enroll_in_course");
  });

  it("exposes teacher tools only to a teacher", () => {
    expect(names(teacher)).toEqual(expect.arrayContaining(["course_roster", "set_grade"]));
    expect(names(student)).not.toContain("set_grade");
    expect(names(admin)).not.toContain("set_grade");
  });

  it("exposes admin tools only to an admin", () => {
    expect(names(admin)).toEqual(expect.arrayContaining(["list_students", "list_teachers", "create_course"]));
    expect(names(student)).not.toContain("create_course");
    expect(names(teacher)).not.toContain("create_course");
  });
});

describe("MCP identity scoping (the client can never widen its own access)", () => {
  it("scopes list_my_enrollments to the signed-in student's profile id", async () => {
    (enrollmentService.listForStudent as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "e1" }]);
    const res = await tool(student, "list_my_enrollments").handler({});
    expect(enrollmentService.listForStudent).toHaveBeenCalledWith("stu1");
    expect(res.isError).toBeUndefined();
    expect(textOf(res)).toContain("e1");
  });

  it("scopes set_grade to the signed-in teacher's profile id", async () => {
    (gradeService.setGrade as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "g1", letter: "A" });
    await tool(teacher, "set_grade").handler({ enrollmentId: "11111111-1111-1111-1111-111111111111", letter: "A" });
    expect(gradeService.setGrade).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111", "A", "tea1");
  });
});

describe("MCP error surfacing (service AppError → clean tool error, not a crash)", () => {
  it("relays a thrown AppError as an isError result", async () => {
    (courseService.getById as ReturnType<typeof vi.fn>).mockRejectedValue(NotFound("Course not found."));
    const res = await tool(student, "get_course").handler({ courseId: "22222222-2222-2222-2222-222222222222" });
    expect(res.isError).toBe(true);
    expect(textOf(res)).toBe("Course not found.");
  });

  it("drop_course reports a friendly message when not enrolled", async () => {
    (enrollmentModel.findActive as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const res = await tool(student, "drop_course").handler({ courseId: "33333333-3333-3333-3333-333333333333" });
    expect(res.isError).toBeUndefined();
    expect(textOf(res)).toContain("not currently enrolled");
    expect(enrollmentService.drop).not.toHaveBeenCalled();
  });

  it("relays a teacher-ownership Forbidden from the roster tool", async () => {
    (courseService.getRoster as ReturnType<typeof vi.fn>).mockRejectedValue(
      Forbidden("You can only view rosters for courses you own.")
    );
    const res = await tool(teacher, "course_roster").handler({ courseId: "44444444-4444-4444-4444-444444444444" });
    expect(res.isError).toBe(true);
    expect(textOf(res)).toContain("courses you own");
  });
});
