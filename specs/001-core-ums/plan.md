# Implementation Plan: Core University Management System

**Branch**: `001-core-ums` | **Date**: 2026-07-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-core-ums/spec.md`

## Summary

Deliver the core UMS slice — secure role-based sign-in and full CRUD + business rules for
Students, Courses, Enrollment (many-to-many), and Grades — as a **full-stack Next.js (App
Router) application on the Node.js runtime**, backed by **Neon serverless Postgres**. The
backend is organized in an **MVC layering** (Models → Services → Controllers, with Next.js
route handlers as a thin HTTP adapter and React pages/components as the View). Authentication is
**custom JWT + bcrypt**; authorization is **server-side, deny-by-default RBAC** middleware for
the three roles (Administrator, Teacher, Student). Data access and migrations use **Drizzle
ORM**; request/response shapes are validated at the boundary with **Zod**. Business rules
(unique enrollment, own-course-only grading, enrolled-only grading, own-data-only reads,
soft-delete) are enforced in the service layer and, where possible, by database constraints.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20 LTS
**Primary Dependencies**: Next.js 15 (App Router, `runtime = "nodejs"`), React 19, Drizzle ORM +
`drizzle-kit` (migrations), `@neondatabase/serverless` driver, `bcryptjs` (password hashing),
`jsonwebtoken` (JWT), `zod` (runtime validation)
**Storage**: Neon serverless PostgreSQL (single database; connection string via `DATABASE_URL`)
**Testing**: Vitest (unit + integration); a disposable Neon branch / local Postgres for
integration tests; optional Playwright for end-to-end (out of scope for MVP)
**Target Platform**: Web — server (Node runtime) + browser; deployable to Vercel + Neon
**Project Type**: Web application (single Next.js full-stack project with an MVC server layer)
**Performance Goals**: CRUD endpoints p95 < 300 ms under learning-scale load; dashboards render
in < 1 s (aligns with SC-001)
**Constraints**: Stateless serverless functions (no in-process session store — JWT carries
identity); Neon HTTP/pooled driver for short-lived connections; secrets only via env
**Scale/Scope**: Learning scale — low hundreds of users, four core entities, ~15 API endpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | How this plan complies |
|---|-----------|------------------------|
| I | **Spec-Driven Development** | Plan derives from `spec.md` + clarifications; ADR surfaced for MVC/ORM; PHR recorded. |
| II | **Contract-First & Type-Safe** | REST contracts defined in `contracts/` before code; TypeScript end-to-end; Zod validates every request body/param; Drizzle gives typed rows. No `any` at boundaries. |
| III | **Test-First Discipline** | Vitest suites for each business rule (unique enrollment, own-course grading, enrolled-only grading, own-data reads, soft-delete) authored Red→Green; SC-006 covered. |
| IV | **Secure RBAC by Default** | `authenticate` + `authorize` middleware on every route handler; deny-by-default; ownership checks in services; bcrypt hashing; secrets in `.env`. |
| V | **Relational Data Integrity** | Real FKs; UNIQUE(student_id, course_id) on enrollments; migrations via drizzle-kit (versioned, reversible); soft-delete flags; no ad-hoc schema edits. |
| VI | **Simplicity & Learning-First** | Core slice only; minimal dependency set; MVC layering is the teaching goal; no premature abstraction. |

**Result: PASS.** No violations. One dependency choice (Drizzle ORM) is flagged for an ADR as an
architecturally significant decision, not a constitution violation.

## Project Structure

### Documentation (this feature)

```text
specs/001-core-ums/
├── plan.md              # This file
├── research.md          # Phase 0 output — decisions & rationale
├── data-model.md        # Phase 1 output — schema, constraints, relationships
├── quickstart.md        # Phase 1 output — local setup & run
├── contracts/           # Phase 1 output — REST API contract + error taxonomy
│   └── rest-api.md
├── checklists/
│   └── requirements.md  # From /sp.specify
└── tasks.md             # Phase 2 output (/sp.tasks — NOT created here)
```

### Source Code (repository root)

MVC mapping inside Next.js: **View** = React pages/components under `app/`; **Route handlers**
under `app/api/**` are a thin HTTP adapter; **Controller** parses/authorizes and shapes the
response; **Service** holds business rules; **Model** is Drizzle schema + data-access.

```text
app/                              # Next.js App Router — View + HTTP entry
├── (auth)/
│   └── login/page.tsx
├── (dashboard)/
│   ├── admin/                    # admin screens (students, courses, users)
│   ├── teacher/                  # teacher screens (my courses, roster, grading)
│   └── student/                  # student screens (browse, my courses, my grades)
├── api/                          # Route handlers (thin) → controllers
│   ├── auth/login/route.ts
│   ├── auth/me/route.ts
│   ├── students/route.ts
│   ├── students/[id]/route.ts
│   ├── courses/route.ts
│   ├── courses/[id]/route.ts
│   ├── enrollments/route.ts
│   ├── enrollments/[id]/route.ts
│   ├── courses/[id]/roster/route.ts
│   └── grades/route.ts
├── layout.tsx
└── page.tsx

src/server/                       # MVC backend (Node runtime)
├── models/                       # M — Drizzle schema + typed data access
│   ├── schema.ts                 # all tables, relations, enums
│   ├── user.model.ts
│   ├── student.model.ts
│   ├── teacher.model.ts
│   ├── course.model.ts
│   ├── enrollment.model.ts
│   └── grade.model.ts
├── services/                     # business rules / invariants
│   ├── auth.service.ts
│   ├── student.service.ts
│   ├── course.service.ts
│   ├── enrollment.service.ts
│   └── grade.service.ts
├── controllers/                  # request → service → HTTP response
│   ├── auth.controller.ts
│   ├── student.controller.ts
│   ├── course.controller.ts
│   ├── enrollment.controller.ts
│   └── grade.controller.ts
├── middleware/                   # cross-cutting auth/authz
│   ├── authenticate.ts           # verify JWT → current user
│   └── authorize.ts              # role + ownership guards (deny by default)
├── validation/                   # Zod DTO schemas (single source of shape truth)
│   ├── auth.schema.ts
│   ├── student.schema.ts
│   ├── course.schema.ts
│   ├── enrollment.schema.ts
│   └── grade.schema.ts
└── lib/                          # shared infra
    ├── db.ts                     # Neon + Drizzle client
    ├── password.ts               # bcrypt hash/compare
    ├── jwt.ts                    # sign/verify tokens
    ├── errors.ts                 # AppError taxonomy → status codes
    └── http.ts                   # json(), error() response helpers

drizzle/                          # generated SQL migrations (versioned)
tests/
├── unit/                         # services & lib (pure logic, mocked models)
├── integration/                  # route handlers against a test database
└── setup/                        # test db bootstrap, seed, fixtures

drizzle.config.ts
.env.example                      # DATABASE_URL, JWT_SECRET, BCRYPT_ROUNDS (no real values)
package.json
```

**Structure Decision**: Single full-stack Next.js project. The `src/server/**` tree implements
MVC explicitly; `app/api/**` route handlers stay thin (parse → call controller → return),
keeping business logic testable in isolation and independent of the HTTP framework. This is the
central architectural decision recorded for ADR.

## Phase 0 — Research

See [research.md](./research.md). The backend structure + data-layer decisions are ratified in
[ADR-0001](../../history/adr/ADR-0001-backend-architecture-mvc-drizzle.md). Key decisions:
Drizzle ORM for typed access + migrations; JWT
in an HttpOnly cookie; bcryptjs with cost 10; Zod DTOs shared as the shape source of truth;
soft-delete via `deleted_at` timestamp + partial unique index; Vitest with an ephemeral Neon
branch for integration tests. No unresolved `NEEDS CLARIFICATION` remain.

## Phase 1 — Design & Contracts

- [data-model.md](./data-model.md) — tables (`users`, `students`, `teachers`, `courses`,
  `enrollments`, `grades`), columns, FKs, the `UNIQUE(student_id, course_id)` enrollment
  constraint, soft-delete columns, and the role enum.
- [contracts/rest-api.md](./contracts/rest-api.md) — every endpoint with method, auth/role,
  request/response shape, and the shared error taxonomy → HTTP status mapping.
- [quickstart.md](./quickstart.md) — env setup, migration, seed, run, and test commands.

## Complexity Tracking

> No constitution violations to justify. The table is intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | —          | —                                   |
