---
id: 0005
title: ADR Backend Architecture
stage: plan
date: 2026-07-19
surface: agent
model: claude-opus-4-8
feature: 001-core-ums
branch: 001-core-ums
user: Muhammadumerakmal
command: /sp.adr
labels: [adr, architecture, mvc, drizzle, backend]
links:
  spec: specs/001-core-ums/spec.md
  ticket: null
  adr: history/adr/ADR-0001-backend-architecture-mvc-drizzle.md
  pr: null
files:
 - history/adr/ADR-0001-backend-architecture-mvc-drizzle.md
 - specs/001-core-ums/plan.md
tests:
 - none
---

## Prompt

MVC backend and Drizzle data layer. Record two related architecturally significant decisions from the 001-core-ums plan: (1) implementing explicit MVC layering (Models/Services/Controllers with thin Next.js route handlers as HTTP adapter and React as View) inside the Next.js App Router rather than logic-in-route-handlers or a separate Express API; (2) choosing Drizzle ORM (with drizzle-kit migrations) over Prisma or raw pg for typed data access and versioned migrations against Neon Postgres.

## Response snapshot

Created **ADR-0001: Backend Architecture — MVC Layering with Drizzle Data Access** (Status:
Accepted). Clustered the two related decisions into one ADR (decided together, form the backend
design) rather than two atomic ADRs, per clustering guidance.

Decision documents: View = React app/**; thin app/api route handlers (Node runtime); Controllers
(Zod + authn/authz + HTTP mapping); Services (business rules, ownership checks, framework-
agnostic, unit-testable); Models = Drizzle; drizzle-kit for versioned/reversible migrations.
Positive/negative consequences and four rejected alternatives (logic-in-handlers, separate
Express/Nest, Prisma, raw pg) with rationale. Backlinked from plan.md Phase 0.

No ADR script present → wrote agent-natively to history/adr/. No existing ADRs; no conflicts.

## Outcome

- ✅ Impact: Backend architecture + data layer ratified and reviewable; plan links to ADR-0001.
- 🧪 Tests: none (decision record)
- 📁 Files: ADR-0001, plan.md (backlink), this PHR
- 🔁 Next prompts: /sp.checklist (optional) then /sp.tasks
- 🧠 Reflection: Clustered MVC + Drizzle; noted they may diverge later (data-layer could be superseded independently).

## Evaluation notes (flywheel)

- Failure modes observed: none (avoided over-granular ADRs by clustering; alternatives + tradeoffs included)
- Graders run and results (PASS/FAIL): PASS — clustered decision, ≥1 alternative each with rationale, pros+cons, concise, references linked
- Prompt variant (if applicable): single clustered ADR vs two atomic — chose clustered
- Next experiment (smallest change to try): proceed to /sp.tasks (or /sp.checklist first)
