# Feature Specification: AI Student Assistant

**Feature**: `002-ai-assistant`
**Created**: 2026-07-19
**Status**: Implemented
**Depends on**: `001-core-ums` (core UMS + auth/RBAC + services)

## Summary

An in-app conversational assistant for signed-in **students**. It answers natural-language
questions about the student's **own** enrollments and grades, browses the course catalog, and
can **enrol** or **drop** courses on request — all through tools that call the existing backend
services, scoped to the requesting student. It never exposes data the student could not already
access (constitution: AI stays within RBAC).

## User Scenarios

### User Story 1 — Ask about my studies (Priority: P1)

A signed-in student opens the assistant on their dashboard and asks questions in plain language.

**Acceptance Scenarios**:
1. **Given** a signed-in student, **When** they ask "what am I enrolled in?", **Then** the
   assistant lists their current active enrollments (and nothing belonging to other students).
2. **Given** a student with a recorded grade, **When** they ask "what are my grades?", **Then**
   the assistant reports their grades, showing ungraded courses as not-yet-graded.
3. **Given** a student, **When** they ask "what courses can I take?", **Then** the assistant lists
   the active course catalog.

### User Story 2 — Act on my behalf (Priority: P2)

**Acceptance Scenarios**:
1. **Given** a student, **When** they say "enrol me in CS101", **Then** the assistant enrolls them
   (or relays a clear message if already enrolled / course unavailable).
2. **Given** an enrolled student, **When** they say "drop CS101", **Then** the assistant drops the
   enrollment (or says they were not enrolled).

### Edge Cases
- Non-student roles cannot reach the assistant (server-side `authorize("student")`).
- A tool error (duplicate enrollment, unknown course) is surfaced as a plain message, not a crash.
- If `OPENAI_API_KEY` is unset, the assistant returns a clear "not configured" message.

## Functional Requirements

- **FR-A1**: Only authenticated users with role **student** may use the assistant (server-side).
- **FR-A2**: Assistant tools MUST operate solely on the requesting student's data; the student id
  comes from the session, never from the model.
- **FR-A3**: The assistant MUST use tools for all data (enrollments, grades, catalog) and MUST NOT
  fabricate courses, grades, or IDs.
- **FR-A4**: The assistant MAY enrol/drop the student, reusing the same business rules and errors
  as the REST API (unique active enrollment, own-data only).
- **FR-A5**: Secrets (`OPENAI_API_KEY`) MUST come from the environment; missing key yields a clear
  message, not a stack trace.

## Success Criteria

- **SC-A1**: 100% of assistant data comes from tools; no hallucinated courses/grades in testing.
- **SC-A2**: 100% of non-student callers are denied.
- **SC-A3**: A student can enrol and then confirm enrollment through the assistant in one session.

## Out of Scope

- Teacher/admin assistants, streaming responses, conversation history persistence, multi-turn
  memory beyond a single request, and voice.

## Design (as built)

- **SDK**: OpenAI Agents SDK for TypeScript (`@openai/agents`). See
  [ADR-0003](../../history/adr/ADR-0003-ai-assistant-openai-agents.md).
- **Tools** (`backend/src/ai/agent.ts`): `list_my_enrollments`, `list_my_grades`,
  `list_available_courses`, `enroll_in_course`, `drop_course` — each calls a backend service with
  the `StudentContext.studentId` from the run context.
- **Endpoint**: `POST /api/assistant` (student-only) → `{ data: { reply } }`.
- **Frontend**: `AssistantChat` widget on the student dashboard.
- **Config**: `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-4o-mini`).
