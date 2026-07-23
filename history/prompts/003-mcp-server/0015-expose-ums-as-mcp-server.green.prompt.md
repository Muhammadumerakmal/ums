---
id: 0015
title: Expose UMS as an MCP server
stage: green
date: 2026-07-23
surface: agent
model: claude-opus-4-8
feature: 003-mcp-server
branch: feat/verify-ai-assistant
user: muhammadumerakmal
command: implement directly
labels: [mcp, rbac, backend, integration]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - backend/src/mcp/server.ts
 - backend/tests/unit/mcp.test.ts
 - backend/package.json
 - backend/.env.example
 - README.md
tests:
 - backend/tests/unit/mcp.test.ts (9 new: role scoping, identity scoping, error surfacing)
 - end-to-end stdio drive across student/teacher/admin against seeded Neon DB
---

## Prompt

complete the project integrate mcps

(Clarified via question: direction = "Expose UMS as an MCP server"; workflow = "Implement directly".)

## Response snapshot

Built a stdio MCP server (`backend/src/mcp/server.ts`) on `@modelcontextprotocol/sdk` v1.29.0
that exposes the University Management System to any MCP client (Claude Desktop/Code, MCP
Inspector). It reuses the existing backend services directly — no duplicated domain logic —
mirroring how feature 002's AI assistant wires tools.

Identity & RBAC: the server authenticates ONCE at startup as a real UMS user via
`UMS_MCP_EMAIL` / `UMS_MCP_PASSWORD` (bcrypt-verified through `authService.login`), then
registers ONLY the tools that user's role may use (deny-by-default, least privilege). Every tool
runs scoped to the resolved `profileId` from the session — never a client-supplied id.

Tools: shared `whoami`/`list_courses`/`get_course`; student `list_my_enrollments`,
`list_my_grades`, `enroll_in_course`, `drop_course`; teacher `course_roster`, `set_grade`;
admin `list_students`, `list_teachers`, `create_course`. Service `AppError`s are translated to
clean MCP tool errors (`isError: true`); stdout is reserved for JSON-RPC, all logs to stderr.

Tool wiring is kept as data (`toolsForIdentity`) so it is unit-testable without a DB.

## Outcome

- ✅ Impact: UMS is now consumable over MCP with the same RBAC guarantees as the REST API.
- 🧪 Tests: 9 new unit tests (16 total unit) pass; `tsc --noEmit` clean; end-to-end stdio drive
  confirmed student=7 tools, teacher=5, admin=6, and `set_grade` genuinely absent for a student
  (protocol -32602), all against the live seeded Neon DB.
- 📁 Files: new `mcp/server.ts` + `tests/unit/mcp.test.ts`; `npm run mcp` script; `.env.example`
  and README documentation with a paste-ready client config.
- 🔁 Next prompts: optional — add MCP resources (read-only catalog), or an SSE/HTTP transport for
  remote clients; formalize as `specs/003-mcp-server/`.
- 🧠 Reflection: reusing services + resolving identity from a bcrypt login kept the RBAC surface
  identical to the API with a small, focused diff.

## Evaluation notes (flywheel)

- Failure modes observed: none — stdout discipline (logs to stderr) is essential for stdio MCP.
- Graders run and results (PASS/FAIL): typecheck PASS; unit PASS (16/16); e2e drive PASS.
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): add a `student_profile` MCP resource for read context.
