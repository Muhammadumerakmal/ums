# ADR-0002: Split into Separate Frontend (Next.js) and Backend (Express) Apps

> **Scope**: Revisits the deployment/topology half of [ADR-0001](./ADR-0001-backend-architecture-mvc-drizzle.md).
> The MVC layering and Drizzle data layer from ADR-0001 are unchanged; only the "single Next.js
> app hosting the API" decision is replaced.

- **Status:** Accepted (supersedes the single-app topology of ADR-0001)
- **Date:** 2026-07-19
- **Feature:** 001-core-ums (Core University Management System)
- **Context:** ADR-0001 chose to host the API inside the Next.js app as route handlers. The user
  subsequently asked for the frontend and backend to live in separate `frontend/` and `backend/`
  folders as two independent apps — a structure that makes the client/server boundary explicit
  (a primary learning goal of this project).

## Decision

Restructure the repository into two independent applications:

- **`frontend/`** — Next.js (App Router) serving only the React UI. All data access goes through a
  small `lib/api.ts` fetch wrapper that targets the backend origin (`NEXT_PUBLIC_API_URL`) with
  `credentials: "include"` so the HttpOnly session cookie is sent cross-origin.
- **`backend/`** — a standalone **Express** (Node.js) API server. The **MVC layers from ADR-0001
  are reused unchanged**: `models/` (Drizzle), `services/` (business rules), `controllers/`; the
  thin Next.js route handlers are replaced by **Express routers** in `routes/`, and
  `authenticate`/`authorize` become **Express middleware**. Auth stays custom JWT + bcrypt; the
  JWT is delivered in an HttpOnly cookie. **CORS** allows the frontend origin with credentials.
- Each app has its own `package.json`, `tsconfig.json`, and `.env`. The backend owns the Neon
  connection, Drizzle migrations, seed, and Vitest tests.

## Consequences

### Positive

- Explicit client/server separation — the core skill this project practices. Backend is
  independently runnable/testable/deployable and framework-agnostic at the service layer.
- The API is reusable by any client (web, mobile, CLI) — not coupled to Next.js.
- Preserves everything valuable from ADR-0001 (MVC, Drizzle, RBAC, error taxonomy, Zod).

### Negative

- Two apps to install, run, and deploy (two `npm install`, two dev servers/ports).
- Cross-origin auth requires CORS-with-credentials and cookie `SameSite` care; in production the
  cookie needs `Secure` + `SameSite=None` (or same-site hosting / a proxy).
- Minor duplication of TypeScript/tooling config across the two packages.

## Alternatives Considered

- **Keep the single Next.js app (ADR-0001 as-is)** — simplest to run/deploy, but does not give the
  explicit frontend/backend split the user asked for and hides the client/server boundary.
- **npm/pnpm workspaces monorepo with a shared types package** — reduces duplication and could
  share DTOs. Deferred to keep the two apps simple and independent for now; can be adopted later
  without changing the runtime boundary.

## References

- Supersedes (topology only): [ADR-0001](./ADR-0001-backend-architecture-mvc-drizzle.md)
- Implementation Plan: [specs/001-core-ums/plan.md](../../specs/001-core-ums/plan.md)
- API Contract: [specs/001-core-ums/contracts/rest-api.md](../../specs/001-core-ums/contracts/rest-api.md)
- Evaluator Evidence: [history/prompts/001-core-ums/0009-split-frontend-backend.refactor.prompt.md](../prompts/001-core-ums/0009-split-frontend-backend.refactor.prompt.md)
