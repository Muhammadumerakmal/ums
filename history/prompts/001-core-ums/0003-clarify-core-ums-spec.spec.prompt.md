---
id: 0003
title: Clarify Core UMS Spec
stage: spec
date: 2026-07-19
surface: agent
model: claude-opus-4-8
feature: 001-core-ums
branch: 001-core-ums
user: Muhammadumerakmal
command: /sp.clarify
labels: [clarify, spec, data-model, auth, grading]
links:
  spec: specs/001-core-ums/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-core-ums/spec.md
tests:
 - none
---

## Prompt

/sp.clarify (no arguments) — user chose to run structured clarification before planning.

Four clarification questions were presented with recommended options. User answers:
1. People data model → Separate profiles, 1:1 to User (recommended)
2. Grade format → Letter grade A–F (recommended)
3. Delete behavior for referenced records → Soft delete / block hard delete (recommended)
4. Authentication → Custom JWT + bcrypt

## Response snapshot

Ran ambiguity scan across the taxonomy; most categories Clear. Resolved 4 high-impact
Partial/Missing decisions and integrated them into `spec.md`:

- Added `## Clarifications` → `### Session 2026-07-19` with 4 Q/A bullets.
- FR-001: passwords stored as secure hashes, token-based session at sign-in.
- FR-016: grade constrained to fixed set {A, B, C, D, F}.
- FR-022: rewritten to soft-delete Students/Courses; block hard deletes that would orphan
  enrollments/grades; inactive records excluded from active listings and new enrollments.
- Key Entities: split people model into User (auth) + Student profile + Teacher profile
  (1:1 to User); Course and Student gain active/inactive status; Grade constrained to letters.
- Assumptions updated for hashed-password/token sessions, 1:1 profile↔user, letter grades.

## Outcome

- ✅ Impact: Data model, auth approach, grade format, and delete semantics now unambiguous — de-risks /sp.plan.
- 🧪 Tests: none (spec artifact); business rules remain covered by SC-006.
- 📁 Files: spec.md (Clarifications + FR-001/016/022 + entities + assumptions), this PHR
- 🔁 Next prompts: /sp.plan (MVC + Neon schema + JWT/bcrypt auth + RBAC); surface MVC ADR
- 🧠 Reflection: Custom JWT+bcrypt chosen over Auth.js — more security surface; plan must cover hashing cost, token expiry, secret handling.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): PASS (one bullet per answer, ≤5 questions, no contradictions left)
- Prompt variant (if applicable): batched 4 questions via native question tool with recommended-first options
- Next experiment (smallest change to try): proceed to /sp.plan
