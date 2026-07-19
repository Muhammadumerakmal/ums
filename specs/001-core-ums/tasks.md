# Tasks: Core University Management System

**Feature**: `001-core-ums` | **Date**: 2026-07-19
**Inputs**: [plan.md](./plan.md) · [spec.md](./spec.md) · [data-model.md](./data-model.md) · [contracts/rest-api.md](./contracts/rest-api.md) · [research.md](./research.md)

**Tests**: Included — the spec (SC-006) mandates automated tests for every business rule.
**Format**: `- [ ] [TaskID] [P?] [Story?] Description with file path`
`[P]` = parallelizable (different files, no incomplete dependencies).

---

## Phase 1: Setup (project initialization)

- [X] T001 Initialize Next.js 15 (App Router, TypeScript) app at repo root with `app/` and `src/` (create `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`)
- [X] T002 Add dependencies in `package.json`: `drizzle-orm`, `@neondatabase/serverless`, `bcryptjs`, `jsonwebtoken`, `zod`; devDeps: `drizzle-kit`, `vitest`, `@types/bcryptjs`, `@types/jsonwebtoken`, `tsx`, `eslint`
- [X] T003 [P] Create `.env.example` (DATABASE_URL, DATABASE_URL_TEST, JWT_SECRET, BCRYPT_ROUNDS, JWT_EXPIRES_IN) and add `.env.local` to `.gitignore`
- [X] T004 [P] Add npm scripts to `package.json` (dev, build, start, db:generate, db:migrate, db:seed, test, test:unit, test:watch, lint, typecheck)
- [X] T005 [P] Configure `drizzle.config.ts` (schema path `src/server/models/schema.ts`, out `drizzle/`, dialect postgresql, DATABASE_URL)
- [X] T006 [P] Configure `vitest.config.ts` (node environment, `tests/` include, setup file `tests/setup/global.ts`)
- [X] T007 [P] Create Neon DB client in `src/server/lib/db.ts` (Neon serverless driver + Drizzle instance)

**Checkpoint**: App scaffolds, `npm run typecheck` passes, DB client compiles.

---

## Phase 2: Foundational (blocking prerequisites — MUST finish before any user story)

- [X] T008 Define full Drizzle schema in `src/server/models/schema.ts`: enums (role, grade_letter), tables users, students, teachers, courses, enrollments, grades with FKs `ON DELETE RESTRICT`, soft-delete columns, and partial unique index `uq_active_enrollment (student_id, course_id) WHERE dropped_at IS NULL`
- [ ] T009 Generate + apply initial migration (`npm run db:generate` then `db:migrate`) producing `drizzle/0000_*.sql`
- [X] T010 [P] Password helpers in `src/server/lib/password.ts` (`hash`, `compare` via bcryptjs, cost from BCRYPT_ROUNDS)
- [X] T011 [P] JWT helpers in `src/server/lib/jwt.ts` (`sign({sub,role})`, `verify` → payload; HS256; JWT_EXPIRES_IN)
- [X] T012 [P] Error taxonomy in `src/server/lib/errors.ts` (`AppError` + codes VALIDATION_ERROR, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, CONFLICT, UNPROCESSABLE_RULE, INTERNAL_ERROR → HTTP status map)
- [X] T013 [P] HTTP helpers in `src/server/lib/http.ts` (`json(data,status)`, `error(AppError)` → NextResponse envelopes)
- [X] T014 `authenticate` middleware in `src/server/middleware/authenticate.ts` (read HttpOnly cookie → verify JWT → current user {id, role}; throw UNAUTHENTICATED)
- [X] T015 `authorize` middleware in `src/server/middleware/authorize.ts` (deny-by-default role gate + optional ownership predicate; throw FORBIDDEN)
- [X] T016 [P] Model data-access helpers in `src/server/models/{user,student,teacher,course,enrollment,grade}.model.ts` (typed CRUD wrappers over Drizzle, filtering soft-deleted rows)
- [X] T017 [P] Test DB bootstrap in `tests/setup/global.ts` + `tests/setup/seed.ts` (migrate DATABASE_URL_TEST, truncate-between-tests helper, fixtures: 1 admin, 1 teacher, 2 students, 1 course)
- [X] T018 [P] Seed script in `src/server/models/seed.ts` wired to `npm run db:seed` (admin/teacher/2 students + 1 course + 1 enrollment; hashed passwords)

**Checkpoint**: Schema migrated; auth/authz + lib primitives available; seed + test harness run.

---

## Phase 3: User Story 1 — Secure sign-in with role-based access (P1) 🎯 MVP

**Goal**: A user of any role signs in and reaches their correct dashboard; unauthenticated and
cross-role access is denied server-side.
**Independent test**: Sign in as each role → correct dashboard; signed-out → redirected; student→admin route → 403.

- [X] T019 [P] [US1] Auth Zod DTOs in `src/server/validation/auth.schema.ts` (loginSchema: email, password)
- [X] T020 [US1] `AuthService` in `src/server/services/auth.service.ts` (verify credentials, resolve profileId, issue token payload)
- [X] T021 [US1] `AuthController` in `src/server/controllers/auth.controller.ts` (login/logout/me; set/clear HttpOnly cookie)
- [X] T022 [P] [US1] Route handler `app/api/auth/login/route.ts` (POST, `runtime="nodejs"`)
- [X] T023 [P] [US1] Route handler `app/api/auth/logout/route.ts` (POST) and `app/api/auth/me/route.ts` (GET)
- [X] T024 [US1] Login page `app/(auth)/login/page.tsx` (form → /api/auth/login)
- [X] T025 [US1] Role-routed dashboards `app/(dashboard)/{admin,teacher,student}/page.tsx` + shared layout guard reading `/api/auth/me`
- [X] T026 [P] [US1] Test: sign-in success per role + invalid credentials rejected in `tests/integration/auth.login.test.ts` (FR-001)
- [X] T027 [P] [US1] Test: deny-by-default RBAC — unauthenticated 401 + student→admin route 403 in `tests/integration/rbac.test.ts` (FR-003/004)

**Checkpoint**: US1 independently demoable — auth + RBAC working end to end.

---

## Phase 4: User Story 2 — Administrator manages students and courses (P1)

**Goal**: Admin CRUDs students and courses and assigns an owning teacher.
**Independent test**: As admin, create/edit/soft-delete a student and a course, assign a teacher; invalid teacher rejected.

- [X] T028 [P] [US2] Zod DTOs in `src/server/validation/student.schema.ts` and `course.schema.ts` (create/update shapes)
- [X] T029 [US2] `StudentService` in `src/server/services/student.service.ts` (create user+profile, list active, get, update, soft-delete; unique email/studentNumber → CONFLICT)
- [X] T030 [US2] `CourseService` in `src/server/services/course.service.ts` (create/list/get/update/soft-delete; reject non-existent teacherId; unique code → CONFLICT)
- [X] T031 [US2] `StudentController` + `CourseController` in `src/server/controllers/` (admin-only via authorize)
- [X] T032 [P] [US2] Route handlers `app/api/students/route.ts` + `app/api/students/[id]/route.ts`
- [X] T033 [P] [US2] Route handlers `app/api/courses/route.ts` + `app/api/courses/[id]/route.ts`
- [X] T034 [US2] Admin UI screens under `app/(dashboard)/admin/` (students list/create/edit; courses list/create/edit with teacher select)
- [X] T035 [P] [US2] Test: admin CRUD + validation + duplicate email/code CONFLICT in `tests/integration/admin.students-courses.test.ts` (FR-006/007/009)
- [X] T036 [P] [US2] Test: assigning non-existent teacher rejected + soft-delete excludes from listing in `tests/integration/course.softdelete.test.ts` (FR-008/022)

**Checkpoint**: US1+US2 = admin can build the master data other stories depend on.

---

## Phase 5: User Story 3 — Student enrolls in and drops courses (P2)

**Goal**: Student enrolls, sees own enrollments, cannot double-enroll, and drops.
**Independent test**: As student, enroll → appears; re-enroll same course → rejected; drop → removed.

- [X] T037 [P] [US3] Zod DTO in `src/server/validation/enrollment.schema.ts` (enroll: courseId)
- [X] T038 [US3] `EnrollmentService` in `src/server/services/enrollment.service.ts` (enroll self, list own active, drop own; block inactive course; duplicate active → CONFLICT; re-enroll after drop allowed)
- [X] T039 [US3] `EnrollmentController` in `src/server/controllers/enrollment.controller.ts` (student-self + admin; ownership on drop)
- [X] T040 [P] [US3] Route handlers `app/api/enrollments/route.ts` + `app/api/enrollments/[id]/route.ts`
- [X] T041 [US3] Student UI under `app/(dashboard)/student/` (browse active courses, enroll, my courses, drop)
- [X] T042 [P] [US3] Test: unique active enrollment — duplicate rejected, re-enroll after drop allowed in `tests/integration/enrollment.unique.test.ts` (FR-012)
- [X] T043 [P] [US3] Test: student sees only own enrollments; cannot drop another's in `tests/integration/enrollment.owndata.test.ts` (FR-014)

**Checkpoint**: Students can self-manage enrollment with the uniqueness invariant enforced.

---

## Phase 6: User Story 4 — Teacher grades students in their own courses (P2)

**Goal**: Teacher views own-course roster and records/updates letter grades; cannot touch others' courses.
**Independent test**: As owning teacher, view roster, record grade B, update it; non-owner → 403; grading non-enrolled → 422.

- [X] T044 [P] [US4] Zod DTO in `src/server/validation/grade.schema.ts` (grade: enrollmentId, letter ∈ {A,B,C,D,F})
- [X] T045 [US4] `CourseService.getRoster` (students actively enrolled + current grade; owning-teacher/admin only)
- [X] T046 [US4] `GradeService` in `src/server/services/grade.service.ts` (upsert grade; enforce owning-teacher; require active enrollment; letter domain)
- [X] T047 [US4] `GradeController` + roster action in `src/server/controllers/grade.controller.ts` (owning-teacher via authorize ownership)
- [X] T048 [P] [US4] Route handlers `app/api/courses/[id]/roster/route.ts` + `app/api/grades/route.ts` (POST)
- [X] T049 [US4] Teacher UI under `app/(dashboard)/teacher/` (my courses → roster → set/update grade)
- [X] T050 [P] [US4] Test: own-course-only grading — non-owner teacher 403 in `tests/integration/grade.ownership.test.ts` (FR-017)
- [X] T051 [P] [US4] Test: enrolled-only grading (non-enrolled → 422) + letter-domain validation + update-in-place in `tests/integration/grade.rules.test.ts` (FR-016/018)

**Checkpoint**: Grading works with ownership + enrollment invariants enforced.

---

## Phase 7: User Story 5 — Student views their grades (P3)

**Goal**: Student sees own grades across enrolled courses; ungraded courses show null, not error.
**Independent test**: As student with a grade, see it against the right course; enrolled-but-ungraded shows not-yet-graded.

- [X] T052 [US5] `GradeService.listForStudent` (own grades across enrolled courses; ungraded → null)
- [X] T053 [P] [US5] Route handler `app/api/grades/route.ts` (GET, student-self scope)
- [X] T054 [US5] Student grades view in `app/(dashboard)/student/grades/page.tsx`
- [X] T055 [P] [US5] Test: student sees only own grades; ungraded course returns null not error in `tests/integration/grade.studentview.test.ts` (FR-019)

**Checkpoint**: Full academic loop demoable end to end.

---

## Phase 8: Polish & Cross-Cutting

- [X] T056 [P] Centralized error handling wrapper for route handlers (map thrown AppError → taxonomy response) verified across all routes in `src/server/lib/http.ts`
- [X] T057 [P] Unit tests for lib primitives (password hash/compare, jwt sign/verify, errors→status) in `tests/unit/lib.test.ts`
- [X] T058 [P] `npm run lint` + `npm run typecheck` clean (no `any` at boundaries)
- [ ] T059 [P] Validate quickstart smoke checks against running app; update `quickstart.md` if commands drift
- [X] T060 [P] Add `README.md` (setup, scripts, architecture overview linking ADR-0001)

---

## Dependencies & Execution Order

- **Setup (P1)** → **Foundational (P2)** block everything.
- **US1 (P3 phase)** should be first — it is the MVP and provides auth/RBAC used by all others.
- **US2** depends on Foundational (master data). **US3** depends on US2 (courses/students exist).
  **US4** depends on US3 (enrollments to grade). **US5** depends on US4 (grades to view).
- Within a story, `[P]` tasks (separate files) can run together; services precede the controllers/
  routes that call them; DTOs `[P]` can be written up front.

## Parallel execution examples

- **Setup**: T003, T004, T005, T006, T007 in parallel after T002.
- **Foundational**: T010, T011, T012, T013, T016, T017, T018 in parallel after T009 (T014/T015 after T011/T012).
- **US1**: T022 & T023 parallel after T021; T026 & T027 parallel after routes exist.
- **Tests** within each story (e.g., T035/T036, T042/T043, T050/T051) run in parallel.

## Implementation strategy

- **MVP = Phase 1 + Phase 2 + US1** (auth + RBAC). Ship/demo, then layer US2 → US3 → US4 → US5.
- Each user-story phase is an independently testable increment aligned to its spec acceptance
  scenarios and the mandated business-rule tests (SC-006).

## Summary

- **Total tasks**: 60 (T001–T060)
- **Setup**: 7 · **Foundational**: 11 · **US1**: 9 · **US2**: 9 · **US3**: 7 · **US4**: 8 · **US5**: 4 · **Polish**: 5
- **Business-rule tests**: unique active enrollment (T042), own-course grading (T050),
  enrolled-only grading (T051), own-data reads (T043/T055), soft-delete (T036) — covers SC-006.
