---
id: 0007
title: Core UMS Tasks Breakdown
stage: tasks
date: 2026-07-19
surface: agent
model: claude-opus-4-8
feature: 001-core-ums
branch: 001-core-ums
user: Muhammadumerakmal
command: /sp.tasks
labels: [tasks, mvc, tdd, breakdown, user-stories]
links:
  spec: specs/001-core-ums/spec.md
  ticket: null
  adr: history/adr/ADR-0001-backend-architecture-mvc-drizzle.md
  pr: null
files:
 - specs/001-core-ums/tasks.md
tests:
 - none
---

## Prompt

Generate the dependency-ordered tasks.md for 001-core-ums from plan.md, data-model.md, contracts/rest-api.md, and research.md. Organize by user story priority (P1 auth/RBAC + admin CRUD, P2 enrollment + grading, P3 view grades). Include setup (Next.js scaffold, Drizzle, Neon, env), MVC layers (models, services, controllers, route handlers, middleware, validation), migrations, seed, and Vitest tests for each business rule (unique active enrollment, own-course grading, enrolled-only grading, own-data reads, soft-delete). Mark parallelizable tasks.

## Response snapshot

Generated `specs/001-core-ums/tasks.md` — 60 tasks (T001–T060) in checklist format, organized by
phase and user story:
- Phase 1 Setup (T001–T007): Next.js scaffold, deps, env, drizzle/vitest config, db client.
- Phase 2 Foundational (T008–T018): full Drizzle schema + partial unique index, migration,
  password/jwt/errors/http libs, authenticate/authorize middleware, model helpers, seed + test harness.
- Phase 3 US1 (T019–T027): auth login/logout/me, RBAC dashboards, tests (FR-001/003/004).
- Phase 4 US2 (T028–T036): admin student/course CRUD, teacher assignment, soft-delete, tests.
- Phase 5 US3 (T037–T043): enrollment enroll/drop, unique-active-enrollment + own-data tests.
- Phase 6 US4 (T044–T051): roster + grade upsert, own-course + enrolled-only tests.
- Phase 7 US5 (T052–T055): student grades view + own-data test.
- Phase 8 Polish (T056–T060): error wrapper, lib unit tests, lint/typecheck, quickstart, README.
Includes dependencies, parallel-execution examples, MVP strategy (Setup+Foundational+US1), and a
summary mapping the 5 business-rule tests to SC-006.

## Outcome

- ✅ Impact: Executable, dependency-ordered backlog ready for /sp.implement; each story independently testable.
- 🧪 Tests: test tasks included per business rule (SC-006 satisfied by design).
- 📁 Files: tasks.md, this PHR
- 🔁 Next prompts: /sp.implement (build MVP US1 first, then US2→US5)
- 🧠 Reflection: Tasks reference exact file paths from the MVC plan structure for direct execution.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): PASS (all tasks have checkbox+ID+path; story labels on story phases only; [P] marks parallel work)
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): /sp.implement starting Phase 1
