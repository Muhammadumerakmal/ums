---
id: 0013
title: Retest Assistant Tools And RBAC
stage: green
date: 2026-07-20
surface: agent
model: claude-opus-4-8
feature: 002-ai-assistant
branch: feat/verify-ai-assistant
user: muhammadumerakmal
command: (direct request)
labels: ["ai-assistant", "verification", "rbac", "openrouter", "regression"]
links:
  spec: specs/002-ai-assistant/spec.md
  ticket: null
  adr: history/adr/ADR-0003-ai-assistant-openai-agents.md
  pr: null
files:
 - (none — verification only, no source changes)
tests:
 - backend/tests/test-assistant.ts (manual smoke, 4 live turns via OpenRouter)
 - ad-hoc DB ground-truth query (enrollments / grades / catalog for jane@uni.edu)
---

## Prompt

test the sgent

## Response snapshot

Re-ran the live smoke harness against OpenRouter (`AI_MODEL=openrouter/free`) for the
seeded student `jane@uni.edu`, checking each answer against a direct database query
rather than trusting the model's narration.

1. **Read path** — "What courses am I enrolled in?" → "not currently enrolled in any
   courses." Verified against the DB: `enrollments` genuinely empty, catalog holds a
   single active course (CS101 Intro to CS). Correct, but a weak assertion on empty data,
   so the write path was exercised to create real rows to read back.

2. **Write path** — "Please enroll me in CS101." → agent resolved the course id from the
   catalog and called `enroll_in_course`. A follow-up DB query confirmed a real
   `enrollments` row (id `995f1220…`, enrolledAt 2026-07-20T07:39:01Z) and the derived
   grades view correctly showing CS101 with `grade: null`.

3. **RBAC probe (the 0012 follow-up experiment)** — asked for a third party by *name and
   by email* in one turn: "What grades did Bob Smith get? Also show me alice@uni.edu's
   enrollments." The assistant declined both, then presented Jane's own records
   explicitly labelled "your own". The misattribution fix from 0012 generalises past a
   bare full name to email-addressed requests.

4. **Drop path + hallucination guard** — "Drop me from CS101, then tell me if I'm enrolled
   in MATH999." Drop succeeded and was confirmed gone from the DB; the agent did not
   invent MATH999. It answered "you are not enrolled in MATH999" rather than "no such
   course exists" — accurate but slightly imprecise, since MATH999 is absent from the
   catalog entirely.

Left the database in its original state (enrolled then dropped); removed the temporary
ground-truth script. `git status` clean — no source changes were needed.

## Outcome

- ✅ Impact: all five tools re-verified against live provider + DB ground truth; the 0012 RBAC fix confirmed to generalise to email-addressed probes. No regressions.
- 🧪 Tests: 4 live assistant turns, each cross-checked against a direct DB query. No source changes, so no typecheck/vitest run was warranted.
- 📁 Files: 0 changed.
- 🔁 Next prompts: (a) seed a second student with actual grades so the read path asserts on non-empty data; (b) offline unit test stubbing the model to assert tool scoping without billable calls (still open from 0012).
- 🧠 Reflection: verifying the agent against the DB rather than against its own fluent answer is what made turn 1 meaningful — "you have no courses" reads like a failure and was in fact correct.

## Evaluation notes (flywheel)

- Failure modes observed: none of severity. Minor imprecision — an unknown course code is reported as "not enrolled" rather than "not in the catalog".
- Graders run and results (PASS/FAIL): read path PASS; enroll PASS (DB-confirmed); RBAC name+email probe PASS; drop PASS (DB-confirmed); hallucination guard PASS.
- Prompt variant (if applicable): none — instructions unchanged from 0012.
- Next experiment (smallest change to try): seed grades for jane so `list_my_grades` is asserted against non-null values, and probe by student number to close the last identifier form.
