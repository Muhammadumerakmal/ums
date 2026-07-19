# Feature Specification: Core University Management System

**Feature Branch**: `001-core-ums`  
**Created**: 2026-07-19  
**Status**: Draft  
**Input**: User description: "Core University Management System slice. Domain entities: Students, Courses, Enrollment (many-to-many between students and courses), and Grades. Three roles with server-side RBAC: Admin, Teacher, Student. Backend MUST follow MVC architecture within the Next.js app on the Node.js runtime, backed by Neon serverless Postgres. AI assistant is OUT OF SCOPE for this spec."

## Clarifications

### Session 2026-07-19

- Q: How should the people data model be structured (User accounts vs. Student/Teacher records)? → A: Separate profiles — a `users` account (identity + credentials + role) with distinct Student and Teacher profile records linked one-to-one to a User.
- Q: What format should grades use? → A: Letter grade A–F (a value from the fixed set {A, B, C, D, F}).
- Q: When removing a Course or Student that has enrollments/grades, what should happen? → A: Soft delete — records are marked inactive rather than physically deleted; a hard delete that would orphan enrollments/grades is blocked. Grade history is preserved.
- Q: How should authentication be implemented? → A: Custom authentication with hashed passwords (bcrypt) and token-based (JWT) sessions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure sign-in with role-based access (Priority: P1)

Any member of the university (administrator, teacher, or student) signs in with their
credentials and is taken to a dashboard that shows only what their role permits. An
administrator sees management tools; a teacher sees their own courses; a student sees their
own courses and grades. Someone who is not signed in cannot reach any protected area.

**Why this priority**: Every other capability depends on knowing who the user is and what they
are allowed to do. Without trustworthy sign-in and role separation, no data can be safely shown
or changed. This is the foundational MVP slice.

**Independent Test**: Create one user of each role, sign in as each, and confirm each lands on
the correct dashboard and cannot open pages or data belonging to another role. Confirm a signed-out
visitor is redirected to sign-in.

**Acceptance Scenarios**:

1. **Given** a registered administrator, **When** they sign in with valid credentials, **Then**
   they land on the admin dashboard with access to student, course, and user management.
2. **Given** a registered student, **When** they attempt to open an administrator-only page,
   **Then** access is denied and they are not shown any administrative data.
3. **Given** a visitor who is not signed in, **When** they request any protected page or data,
   **Then** they are redirected to sign-in and no protected data is returned.
4. **Given** a user with invalid credentials, **When** they attempt to sign in, **Then** they
   receive a clear error and remain signed out.

---

### User Story 2 - Administrator manages students and courses (Priority: P1)

An administrator maintains the university's core records: creating, viewing, updating, and
removing students and courses, and assigning a teacher as the owner of each course.

**Why this priority**: Students and courses are the master data every other feature references.
Enrollment and grading cannot happen until these records exist and courses have an owning teacher.

**Independent Test**: Sign in as an administrator, create a student and a course, assign a
teacher to the course, edit each record, and remove a record — confirming each change persists
and is reflected in listings.

**Acceptance Scenarios**:

1. **Given** an administrator on the admin dashboard, **When** they create a student with valid
   details, **Then** the student appears in the student list and can be retrieved later.
2. **Given** an administrator, **When** they create a course and assign an existing teacher as
   its owner, **Then** the course lists that teacher as owner.
3. **Given** an existing student, **When** an administrator edits the student's details, **Then**
   the updated details are saved and shown.
4. **Given** a course with no enrollments, **When** an administrator removes it, **Then** it no
   longer appears in the course list.
5. **Given** a required field is missing or invalid, **When** the administrator submits, **Then**
   the record is not created and a clear validation message is shown.

---

### User Story 3 - Student enrolls in and drops courses (Priority: P2)

A student browses available courses, enrolls in a course, sees their current enrollments, and
drops a course they no longer want.

**Why this priority**: Enrollment is the central relationship of the system and the primary
student-facing action, but it depends on students and courses (P1) already existing.

**Independent Test**: Sign in as a student, enroll in a course, confirm it appears in "my
courses", attempt to enroll in the same course again (must be prevented), then drop it and
confirm it is removed.

**Acceptance Scenarios**:

1. **Given** a student viewing available courses, **When** they enroll in a course they are not
   yet in, **Then** the course appears in their enrolled courses.
2. **Given** a student already enrolled in a course, **When** they attempt to enroll in the same
   course again, **Then** the second enrollment is rejected and they see a clear message.
3. **Given** a student enrolled in a course, **When** they drop it, **Then** it is removed from
   their enrolled courses.
4. **Given** a student, **When** they view their dashboard, **Then** they see only their own
   enrollments and never another student's.

---

### User Story 4 - Teacher grades students in their own courses (Priority: P2)

A teacher views the roster of students enrolled in a course they own and records or updates a
grade for each student. A teacher cannot view or grade courses they do not own.

**Why this priority**: Grading delivers the core academic outcome, but it depends on enrollment
(P2) and on course ownership (P1) already being in place.

**Independent Test**: Sign in as a teacher, open a course they own, record a grade for an
enrolled student, update it, and confirm the student can see it. Then confirm the teacher cannot
open or grade a course owned by a different teacher.

**Acceptance Scenarios**:

1. **Given** a teacher who owns a course, **When** they open that course, **Then** they see the
   list of students currently enrolled in it.
2. **Given** a teacher viewing their own course roster, **When** they record a grade for an
   enrolled student, **Then** the grade is saved and visible to that student.
3. **Given** a teacher, **When** they attempt to view or grade a course they do not own, **Then**
   access is denied.
4. **Given** a recorded grade, **When** the owning teacher updates it, **Then** the new grade
   replaces the old one for that student in that course.

---

### User Story 5 - Student views their grades (Priority: P3)

A student views the grades they have received across the courses they are enrolled in.

**Why this priority**: This is the read-only payoff of the grading flow; valuable but dependent
on grades (P2) already being recorded.

**Independent Test**: Sign in as a student who has a recorded grade and confirm the grade is
visible against the correct course, and that no other student's grades are shown.

**Acceptance Scenarios**:

1. **Given** a student with a recorded grade, **When** they view their grades, **Then** they see
   the grade against the correct course.
2. **Given** a student enrolled in a course with no grade yet, **When** they view their grades,
   **Then** that course shows as not-yet-graded rather than an error.

---

### Edge Cases

- **Duplicate enrollment**: A student attempting to enroll twice in the same course is rejected
  (each student may be enrolled in a given course at most once).
- **Grading a non-enrolled student**: A teacher cannot record a grade for a student who is not
  enrolled in that course.
- **Cross-ownership access**: A teacher acting on a course they do not own is denied.
- **Cross-tenant data access**: A student requesting another student's enrollments or grades is
  denied.
- **Deleting referenced records**: Removing a course or student that has enrollments/grades must
  behave predictably (either blocked or cascaded per a documented rule) rather than leaving
  orphaned records.
- **Assigning a non-existent teacher** to a course is rejected.
- **Empty states**: Dashboards with no students, courses, enrollments, or grades render an empty
  state rather than an error.
- **Session expiry**: An expired session is treated as signed-out and redirected to sign-in.

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & Authorization**

- **FR-001**: System MUST allow a registered user to sign in with credentials and MUST reject
  invalid credentials with a clear message. Passwords MUST be stored only as secure hashes
  (never plaintext), and sessions MUST be maintained via a signed token issued at sign-in.
- **FR-002**: System MUST assign every user exactly one role from: Administrator, Teacher, Student.
- **FR-003**: System MUST enforce role permissions on the server for every action and data
  request, denying by default any request lacking an explicit permission.
- **FR-004**: System MUST redirect or reject unauthenticated requests to protected pages and data.
- **FR-005**: System MUST route each signed-in user to the dashboard appropriate to their role.

**Student & Course Management (Administrator)**

- **FR-006**: Administrators MUST be able to create, view, update, and remove student records.
- **FR-007**: Administrators MUST be able to create, view, update, and remove course records.
- **FR-008**: System MUST allow a course to be assigned an owning teacher, and MUST reject
  assignment of a teacher that does not exist.
- **FR-009**: System MUST validate required fields on students and courses and reject invalid
  submissions with clear messages.

**Enrollment (Student)**

- **FR-010**: Students MUST be able to view courses available to enroll in.
- **FR-011**: Students MUST be able to enroll in a course they are not already enrolled in.
- **FR-012**: System MUST prevent a student from being enrolled in the same course more than once.
- **FR-013**: Students MUST be able to drop a course they are enrolled in.
- **FR-014**: Students MUST be able to view the list of their own current enrollments only.

**Grading (Teacher & Student)**

- **FR-015**: Teachers MUST be able to view the roster of students enrolled in courses they own.
- **FR-016**: Teachers MUST be able to record and update a grade for a student enrolled in a
  course they own. A grade MUST be a value from the fixed set {A, B, C, D, F}; any other value
  is rejected.
- **FR-017**: System MUST prevent a teacher from viewing or grading a course they do not own.
- **FR-018**: System MUST prevent recording a grade for a student not enrolled in that course.
- **FR-019**: Students MUST be able to view their own grades only, across their enrolled courses.

**Data Integrity**

- **FR-020**: System MUST persist all records durably so they survive across sessions.
- **FR-021**: System MUST keep relationships consistent (an enrollment always references a real
  student and real course; a grade always references a real enrollment/roster entry).
- **FR-022**: System MUST use soft deletion for Students and Courses — removal marks the record
  inactive rather than physically deleting it, preserving related enrollments and grades. A hard
  delete that would orphan enrollments or grades MUST be blocked. Inactive students/courses are
  excluded from active listings and cannot receive new enrollments.

### Key Entities *(include if feature involves data)*

- **User**: An account that can sign in. Holds identity (e.g., email/name), a secure password
  hash, and exactly one role (Administrator, Teacher, or Student). Serves as the authentication
  and authorization record; domain profiles link to it.
- **Student**: A learner profile linked one-to-one to a User of role Student. Has profile
  details and an active/inactive status, and may be enrolled in many courses.
- **Teacher**: An instructor profile linked one-to-one to a User of role Teacher. Owns zero or
  more courses.
- **Course**: A unit of instruction with identifying details (e.g., title/code), an owning
  Teacher, and an active/inactive status. May have many enrolled students.
- **Enrollment**: The link between one Student and one Course — the many-to-many relationship.
  Each (student, course) pair is unique. Carries enrollment status/date.
- **Grade**: The academic result for a specific Student in a specific Course they are enrolled
  in — a value from {A, B, C, D, F}. Belongs to a single enrollment/roster entry and is recorded
  by the owning Teacher.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user of any role can sign in and reach their correct dashboard in under 1 minute
  on first attempt.
- **SC-002**: 100% of attempts to access data or actions outside a user's role are denied (no
  cross-role data leakage in testing).
- **SC-003**: An administrator can create a complete student-and-course setup (a student, a
  course, and a teacher assignment) in under 3 minutes.
- **SC-004**: 100% of duplicate-enrollment attempts for the same student and course are rejected.
- **SC-005**: A teacher can record grades for an entire course roster, and each affected student
  sees their grade immediately afterward, with no student seeing another student's grade.
- **SC-006**: Every business rule (unique enrollment, own-course-only grading, enrolled-only
  grading, own-data-only viewing) is covered by an automated test that passes.

## Assumptions

- Sign-in uses hashed-password credentials with token-based sessions; self-service registration
  and password reset are not required for this slice (users are provisioned by an administrator
  or seed data).
- Each Student and each Teacher corresponds one-to-one to a User account; the initial dataset may
  be created via seed data for testing.
- Grades use letter values {A, B, C, D, F}; numeric scales, weighting, and GPA calculation are
  out of scope for this slice.
- Semesters/terms, scheduling, attendance, tuition/finance, and notifications are out of scope.
- English-only UI; accessibility and localization beyond reasonable defaults are out of scope.

## Out of Scope

- The AI assistant (OpenAI Agents SDK) — deferred to a separate future specification.
- Admissions, finance/tuition, attendance, timetabling/scheduling, transcripts/GPA, and
  prerequisites.
- Self-service account registration, email verification, and password reset flows.
- Reporting/analytics dashboards beyond the role dashboards described above.
