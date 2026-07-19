# Phase 0 Research: Core University Management System

**Feature**: `001-core-ums` | **Date**: 2026-07-19

This document records the technical decisions that resolve open choices before design. Each
entry: Decision · Rationale · Alternatives considered.

## 1. Backend architecture — MVC inside Next.js App Router

- **Decision**: Implement an explicit MVC layering in `src/server/**` (Models = Drizzle,
  Services = business rules, Controllers = request/response orchestration), with `app/api/**`
  route handlers as a thin HTTP adapter and React pages/components as the View.
- **Rationale**: The user requires MVC. Next.js does not impose a backend structure, so we
  supply one. Keeping business logic in framework-agnostic services makes rules unit-testable
  without HTTP and keeps route handlers trivial. Teaches clean separation of concerns.
- **Alternatives considered**:
  - *Logic directly in route handlers* — fastest to write, but couples business rules to the
    HTTP layer and is hard to test; rejected (violates the MVC requirement and Principle II/III).
  - *Separate standalone Express API* — a second server/process; more infra, breaks the "single
    Next.js app" simplicity goal; rejected (Principle VI).
- **ADR**: Yes — this is architecturally significant and cross-cutting. Recommend `/sp.adr`.

## 2. Data access & migrations — Drizzle ORM

- **Decision**: Use **Drizzle ORM** with `drizzle-kit` for schema definition, typed queries, and
  versioned SQL migrations, over the Neon serverless driver.
- **Rationale**: Type-safe rows with no codegen step, SQL-transparent (you see the queries you
  write — good for learning), first-class Neon/serverless support, and built-in migration
  generation satisfying Principle V (versioned, reversible migrations). Lightweight footprint.
- **Alternatives considered**:
  - *Prisma* — excellent DX but heavier (query engine binary, codegen), more magic, historically
    more friction on serverless cold starts; reasonable but rejected for weight/opacity.
  - *Raw `pg` / `postgres.js`* — maximum control, but hand-rolled types and migrations add
    boilerplate and error surface; rejected for a learning slice.
- **ADR**: Bundle into the same ADR as the MVC decision (data-layer choice).

## 3. Authentication — custom JWT + bcrypt (from clarification)

- **Decision**: Hash passwords with **bcryptjs** (cost factor 10). On sign-in, issue a signed
  **JWT** (HS256) containing `{ sub: userId, role }`, ~1h expiry, stored in an **HttpOnly,
  Secure, SameSite=Lax cookie**. Verify on every protected request in `authenticate` middleware.
- **Rationale**: Matches the clarified choice. HttpOnly cookie avoids exposing the token to JS
  (mitigates XSS token theft) and works cleanly with server components / route handlers. Stateless
  fits serverless (no session store). bcrypt cost 10 balances security and latency at this scale.
- **Alternatives considered**:
  - *Auth.js (NextAuth)* — less code to get wrong, but the user chose custom for learning.
  - *Token in `localStorage` + Authorization header* — simpler client wiring but XSS-exposed;
    rejected in favor of HttpOnly cookie.
  - *Refresh-token rotation* — deferred; single short-lived token is sufficient for the slice.
- **Secret handling**: `JWT_SECRET` from env; never committed; documented in `.env.example`.

## 4. Authorization — server-side, deny-by-default RBAC

- **Decision**: An `authorize(roles[], ownershipCheck?)` middleware runs after `authenticate`.
  A route with no explicit rule is forbidden. Role gates handle coarse access
  (e.g., only Admin may create courses); **ownership checks in the service layer** handle
  fine-grained rules (teacher owns the course; student reads only their own rows).
- **Rationale**: Principle IV — the server is the trust boundary; UI hiding is UX only. Two-tier
  (role + ownership) covers both "who can call this" and "on whose data".
- **Alternatives considered**: Attribute/policy engine (e.g., CASL) — overkill for three roles;
  rejected (Principle VI).

## 5. Validation & shape source of truth — Zod DTOs

- **Decision**: Define request DTOs as **Zod** schemas in `src/server/validation/**`; controllers
  parse input through them and infer TypeScript types from the same schema.
- **Rationale**: Principle II — one source of truth for a shape drives both runtime validation and
  static types, preventing client/server drift; rejects malformed input at the boundary.
- **Alternatives considered**: Manual `if` checks (error-prone), class-validator (decorator/DI
  weight); rejected.

## 6. Soft delete — `deleted_at` + partial unique index

- **Decision**: `students` and `courses` carry a nullable `deleted_at timestamptz`. "Delete"
  sets `deleted_at = now()`. Active listings filter `deleted_at IS NULL`. The enrollment
  uniqueness uses a **partial unique index** `UNIQUE(student_id, course_id) WHERE dropped_at IS
  NULL` so a student may re-enroll after dropping but never hold two active enrollments. A hard
  delete that would orphan enrollments/grades is not exposed.
- **Rationale**: Preserves academic/grade history (FR-022) while keeping uniqueness correct
  across the enroll→drop→re-enroll lifecycle.
- **Alternatives considered**: Hard delete + cascade (destroys history — rejected per
  clarification); status enum column instead of timestamp (loses "when"); rejected.

## 7. Testing strategy — Vitest + ephemeral test database

- **Decision**: **Vitest** for unit tests (services/lib with mocked models) and integration tests
  (route handlers against a real Postgres — a disposable Neon branch or local container). Each
  business rule from the spec gets a dedicated test. Seed fixtures create one user per role.
- **Rationale**: Principle III + SC-006. Unit tests pin business logic fast; integration tests
  prove RBAC and DB constraints actually hold end-to-end.
- **Alternatives considered**: Jest (heavier config with ESM/TS), testing only via unit mocks
  (misses real constraint enforcement); rejected.

## 8. Runtime & connection handling

- **Decision**: Force route handlers to the **Node.js runtime** (`export const runtime =
  "nodejs"`) because `bcryptjs`/`jsonwebtoken` need Node APIs. Use Neon's pooled serverless
  driver for short-lived connections.
- **Rationale**: Edge runtime lacks the crypto/Node APIs these libraries expect; Node runtime is
  required and matches the constitution's stack constraint.

## Resolved unknowns

All `NEEDS CLARIFICATION` items are resolved: ORM (Drizzle), token transport (HttpOnly cookie),
bcrypt cost (10), soft-delete mechanism (`deleted_at` + partial unique index), test framework
(Vitest + ephemeral DB), runtime (Node). Ready for Phase 1 design.
