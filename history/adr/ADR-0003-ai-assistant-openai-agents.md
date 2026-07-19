# ADR-0003: AI Student Assistant via OpenAI Agents SDK (RBAC-scoped in-process tools)

- **Status:** Accepted
- **Date:** 2026-07-19
- **Feature:** 002-ai-assistant
- **Context:** The product vision includes an AI assistant (constitution: AI must be additive and
  never bypass RBAC). We add a student-facing conversational assistant to the existing backend
  without weakening the security boundary.

## Decision

- **SDK**: Use the **OpenAI Agents SDK for TypeScript** (`@openai/agents`) to define an agent with
  function tools and run turns server-side.
- **Tool topology**: Agent tools call the **existing MVC services in-process** (not over HTTP).
- **RBAC scoping**: Each run receives a server-derived `StudentContext { studentId }` taken from
  the authenticated session. Tools read the id from the run context — **never** from model input —
  so the agent can only ever touch the requesting student's own data. The endpoint is
  `authorize("student")`, deny-by-default like every other route.
- **Surface**: `POST /api/assistant` (student-only); a small `AssistantChat` React widget on the
  student dashboard.
- **Config**: `OPENAI_API_KEY` + `OPENAI_MODEL` (default `gpt-4o-mini`) from the environment; a
  missing key returns a clear message, not a crash.
- **Dependency change**: The Agents SDK requires **zod v4**, so the backend was upgraded from zod
  v3 → v4. Our schemas (`.email()/.uuid()/.enum()/.refine()`) remain compatible; typecheck and the
  unit suite stay green.

## Consequences

### Positive
- The assistant inherits all existing business rules and RBAC by reusing services — no parallel
  data path to secure, no data leakage across students.
- In-process tools are type-safe and fast (no HTTP/auth round-trip).
- Additive: the core app is unchanged and works without the AI feature.

### Negative
- Requires an `OPENAI_API_KEY` and incurs per-call cost/latency; assistant is unusable without it.
- Couples the agent to the backend process (not independently deployable) — acceptable for now.
- Forced a repo-wide zod major upgrade (v3 → v4).
- The model can still phrase things imperfectly; tools constrain *data*, not tone.

## Alternatives Considered
- **Call the REST API over HTTP from tools** — more decoupled but adds auth/HTTP plumbing and
  latency; rejected for the in-process simplicity of a single backend.
- **All-roles assistant** — more capable but larger surface; deferred (student-only first).
- **Direct Chat Completions + hand-rolled tool loop** — more code to manage the tool-calling loop;
  the Agents SDK handles orchestration, so rejected.
- **Keep zod v3 + `--legacy-peer-deps`** — risks runtime mismatch since the SDK builds tool schemas
  against zod v4; rejected in favor of a clean upgrade.

## References
- Feature Spec: [specs/002-ai-assistant/spec.md](../../specs/002-ai-assistant/spec.md)
- Related: [ADR-0001](./ADR-0001-backend-architecture-mvc-drizzle.md),
  [ADR-0002](./ADR-0002-frontend-backend-split.md)
- Evaluator Evidence: [history/prompts/002-ai-assistant/0011-ai-student-assistant.green.prompt.md](../prompts/002-ai-assistant/0011-ai-student-assistant.green.prompt.md)
