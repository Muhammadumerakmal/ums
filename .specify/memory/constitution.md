<!--
SYNC IMPACT REPORT
==================
Version change: TEMPLATE (unversioned) → 1.0.0
Bump rationale: Initial ratification. First concrete constitution replacing the
unfilled template. MAJOR baseline established.

Modified principles: (all newly defined from placeholders)
  [PRINCIPLE_1_NAME] → I. Spec-Driven Development (NON-NEGOTIABLE)
  [PRINCIPLE_2_NAME] → II. Contract-First & Type-Safe Full Stack
  [PRINCIPLE_3_NAME] → III. Test-First Discipline
  [PRINCIPLE_4_NAME] → IV. Secure Role-Based Access by Default
  [PRINCIPLE_5_NAME] → V. Relational Data Integrity
  [PRINCIPLE_6_NAME] → VI. Simplicity & Learning-First (YAGNI)

Added sections:
  - Technology & Architecture Constraints (was [SECTION_2_NAME])
  - Development Workflow & Quality Gates (was [SECTION_3_NAME])

Removed sections: none

Templates requiring updates:
  ✅ .specify/templates/plan-template.md    (reviewed — Constitution Check aligns)
  ✅ .specify/templates/spec-template.md    (reviewed — no mandatory-section conflict)
  ✅ .specify/templates/tasks-template.md   (reviewed — task categories cover testing/security)

Deferred TODOs: none
-->

# University Management System Constitution

## Core Principles

### I. Spec-Driven Development (NON-NEGOTIABLE)

Every feature MUST flow through the SDD pipeline before code is written: `specify → clarify
(when ambiguous) → plan → tasks → implement`. No production code is authored without a
corresponding `spec.md` and `tasks.md` under `specs/<feature>/`. Every user prompt MUST be
captured verbatim as a Prompt History Record (PHR) under `history/prompts/`. Architecturally
significant decisions MUST be surfaced for an ADR before they are baked into the plan.

**Rationale:** This is a learning project whose primary goal is mastering disciplined
full-stack delivery. The process is the product; skipping it defeats the purpose.

### II. Contract-First & Type-Safe Full Stack

API contracts (request/response shapes, error taxonomy, status codes) MUST be defined before
implementation. TypeScript MUST be used end to end (Next.js frontend, API routes, and shared
types). Data shapes crossing the network boundary MUST be validated at runtime (e.g. Zod) and
the same schema MUST drive the static type. No `any` at API boundaries.

**Rationale:** Type safety across the client/server seam is one of the highest-value skills a
full-stack developer practices; a single source of truth for shapes prevents drift.

### III. Test-First Discipline

Each user-facing behavior and business rule MUST have a test. Business rules (enrollment
limits, prerequisite checks, "a teacher grades only their own courses") MUST be covered before
or alongside implementation following Red → Green → Refactor. A change is not "done" until its
tests pass and are committed with it.

**Rationale:** Business logic in a UMS is rule-dense; tests document intent and prevent the
regressions that make relational systems fragile.

### IV. Secure Role-Based Access by Default

The three roles — Admin, Teacher, Student — MUST be enforced server-side on every mutating and
sensitive-read endpoint; client-side checks are UX only and never the security boundary. Deny
by default: an endpoint without an explicit authorization rule is forbidden. Secrets (Neon
connection string, OpenAI API key) MUST live in environment variables and never be committed.

**Rationale:** RBAC is the defining backend concern of this domain and a core hiring signal;
learning to place the trust boundary on the server is non-negotiable.

### V. Relational Data Integrity

Postgres (Neon) is the single source of truth. Relationships MUST be expressed with real
foreign keys and appropriate constraints (unique enrollment per student+course, non-null
ownership). Schema changes MUST go through versioned, reversible migrations — never manual
ad-hoc edits to a live schema. Referential and business invariants belong in the database where
practical, not only in application code.

**Rationale:** Modeling the many-to-many enrollment relationship correctly is the central data
lesson of this project; integrity enforced at the store survives application bugs.

### VI. Simplicity & Learning-First (YAGNI)

Build the smallest slice that teaches the concept. Prefer the core domain (Students, Courses,
Enrollment, Grades) working end to end over breadth of half-finished modules. Add abstraction
only when a second concrete need appears. Every dependency MUST justify its learning or
delivery value.

**Rationale:** Scope sprawl is the number-one killer of learning projects; finishing a coherent
slice beats an unfinished platform.

## Technology & Architecture Constraints

- **Frontend & Backend:** Next.js (App Router) with API routes / route handlers on the Node.js
  runtime. TypeScript everywhere.
- **Database:** Neon serverless Postgres, accessed through a typed query layer or ORM with
  migration support.
- **AI Assistant:** OpenAI Agents SDK powers an in-app assistant. AI features MUST be additive
  and MUST NOT bypass RBAC — the agent operates within the requesting user's permissions and
  never exposes data the user could not otherwise access.
- **Roles:** Admin, Teacher, Student — a fixed enumeration for the initial scope.
- **Configuration:** All secrets and environment-specific values via `.env`; a committed
  `.env.example` documents required keys with no real values.

## Development Workflow & Quality Gates

- Follow the pipeline: `/sp.constitution → /sp.specify → /sp.clarify (optional) → /sp.plan →
  /sp.tasks → /sp.implement`, with `/sp.analyze` and `/sp.checklist` as optional quality gates.
- Every change is the smallest viable diff; unrelated refactors are out of scope for a task.
- Code review (self-review at minimum) MUST verify: tests pass, RBAC enforced server-side, no
  secrets committed, contracts/types consistent, and constitution compliance.
- New code cites the files it touches; new contracts are proposed explicitly before wiring.
- Work happens on a feature branch and is pushed to the remote; the default branch is protected
  from direct commits.

## Governance

This constitution supersedes ad-hoc practice. Amendments MUST be proposed as a documented change
(what/why), versioned per the policy below, and reflected in dependent templates
(`plan-template.md`, `spec-template.md`, `tasks-template.md`) in the same change.

**Versioning policy (semantic):**
- **MAJOR** — backward-incompatible governance changes or principle removal/redefinition.
- **MINOR** — a new principle/section or materially expanded guidance.
- **PATCH** — clarifications and wording fixes with no semantic change.

**Compliance:** Every plan MUST include a Constitution Check; every PR/review MUST verify
compliance. Deviations MUST be justified in writing or the change is rejected. Use `CLAUDE.md`
as the runtime development-guidance companion to this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-07-19 | **Last Amended**: 2026-07-19
