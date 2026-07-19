# Core University Management System

A full-stack learning project: role-based university management (Students, Courses, Enrollment,
Grades). Split into two independent apps — a **Next.js frontend** and a **standalone Express
backend** — sharing an explicit **MVC** design, **Neon serverless Postgres**, and **custom JWT +
bcrypt** auth.

> Built spec-first. See `specs/001-core-ums/` for the spec, plan, data model, API contract, and
> tasks; `history/adr/` for architecture decisions (ADR-0001 MVC + Drizzle, ADR-0002 the split).

## Repository layout

```
repo/
├── frontend/     # Next.js (App Router) — React UI only, calls the backend API
│   ├── app/                 # login + admin/teacher/student dashboards
│   └── lib/api.ts           # fetch wrapper → backend, credentials: "include"
├── backend/      # Express API (Node runtime)
│   └── src/
│       ├── models/          # Drizzle schema + data access
│       ├── services/        # business rules & ownership/own-data checks
│       ├── controllers/     # request → service → response
│       ├── routes/          # Express routers (thin HTTP layer)
│       ├── middleware/      # authenticate + authorize (deny-by-default RBAC), error handler
│       └── lib/             # db, password (bcrypt), jwt, errors
├── specs/        # SDD artifacts
└── history/      # ADRs + prompt history records
```

## Stack

- **Frontend**: Next.js 15, React 19
- **Backend**: Express 4 on Node 20, Drizzle ORM + `drizzle-kit`, Zod, bcryptjs, jsonwebtoken
- **Database**: Neon serverless PostgreSQL

## Run it (two terminals)

**1. Backend** (`http://localhost:4000`)
```bash
cd backend
cp .env.example .env.local     # DATABASE_URL (Neon), JWT_SECRET, FRONTEND_ORIGIN, PORT
npm install
npm run db:generate            # SQL migration from schema (already committed)
npm run db:migrate             # apply to Neon
npm run db:seed                # admin/teacher/2 students + 1 course + 1 enrollment
npm run dev                    # Express API on :4000
```

**2. Frontend** (`http://localhost:3000`)
```bash
cd frontend
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                    # Next.js on :3000
```

Open `http://localhost:3000/login`. Seed logins:
`admin@uni.edu / admin1234` · `teacher@uni.edu / teacher1234` · `jane@uni.edu / student1234`

## Verify

```bash
# backend
cd backend && npm run typecheck && npm run test:unit   # integration tests need DATABASE_URL_TEST
# frontend
cd frontend && npm run typecheck && npm run build
```

## Business rules enforced (service layer + DB constraints)

- Unique **active** enrollment per (student, course) — partial unique index; re-enrol allowed after drop.
- Teachers grade only students in **courses they own**; grading requires an **active** enrollment.
- Students read only **their own** enrollments and grades.
- Grades restricted to **{A, B, C, D, F}**.
- **Soft delete** for students/courses (preserves history; excluded from active listings).

## Notes on cross-origin auth

The backend issues the JWT in an **HttpOnly cookie** and enables **CORS with credentials** for the
frontend origin. The frontend sends `credentials: "include"`. In production, host both under the
same site or set the cookie `Secure; SameSite=None`.

## Out of scope (future)

AI assistant (OpenAI Agents SDK), admissions, finance, attendance, scheduling, transcripts/GPA.
