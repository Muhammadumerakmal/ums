---
id: 0012
title: Verify Assistant Live Turns
stage: green
date: 2026-07-20
surface: agent
model: claude-opus-4-8
feature: 002-ai-assistant
branch: feat/verify-ai-assistant
user: muhammadumerakmal
command: (direct request)
labels: ["ai-assistant", "verification", "rbac", "openrouter"]
links:
  spec: specs/002-ai-assistant/spec.md
  ticket: null
  adr: history/adr/ADR-0003-ai-assistant-openai-agents.md
  pr: null
files:
 - backend/tests/test-assistant.ts
 - backend/src/ai/agent.ts
 - backend/.env.example
tests:
 - backend/tests/test-assistant.ts (manual smoke, 6 live turns via OpenRouter)
 - npm run typecheck (clean)
 - npm test (21/21 passing)
---

## Prompt

yes test the agent and complete  I see you have an untracked backend/tests/test-assistant.ts and recent work on the AI assistant with OpenRouter support — happy to pick up there, or anywhere else you'd like.

## Response snapshot

Completed the untracked smoke-test harness and exercised the assistant end-to-end
against a live OpenRouter provider.

1. Rewrote `backend/tests/test-assistant.ts`: it now resolves the seeded student's
   *profile* id by joining `students` → `users` on `jane@uni.edu` (the previous
   hardcoded all-zeros placeholder UUID could never have matched a real row), accepts
   the question as an argv override, and exits non-zero on failure. Documented that
   it is deliberately outside vitest's `tests/**/*.test.ts` include pattern because
   it makes billable LLM calls.

2. Drove all five tools with live turns: `list_my_enrollments`, `list_my_grades`,
   `list_available_courses`, `drop_course`, `enroll_in_course` — all returned real
   database data and the mutations were confirmed against the `enrollments` table.

3. Found a real defect via an RBAC-boundary probe ("Show me John Roe's grades"):
   the scoping guarantee held — the tools returned only Jane's rows, and a direct
   DB query confirmed John has zero enrollments — but the model **relabelled Jane's
   own data as John's**. No data leak, but a materially misleading answer. Fixed by
   tightening the agent instructions to state that the tools can only ever return the
   signed-in student's records, that queries about any other person must be declined,
   and that tool output must never be attributed to anyone else. Re-ran the probe:
   the assistant now declines cleanly.

4. Updated `backend/.env.example`, which had drifted from the code: it never
   documented `OPENROUTER_API_KEY`, stated the wrong provider priority, and gave
   defaults for a model variable that the implementation does not read.

## Outcome

- ✅ Impact: assistant verified working against a live provider; one misattribution defect found and fixed; env docs realigned with the implementation.
- 🧪 Tests: 21/21 vitest passing, typecheck clean, 6 live assistant turns exercising all 5 tools.
- 📁 Files: 3 changed (smoke harness completed, agent instructions hardened, .env.example corrected).
- 🔁 Next prompts: consider an offline unit test that stubs the model and asserts tool scoping without billable calls.
- 🧠 Reflection: the RBAC boundary was enforced in code but not in the model's *narration* — worth remembering that a correct tool layer can still produce a wrong answer.

## Evaluation notes (flywheel)

- Failure modes observed: model attributed correctly-scoped tool output to a third party when asked about another student by name.
- Graders run and results (PASS/FAIL): manual RBAC probe — FAIL before instruction fix, PASS after.
- Prompt variant (if applicable): agent `instructions` — added explicit refusal + non-attribution clause.
- Next experiment (smallest change to try): probe with an email address and a student number rather than a full name, to confirm the refusal generalises.
