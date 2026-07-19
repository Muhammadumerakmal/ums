---
id: 0009
title: Split Frontend And Backend
stage: refactor
date: 2026-07-19
surface: agent
model: claude-opus-4-8
feature: 001-core-ums
branch: 001-core-ums
user: Muhammadumerakmal
command: none
labels: [refactor, architecture, express, nextjs, split, cors]
links:
  spec: specs/001-core-ums/spec.md
  ticket: null
  adr: history/adr/ADR-0002-frontend-backend-split.md
  pr: null
files:
 - frontend/** (Next.js UI + lib/api.ts + package.json/tsconfig/.env.example)
 - backend/** (Express app/server/routes + reused models/services/controllers + middleware + lib)
 - history/adr/ADR-0001-*.md (status → partially superseded)
 - history/adr/ADR-0002-frontend-backend-split.md (new)
 - README.md
 - .gitignore
tests:
 - backend unit (tests/unit/lib.test.ts) — 7 passed
---

## Prompt

put frontend in frontend folder,backend in backend folder

## Response snapshot

Restructured the single Next.js app into two independent apps (user chose the true split):

- **frontend/** — Next.js (App Router) UI only. Removed app/api/**; added lib/api.ts (fetch
  wrapper → backend origin with credentials:"include"); rewrote login + 3 dashboards to call
  api("/…"). Own package.json/tsconfig/next.config/.env.example (NEXT_PUBLIC_API_URL).
- **backend/** — standalone Express API. Reused MVC models/services/validation unchanged.
  Rewrote authenticate/authorize as Express middleware; controllers as Express handlers;
  added Express routers (routes/*), app.ts (cors+credentials, json, cookie-parser, /api, error
  middleware), server.ts. Replaced Next http.ts with asyncHandler + error middleware. Moved
  Drizzle config/migration/seed/tests to backend. Own package.json/tsconfig/.env.example
  (DATABASE_URL, JWT_SECRET, PORT, FRONTEND_ORIGIN).

ADRs: marked ADR-0001 topology as partially superseded; created ADR-0002 documenting the split
(MVC + Drizzle carried over intact). Updated root README (two-app run instructions) and .gitignore
(nested node_modules/.next).

Verification:
- backend: `npm run typecheck` clean; `npm run test:unit` 7/7 pass; server boots and
  `/health`→ok, `/api/auth/me` (unauth)→401 UNAUTHENTICATED, bad login→VALIDATION_ERROR
  (full routing + auth + zod + error middleware proven without a DB).
- frontend: `npm run typecheck` clean; `npm run build` success (6 routes).

## Outcome

- ✅ Impact: Clean frontend/backend separation; both apps build and run; API framework-agnostic and reusable.
- 🧪 Tests: backend unit 7/7; integration still skip without DATABASE_URL_TEST; smoke via curl confirmed live behavior.
- 📁 Files: frontend/** + backend/** + ADR-0001 (superseded note) + ADR-0002 + README + .gitignore + this PHR
- 🔁 Next prompts: add Neon creds → migrate/seed/run both; commit + push; then AI-assistant feature.
- 🧠 Reflection: Reused all business logic; only the HTTP-adapter + auth-transport layer changed, exactly as ADR-0002 intends.

## Evaluation notes (flywheel)

- Failure modes observed: persisted bash cwd (cd backend) broke later relative paths → used absolute paths; test files kept old @/src/server import alias → sed-fixed to relative.
- Graders run and results (PASS/FAIL): PASS — both typecheck clean, backend unit green, backend smoke endpoints correct, frontend build success.
- Prompt variant (if applicable): chose two-app split (supersedes ADR-0001 topology) per user selection.
- Next experiment (smallest change to try): provision Neon, run backend integration suite end-to-end.
