---
id: 0011
title: AI Student Assistant
stage: green
date: 2026-07-19
surface: agent
model: claude-opus-4-8
feature: 002-ai-assistant
branch: main
user: muhammadumerakmal
command: none
labels: [ai, openai-agents, assistant, rbac, tools, zod4]
links:
  spec: specs/002-ai-assistant/spec.md
  ticket: null
  adr: history/adr/ADR-0003-ai-assistant-openai-agents.md
  pr: null
files:
 - backend/src/ai/agent.ts
 - backend/src/validation/assistant.schema.ts
 - backend/src/controllers/assistant.controller.ts
 - backend/src/routes/assistant.routes.ts
 - backend/src/routes/index.ts
 - backend/.env.example
 - backend/package.json (zod v4 + @openai/agents)
 - frontend/components/AssistantChat.tsx
 - frontend/app/(dashboard)/student/page.tsx
 - specs/002-ai-assistant/spec.md
 - history/adr/ADR-0003-ai-assistant-openai-agents.md
tests:
 - backend unit (lib.test.ts) — 7 passed under zod v4
---

## Prompt

make ai agent

## Response snapshot

Built the AI Student Assistant (feature 002-ai-assistant) per clarified scope: a student-only
conversational assistant whose tools call the existing backend services in-process, scoped to the
signed-in student's id (RBAC-preserving).

Backend (OpenAI Agents SDK, @openai/agents v0.13.5):
- src/ai/agent.ts — StudentContext; 5 tools (list_my_enrollments, list_my_grades,
  list_available_courses, enroll_in_course, drop_course) reading studentId from run context;
  Agent<StudentContext> with instructions; askAssistant(message, ctx) → run(...).finalOutput;
  clear error if OPENAI_API_KEY missing.
- validation/assistant.schema.ts, controllers/assistant.controller.ts (resolve student, scope,
  run), routes/assistant.routes.ts (authenticate + authorize("student")), wired into routes/index.
- .env.example: OPENAI_API_KEY, OPENAI_MODEL (default gpt-4o-mini).
- Dependency: SDK requires zod v4 → upgraded backend zod v3→v4 (schemas compatible).

Frontend: components/AssistantChat.tsx chat widget added to the student dashboard.

Verification: fetched real SDK API from installed d.ts (tool/run/Agent/RunContext.context);
backend typecheck clean; unit tests 7/7 under zod v4; server boots and POST /api/assistant → 401
without auth (route mounted + protected). Frontend typecheck clean + build success (student route
1.94 kB). Live agent calls require OPENAI_API_KEY (user-provided).

## Outcome

- ✅ Impact: AI assistant delivered; the deferred piece of the original vision is now built and RBAC-safe.
- 🧪 Tests: backend unit 7/7 (zod v4); assistant runtime needs OPENAI_API_KEY to exercise end-to-end.
- 📁 Files: backend ai/route/validation/controller + frontend widget + spec + ADR-0003 + this PHR
- 🔁 Next prompts: set OPENAI_API_KEY (+ Neon DB) → chat end-to-end; optionally all-roles assistant.
- 🧠 Reflection: Tools take studentId from server context, never model input — the key RBAC guarantee.

## Evaluation notes (flywheel)

- Failure modes observed: SDK needs zod v4 (ERESOLVE) → upgraded; tool execute typed RunContext<unknown> → loosened helper + cast.
- Graders run and results (PASS/FAIL): PASS — backend+frontend typecheck clean, unit green, route mounted/protected (401), frontend build success.
- Prompt variant (if applicable): student-only + in-process tools (chosen via clarifying question).
- Next experiment (smallest change to try): provide OPENAI_API_KEY and run a real chat turn (enrol via assistant).
