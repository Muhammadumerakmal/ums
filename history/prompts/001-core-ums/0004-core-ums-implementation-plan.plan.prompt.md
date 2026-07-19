---
id: 0004
title: Core UMS Implementation Plan
stage: plan
date: 2026-07-19
surface: agent
model: claude-opus-4-8
feature: 001-core-ums
branch: 001-core-ums
user: Muhammadumerakmal
command: /sp.plan
labels: [plan, mvc, nextjs, neon, drizzle, rbac, jwt]
links:
  spec: specs/001-core-ums/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-core-ums/plan.md
 - specs/001-core-ums/research.md
 - specs/001-core-ums/data-model.md
 - specs/001-core-ums/contracts/rest-api.md
 - specs/001-core-ums/quickstart.md
 - CLAUDE.md
tests:
 - none
---

## Prompt

Design the implementation plan for the Core UMS. Backend MUST follow MVC architecture (Models, Controllers, Services, Routes) inside the Next.js App Router on the Node.js runtime, backed by Neon serverless Postgres. Auth is custom JWT + bcrypt with server-side RBAC middleware. People model: users (auth) with 1:1 student/teacher profiles. Grades are letters A-F. Soft-delete for students/courses. Cover: folder structure, Postgres schema with FKs/unique constraints/soft-delete columns, API contracts with error taxonomy, RBAC enforcement, and testing strategy. Surface the MVC-inside-Next.js architectural decision for an ADR.

## Response snapshot

Produced the full Phase 0 + Phase 1 plan for `001-core-ums`:

- **plan.md** — Summary, Technical Context (TS/Node 20, Next.js 15 App Router, Drizzle ORM,
  Neon, bcryptjs, jsonwebtoken, Zod, Vitest), Constitution Check (all 6 principles PASS),
  MVC folder structure (View = app/, thin app/api route handlers → controllers → services →
  Drizzle models; middleware for authenticate/authorize; lib for db/jwt/password/errors).
- **research.md** — 8 decisions with rationale/alternatives: MVC-in-Next.js, Drizzle ORM,
  JWT in HttpOnly cookie + bcrypt cost 10, deny-by-default RBAC (role + ownership), Zod DTOs,
  soft-delete via deleted_at + partial unique index, Vitest + ephemeral DB, Node runtime.
- **data-model.md** — 6 tables (users, students, teachers, courses, enrollments, grades),
  enums (role, grade_letter), FKs ON DELETE RESTRICT, partial unique index for one active
  enrollment per student+course, soft-delete columns, invariants→FR traceability.
- **contracts/rest-api.md** — ~15 endpoints with method/role/auth/shapes, shared error
  taxonomy (VALIDATION/UNAUTHENTICATED/FORBIDDEN/NOT_FOUND/CONFLICT/UNPROCESSABLE_RULE/INTERNAL),
  endpoint→requirement traceability.
- **quickstart.md** — env, migrate, seed, run, test, smoke-check mapped to acceptance.
- Ran update-agent-context.ps1 → CLAUDE.md updated with stack.

Recovered a git hiccup mid-command: automation had auto-committed the feature work as "start"
and renamed branch 001-core-ums → main; recreated the 001-core-ums branch carrying the
uncommitted clarify edits. setup-plan.ps1 had written to specs/main (stray dir removed).

## Outcome

- ✅ Impact: Complete design ready for task breakdown; architecture, schema, contracts, and tests defined.
- 🧪 Tests: none yet; strategy defined (Vitest unit+integration, one test per business rule, SC-006).
- 📁 Files: plan.md, research.md, data-model.md, contracts/rest-api.md, quickstart.md, CLAUDE.md, this PHR
- 🔁 Next prompts: /sp.adr (MVC + Drizzle decision), then /sp.checklist (optional), then /sp.tasks
- 🧠 Reflection: Drizzle chosen unilaterally with rationale — flagged for user veto via ADR.

## Evaluation notes (flywheel)

- Failure modes observed: git automation renamed feature branch to main mid-flow; setup-plan resolved wrong branch → wrote specs/main. Both recovered without data loss.
- Graders run and results (PASS/FAIL): PASS (Constitution Check all green; no NEEDS CLARIFICATION left)
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): create ADR to ratify MVC + Drizzle, then /sp.tasks
