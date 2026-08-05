# Database Migrations

This file explain how to migrate the database.

---

**Document**: 06_Database_Migrations.md  
**Last Updated**: August 5, 2026  
**Version**: 1.0.0  
**Author**: Tutorly Development Team  

---

## Available Migrations

### `hashExistingPasswords.js` 
Migrates plain-text passwords to bcrypt-hashed passwords in the database.

**⚠️ IMPORTANT:** This script should be run **ONLY ONCE** after implementing bcrypt authentication.

#### When to run:
- After updating to the bcrypt authentication system
- If you have existing users with plain-text passwords in the database
- Before deploying to production

#### Before running:
1. **Make a backup of your database**
2. Ensure the Java API server is running (`localhost:8443`)
3. Ensure you have the correct API key in `server_utilities/config.js`

#### How to run:
```bash
cd Nodejs
node migrations/hashExistingPasswords.js
```

#### What it does:
1. Fetches all tutors from the database
2. Checks if each password is already hashed (bcrypt hashes start with `$2`)
3. Skips already-hashed passwords
4. Hashes plain-text passwords using bcrypt
5. Updates each user with the hashed password
6. Repeats the process for admin users
7. Provides a colored summary of the migration

#### Output example:
```
========================================
  Password Migration Script
========================================

Fetching all tutors...
Found 5 tutors

[HASH] john_doe...
[SUCCESS] john_doe - Password hashed and updated
[SKIP] jane_smith - Already hashed
[HASH] bob_tutor...
[SUCCESS] bob_tutor - Password hashed and updated

Fetching all admins...
Found 2 admins

[HASH] Admin admin1...
[SUCCESS] Admin admin1 - Password hashed and updated

========================================
  Migration Complete!
  Updated: 3
  Skipped: 2
========================================
```

#### Troubleshooting:
- **Error: Cannot connect to Java API**: Ensure the Java backend is running on port 8443
- **Error: API key invalid**: Check the `JAVA_API_KEY` in `server_utilities/config.js`
- **Error: User not found**: The Java API may have changed its endpoints

#### Safety features:
- Auto-detects already hashed passwords and skips them
- Can be run multiple times safely (won't double-hash)
- Provides detailed logging of all operations
- Exits with error code if migration fails

---

### Manual SQL: `test.mark` → `DOUBLE PRECISION`

**⚠️ Not a checked-in script.** Unlike the migration above, this was a one-off manual SQL change run directly against Postgres via `psql` - there is no corresponding file under `Nodejs/migrations/`. Documented here so the schema change (and the data it discarded) has a record.

**Why:** The `test` table's `mark` column was `INTEGER`, but the Evaluations page (`/reports`) needed half-point marks (7.5, 8.5) on the 0-10 scale it already used. The table also held 10 placeholder seed rows on an unrelated 0-30 scale, which were cleared first rather than converted.

**What was run:**
```sql
-- 1. Clear placeholder seed data (0-30 scale, unrelated to the 0-10 UI)
DELETE FROM test;

-- 2. Widen the column to support half-point marks
ALTER TABLE test ALTER COLUMN mark TYPE DOUBLE PRECISION USING mark::double precision;
```

**Corresponding code changes:** `Test.java`'s `mark` field changed from `Integer` to `Double` (getter/setter/constructor), and `TestRepository`/`TestService`'s `getTestsByMinMark`/`findByMarkGreaterThanEqual` signatures updated to match. See [01_Java_Backend_API.md - Tests](01_Java_Backend_API.md#tests).

**Note:** `spring.jpa.hibernate.ddl-auto=update` (see `application.properties`) does **not** alter existing column types - it only adds missing tables/columns. A Java-only field type change would have caused a runtime type mismatch against the still-`INTEGER` column until this SQL was run by hand.

**If you're setting up a fresh database:** not needed - a new database created from the current entity mapping will get `DOUBLE PRECISION` from the start. This only applies to a database that already had the `test` table from before this change.

---

### Automatic: `test.subject` column added

**No manual action needed** - unlike the `mark` type change above, this was picked up automatically by `spring.jpa.hibernate.ddl-auto=update` on the next Java backend restart after `Test.java` gained a `subject` field. Hibernate's schema update *can* add missing columns (unlike altering an existing column's type), so no SQL had to be run by hand.

**What changed:** `Test.java` gained a nullable `subject` field (`String`, e.g. "Matematica"); `TestCreateDTO` and `TestController` updated to pass it through. See [01_Java_Backend_API.md - Tests](01_Java_Backend_API.md#tests). The list of subjects offered in the Evaluations page's "Add Evaluation" dropdown lives in `Nodejs/config/subjects.json` (not the database) - `subject` itself has no check constraint or enum, it's a free-text column.

**`Database/init.sql`** was updated to match (added the `subject VARCHAR(255)` column and updated the seed `test` rows with 0-10-scale marks and real subject names) - relevant only if you're bootstrapping a fresh database from that script rather than letting Hibernate create the schema.

---

### Manual SQL + Code Migration: `tutor` → `app_user`, `Pack` table, GUEST role

**⚠️ Breaking change - requires a downtime window with DB migration and code deploy done together.** Unlike every migration above, the old code and the new schema are **not** cross-compatible in either direction:
- The old Java/Node code queries a `tutor` table and `/api/tutors/*` endpoints that this migration removes.
- The new code queries `app_user` and `/api/users/*`, which don't exist until the SQL below has run.

Don't run the SQL against a database still being served by the old code, and don't deploy the new code against a database that hasn't been migrated yet.

**Why:** Introduces a `GUEST` account role (e.g. a parent/guardian who should only ever see their own child's data - the actual view-filtering for GUEST is a separate, not-yet-implemented follow-up) and lesson packages (`pack`, a prepaid block of hours a student can draw lessons from). Since `tutor` was gaining a role that isn't really "a tutor" (a GUEST doesn't teach), the table was renamed to the more general `app_user` at the same time. `user` was **not** used as the table name because it's a reserved SQL keyword in PostgreSQL - `CREATE TABLE user` fails without quoting every reference to it everywhere, which was judged worse than a slightly less on-the-nose name.

**What changed at the schema level:**
- `tutor` renamed to `app_user`; `role` check constraint extended to allow `GUEST` (previously only `GENERIC`/`STAFF`); `mail` column (nullable)
- `admin_creates_tutor` renamed to `admin_creates_user` (its `id_tutor` column renamed to `id_user`)
- New `student.id_user` column (nullable FK to `app_user`) - the GUEST account allowed to view that student, if any
- New `pack` table (id, hours, closure date, id_student) - lesson packages
- New `lesson.id_pack` column (nullable FK to `pack`) - a lesson doesn't have to belong to a package
- `test.mark`'s check constraint tightened from `0-30` to `0-10` - a stale range left over from before the Evaluations page's half-point 0-10 scale (see the `test.mark → DOUBLE PRECISION` entry above); unrelated to the rename, bundled in because it was noticed while touching this same file

**Corresponding code changes:** `Tutor` entity renamed to `User` (`@Table(name = "app_user")`); `TutorRepository`/`TutorService`/`TutorController` renamed to `UserRepository`/`UserService`/`UserController`; `UserController`'s REST base path changed from `/api/tutors` to `/api/users` (including `/api/users/login`). `AdminCreatesTutor`(`+Id`/`Repository`) renamed to `AdminCreatesUser`. `Lesson`, `Test`, `Prenotation`, `CalendarNote` now reference the `User` type instead of `Tutor`, but kept their own field names (`tutor`, `creator`), DB columns (`id_tutor`, `id_creator`), and sub-paths (e.g. `/api/lessons/tutor/{tutorId}`) unchanged - those describe the *role* a user plays in that relationship, not the account type, so renaming them would have been pure churn with no benefit. New `Pack` entity + `PackRepository` (a REST controller/service were added later - see [01_Java_Backend_API.md - Packs](01_Java_Backend_API.md#packs)). New `Lesson.pack` / `Student.user` relations. On the Node.js side: every `/api/tutors/*` call in `index.js`, `javaApiService.js`, `authService.js` (including the real login flow), and `migrations/hashExistingPasswords.js` updated to `/api/users/*`.

**`Database/init.sql`** was updated to match - only relevant if you're bootstrapping a brand-new database from that script rather than migrating an existing one; a fresh database doesn't need any of the steps below.

#### Step-by-step (existing database)

**1. Back up the database.**
```bash
pg_dump -h localhost -U tutorly_admin -d tutorly_db -F c -f tutorly_backup_$(date +%Y%m%d).dump
```
Do this even in development - the migration is reversible in principle (see "Rolling back" below), but not once new data has been written on top of the new columns/tables.

**2. Stop both servers.** Stop the Node.js frontend and the Java backend (or their systemd/PM2 services on a VPS) - the SQL in step 3 intentionally breaks the currently-deployed code.

**3. Run the migration, as one transaction:**
```sql
BEGIN;

-- tutor -> app_user (existing FKs auto-follow the rename by OID; no data loss)
ALTER TABLE tutor RENAME TO app_user;
ALTER SEQUENCE tutor_id_seq RENAME TO app_user_id_seq;
ALTER TABLE app_user RENAME CONSTRAINT tutor_pkey TO app_user_pkey;
ALTER TABLE app_user RENAME CONSTRAINT tutor_username_key TO app_user_username_key;
ALTER TABLE app_user RENAME CONSTRAINT tutor_status_check TO app_user_status_check;
ALTER TABLE app_user DROP CONSTRAINT tutor_role_check;
ALTER TABLE app_user ADD CONSTRAINT app_user_role_check CHECK (role IN ('GENERIC', 'STAFF', 'GUEST'));

-- Only if your `tutor` table doesn't already have a `mail` column
-- (it may already exist from an earlier, unrelated ddl-auto=update run):
-- ALTER TABLE app_user ADD COLUMN mail VARCHAR(255);

-- admin_creates_tutor -> admin_creates_user
ALTER TABLE admin_creates_tutor RENAME TO admin_creates_user;
ALTER TABLE admin_creates_user RENAME COLUMN id_tutor TO id_user;
ALTER TABLE admin_creates_user RENAME CONSTRAINT admin_creates_tutor_pkey TO admin_creates_user_pkey;
ALTER TABLE admin_creates_user RENAME CONSTRAINT admin_creates_tutor_id_admin_fkey TO admin_creates_user_id_admin_fkey;
ALTER TABLE admin_creates_user RENAME CONSTRAINT admin_creates_tutor_id_tutor_fkey TO admin_creates_user_id_user_fkey;

-- student.id_user: optional link to the GUEST account allowed to view this student
ALTER TABLE student ADD COLUMN id_user BIGINT;
ALTER TABLE student ADD CONSTRAINT student_id_user_fkey FOREIGN KEY (id_user) REFERENCES app_user(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- New pack table (lesson packages)
CREATE TABLE pack (
    id BIGSERIAL PRIMARY KEY,
    hours FLOAT NOT NULL,
    closure DATE,
    id_student BIGINT NOT NULL,
    FOREIGN KEY (id_student) REFERENCES student(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- lesson.id_pack: optional link from a lesson to the pack it was drawn from
ALTER TABLE lesson ADD COLUMN id_pack BIGINT;
ALTER TABLE lesson ADD CONSTRAINT lesson_id_pack_fkey FOREIGN KEY (id_pack) REFERENCES pack(id)
    ON DELETE CASCADE;

-- test.mark: tighten the stale 0-30 range to the app's actual 0-10 half-point scale
ALTER TABLE test DROP CONSTRAINT test_mark_check;
ALTER TABLE test ADD CONSTRAINT test_mark_check CHECK (mark >= 0 AND mark <= 10);

COMMIT;
```

**4. Verify no rows were lost** - compare against counts taken before step 2 (or from the step 1 backup):
```sql
SELECT 'app_user' t, count(*) FROM app_user UNION ALL
SELECT 'student', count(*) FROM student UNION ALL
SELECT 'lesson', count(*) FROM lesson UNION ALL
SELECT 'test', count(*) FROM test UNION ALL
SELECT 'prenotation', count(*) FROM prenotation;
```

**5. Deploy the new Java backend and Node.js code together** (see "Corresponding code changes" above). Rebuild the Java jar (`mvn clean package`) and restart the Node.js process.

**6. Smoke test:**
- Log in as an existing tutor/STAFF account (passwords are untouched by this migration)
- Load `/home`, `/calendar`, `/lessons`, `/reports`, `/staffPanel` - anywhere that shows tutor names or requires the tutor lookup to succeed
- If applicable, open a STAFF-only student profile page (`/student/:id`)

#### Rolling back

Only safe if nothing has used the new columns/tables yet (no GUEST accounts created, no packs created, no lesson assigned to a pack). If in doubt, restore from the step 1 backup instead of running this.

```sql
BEGIN;
ALTER TABLE test DROP CONSTRAINT test_mark_check;
ALTER TABLE test ADD CONSTRAINT test_mark_check CHECK (mark >= 0 AND mark <= 30);

ALTER TABLE lesson DROP CONSTRAINT lesson_id_pack_fkey;
ALTER TABLE lesson DROP COLUMN id_pack;
DROP TABLE pack;

ALTER TABLE student DROP CONSTRAINT student_id_user_fkey;
ALTER TABLE student DROP COLUMN id_user;

ALTER TABLE admin_creates_user RENAME CONSTRAINT admin_creates_user_id_user_fkey TO admin_creates_tutor_id_tutor_fkey;
ALTER TABLE admin_creates_user RENAME CONSTRAINT admin_creates_user_id_admin_fkey TO admin_creates_tutor_id_admin_fkey;
ALTER TABLE admin_creates_user RENAME CONSTRAINT admin_creates_user_pkey TO admin_creates_tutor_pkey;
ALTER TABLE admin_creates_user RENAME COLUMN id_user TO id_tutor;
ALTER TABLE admin_creates_user RENAME TO admin_creates_tutor;

ALTER TABLE app_user DROP CONSTRAINT app_user_role_check;
ALTER TABLE app_user ADD CONSTRAINT tutor_role_check CHECK (role IN ('GENERIC', 'STAFF'));
ALTER TABLE app_user RENAME CONSTRAINT app_user_status_check TO tutor_status_check;
ALTER TABLE app_user RENAME CONSTRAINT app_user_username_key TO tutor_username_key;
ALTER TABLE app_user RENAME CONSTRAINT app_user_pkey TO tutor_pkey;
ALTER SEQUENCE app_user_id_seq RENAME TO tutor_id_seq;
ALTER TABLE app_user RENAME TO tutor;
COMMIT;
```
This does **not** undo the Java/Node code changes - only redeploy this rollback against a database still running the *old* code, and redeploy the old code alongside it.

---

### Manual SQL: Pack timestamps and lesson.id_pack ON DELETE SET NULL

**⚠️ Not a checked-in script.** Like the `test.mark` migration above, these were one-off manual SQL changes run directly against Postgres via `psql`.

**Why:** The Pack feature (see [01_Java_Backend_API.md - Packs](01_Java_Backend_API.md#packs)) needed a `startTime` (when the pack starts being usable - required for the lesson auto-assignment/eligibility logic) and a `createdAt` audit timestamp, neither of which existed on the original `pack` table from the `tutor` → `app_user` migration above. Separately, `lesson.id_pack`'s FK was originally `ON DELETE CASCADE`, meaning deleting a pack silently deleted every lesson ever drawn from it - real attendance/billing history. Changed to `ON DELETE SET NULL` so deleting a pack only clears `id_pack` on its lessons.

**What was run:**
```sql
-- Add createdAt/startTime to the existing (empty) pack table
ALTER TABLE pack ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE pack ADD COLUMN start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Stop cascading lesson deletes when a pack is deleted
ALTER TABLE lesson DROP CONSTRAINT lesson_id_pack_fkey;
ALTER TABLE lesson ADD CONSTRAINT lesson_id_pack_fkey FOREIGN KEY (id_pack) REFERENCES pack(id)
    ON DELETE SET NULL;
```

**Corresponding code changes:** `Pack.java` gained `createdAt` (Java-side field-initializer default, same pattern as `Prenotation.createdAt` - not DTO-settable) and `startTime` (required, user-editable, passed through `PackCreateDTO`) fields. See [01_Java_Backend_API.md - Packs](01_Java_Backend_API.md#packs) for the full field list and the `PackService` business logic that uses `startTime` for pack-eligibility checks.

**If you're setting up a fresh database:** not needed - `Database/init.sql` was updated to match (`pack.created_at`/`pack.start_time` columns with `DEFAULT CURRENT_TIMESTAMP`, and `lesson.id_pack`'s FK already `ON DELETE SET NULL`). This only applies to a database that already had the `pack`/`lesson` tables from before this change.

---

## Creating New Migrations

When creating a new migration script:

1. Create a new file in this folder with a descriptive name (e.g., `addNewField.js`)
2. Add a detailed comment block explaining what it does
3. Include safety checks and rollback instructions
4. Document it in this guide
5. Test on a development database first
6. Always recommend backing up before running

### Migration template:
```javascript
/**
 * Migration: [Description]
 * 
 * ⚠️ WARNING: [Important warnings]
 * 
 * Usage: node migrations/[filename].js
 */

async function migrate() {
    try {
        // Migration logic here
        console.log('Migration complete');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
```
---

**Navigation**  
⬅️ **Previous**: [05_Service_Modules.md](05_Service_Modules.md) | **Next**: [07_Database_Configuration.md](07_Database_Configuration.md) ➡️  
🏠 **Home**: [Documentation Index](README.md)

---

**Last Updated**: August 5, 2026  