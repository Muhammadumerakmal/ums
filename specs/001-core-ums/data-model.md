# Data Model: Core University Management System

**Feature**: `001-core-ums` | **Date**: 2026-07-19 | **Store**: Neon PostgreSQL (via Drizzle ORM)

## Overview

Six tables. `users` holds authentication + role; `students` and `teachers` are domain profiles
linked 1:1 to a user. `courses` are owned by a teacher. `enrollments` is the many-to-many join
between students and courses. `grades` records a letter result per active enrollment.

```text
users 1───1 students 1───* enrollments *───1 courses *───1 teachers
users 1───1 teachers                    │
                                         └───1 grades (0..1 per enrollment)
```

## Enums

- **role**: `admin` | `teacher` | `student`
- **grade_letter**: `A` | `B` | `C` | `D` | `F`
- **enrollment_status**: `active` | `dropped`  *(status mirrors `dropped_at IS NULL`)*

## Tables

### `users` — authentication & authorization record

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `email` | text | NOT NULL, UNIQUE (citext or lower-cased) |
| `password_hash` | text | NOT NULL (bcrypt) |
| `full_name` | text | NOT NULL |
| `role` | role (enum) | NOT NULL |
| `created_at` | timestamptz | NOT NULL, default `now()` |
| `updated_at` | timestamptz | NOT NULL, default `now()` |

Rules: exactly one role per user. Password never stored in plaintext. Email unique and used as
the sign-in identifier.

### `students` — student profile (1:1 with a `student`-role user)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `user_id` | uuid | NOT NULL, UNIQUE, FK → `users(id)` ON DELETE RESTRICT |
| `student_number` | text | NOT NULL, UNIQUE |
| `deleted_at` | timestamptz | NULL (soft delete) |
| `created_at` | timestamptz | NOT NULL, default `now()` |
| `updated_at` | timestamptz | NOT NULL, default `now()` |

Rules: `user_id` UNIQUE enforces 1:1. Soft delete via `deleted_at`. Active queries filter
`deleted_at IS NULL`. Inactive students cannot receive new enrollments.

### `teachers` — teacher profile (1:1 with a `teacher`-role user)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `user_id` | uuid | NOT NULL, UNIQUE, FK → `users(id)` ON DELETE RESTRICT |
| `department` | text | NULL |
| `created_at` | timestamptz | NOT NULL, default `now()` |
| `updated_at` | timestamptz | NOT NULL, default `now()` |

Rules: `user_id` UNIQUE enforces 1:1. (Teachers are not soft-deleted in this slice; a teacher
with courses cannot be removed — courses must be reassigned first, out of MVP scope.)

### `courses` — unit of instruction, owned by one teacher

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `code` | text | NOT NULL, UNIQUE (e.g., "CS101") |
| `title` | text | NOT NULL |
| `teacher_id` | uuid | NOT NULL, FK → `teachers(id)` ON DELETE RESTRICT |
| `deleted_at` | timestamptz | NULL (soft delete) |
| `created_at` | timestamptz | NOT NULL, default `now()` |
| `updated_at` | timestamptz | NOT NULL, default `now()` |

Rules: exactly one owning teacher (FK). `teacher_id` must reference an existing teacher
(rejects assigning a non-existent teacher — FR-008). Soft delete via `deleted_at`; inactive
courses excluded from active listings and closed to new enrollments.

### `enrollments` — many-to-many join (Student ↔ Course)

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `student_id` | uuid | NOT NULL, FK → `students(id)` ON DELETE RESTRICT |
| `course_id` | uuid | NOT NULL, FK → `courses(id)` ON DELETE RESTRICT |
| `enrolled_at` | timestamptz | NOT NULL, default `now()` |
| `dropped_at` | timestamptz | NULL (drop = soft removal of the enrollment) |
| `created_at` | timestamptz | NOT NULL, default `now()` |

**Uniqueness (business rule FR-012):**
```sql
CREATE UNIQUE INDEX uq_active_enrollment
  ON enrollments (student_id, course_id)
  WHERE dropped_at IS NULL;
```
A student may hold at most one *active* enrollment per course, yet may re-enroll after dropping.
Dropping sets `dropped_at = now()` rather than deleting the row (preserves history).

### `grades` — letter result for an enrollment

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `enrollment_id` | uuid | NOT NULL, UNIQUE, FK → `enrollments(id)` ON DELETE RESTRICT |
| `letter` | grade_letter (enum) | NOT NULL (A/B/C/D/F) |
| `graded_by` | uuid | NOT NULL, FK → `teachers(id)` |
| `graded_at` | timestamptz | NOT NULL, default `now()` |
| `updated_at` | timestamptz | NOT NULL, default `now()` |

Rules: one grade per enrollment (`enrollment_id` UNIQUE) — updating a grade replaces the letter.
`letter` restricted to the enum (FR-016). A grade may only exist for an enrollment whose course
is owned by `graded_by` (enforced in the service layer — FR-017/FR-018). Grading requires an
active enrollment.

## Relationships summary

| From | To | Cardinality | FK |
|------|----|-------------|-----|
| students | users | 1:1 | students.user_id → users.id |
| teachers | users | 1:1 | teachers.user_id → users.id |
| courses | teachers | *:1 | courses.teacher_id → teachers.id |
| enrollments | students | *:1 | enrollments.student_id → students.id |
| enrollments | courses | *:1 | enrollments.course_id → courses.id |
| grades | enrollments | 1:1 | grades.enrollment_id → enrollments.id |
| grades | teachers | *:1 | grades.graded_by → teachers.id |

## Invariants (enforced by DB + service layer)

1. **Unique active enrollment** — partial unique index (DB). *[FR-012]*
2. **Grade letter domain** — enum constraint (DB) + Zod (boundary). *[FR-016]*
3. **One grade per enrollment** — unique FK (DB). *[FR-016]*
4. **Own-course grading only** — service checks `course.teacher_id == currentTeacher.id`. *[FR-017]*
5. **Enrolled-only grading** — service checks the enrollment is active before grading. *[FR-018]*
6. **Own-data reads** — service scopes student queries to `currentStudent.id`. *[FR-014/019]*
7. **No orphaning** — all FKs `ON DELETE RESTRICT`; removal is soft (`deleted_at`). *[FR-022]*
8. **Valid teacher on course** — FK rejects non-existent teacher assignment. *[FR-008]*

## State transitions

- **Enrollment**: `active` (enrolled_at set, dropped_at NULL) → `dropped` (dropped_at set). A new
  enrollment row is created to re-enroll after a drop.
- **Student / Course**: `active` (deleted_at NULL) → `inactive` (deleted_at set). Inactive is
  excluded from listings and blocks new enrollments.
- **Grade**: `absent` (no row) → `recorded` (letter set) → `recorded` (letter updated in place).

## Seed data (for tests & local dev)

- 1 admin user; 1 teacher user + teacher profile; 2 student users + student profiles.
- 1 course owned by the teacher; 1 active enrollment; 0 grades initially.
