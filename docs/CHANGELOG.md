# Changelog

All notable changes to the Tutorly project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

**Internationalization (i18n)**
- Automatic English/Italian translation for the Dashboard, Calendar, Lessons, Staff Panel, Login, and Evaluations pages, detected from the browser's `Accept-Language` header (no manual switcher).
- `server_utilities/i18n.js`: language detection, dot-notation translation lookup with `{placeholder}` substitution, and an Express middleware exposing `t()`, `lang`, and `translations` to every EJS view via `res.locals`.
- `public/js/i18n.js`: client-side mirror of the same `t()` helper for dynamically-rendered content and alerts in `calendarScript.js`, `homeScript.js`, `lessonsScript.js`, `staffPanel.js`, and `reports.js`.
- `locales/en.json` / `locales/it.json` dictionaries covering navigation, shared modals, validation/error messages, and page-specific strings.

**Calendar**
- Weekly repeat option for prenotations: create the same prenotation across a date range, same day-of-week and time each week, in one submission.
- Continuous multi-day notes: a single note can span a start date/time to an end date/time across multiple days instead of one record per day.
- "All day" flag for notes: skips manual time entry and takes each selected day in full; all-day notes render in a dedicated row above the hourly grid instead of stretched across it.

**Evaluations (Reports)**
- New `/reports` page tracking student test marks, wired end-to-end to the Java backend's existing `Test` entity (previously unused - no route rendered it and nothing persisted).
- Add/delete evaluations (`POST`/`DELETE /api/tests`) with a real student dropdown, a subject dropdown, a 0-10 mark with half-point steps, a date, and an optional description.
- Per-student statistics: running average and an inline SVG progress chart (marks over time plus running-average line), filterable by date range and a student-name search bar.
- "Reports" navigation link added to Dashboard, Calendar, Lessons, and Staff Panel; logout button added to the page header (desktop + mobile), matching every other page.
- `Test.subject` field (free text) plus `Nodejs/config/subjects.json`, a fixed, non-translated reference list of subject names used only to populate the "Add Evaluation" subject dropdown; the subject field is required in the "Add Evaluation" form.
- Statistics cards are now grouped by student **and** subject (previously just by student), each with its own average and chart, and a subject badge on the card header.
- Student search/autocomplete added to the "Add Evaluation" form (same UX as the Lessons/Calendar/Home student pickers).
- Full i18n coverage (English/Italian) for the Evaluations page and its "Reports" nav link everywhere it appears.

**Student Profile Page** (STAFF only)
- New `/student/:id` page: a per-student deep dive combining evaluations, hours taught, and prenotations across **every** tutor who has worked with that student (not just the viewing STAFF member) - see [03_Nodejs_Frontend.md - Student Profile Page](03_Nodejs_Frontend.md#student-profile-page).
- Marks chart grouped by **subject + tutor** pair, one colored line per group (10-color palette), with a card-grid legend showing each group's average; click a legend card to toggle that line on/off in the chart.
- Chart x-axis date labels thin out dynamically so they never overlap regardless of how many evaluations are plotted.
- From/To date filter (same UX/default range as Evaluations) drives the marks chart, the "All Tests" list, the "Hours per Month" breakdown, and the "Avg mark" profile stat together.
- "Hours per Month" shown as exact hours/minutes (not decimal), capped to the 6 most recent months with lessons.
- Prenotations list (scrollable past ~5 entries) across every tutor, soonest-first; overdue ones shown in red and labeled "Expired" instead of "Pending".
- STAFF can click a prenotation to edit its date/time/tutor or delete it, reusing the same `PUT`/`DELETE /api/prenotations/:id` endpoints and edit-modal pattern as the Calendar page.
- Logout button, real session-driven navigation (previously a static mockup with no route, no auth, and hardcoded sample data).

**Accounts, GUEST Role & Lesson Packages**
- `Tutor` entity/table renamed to `User`/`app_user` (`user` is a reserved SQL keyword in PostgreSQL) to make room for a `GUEST` role - an account type intended for a parent/guardian who should only see their linked student's data. **The view-restriction for `GUEST` isn't implemented yet** - today it authenticates and sees data like a `GENERIC` tutor would; this is a data-model-only first step. See [06_Database_Migrations.md](06_Database_Migrations.md#manual-sql--code-migration-tutor--app_user-pack-table-guest-role).
- New `Student.id_user` (nullable FK to `app_user`): the `GUEST` account, if any, linked to a student.
- New `Pack` entity/table (id, hours, closure date, student) representing a prepaid block of tutoring hours; `Lesson.id_pack` (nullable) optionally links a lesson to the package it was drawn from.
- Java REST base path `/api/tutors` renamed to `/api/users` (`UserController`, formerly `TutorController`); every other controller's `/tutor/{tutorId}`-style sub-paths were deliberately left unchanged, since those describe the tutor *role* in that relationship, not the account type.

**Lesson Packages - full feature** (STAFF only)
- Full `Pack` REST API (`PackController`/`PackService`, previously entity + repository only): `GET/POST/PUT /api/packs`, `GET /api/packs/student/{studentId}`, `PUT /api/packs/{id}/close`, `DELETE /api/packs/{id}`. See [01_Java_Backend_API.md - Packs](01_Java_Backend_API.md#packs).
- `Pack` gained `createdAt` (audit-only) and `startTime` (required, user-editable) timestamp columns.
- New lessons are automatically drawn from the student's active pack when one is eligible (not closed, lesson starts after the pack's start time, hours still available); if a lesson only partially fits in the pack's remaining hours, it's **split into two lessons** - the portion that fits stays in the pack, the remainder is saved as a separate unassigned lesson.
- Creating a new pack retroactively absorbs the student's existing unassigned lessons starting at or after the pack's start time (same eligibility/splitting logic, processed chronologically until the pack's hours run out).
- `GET /api/packs/student/{studentId}` now reports each pack's `usedHours`, and for packs that are full and still open, `unassignedHours` and the earliest unassigned lesson's `firstUnassignedLessonStart`.
- Student Profile page: a "Packs" card below "Hours per Month" lists active packs with a progress bar; a full pack's card turns red with a "Close Package" button (`PUT /api/packs/:id/close`); if there are hours outside any pack, a "+ New Package" button opens the create-pack form pre-filled with the first unassigned lesson's date/time. The New Package form defaults Hours to 10 and Start Date/Time to now.
- `lesson.id_pack`'s FK changed from `ON DELETE CASCADE` to `ON DELETE SET NULL` - deleting a pack no longer deletes its lessons, only clears their `id_pack`. See [06_Database_Migrations.md](06_Database_Migrations.md#manual-sql-pack-timestamps-and-lessonid_pack-on-delete-set-null).

### Fixed
- `TestRepository.findByTutorId`/`findByStudentId` threw a 500 error (`UnknownPathException`) instead of returning results, because Spring Data JPA couldn't disambiguate the property path once `Test` gained `tutorId`/`studentId` JSON helper getters. Renamed to `findByTutor_Id`/`findByStudent_Id` (explicit underscore), matching the convention `LessonRepository` already used.
- `javaApiService.js`'s `fetchStudentData()` let a Java 404 reject the promise instead of resolving `null` like every other single-item fetch helper - this silently broke the Student Profile page's own "student not found" 404 handling, since the rejection was caught by the route's generic error handler (redirect to `/home`) before the explicit `if (!student)` check ever ran.

### Changed
- `Test.mark` changed from `Integer` to `Double` (DB column migrated to `double precision`) to support half-point grades, matching the 0-10 scale the Evaluations UI expects. See [06_Database_Migrations.md](06_Database_Migrations.md) for the manual SQL migration.
- `Test.mark`'s check constraint tightened from `0-30` (stale, unrelated to the app) to `0-10`, matching the scale the Evaluations UI has always enforced.
- `Database/init.sql` updated: `test` table gains a `subject` column, and its seed data now uses 0-10-scale marks with real subject names (previously an unrelated 0-30 scale with no subject); also updated for the `tutor` → `app_user` rename, the new `pack` table (`created_at`/`start_time` columns included), and `lesson.id_pack`'s `ON DELETE SET NULL` FK (see above).

### Removed
- `Database/POSTGRE_DB_CONFIG.TXT`: redundant near-duplicate of `Database/init.sql`'s schema (with plain-text passwords and no longer up to date).

### Planned
- E2E testing with Playwright
- Redis session storage for horizontal scaling
- Real-time notifications with WebSockets
- Mobile-responsive design improvements
- Email notifications for lesson confirmations
- Advanced reporting dashboard

---

## [1.0.0] - 2026-04-29

### Added

**Backend Architecture (Spring Boot & PostgreSQL)**
- Complete RESTful API architecture (Controller, Service, Repository, Entity layers).
- Centralized Exception Handling (`@RestControllerAdvice`) for standardized JSON error responses.
- Relational database schema with 8 entities (Users, Admins, Tutors, Students, Lessons, Prenotations, CalendarNotes, Tests).
- Database auto-generation and schema mapping (`ddl-auto=update`).
- Advanced Cloud-Ready Observability system using AspectJ (AOP) for automatic Controller/Service logging without boilerplate.
- MDC (Mapped Diagnostic Context) distributed tracking via injected `traceId` for each HTTP request.
- Logback configurable Profiles (Dev/Prod) with ANSI-colored, fixed-column, tabular CLI logs.
- API Key Authentication via HTTP Interceptors for secure endpoint access.
- Complete HTTPS/SSL Support activated natively via Self-Signed Certificates (`keystore.p12`).
- Desktop Launcher Application (Java Swing) for quick database configuration and server booting with real-time log tailing.

**Frontend Web Application (Node.js, Express, EJS)**
- Fully responsive Web interface using EJS server-side rendering.
- Role-Based Access Control (RBAC) with dual authentication systems: Admin Panel and Tutor Staff Panel.
- Progressive Web App (PWA) setup with Service Workers and custom manifest definitions for caching.
- Secure Session Management with configurable durations.
- Password Security Migration to bcrypt hashing.
- Excel Report Generation logic for lessons, monthly statistics, and student reports.
- Advanced CLI Logger (`logger.js`, `adminLogger.js`) featuring colored outputs and login attempt tracking (`admin_login_attempts.txt`).
- Custom API Aggregation module (`javaApiService.js`) to seamlessly map frontend requests to the Java backend.
- Local HTTPS Support setup for dual-layer secure development.

**Documentation**
- Comprehensive standardized documentation structure covering architecture, Database schema, PWA setup, and HTTPS config.
- Centralized Glossary, Testing Guide, Deployment Guide, and Contribution Guidelines.

### Security
- All passwords cryptographically hashed using `bcrypt`.
- API Key validation for all sensitive backend requests.
- Secure session management and validation.
- CORS configuration for API security restriction.

---

## Component Versions

### Current Stack (v1.0.0)

| Component | Version | Technology |
|-----------|---------|------------|
| Java Backend API | 1.0.0 | Spring Boot 3.4.1, Java 21 |
| Node.js Frontend | 1.0.0 | Express.js 4.18.2, Node.js 18+ |
| GUI Launcher | 1.0.0 | Java Swing, Java 21 |
| Database | 1.0.0 | PostgreSQL 12+ |

### Core Dependencies

**Java Backend:**
- Spring Boot 3.4.1
- Spring Data JPA
- Hibernate 6.x
- PostgreSQL Driver 42.7.1
- AspectJ (Weaver & Runtime) 1.9.21
- Maven 3.8+

**Node.js Frontend:**
- Express.js 4.18.2
- EJS 3.1.9
- bcrypt 5.1.1
- express-session 1.18.2
- ExcelJS 4.4.0
- Node.js 18.x+

## Migration Guides

### Migrating to v1.2.0

**IMPORTANT**: This version changes password storage from plain text to bcrypt hashes.

1. Backup your database before upgrading
2. Update Java backend to v1.2.0
3. Update Node.js frontend to v1.2.0
4. Run the password migration script:
   ```bash
   cd Nodejs
   node migrations/hashExistingPasswords.js
   ```
5. Verify all users can log in
6. Delete backup if everything works

### Migrating to v1.0.0 from Beta

1. Update database schema (Hibernate will auto-update)
2. Install new dependencies:
   ```bash
   cd Java/backend-api && mvn clean install
   cd Nodejs && npm install
   ```
3. Update configuration files with new settings
4. Restart all services

---

## Breaking Changes

### v1.2.0
- **Password Authentication**: Plain text passwords no longer supported. Must run migration script.
- **API Security**: All API requests now require `X-API-Key` header.
- **HTTPS**: Backend now requires HTTPS. Update client configurations.

### v1.0.0
- **Database Schema**: Significant schema changes from beta. Not backward compatible.
- **API Endpoints**: Several endpoints renamed for consistency.
- **Authentication**: New session-based authentication system.

---

## Known Issues

### Current Issues (v1.3.0)
- [ ] No automated tests for frontend routes (planned for v1.4.0)
- [ ] Self-signed certificates show browser warnings (expected in development)
- [ ] Large Excel exports may timeout (optimization planned)

### Resolved Issues
- [x] ~~Session timeout causing unexpected logouts~~ (Fixed in v1.1.0)
- [x] ~~Foreign key constraint errors on cascade delete~~ (Fixed in v1.0.0)
- [x] ~~Plain text password storage~~ (Fixed in v1.2.0)

---

## Contributing

See [docs/10_Contributing_Guide.md](docs/10_Contributing_Guide.md) for guidelines on contributing to this project.

All notable changes should be documented in this file when creating pull requests.

---

## Links

- **Documentation**: [docs/README.md](docs/README.md)
- **Repository**: https://github.com/skenny-dev/Tutorly (placeholder)
- **Issues**: GitHub Issues
- **License**: [LICENSE.txt](LICENSE.txt)

---

**Maintained by**: Tutorly Development Team (Skenny)  
**Email**: skenny.dev@gmail.com  
**Last Updated**: August 5, 2026
