# 🗄️ Database Configuration - PostgreSQL

This document provides comprehensive information about the Tutorly database structure, configuration, and setup.

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

#### 2. **Tutor** (Tutors/Staff)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique tutor ID |
| `username` | VARCHAR(100) | NOT NULL, UNIQUE | Login username |
| `password` | VARCHAR(255) | NOT NULL | Bcrypt-hashed password |
| `status` | VARCHAR(20) | NOT NULL | Account status (ACTIVE/BLOCKED) |
| `role` | VARCHAR(20) | NOT NULL | Role (STAFF/NORMAL) |

**Purpose**: Store tutor accounts with role-based access control.

**Status Values**:
- `ACTIVE` - Can log in and use the system
- `BLOCKED` - Account disabled, login prevented

**Role Values**:
- `STAFF` - Full access (manage students, view all lessons, export reports)
- `NORMAL` - Limited access (own lessons only)

---

#### 3. **AdminCreatesTutor** (Associative Entity)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `admin_id` | BIGINT | FK → Admin(id) | Administrator who created the tutor |
| `tutor_id` | BIGINT | FK → Tutor(id) | Created tutor |
| `timestamp` | TIMESTAMP | NOT NULL | Creation date/time |

**Purpose**: Track which admin created each tutor account and when.

**Composite Primary Key**: (`admin_id`, `tutor_id`)

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

**Purpose**: Store student information and academic details.

---

#### 5. **Lesson**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique lesson ID |
| `description` | TEXT | | Lesson content/topics covered |
| `start_time` | TIMESTAMP | NOT NULL | Lesson start date/time |
| `end_time` | TIMESTAMP | NOT NULL | Lesson end date/time |
| `tutor_id` | BIGINT | FK → Tutor(id), NOT NULL | Tutor who conducted the lesson |
| `student_id` | BIGINT | FK → Student(id), NOT NULL | Student who attended |

**Purpose**: Record completed tutoring sessions.

**Constraints**:
- `end_time` must be after `start_time`
- One tutor and one student per lesson

---

#### 6. **Prenotation** (Bookings)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique booking ID |
| `start_time` | TIMESTAMP | NOT NULL | Scheduled start time |
| `end_time` | TIMESTAMP | NOT NULL | Scheduled end time |
| `flag` | VARCHAR(20) | NOT NULL | Booking status |
| `student_id` | BIGINT | FK → Student(id), NOT NULL | Student booking the lesson |
| `tutor_id` | BIGINT | FK → Tutor(id) | Assigned tutor |
| `creator_id` | BIGINT | FK → Tutor(id) | Tutor who created the booking |

**Purpose**: Manage lesson reservations and scheduling.

**Flag Values**:
- `PENDING` - Awaiting confirmation
- `CONFIRMED` - Approved and scheduled
- `CANCELLED` - Cancelled by user
- `COMPLETED` - Lesson finished (can convert to Lesson)

---

#### 7. **Test**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique test ID |
| `test_type` | VARCHAR(50) | NOT NULL | Type of assessment |
| `grade` | VARCHAR(10) | | Grade/score received |
| `date` | DATE | NOT NULL | Test date |
| `tutor_id` | BIGINT | FK → Tutor(id), NOT NULL | Tutor who administered the test |
| `student_id` | BIGINT | FK → Student(id), NOT NULL | Student who took the test |

**Purpose**: Track student assessments and performance.

---

#### 8. **CalendarNote**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique note ID |
| `description` | TEXT | NOT NULL | Note content/task description |
| `start_time` | TIMESTAMP | NOT NULL | Note/event start time |
| `end_time` | TIMESTAMP | | Optional end time (for time-blocks) |
| `creator_id` | BIGINT | FK → Tutor(id), NOT NULL | Tutor who created the note |

**Purpose**: Calendar reminders, tasks, and planning notes.

**Many-to-Many Relationship**: `CalendarNote ↔ Tutor` (via join table)
- A note can be shared with multiple tutors
- A tutor can see multiple notes

---

### Relationships Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| **Admin → Tutor** | Many-to-Many | An admin can create multiple tutors; tracked via `AdminCreatesTutor` |
| **Tutor → Lesson** | One-to-Many | A tutor conducts many lessons |
| **Student → Lesson** | One-to-Many | A student attends many lessons |
| **Tutor → Prenotation** | One-to-Many (2 roles) | As assigned tutor OR as creator |
| **Student → Prenotation** | One-to-Many | A student can have many bookings |
| **Tutor → Test** | One-to-Many | A tutor administers many tests |
| **Student → Test** | One-to-Many | A student takes many tests |
| **Tutor → CalendarNote** | Many-to-Many | Tutors can create and share notes |

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
   - All passwords in `admin` and `tutor` tables should start with `$2b$10$`
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
FROM tutor 
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

### Tools
- **pgAdmin**: [https://www.pgadmin.org/](https://www.pgadmin.org/) - GUI for PostgreSQL
- **DBeaver**: [https://dbeaver.io/](https://dbeaver.io/) - Universal database tool
- **TablePlus**: [https://tableplus.com/](https://tableplus.com/) - Modern database client

---

**Last Updated**: February 25, 2026
