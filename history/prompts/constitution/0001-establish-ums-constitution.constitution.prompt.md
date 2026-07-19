---
id: 0001
title: Establish UMS Constitution
stage: constitution
date: 2026-07-19
surface: agent
model: claude-opus-4-8
feature: none
branch: master
user: Muhammadumerakmal
command: /sp.constitution
labels: [constitution, governance, full-stack, sdd]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - .specify/memory/constitution.md
tests:
 - none
---

## Prompt

University Management System — full-stack learning project. Stack: Next.js (frontend + API routes), Node.js runtime, Neon serverless Postgres, OpenAI Agents SDK for an AI assistant feature. Three roles: Admin, Teacher, Student. Core domain slice: Students, Courses, Enrollment, Grades. Emphasis on clean full-stack fundamentals, role-based access control, relational data modeling, and testable code.

## Response snapshot

Ratified constitution v1.0.0 for the University Management System (learning project).
Defined 6 core principles:
  I.   Spec-Driven Development (NON-NEGOTIABLE)
  II.  Contract-First & Type-Safe Full Stack
  III. Test-First Discipline
  IV.  Secure Role-Based Access by Default
  V.   Relational Data Integrity
  VI.  Simplicity & Learning-First (YAGNI)
Added "Technology & Architecture Constraints" (Next.js + Node + Neon Postgres + OpenAI
Agents SDK; Admin/Teacher/Student roles; secrets via .env) and "Development Workflow &
Quality Gates" sections, plus Governance with semantic versioning policy.
Verified dependent templates (plan/spec/tasks) align — plan-template's Constitution Check
is dynamically derived, no edits required.

## Outcome

- ✅ Impact: Project principles established; SDD pipeline and RBAC/type-safety/testing gates now binding.
- 🧪 Tests: none (governance artifact)
- 📁 Files: .specify/memory/constitution.md (constitution v1.0.0), this PHR
- 🔁 Next prompts: /sp.specify for the core Students/Courses/Enrollment/Grades slice
- 🧠 Reflection: Scoped to a finishable learning slice; AI assistant constrained to operate within RBAC.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): PASS (no unresolved placeholders; version/date coherent)
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): proceed to /sp.specify
