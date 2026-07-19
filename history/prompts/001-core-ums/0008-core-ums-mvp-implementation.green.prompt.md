---
id: 0008
title: Core UMS MVP Implementation
stage: green
date: 2026-07-19
surface: agent
model: claude-opus-4-8
feature: 001-core-ums
branch: 001-core-ums
user: Muhammadumerakmal
command: /sp.implement
labels: [implement, mvc, nextjs, drizzle, neon, jwt, rbac, mvp]
links:
  spec: specs/001-core-ums/spec.md
  ticket: null
  adr: history/adr/ADR-0001-backend-architecture-mvc-drizzle.md
  pr: null
files:
 - package.json / tsconfig.json / next.config.ts / drizzle.config.ts / vitest.config.ts / .env.example / .gitignore
 - src/server/lib/{db,password,jwt,errors,http}.ts
 - src/server/models/{schema,user,student,teacher,course,enrollment,grade}.model.ts + seed.ts
 - src/server/middleware/{authenticate,authorize}.ts
 - src/server/validation/{auth,student,course,enrollment,grade}.schema.ts
 - src/server/services/{auth,student,course,enrollment,grade}.service.ts
 - src/server/controllers/{auth,student,course,enrollment,grade,teacher}.controller.ts
 - app/api/** (11 route handlers) + app/(auth)/login + app/(dashboard)/{admin,teacher,student}
 - drizzle/0000_smiling_nemesis.sql
 - tests/setup/global.ts, tests/unit/lib.test.ts, tests/integration/enrollment.unique.test.ts
 - README.md
tests:
 - vitest unit (tests/unit/lib.test.ts) — 7 passed
---

## Prompt

Implement 001-core-ums per tasks.md, MVP-first: Phase 1 Setup + Phase 2 Foundational + Phase 3 US1 (auth + RBAC) as the first shippable increment, then continue US2→US5 as far as the environment allows. Build the MVC structure (models, services, controllers, route handlers, middleware, validation) with Drizzle + Neon, custom JWT+bcrypt auth, and Vitest business-rule tests.

## Response snapshot

Implemented the full Core UMS across all 5 user stories (not just the MVP). Built the MVC backend
under `src/server/` (lib → models → services → controllers) with thin Next.js route handlers and
React dashboards as the View. 6 Drizzle tables with FKs (ON DELETE RESTRICT), soft-delete columns,
and the partial unique index `uq_active_enrollment ... WHERE dropped_at IS NULL` (FR-012). Custom
JWT (HttpOnly cookie) + bcrypt auth; deny-by-default `authorize` role gate + service-layer
ownership/own-data checks. Zod DTOs validate every request. 11 API routes + login + 3 role
dashboards. Added a small admin-only GET /api/teachers (beyond original contract) so the admin
course form can pick an owner. Generated migration SQL, seed script, README.

Verification: `npm run typecheck` clean; `npm run build` succeeded (all 16 routes compiled);
`npm run test:unit` 7/7 passed (password, jwt, error taxonomy, grade-letter validation);
`drizzle-kit generate` produced 0000_smiling_nemesis.sql with the partial unique index confirmed.

Marked 48/60 tasks done. Remaining 12 require a live Neon DB (T009 migrate, DB-backed integration
tests T026/027/035/036/042/043/050/051/055, full test-DB harness T017, quickstart validation T059)
— these are written/scaffolded (one guarded integration test template included) and run once the
user provides DATABASE_URL/DATABASE_URL_TEST.

## Outcome

- ✅ Impact: Working, type-safe, buildable full-stack UMS with all business rules enforced in code + DB.
- 🧪 Tests: unit 7/7 pass; integration tests scaffolded (skip without DATABASE_URL_TEST).
- 📁 Files: ~45 source files + config + migration + tests + README (see list)
- 🔁 Next prompts: add Neon creds → db:migrate + db:seed + run integration tests; then commit/PR; then AI-assistant feature spec.
- 🧠 Reflection: Kept route handlers thin per ADR-0001; business logic isolated in services. DB-dependent steps deferred, not faked.

## Evaluation notes (flywheel)

- Failure modes observed: NODE_ENV read-only typecheck error (fixed via mutable cast); db.ts throwing at import would have broken build → made client lazy (Proxy).
- Graders run and results (PASS/FAIL): PASS — typecheck clean, production build success, unit suite green, migration includes FR-012 index.
- Prompt variant (if applicable): built full feature (US1–US5) rather than stopping at MVP, since env allowed.
- Next experiment (smallest change to try): provision Neon test branch and execute the integration suite to close T009/T017/T026+.
