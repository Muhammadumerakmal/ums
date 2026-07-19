# ADR-0001: Backend Architecture — MVC Layering with Drizzle Data Access

> **Scope**: Documents the backend structural approach for the Core UMS as one decision cluster:
> the MVC layering inside Next.js *and* the data-access/migration technology, which were chosen
> together and form an integrated backend design.

- **Status:** Partially superseded by [ADR-0002](./ADR-0002-frontend-backend-split.md)
  (the "single Next.js app" deployment shape is superseded; the MVC layering and Drizzle data
  layer remain in force — they were carried into the Express backend unchanged).
- **Date:** 2026-07-19
- **Feature:** 001-core-ums (Core University Management System)
- **Context:** The constitution mandates Spec-Driven Development, server-side RBAC, relational
  integrity via migrations, contract-first type safety, and simplicity. The user requires the
  backend to follow **MVC** and to run inside a single **Next.js (App Router) + Node.js** app
  against **Neon serverless Postgres**. Next.js does not prescribe a backend structure, and it
  offers no built-in data/migration layer — both must be chosen deliberately. This is a
  full-stack learning project, so clarity and testability of the structure are first-class goals.

## Decision

Adopt an explicit **MVC layering** implemented in `src/server/**`, plus **Drizzle ORM** as the
typed data-access and migration layer:

- **View**: React pages/components under `app/**` (App Router).
- **HTTP adapter**: `app/api/**` route handlers stay *thin* — parse the request, call a
  controller, return the response. Handlers pin `runtime = "nodejs"`.
- **Controller** (`src/server/controllers`): validates input via Zod DTOs, invokes
  `authenticate`/`authorize`, calls a service, and maps results/errors to HTTP.
- **Service** (`src/server/services`): holds all business rules and ownership/own-data checks —
  framework-agnostic and unit-testable without HTTP.
- **Model** (`src/server/models`): Drizzle schema + typed data access over Neon.
- **Data layer**: **Drizzle ORM** with **`drizzle-kit`** for schema-defined, versioned,
  reversible SQL migrations; queries are typed with no codegen step.

## Consequences

### Positive

- Business rules live in services, isolated from Next.js — directly satisfies Test-First
  (Principle III) and Contract-First/type-safety (Principle II); route handlers become trivial.
- Single deployable app (Next.js on Vercel + Neon) — no second server/process to operate
  (Principle VI, Simplicity).
- Drizzle gives compile-time-checked queries and first-class serverless/Neon support with a small
  footprint and transparent SQL — good for learning and aligned with relational-integrity
  migrations (Principle V).
- Clear seams make RBAC placement obvious (middleware + service ownership checks) — supports
  Principle IV (secure by default).

### Negative

- More files/indirection than putting logic straight in route handlers — a deliberate cost paid
  for testability and separation of concerns.
- "MVC" is a convention here, not an enforced framework — discipline is required to keep route
  handlers thin and logic out of controllers/views.
- Drizzle is younger than Prisma with a smaller ecosystem; some advanced features are more manual.
- Team must learn Drizzle's schema/migration workflow.

## Alternatives Considered

- **Logic directly in Next.js route handlers (no service layer)** — fewest files, fastest to
  write. Rejected: couples business rules to the HTTP framework, hard to unit-test, violates the
  MVC requirement and Principles II/III.
- **Separate standalone Express (or Nest) API alongside Next.js** — a mature, opinionated backend.
  Rejected: introduces a second server/process and deployment, breaking the single-app simplicity
  goal (Principle VI) for no benefit at this scale.
- **Prisma** as the data layer — excellent DX and ecosystem. Rejected (for this project): heavier
  (query-engine binary + codegen), more abstraction/"magic," and historically more serverless
  cold-start friction; less transparent for a learning goal.
- **Raw `pg` / `postgres.js`** — maximum control, minimal deps. Rejected: hand-rolled types and
  migrations add boilerplate and error surface, undercutting type safety and migration discipline.

> Note: MVC layering and the Drizzle choice *could* diverge later (e.g., swap Drizzle for Prisma
> while keeping MVC). They are clustered here because they were adopted together as the initial
> backend design; a future ADR may supersede the data-layer half independently.

## References

- Feature Spec: [specs/001-core-ums/spec.md](../../specs/001-core-ums/spec.md)
- Implementation Plan: [specs/001-core-ums/plan.md](../../specs/001-core-ums/plan.md)
- Research: [specs/001-core-ums/research.md](../../specs/001-core-ums/research.md) (decisions 1 & 2)
- Data Model: [specs/001-core-ums/data-model.md](../../specs/001-core-ums/data-model.md)
- Related ADRs: none (first ADR)
- Evaluator Evidence: [history/prompts/001-core-ums/0005-adr-backend-architecture.plan.prompt.md](../prompts/001-core-ums/0005-adr-backend-architecture.plan.prompt.md)
