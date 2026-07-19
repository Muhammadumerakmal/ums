---
id: 0002
title: Core UMS Baseline Spec
stage: spec
date: 2026-07-19
surface: agent
model: claude-opus-4-8
feature: 001-core-ums
branch: 001-core-ums
user: Muhammadumerakmal
command: /sp.specify
labels: [spec, ums, rbac, enrollment, grades]
links:
  spec: specs/001-core-ums/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-core-ums/spec.md
 - specs/001-core-ums/checklists/requirements.md
tests:
 - none
---

## Prompt

Core University Management System slice. Domain entities: Students, Courses, Enrollment (many-to-many between students and courses), and Grades. Three roles with server-side RBAC: Admin (manages students, courses, and users; full access), Teacher (owns courses, manages enrollment/grades for their own courses only), Student (views own profile, enrolls/drops courses, views own grades). Backend MUST follow MVC architecture (Models, Controllers, Routes/Services) within the Next.js app on the Node.js runtime, backed by Neon serverless Postgres. Business rules include: unique enrollment per student+course (no duplicates), teachers can only grade students in their own courses, students cannot enroll twice in the same course. AI assistant is OUT OF SCOPE for this spec (separate future feature). Focus on auth/login, role-based dashboards, and CRUD + business rules for the four core entities.

## Response snapshot

Created feature branch `001-core-ums` and wrote the baseline specification at
`specs/001-core-ums/spec.md`. The spec defines 5 prioritized, independently-testable user
stories (P1: RBAC sign-in; P1: admin manages students/courses; P2: student enroll/drop;
P2: teacher grades own-course students; P3: student views grades), 22 functional requirements
grouped by auth, admin CRUD, enrollment, grading, and data integrity, plus 5 key entities
(User, Student, Course, Enrollment, Grade), edge cases, 6 measurable success criteria,
assumptions, and explicit out-of-scope (AI assistant deferred).

Implementation constraints (MVC backend, Next.js, Neon Postgres) were intentionally excluded
from the spec to keep it technology-agnostic and carried forward to `/sp.plan`.
Wrote quality checklist at `specs/001-core-ums/checklists/requirements.md` — all items pass;
no [NEEDS CLARIFICATION] markers remain.

## Outcome

- ✅ Impact: Baseline spec ready; core slice scoped, bounded, and testable.
- 🧪 Tests: none (specification artifact); SC-006 mandates automated business-rule tests at build time.
- 📁 Files: spec.md, checklists/requirements.md, this PHR
- 🔁 Next prompts: /sp.clarify (optional) or /sp.plan (MVC + Next.js + Neon design)
- 🧠 Reflection: Kept spec business-focused; MVC/stack decisions reserved for plan + ADR.

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.ps1 mis-parsed a description with parentheses/slashes, but branch + spec.md were still created correctly.
- Graders run and results (PASS/FAIL): PASS (quality checklist all green, no clarification markers)
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): run /sp.plan with MVC architecture as a Constitution Check input
