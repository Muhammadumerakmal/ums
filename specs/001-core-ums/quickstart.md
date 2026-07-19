# Quickstart: Core University Management System

**Feature**: `001-core-ums` | **Date**: 2026-07-19

Local setup to run and test the app. Assumes Node.js 20 LTS and a free Neon account.

## 1. Prerequisites

- Node.js 20 LTS and npm
- A Neon project + database → copy its connection string (`postgres://...`)

## 2. Environment

Create `.env.local` from the template (never commit real values):

```bash
cp .env.example .env.local
```

`.env.example` documents required keys:

```dotenv
# Neon Postgres connection string
DATABASE_URL="postgres://user:password@ep-xxxx.neon.tech/neondb?sslmode=require"
# Secret used to sign JWTs (use a long random string)
JWT_SECRET="change-me-to-a-long-random-string"
# bcrypt cost factor
BCRYPT_ROUNDS="10"
# JWT lifetime
JWT_EXPIRES_IN="1h"
```

## 3. Install

```bash
npm install
```

## 4. Database — migrate & seed

```bash
npm run db:generate    # drizzle-kit: generate SQL migration from schema
npm run db:migrate     # apply migrations to Neon
npm run db:seed        # insert seed users (admin/teacher/2 students), 1 course, 1 enrollment
```

Seed credentials (local/dev only):

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@uni.edu | admin1234 |
| Teacher | teacher@uni.edu | teacher1234 |
| Student | jane@uni.edu | student1234 |

## 5. Run

```bash
npm run dev            # http://localhost:3000
```

Sign in at `/login`. Each role lands on its dashboard: admin → students/courses management;
teacher → my courses + roster/grading; student → browse/enroll + my grades.

## 6. Test

```bash
npm run test           # Vitest: unit + integration
npm run test:unit      # services & lib only (fast)
npm run test:watch
```

Integration tests run against a disposable database (a Neon branch or local Postgres) configured
via `DATABASE_URL_TEST`.

## 7. Smoke check (maps to spec acceptance)

1. Log in as **admin** → create a student, create a course, assign the teacher. *(Story 2)*
2. Log in as **student** → enroll in the course; try to enroll again → rejected. *(Story 3, FR-012)*
3. Log in as **teacher** → open the owned course roster → record grade `B`. *(Story 4)*
4. Try opening a course you don't own as teacher → `403`. *(FR-017)*
5. Log in as **student** → see grade `B` for the course. *(Story 5)*

## 8. Useful scripts (package.json)

| Script | Purpose |
|--------|---------|
| `dev` / `build` / `start` | Next.js dev / production build / serve |
| `db:generate` / `db:migrate` / `db:seed` | Drizzle migration + seed |
| `test` / `test:unit` / `test:watch` | Vitest |
| `lint` / `typecheck` | ESLint / `tsc --noEmit` |
