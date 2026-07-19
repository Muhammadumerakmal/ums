# Requirements Quality Checklist: Core UMS (Pre-Implementation Gate)

**Purpose**: Unit-test the *requirements* (spec + plan + data-model + contracts) for completeness,
clarity, consistency, measurability, and coverage before `/sp.tasks` and `/sp.implement`.
**Created**: 2026-07-19
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md) · [data-model.md](../data-model.md) · [contracts/rest-api.md](../contracts/rest-api.md)
**Audience/Timing**: Author + reviewer, pre-implementation
**Focus**: requirement completeness, RBAC/security, relational integrity, API/error taxonomy, MVC separation, business-rule test coverage

## Requirement Completeness

- [ ] CHK001 - Are provisioning requirements defined for how a User account and its Student/Teacher profile are created together? [Completeness, Spec §FR-006, Assumptions]
- [ ] CHK002 - Are requirements defined for what happens to a course's enrollments/grades when its owning teacher must change? [Gap, Data-model §teachers]
- [ ] CHK003 - Are session lifetime and expiry requirements specified (token TTL, behavior on expiry)? [Completeness, Spec §FR-001, Edge "Session expiry"]
- [ ] CHK004 - Are requirements documented for the initial admin account bootstrap (who seeds the first admin)? [Gap, Assumptions]
- [ ] CHK005 - Are password strength/format requirements specified, or explicitly deferred? [Gap, Spec §FR-001]
- [ ] CHK006 - Is every functional requirement (FR-001..FR-022) mapped to at least one API endpoint? [Traceability, Contracts §traceability]

## Requirement Clarity

- [ ] CHK007 - Is "server-side RBAC, deny-by-default" defined precisely enough to test (an endpoint without an explicit rule is forbidden)? [Clarity, Spec §FR-003]
- [ ] CHK008 - Is the distinction between role-gating and ownership/own-data checks unambiguous in the requirements? [Clarity, Plan §Constitution IV, Research §4]
- [ ] CHK009 - Is the grade domain unambiguously fixed to {A, B, C, D, F} everywhere it appears (spec, data-model, contract)? [Consistency/Clarity, Spec §FR-016]
- [ ] CHK010 - Is "soft delete" defined with observable criteria (excluded from active listings, blocks new enrollments, preserves history)? [Clarity, Spec §FR-022]
- [ ] CHK011 - Are the terms "enrollment" (row) vs "active enrollment" (dropped_at IS NULL) clearly distinguished? [Ambiguity, Data-model §enrollments]

## Requirement Consistency

- [ ] CHK012 - Do the spec entities, data-model tables, and API payloads agree on field names and cardinalities (User/Student/Teacher 1:1)? [Consistency, Spec §Key Entities, Data-model]
- [ ] CHK013 - Is the delete semantics consistent between FR-022 (soft delete) and every DELETE endpoint description? [Consistency, Contracts §Students/Courses]
- [ ] CHK014 - Are error outcomes for the same rule consistent across contract and spec (e.g., duplicate enrollment → 409 CONFLICT ↔ FR-012)? [Consistency, Contracts §Error Taxonomy]
- [ ] CHK015 - Does the auth approach (JWT+bcrypt, HttpOnly cookie) stay consistent across spec clarifications, plan, and research? [Consistency, Research §3]

## Security / RBAC Requirements Quality

- [ ] CHK016 - Are authorization requirements specified for EVERY endpoint (role + ownership), with no endpoint left unstated? [Coverage, Contracts §Auth column]
- [ ] CHK017 - Are secret-handling requirements explicit (JWT_SECRET, DATABASE_URL via env, never committed, documented in .env.example)? [Completeness, Plan §Constraints, Quickstart §2]
- [ ] CHK018 - Are password-at-rest requirements unambiguous (hash only, never plaintext, defined cost factor)? [Clarity, Spec §FR-001, Research §3]
- [ ] CHK019 - Are negative authorization scenarios specified as requirements (student→admin route, teacher→other's course, student→other's data)? [Coverage/Exception, Spec §User Story 1, FR-017/019]
- [ ] CHK020 - Is the trust-boundary requirement stated (client-side checks are UX only, server is authoritative)? [Clarity, Constitution IV]

## Relational Integrity Requirements Quality

- [ ] CHK021 - Is the unique-active-enrollment rule specified precisely enough to implement as a constraint (unique on student+course WHERE not dropped)? [Measurability, Data-model §enrollments, FR-012]
- [ ] CHK022 - Are foreign-key and on-delete behaviors (RESTRICT) documented for every relationship? [Completeness, Data-model §Relationships]
- [ ] CHK023 - Are "one grade per enrollment" and "grade requires active enrollment" stated as verifiable invariants? [Measurability, Data-model §Invariants, FR-016/018]
- [ ] CHK024 - Are migration requirements (versioned, reversible; no ad-hoc schema edits) stated as a constraint? [Completeness, Constitution V, Research §2]

## API Contract & Error Taxonomy Quality

- [ ] CHK025 - Does every endpoint define request shape, success response, and the full set of possible error codes? [Completeness, Contracts]
- [ ] CHK026 - Is each error code mapped to exactly one HTTP status with a documented trigger (no ambiguous 422 overlap between VALIDATION_ERROR and UNPROCESSABLE_RULE)? [Clarity/Consistency, Contracts §Error Taxonomy]
- [ ] CHK027 - Are empty-state / not-yet-graded responses specified (e.g., grade null rather than error)? [Edge Case, Contracts §GET /grades, Story 5]
- [ ] CHK028 - Is a success/error response envelope defined consistently for all endpoints? [Consistency, Contracts §Conventions]

## MVC Layering / Architecture Requirements Quality

- [ ] CHK029 - Are the responsibilities of each MVC layer (route handler vs controller vs service vs model) defined clearly enough to prevent logic leaking into route handlers? [Clarity, Plan §Structure, ADR-0001]
- [ ] CHK030 - Is it specified that business rules live in services (framework-agnostic, unit-testable) rather than in controllers or handlers? [Clarity, ADR-0001, Constitution III]

## Business-Rule Test Coverage (Requirements for tests)

- [ ] CHK031 - Does SC-006 require an automated test for EACH business rule (unique enrollment, own-course grading, enrolled-only grading, own-data reads, soft-delete)? [Coverage, Spec §SC-006]
- [ ] CHK032 - Are acceptance scenarios stated in testable Given/When/Then form for all user stories? [Measurability, Spec §User Scenarios]
- [ ] CHK033 - Are re-enrollment-after-drop and grade-update-in-place requirements covered so tests can pin the lifecycle? [Coverage, Data-model §State transitions]

## Dependencies & Assumptions

- [ ] CHK034 - Are all assumptions (seed-based provisioning, no self-registration, letter grades only, no terms/finance) explicitly recorded and bounded? [Assumption, Spec §Assumptions/Out of Scope]
- [ ] CHK035 - Is the Node-runtime dependency (bcrypt/jwt require Node APIs, not Edge) documented as a constraint? [Dependency, Research §8]

## Notes

- This checklist validates requirement *quality*, not implementation. Items are questions to
  resolve or consciously accept before building.
- Known deferrals already accepted in the spec/plan (password strength, teacher reassignment,
  refresh tokens) are surfaced here (CHK002/005/003) so they are explicit choices, not gaps.
