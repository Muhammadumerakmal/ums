# REST API Contract: Core University Management System

**Feature**: `001-core-ums` | **Date**: 2026-07-19 | **Base path**: `/api`

All endpoints run on the **Node.js runtime**. Requests/responses are JSON. Authentication is a
signed JWT delivered in an **HttpOnly cookie** set at login. Authorization is **server-side and
deny-by-default**: every endpoint declares required role(s); ownership/own-data rules are noted
per endpoint. Request bodies are validated with Zod; invalid input returns `422`.

## Conventions

- **Auth column**: which role(s) may call. "Self" means the caller may only act on their own data.
- IDs are UUIDs. Timestamps are ISO-8601 UTC.
- Soft-deleted (`deleted_at`/`dropped_at`) records are excluded from list endpoints by default.
- Success envelope: `{ "data": <payload> }`. Error envelope: see Error Taxonomy.

## Error Taxonomy

| App error code | HTTP | Meaning | Example trigger |
|----------------|------|---------|-----------------|
| `VALIDATION_ERROR` | 422 | Request body/params failed schema validation | missing `email`, grade not in A–F |
| `UNAUTHENTICATED` | 401 | Missing/invalid/expired token | no cookie, bad JWT |
| `FORBIDDEN` | 403 | Authenticated but role/ownership denies action | student hits admin route; teacher grades other's course |
| `NOT_FOUND` | 404 | Target resource does not exist (or is soft-deleted) | unknown course id |
| `CONFLICT` | 409 | Business-rule/uniqueness conflict | duplicate active enrollment, duplicate email/code |
| `UNPROCESSABLE_RULE` | 422 | Semantically invalid business action | grading a non-enrolled student |
| `INTERNAL_ERROR` | 500 | Unexpected server failure | unhandled exception |

Error body:
```json
{ "error": { "code": "CONFLICT", "message": "Student is already enrolled in this course." } }
```

---

## Auth

### POST `/api/auth/login`  · Auth: public
Request:
```json
{ "email": "admin@uni.edu", "password": "secret" }
```
Responses: `200` `{ "data": { "id", "fullName", "role" } }` and sets HttpOnly `token` cookie ·
`401 UNAUTHENTICATED` on bad credentials · `422 VALIDATION_ERROR`.

### POST `/api/auth/logout` · Auth: any authenticated
`200` — clears the cookie.

### GET `/api/auth/me` · Auth: any authenticated
`200` `{ "data": { "id", "fullName", "role", "profileId" } }` · `401` if not signed in.

---

## Students  *(profiles managed by Admin)*

### GET `/api/students` · Auth: **admin**
List active students. `200` `{ "data": [ { "id", "userId", "fullName", "email", "studentNumber" } ] }`.

### POST `/api/students` · Auth: **admin**
Creates a `student`-role user + student profile together.
```json
{ "fullName": "Jane Doe", "email": "jane@uni.edu", "password": "temp1234", "studentNumber": "S-1001" }
```
`201` `{ "data": { student } }` · `409 CONFLICT` (email or studentNumber exists) · `422`.

### GET `/api/students/{id}` · Auth: **admin**
`200` `{ "data": { student } }` · `404`.

### PATCH `/api/students/{id}` · Auth: **admin**
Update profile fields (fullName, studentNumber). `200` · `404` · `409` · `422`.

### DELETE `/api/students/{id}` · Auth: **admin**
**Soft delete** (sets `deleted_at`). `200` · `404`. Never hard-deletes; enrollments/grades retained.

---

## Courses

### GET `/api/courses` · Auth: **any authenticated**
List active courses. Students see catalog; teachers/admin see all active.
`200` `{ "data": [ { "id", "code", "title", "teacherId", "teacherName" } ] }`.

### POST `/api/courses` · Auth: **admin**
```json
{ "code": "CS101", "title": "Intro to CS", "teacherId": "<uuid>" }
```
`201` · `409 CONFLICT` (duplicate code) · `422` (unknown/invalid teacherId → rejected) · FR-008.

### GET `/api/courses/{id}` · Auth: **any authenticated** `200` · `404`.

### PATCH `/api/courses/{id}` · Auth: **admin**
Update code/title/teacherId. `200` · `404` · `409` · `422`.

### DELETE `/api/courses/{id}` · Auth: **admin**
**Soft delete**. `200` · `404`.

### GET `/api/courses/{id}/roster` · Auth: **admin or owning teacher** (ownership)
List students actively enrolled in the course, with their current grade (if any).
`200` `{ "data": [ { "studentId", "fullName", "studentNumber", "grade": "B" | null } ] }` ·
`403 FORBIDDEN` if a teacher requests a course they do not own (FR-017) · `404`.

---

## Enrollments

### GET `/api/enrollments` · Auth: **student (self)** or **admin**
Student: their own active enrollments only (FR-014). Admin: may filter by `?studentId=` / `?courseId=`.
`200` `{ "data": [ { "id", "courseId", "code", "title", "enrolledAt" } ] }`.

### POST `/api/enrollments` · Auth: **student (self)**
Enroll the current student in a course.
```json
{ "courseId": "<uuid>" }
```
`201` · `409 CONFLICT` (already actively enrolled — FR-012) · `404` (course missing/inactive) ·
`422`.

### DELETE `/api/enrollments/{id}` · Auth: **student (self, own enrollment)** or **admin**
Drop the enrollment (**sets `dropped_at`**, soft). `200` · `403` (not the owner) · `404`.

---

## Grades

### POST `/api/grades` · Auth: **owning teacher**
Record or update (upsert) the grade for an enrollment in a course the teacher owns.
```json
{ "enrollmentId": "<uuid>", "letter": "B" }
```
`200`/`201` · `403 FORBIDDEN` (teacher does not own the course — FR-017) ·
`422 UNPROCESSABLE_RULE` (enrollment not active / student not enrolled — FR-018) ·
`422 VALIDATION_ERROR` (letter not in A–F — FR-016) · `404` (enrollment missing).

### GET `/api/grades` · Auth: **student (self)**
The current student's grades across their enrolled courses (FR-019).
`200` `{ "data": [ { "courseId", "code", "title", "grade": "A" | null } ] }` — courses with no
grade yet report `null` rather than erroring (Story 5 acceptance #2).

---

## Endpoint → requirement traceability

| Endpoint | Requirements |
|----------|--------------|
| POST /auth/login, /auth/me | FR-001, FR-004, FR-005 |
| all (role column) | FR-002, FR-003 |
| /students * | FR-006, FR-009, FR-022 |
| /courses *, /courses/{id}/roster | FR-007, FR-008, FR-015, FR-017, FR-022 |
| /enrollments * | FR-010, FR-011, FR-012, FR-013, FR-014 |
| /grades * | FR-016, FR-017, FR-018, FR-019 |
