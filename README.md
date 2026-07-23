# Core University Management System

A full-stack learning project: role-based university management (Students, Courses, Enrollment,
Grades). Split into two independent apps — a **Next.js frontend** and a **standalone Express
backend** — sharing an explicit **MVC** design, **Neon serverless Postgres**, and **custom JWT +
bcrypt** auth.

> Built spec-first. See `specs/001-core-ums/` for the spec, plan, data model, API contract, and
> tasks; `history/adr/` for architecture decisions (ADR-0001 MVC + Drizzle, ADR-0002 the split).

## Repository layout

```
repo/
├── frontend/     # Next.js (App Router) — React UI only, calls the backend API
│   ├── app/                 # login + admin/teacher/student dashboards
│   └── lib/api.ts           # fetch wrapper → backend, credentials: "include"
├── backend/      # Express API (Node runtime)
│   └── src/
│       ├── models/          # Drizzle schema + data access
│       ├── services/        # business rules & ownership/own-data checks
│       ├── controllers/     # request → service → response
│       ├── routes/          # Express routers (thin HTTP layer)
│       ├── middleware/      # authenticate + authorize (deny-by-default RBAC), error handler
│       └── lib/             # db, password (bcrypt), jwt, errors
├── specs/        # SDD artifacts
└── history/      # ADRs + prompt history records
```

## Stack

- **Frontend**: Next.js 15, React 19
- **Backend**: Express 4 on Node 20, Drizzle ORM + `drizzle-kit`, Zod, bcryptjs, jsonwebtoken
- **Database**: Neon serverless PostgreSQL

## Run it (two terminals)

**1. Backend** (`http://localhost:4000`)
```bash
cd backend
cp .env.example .env.local     # DATABASE_URL (Neon), JWT_SECRET, FRONTEND_ORIGIN, PORT
npm install
npm run db:generate            # SQL migration from schema (already committed)
npm run db:migrate             # apply to Neon
npm run db:seed                # admin/teacher/2 students + 1 course + 1 enrollment
npm run dev                    # Express API on :4000
```

**2. Frontend** (`http://localhost:3000`)
```bash
cd frontend
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                    # Next.js on :3000
```

Open `http://localhost:3000/login`. Seed logins:
`admin@uni.edu / admin1234` · `teacher@uni.edu / teacher1234` · `jane@uni.edu / student1234`

## Verify

```bash
# backend
cd backend && npm run typecheck && npm run test:unit   # integration tests need DATABASE_URL_TEST
# frontend
cd frontend && npm run typecheck && npm run build
```

## Business rules enforced (service layer + DB constraints)

- Unique **active** enrollment per (student, course) — partial unique index; re-enrol allowed after drop.
- Teachers grade only students in **courses they own**; grading requires an **active** enrollment.
- Students read only **their own** enrollments and grades.
- Grades restricted to **{A, B, C, D, F}**.
- **Soft delete** for students/courses (preserves history; excluded from active listings).

## AI student assistant (feature 002)

A student-only conversational assistant built with the **OpenAI Agents SDK** (`@openai/agents`).
Its tools call the existing backend services **scoped to the signed-in student** (the student id
comes from the session, never the model), so it never exposes another student's data.
- Endpoint: `POST /api/assistant` (student-only) · Widget on the student dashboard.
- Config: set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`, default `gpt-4o-mini`) in
  `backend/.env.local`. Without a key it returns a clear "not configured" message.
- See [ADR-0003](history/adr/ADR-0003-ai-assistant-openai-agents.md) and
  [specs/002-ai-assistant](specs/002-ai-assistant/spec.md).

## MCP server (expose UMS over Model Context Protocol)

The backend also ships a **stdio MCP server** (`backend/src/mcp/server.ts`) that exposes UMS to any
MCP client — Claude Desktop, Claude Code, the MCP Inspector — through the **same backend services
and business rules** as the REST API. It reuses the existing services directly (like the AI
assistant), so there is no second copy of the domain logic.

**Identity & RBAC.** The server authenticates **once at startup** as a real UMS user via
`UMS_MCP_EMAIL` / `UMS_MCP_PASSWORD` (verified with bcrypt through the same `authService`). It then
advertises **only the tools that user's role may use** (deny-by-default, least privilege), and every
tool runs scoped to that identity — a client can never widen its own access by naming another user.

| Role | Tools |
|------|-------|
| any | `whoami`, `list_courses`, `get_course` |
| student | + `list_my_enrollments`, `list_my_grades`, `enroll_in_course`, `drop_course` |
| teacher | + `course_roster`, `set_grade` |
| admin | + `list_students`, `list_teachers`, `create_course` |

**Run it**
```bash
cd backend
UMS_MCP_EMAIL=jane@uni.edu UMS_MCP_PASSWORD=student1234 npm run mcp   # serves over stdio
```

**Wire it into an MCP client** (e.g. Claude Desktop `claude_desktop_config.json`). Pass the DB and
auth secrets in the client's `env` block — the server loads `.env.local` too, but MCP clients launch
it from their own working directory:
```jsonc
{
  "mcpServers": {
    "ums": {
      "command": "npx",
      "args": ["tsx", "src/mcp/server.ts"],
      "cwd": "E:/umer-ums/backend",
      "env": {
        "DATABASE_URL": "postgres://…neon.tech/neondb?sslmode=require",
        "JWT_SECRET": "…",
        "UMS_MCP_EMAIL": "jane@uni.edu",
        "UMS_MCP_PASSWORD": "student1234"
      }
    }
  }
}
```
Without `UMS_MCP_EMAIL` / `UMS_MCP_PASSWORD` the server exits with a clear "not configured" message.
Because stdio is the JSON-RPC channel, all server logging goes to **stderr**, never stdout.

## Notes on cross-origin auth

The backend issues the JWT in an **HttpOnly cookie** and enables **CORS with credentials** for the
frontend origin. The frontend sends `credentials: "include"`. In production, host both under the
same site or set the cookie `Secure; SameSite=None`.

## Out of scope (future)

Admissions, finance, attendance, scheduling, transcripts/GPA; teacher/admin AI assistants.
