# 🗄️ Database Configuration - PostgreSQL

This document provides comprehensive information about the Tutorly database structure, configuration, and setup.

---

**Document**: 07_Database_Configuration.md  
**Last Updated**: August 5, 2026  
**Version**: 1.0.0  
**Author**: Tutorly Development Team  

---

## 📋 Table of Contents

- [Overview](#overview)
- [Entity-Relationship Model](#entity-relationship-model)
- [Database Schema](#database-schema)
- [Installation and Setup](#installation-and-setup)
- [Configuration](#configuration)
- [Database Migrations](#database-migrations)
- [Troubleshooting](#troubleshooting)

---

## Overview

Tutorly uses **PostgreSQL 12+** as its relational database management system. The database stores all application data including:

- **Users**: Administrators and tutors with authentication credentials
- **Students**: Student information and academic profiles
- **Lessons**: Completed tutoring sessions
- **Prenotations**: Lesson bookings and reservations
- **Tests**: Student assessments and grades
- **Calendar Notes**: Planning and task management

### Database Specifications

| Specification | Value |
|--------------|-------|
| **DBMS** | PostgreSQL 12+ |
| **Default Database Name** | `tutorly_db` |
| **Character Encoding** | UTF-8 |
| **Collation** | Default (en_US.UTF-8) |
| **Connection Port** | 5432 (PostgreSQL default) |
| **ORM** | Hibernate 6.4+ (via Spring Data JPA) |

---

## Entity-Relationship Model

### ER Diagram

The following diagram illustrates the complete database structure with all entities and their relationships:

![Tutorly ER Model](TUTORLY_Normal.png)

---

## Database Schema

### Main Tables

#### 1. **Admin** (Administrators)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique administrator ID |
| `mail` | VARCHAR(255) | NOT NULL, UNIQUE | Email address |
| `password` | VARCHAR(255) | NOT NULL | Bcrypt-hashed password |
| `username` | VARCHAR(100) | NOT NULL, UNIQUE | Login username |

**Purpose**: Manage administrator accounts with full system privileges.

---

#### 2. **User** (Tutors/STAFF/GUEST - table `app_user`)

Renamed from `Tutor`/table `tutor`. See [06_Database_Migrations.md](06_Database_Migrations.md#manual-sql--code-migration-tutor--app_user-pack-table-guest-role) for the full migration and rationale (in short: a `GUEST` role was added for accounts that should only view their linked student's data, and since that's not really "a tutor" anymore, the table was renamed to the more general `app_user` - not `user`, since that's a reserved SQL keyword in PostgreSQL).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique user ID |
| `username` | VARCHAR(100) | NOT NULL, UNIQUE | Login username |
| `password` | VARCHAR(255) | NOT NULL | Bcrypt-hashed password |
| `status` | VARCHAR(20) | NOT NULL | Account status (ACTIVE/BLOCKED) |
| `role` | VARCHAR(20) | NOT NULL | Role (GENERIC/STAFF/GUEST) |
| `mail` | VARCHAR(255) | | Email address, optional (unlike `Admin.mail`, no format check) |

**Purpose**: Store tutor, STAFF, and GUEST accounts with role-based access control.

**Status Values**:
- `ACTIVE` - Can log in and use the system
- `BLOCKED` - Account disabled, login prevented

**Role Values**:
- `STAFF` - Full access (manage students, view all lessons, export reports, student profile pages)
- `GENERIC` - Limited access (own lessons only)
- `GUEST` - Intended for a parent/guardian who should only see their linked student(s) (see `Student.id_user` below) - **the view-restriction itself isn't implemented yet**, a `GUEST` account today authenticates and sees data like a `GENERIC` tutor would

---

#### 3. **AdminCreatesUser** (Associative Entity)

Renamed from `AdminCreatesTutor` (its `id_tutor` column renamed to `id_user`) alongside the table 2 rename above. As with `Test` above, this table's real columns are prefix-style (`id_admin`, `id_user`), not the `admin_id`/`user_id` suffix style shown below - see [Database/init.sql](../Database/init.sql).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `admin_id` | BIGINT | FK → Admin(id) | Administrator who created the user |
| `user_id` | BIGINT | FK → User(id) | Created user |
| `timestamp` | TIMESTAMP | NOT NULL | Creation date/time |

**Purpose**: Track which admin created each user account and when. (*Note: While the ER diagram suggests a (1,1) cardinality, the backend implements this as a join table to allow auditing creation history*).

**Composite Primary Key**: (`id_admin`, `id_user`)

---

#### 4. **Student**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique student ID |
| `name` | VARCHAR(100) | NOT NULL | First name |
| `surname` | VARCHAR(100) | NOT NULL | Last name |
| `student_class` | VARCHAR(10) | | Class/grade (e.g., "3Ainfo") |
| `description` | TEXT | | Additional notes |
| `status` | VARCHAR(20) | NOT NULL | Student status (ACTIVE/INACTIVE) |
| `id_user` | BIGINT | FK → User(id), nullable | The `GUEST` account (if any) allowed to view this student - see [User](#2-user-tutorsstaffguest---table-app_user) above |

**Purpose**: Store student information and academic details.

---

#### 5. **Lesson**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique lesson ID |
| `description` | TEXT | | Lesson content/topics covered |
| `start_time` | TIMESTAMP | NOT NULL | Lesson start date/time |
| `end_time` | TIMESTAMP | NOT NULL | Lesson end date/time |
| `tutor_id` | BIGINT | FK → User(id), NOT NULL | Tutor who conducted the lesson |
| `student_id` | BIGINT | FK → Student(id), NOT NULL | Student who attended |
| `id_pack` | BIGINT | FK → Pack(id), nullable | The lesson package this lesson was drawn from, if any |

**Purpose**: Record completed tutoring sessions.

**Constraints**:
- `end_time` must be after `start_time`
- One tutor and one student per lesson
- A lesson doesn't have to belong to a `Pack`

---

#### 6. **Prenotation** (Bookings)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique booking ID |
| `created_at` | TIMESTAMP | NOT NULL | Booking creation timestamp |
| `start_time` | TIMESTAMP | NOT NULL | Scheduled start time |
| `end_time` | TIMESTAMP | NOT NULL | Scheduled end time |
| `flag` | BOOLEAN | NOT NULL | Booking status (false = pending, true = confirmed) |
| `student_id` | BIGINT | FK → Student(id), NOT NULL | Student booking the lesson |
| `tutor_id` | BIGINT | FK → User(id), NOT NULL | Assigned tutor |
| `creator_id` | BIGINT | FK → User(id) | User who created the booking |

**Purpose**: Manage lesson reservations and scheduling.

**Flag Values**:
- `false` - Pending, awaiting approval or unconfirmed
- `true` - Confirmed, approved, or completed

---

#### 7. **Test**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique test ID |
| `description` | TEXT | | Description of the test content |
| `mark` | DOUBLE PRECISION | CHECK (0-10) | Test score/grade, 0-10 scale with half-points (e.g. 7.5) |
| `subject` | VARCHAR(255) | | Subject/topic the test covers (e.g. "Matematica"), free text |
| `day` | DATE | NOT NULL | Test date |
| `id_tutor` | BIGINT | FK → User(id), NOT NULL | Tutor who administered the test |
| `id_student` | BIGINT | FK → Student(id), NOT NULL | Student who took the test |

**Purpose**: Track student assessments and performance.

> **Note:** this table's actual foreign-key columns are named `id_tutor`/`id_student` (prefix), not `tutor_id`/`student_id` (suffix) as this doc's other table sections show - see [Database/init.sql](../Database/init.sql) for the authoritative schema. `mark`'s type was `INTEGER` until it was migrated to `DOUBLE PRECISION` to support half-point grades, and its check constraint was later tightened from `0-30` to the app's actual `0-10` scale (see [06_Database_Migrations.md](06_Database_Migrations.md)); `subject` was added in the same release as the type change.

---

#### 8. **CalendarNote**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique note ID |
| `description` | TEXT | NOT NULL | Note content/task description |
| `start_time` | TIMESTAMP | NOT NULL | Note/event start time |
| `end_time` | TIMESTAMP | NOT NULL | Note/event end time |
| `creator_id` | BIGINT | FK → User(id), NOT NULL | Tutor who created the note |

**Purpose**: Calendar reminders, tasks, and planning notes.

**Many-to-Many Relationship**: `CalendarNote ↔ User` (via `has` join table)
- A note can be shared with multiple tutors
- A tutor can see multiple notes

---

#### 9. **Pack** (Lesson Packages)

Full REST API (`PackController`/`PackService`) - see [01_Java_Backend_API.md - Packs](01_Java_Backend_API.md#packs) for endpoints and the server-side matching/splitting logic that draws lessons from a pack.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique pack ID |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Audit timestamp, set when the record is created |
| `start_time` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When the package starts being usable - a lesson can only be drawn from a pack if it starts after this |
| `hours` | DOUBLE PRECISION | NOT NULL | Total hours purchased in this package |
| `closure` | DATE | nullable | Date the package was closed/expired; null while still active |
| `id_student` | BIGINT | FK → Student(id), NOT NULL | The student this package belongs to |

**Purpose**: Track prepaid blocks of tutoring hours purchased for a student. A `Lesson` can optionally reference a `Pack` via `lesson.id_pack` (FK is `ON DELETE SET NULL` - deleting a pack clears this on its lessons rather than deleting them) to track which package it was drawn from.

---

### Relationships Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| **Admin → User** | Many-to-Many | An admin can create multiple users; tracked via `AdminCreatesUser` |
| **User → Lesson** | One-to-Many | A tutor conducts many lessons |
| **Student → Lesson** | One-to-Many | A student attends many lessons |
| **User → Prenotation** | One-to-Many (2 roles) | As assigned tutor OR as creator |
| **Student → Prenotation** | One-to-Many | A student can have many bookings |
| **User → Test** | One-to-Many | A tutor administers many tests |
| **Student → Test** | One-to-Many | A student takes many tests |
| **User → CalendarNote** | Many-to-Many | Tutors can create and share notes |
| **Student → Pack** | One-to-Many | A student can have many lesson packages |
| **Pack → Lesson** | One-to-Many, optional | A package can have lessons drawn from it; a lesson doesn't need a package |
| **User → Student** | One-to-Many, optional | A `GUEST` user can be linked to student(s) via `Student.id_user` - visibility restriction not yet enforced |

---

## Installation and Setup

### Prerequisites

- **PostgreSQL 12+** installed and running
- **Superuser Access** (e.g., `postgres` user)
- **Network Access** to port 5432 (or configured port)

### 1. Install PostgreSQL

#### Ubuntu/Debian

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

#### Fedora/RHEL

```bash
# Install PostgreSQL
sudo dnf install postgresql-server postgresql-contrib

# Initialize database cluster
sudo postgresql-setup --initdb

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS

```bash
# Using Homebrew
brew install postgresql@14

# Start service
brew services start postgresql@14
```

#### Windows

1. Download installer from [PostgreSQL.org](https://www.postgresql.org/download/windows/)
2. Run installer and follow setup wizard
3. Note the password you set for `postgres` user
4. PostgreSQL service starts automatically

---

### 2. Create Tutorly Database

#### Option A: Using psql Command Line

```bash
# Connect as postgres superuser
sudo -u postgres psql

# Or on Windows/macOS:
psql -U postgres
```

**Create database and user:**

```sql
-- Create database
CREATE DATABASE tutorly_db
    WITH ENCODING 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE template0;

-- Create dedicated user (recommended for production)
CREATE USER tutorly_admin WITH PASSWORD 'tutorly1234?';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE tutorly_db TO tutorly_admin;

-- Grant schema privileges (PostgreSQL 15+)
\c tutorly_db
GRANT ALL ON SCHEMA public TO tutorly_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tutorly_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tutorly_admin;

-- Exit
\q
```

#### Option B: Using pgAdmin (GUI)

1. Open **pgAdmin** and connect to your PostgreSQL server
2. Right-click **Databases** → **Create** → **Database...**
3. **Database name**: `tutorly_db`
4. **Encoding**: UTF8
5. **Owner**: postgres (or create a new user)
6. Click **Save**

---

### 3. Verify Database Creation

```bash
# List databases
psql -U postgres -l

# Connect to tutorly_db
psql -U postgres -d tutorly_db

# Inside psql, list tables (should be empty initially)
\dt

# Exit
\q
```

---

### 4. Automatic Schema Creation

Tutorly uses **Hibernate** with `ddl-auto=update` to automatically create and update the database schema based on JPA entity classes.

**How it works**:
1. When the Java backend starts, Hibernate scans all `@Entity` classes
2. It compares entities with existing database tables
3. If tables don't exist, they are created automatically
4. If tables exist but columns are missing, they are added
5. ⚠️ **Existing columns are never deleted** (data safety)

**First Startup**:
- All tables will be created automatically
- Foreign key constraints will be established
- Indexes will be generated

**No manual SQL scripts required!**

---

## Configuration

### Java Backend Configuration

#### application.properties

Edit `Java/backend-api/src/main/resources/application.properties`:

```properties
# ===========================================
# DATABASE CONFIGURATION
# ===========================================

# JDBC URL
spring.datasource.url=jdbc:postgresql://localhost:5432/tutorly_db

# Database Credentials
spring.datasource.username=tutorly_admin
spring.datasource.password=tutorly1234?

# PostgreSQL Driver
spring.datasource.driver-class-name=org.postgresql.Driver

# ===========================================
# JPA / HIBERNATE CONFIGURATION
# ===========================================

# Automatically update schema (create tables if missing)
spring.jpa.hibernate.ddl-auto=update

# Show SQL queries in console (disable in production)
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# PostgreSQL Dialect
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# ===========================================
# CONNECTION POOL (HikariCP)
# ===========================================

# Maximum pool size
spring.datasource.hikari.maximum-pool-size=10

# Connection timeout (30 seconds)
spring.datasource.hikari.connection-timeout=30000

# Idle timeout (10 minutes)
spring.datasource.hikari.idle-timeout=600000

# Max lifetime (30 minutes)
spring.datasource.hikari.max-lifetime=1800000
```

**Security Best Practices**:

For production environments, use **environment variables** instead of hardcoded passwords:

```properties
spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/tutorly_db}
spring.datasource.username=${DB_USERNAME:tutorly_admin}
spring.datasource.password=${DB_PASSWORD}
```

Set environment variables:

```bash
export DB_URL="jdbc:postgresql://localhost:5432/tutorly_db"
export DB_USERNAME="tutorly_admin"
export DB_PASSWORD="your_secure_password"
```

---

### Node.js Frontend Configuration

The Node.js frontend **does not connect directly to the database**. It communicates with the Java backend API via HTTPS.

**Configuration** (already set in `server_utilities/config.js`):

```javascript
module.exports = {
  // Java Backend API
  JAVA_API_URL: process.env.JAVA_API_URL || 'https://localhost:8443',
  JAVA_API_KEY: process.env.JAVA_API_KEY || 'MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu',
  
  // No direct database connection needed
};
```

**Architecture**:
```
Node.js Frontend → HTTPS → Java Backend API → JDBC → PostgreSQL
```

---

### Connection String Format

**Basic Format**:
```
jdbc:postgresql://<host>:<port>/<database>
```

**Examples**:

```bash
# Local development
jdbc:postgresql://localhost:5432/tutorly_db

# Remote server
jdbc:postgresql://192.168.1.100:5432/tutorly_db

# With SSL
jdbc:postgresql://db.example.com:5432/tutorly_db?ssl=true&sslfactory=org.postgresql.ssl.NonValidatingFactory

# Cloud database (e.g., AWS RDS)
jdbc:postgresql://tutorly-db.abc123.us-east-1.rds.amazonaws.com:5432/tutorly_db
```

---

## Database Migrations

### Password Hashing Migration

If you have existing data with **plain-text passwords**, you must migrate them to **bcrypt hashes**.

📚 **Complete migration guide**: [06_Database_Migrations.md](06_Database_Migrations.md)

**Quick Steps**:

1. **Backup your database**:
   ```bash
   pg_dump -U postgres tutorly_db > tutorly_backup.sql
   ```

2. **Run migration script**:
   ```bash
   cd Nodejs/migrations
   node hashExistingPasswords.js
   ```

3. **Verify**:
   - All passwords in `admin` and `app_user` tables should start with `$2b$10$`
   - Test login functionality

**When to Run**:
- ✅ After importing old data
- ✅ When upgrading from a version without bcrypt
- ❌ Not needed for fresh installations

---

### Schema Migrations

Hibernate's `ddl-auto=update` handles most schema changes automatically. For complex migrations:

#### Option 1: Flyway (Recommended for Production)

Add to `pom.xml`:

```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
```

Create migration scripts in `src/main/resources/db/migration/`:

```sql
-- V1__Initial_schema.sql
-- V2__Add_student_email.sql
-- V3__Add_lesson_rating.sql
```

#### Option 2: Manual SQL Scripts

```bash
# Connect to database
psql -U tutorly_admin -d tutorly_db

# Run script
\i /path/to/migration_script.sql
```

---

## Troubleshooting

### Connection Refused

**Problem**: `Connection refused` or `Could not connect to server`

**Solutions**:

1. **Verify PostgreSQL is running**:
   ```bash
   sudo systemctl status postgresql  # Linux
   brew services list                # macOS
   # Windows: Check Services app
   ```

2. **Check if PostgreSQL is listening**:
   ```bash
   sudo netstat -plnt | grep 5432
   # or
   sudo lsof -i :5432
   ```

3. **Edit pg_hba.conf** (authentication):
   ```bash
   # Location varies by OS:
   # Ubuntu: /etc/postgresql/14/main/pg_hba.conf
   # macOS: /usr/local/var/postgres/pg_hba.conf
   
   # Add line:
   host    all    all    127.0.0.1/32    md5
   ```

4. **Edit postgresql.conf** (listening addresses):
   ```bash
   # Find line:
   listen_addresses = 'localhost'
   
   # Or for all interfaces:
   listen_addresses = '*'
   ```

5. **Restart PostgreSQL**:
   ```bash
   sudo systemctl restart postgresql
   ```

---

### Authentication Failed

**Problem**: `FATAL: password authentication failed for user "tutorly_admin"`

**Solutions**:

1. **Verify credentials in application.properties**:
   ```properties
   spring.datasource.username=tutorly_admin
   spring.datasource.password=tutorly1234?
   ```

2. **Reset password**:
   ```bash
   psql -U postgres
   ALTER USER tutorly_admin WITH PASSWORD 'new_password';
   ```

3. **Grant privileges**:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE tutorly_db TO tutorly_admin;
   ```

---

### Database Does Not Exist

**Problem**: `FATAL: database "tutorly_db" does not exist`

**Solution**:

```bash
# Create database
psql -U postgres -c "CREATE DATABASE tutorly_db;"

# Verify
psql -U postgres -l | grep tutorly
```

---

### Tables Not Created

**Problem**: Tables don't appear after starting backend

**Solutions**:

1. **Check Hibernate configuration**:
   ```properties
   # Should be 'update', not 'none' or 'validate'
   spring.jpa.hibernate.ddl-auto=update
   ```

2. **Look for errors in logs**:
   ```bash
   # Check backend console output for:
   # - "Table already exists" (OK)
   # - "Permission denied" (privileges issue)
   # - "Syntax error" (entity mapping issue)
   ```

3. **Manually create tables** (last resort):
   ```bash
   # Generate SQL from entities
   mvn clean compile
   # Check target/generated-sources/ for SQL scripts
   ```

---

### Slow Queries

**Problem**: Database operations are slow

**Solutions**:

1. **Add indexes** for frequently queried columns:
   ```sql
   CREATE INDEX idx_lesson_start_time ON lesson(start_time);
   CREATE INDEX idx_lesson_tutor_id ON lesson(tutor_id);
   CREATE INDEX idx_student_status ON student(status);
   ```

2. **Analyze query performance**:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM lesson WHERE tutor_id = 5;
   ```

3. **Increase connection pool size**:
   ```properties
   spring.datasource.hikari.maximum-pool-size=20
   ```

---

### Constraint Violations

**Problem**: `ERROR: duplicate key value violates unique constraint`

**Solution**: Unique constraint violation (e.g., duplicate username)

```sql
-- Find duplicates
SELECT username, COUNT(*) 
FROM app_user 
GROUP BY username 
HAVING COUNT(*) > 1;

-- Fix duplicates (manual cleanup required)
```

---

## Database Backup and Restore

### Backup

```bash
# Full database backup
pg_dump -U postgres tutorly_db > tutorly_backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump -U postgres tutorly_db | gzip > tutorly_backup_$(date +%Y%m%d).sql.gz

# Backup with inserts (for compatibility)
pg_dump -U postgres --inserts tutorly_db > tutorly_backup_inserts.sql
```

### Restore

```bash
# Drop existing database (WARNING: data loss!)
psql -U postgres -c "DROP DATABASE tutorly_db;"
psql -U postgres -c "CREATE DATABASE tutorly_db;"

# Restore from backup
psql -U postgres tutorly_db < tutorly_backup.sql

# Or from compressed
gunzip -c tutorly_backup.sql.gz | psql -U postgres tutorly_db
```

---

## Performance Optimization

### Recommended Settings for Production

**postgresql.conf**:

```ini
# Memory
shared_buffers = 256MB              # 25% of RAM
effective_cache_size = 1GB          # 50-75% of RAM
work_mem = 10MB
maintenance_work_mem = 128MB

# Checkpoints
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Query Planner
default_statistics_target = 100

# Logging (for debugging)
log_min_duration_statement = 1000   # Log queries slower than 1s
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

**Restart after changes**:
```bash
sudo systemctl restart postgresql
```

---

## Monitoring

### Useful Queries

```sql
-- List all tables and row counts
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
       n_live_tup AS rows
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Active connections
SELECT datname, usename, application_name, client_addr, state, query
FROM pg_stat_activity
WHERE datname = 'tutorly_db';

-- Database size
SELECT pg_size_pretty(pg_database_size('tutorly_db'));

-- Table sizes
SELECT tablename, 
       pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

---

## Security Checklist

- [ ] Database uses strong password (not default)
- [ ] Database user has minimal required privileges (not superuser)
- [ ] `pg_hba.conf` restricts connections to trusted hosts
- [ ] SSL/TLS enabled for remote connections
- [ ] Regular backups scheduled (daily recommended)
- [ ] Passwords stored as bcrypt hashes (see [06_Database_Migrations.md](06_Database_Migrations.md))
- [ ] `application.properties` passwords stored in environment variables (production)
- [ ] PostgreSQL updated to latest stable version
- [ ] Firewall rules restrict port 5432 access
- [ ] Database logs reviewed regularly

---

## Additional Resources

### Official Documentation
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Spring Data JPA Reference](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)
- [Hibernate Documentation](https://hibernate.org/orm/documentation/)

### Related Tutorly Documentation
- **Java Backend Configuration**: [01_Java_Backend_API.md](01_Java_Backend_API.md#setup-and-configuration)
- **Password Migration**: [06_Database_Migrations.md](06_Database_Migrations.md)
- **Project Overview**: [00_Project_Overview.md](00_Project_Overview.md)

---

**Navigation**  
⬅️ **Previous**: [06_Database_Migrations.md](06_Database_Migrations.md)  
🏠 **Home**: [Documentation Index](README.md)

---

**Last Updated**: August 5, 2026
