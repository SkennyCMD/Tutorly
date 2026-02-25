# Changelog

All notable changes to the Tutorly project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- E2E testing with Playwright
- Redis session storage for horizontal scaling
- Real-time notifications with WebSockets
- Mobile-responsive design improvements
- Email notifications for lesson confirmations
- Advanced reporting dashboard
- Multi-language support (Italian, English)

---

## [1.3.0] - 2026-02-25

### Added
- **Documentation**: Complete documentation overhaul
  - Added 08_Testing_Guide.md with comprehensive testing strategies
  - Added 09_Deployment_Guide.md for production deployment
  - Added 10_Contributing_Guide.md with contribution guidelines
  - Added 11_Glossary.md with technical terms and acronyms
  - Added CHANGELOG.md for tracking project changes
- **Documentation**: Metadata headers with version, date, and author
- **Documentation**: Navigation links (Previous/Next) in all documents
- **Documentation**: Standardized Table of Contents across all files
- **Documentation**: 07_Database_Configuration.md with complete DB schema

### Changed
- **Documentation**: Fixed typos in multiple documentation files
- **Documentation**: Corrected broken internal links
- **Documentation**: Updated all cross-references to point to docs/ directory
- **Documentation**: Renamed "Server Utilities" to "Service Modules"
- **Documentation**: Updated all documents to February 25, 2026

### Fixed
- Documentation typo: "Laungher" → "Launcher"
- Documentation typo: "mirgate" → "migrate"
- Documentation link: Fixed inconsistent file paths

---

## [1.2.0] - 2026-02-17

### Added
- **Backend**: Complete HTTPS/SSL support for Java backend
- **Backend**: API Key authentication system
- **Frontend**: HTTPS support with self-signed certificates for development
- **Frontend**: Dual authentication system (Tutors and Admins)
- **Frontend**: Color-coded logging system
- **Database**: Password migration script (plain text → bcrypt)
- **Documentation**: 04_HTTPS_Setup_Guide.md
- **Documentation**: 05_Service_Modules.md
- **Documentation**: 06_Database_Migrations.md

### Changed
- **Authentication**: Migrated from plain text to bcrypt password hashing
- **Security**: Enhanced session management with configurable durations
- **Frontend**: Improved error handling and user feedback

### Security
- **CRITICAL**: All passwords now stored as bcrypt hashes
- **Enhancement**: Added API key validation for backend requests
- **Enhancement**: Implemented secure session management

---

## [1.1.0] - 2026-02-01

### Added
- **Frontend**: Excel report generation for lessons
- **Frontend**: Monthly statistics export
- **Frontend**: Student report generation
- **Backend**: CalendarNote entity for calendar management
- **Backend**: Test entity for exam tracking
- **Backend**: Complete CRUD operations for all entities
- **GUI**: Desktop launcher application (Java Swing)
- **GUI**: Real-time server logs in GUI
- **GUI**: Configuration persistence

### Changed
- **Backend**: Improved error handling with centralized exception management
- **Database**: Added indexes for better query performance
- **Frontend**: Enhanced UI with responsive design elements

### Fixed
- **Backend**: Fixed foreign key constraint issues
- **Frontend**: Resolved session timeout problems
- **Database**: Fixed date format inconsistencies

---

## [1.0.0] - 2026-01-15

### Added
- **Backend**: Java Spring Boot REST API with 50+ endpoints
- **Backend**: JPA/Hibernate ORM integration
- **Backend**: PostgreSQL database support
- **Frontend**: Node.js Express web server
- **Frontend**: EJS templating engine
- **Frontend**: Session-based authentication
- **Database**: Complete relational schema with 8 entities:
  - Admin
  - Tutor
  - AdminCreatesTutor
  - Student
  - Lesson
  - Prenotation
  - Test
  - CalendarNote
- **Features**: Student management (CRUD operations)
- **Features**: Tutor management with roles (STAFF, GENERIC)
- **Features**: Lesson tracking and history
- **Features**: Booking system (Prenotations)
- **Features**: Calendar with notes
- **Features**: Admin panel for system management
- **Features**: Staff panel for tutor management
- **Documentation**: Initial README files for all components

### Security
- Basic authentication system
- Role-based access control (RBAC)
- CORS configuration for API security

---

## [0.5.0] - 2025-12-20 (Beta)

### Added
- **Prototype**: Basic Java backend with Spring Boot
- **Prototype**: Simple Node.js frontend
- **Prototype**: PostgreSQL database schema
- **Features**: Basic student CRUD operations
- **Features**: Tutor login functionality
- **Features**: Simple lesson recording

### Changed
- Migrated from SQLite to PostgreSQL
- Improved API endpoint structure

---

## [0.1.0] - 2025-12-01 (Alpha)

### Added
- **Initial Commit**: Project structure
- **Backend**: Basic Spring Boot setup
- **Frontend**: Basic Express.js setup
- **Database**: Initial entity definitions
- **Documentation**: Basic README

---

## Version History

| Version | Release Date | Status | Key Features |
|---------|-------------|--------|--------------|
| 1.3.0 | 2026-02-25 | Current | Complete documentation, Testing & Deployment guides |
| 1.2.0 | 2026-02-17 | Stable | HTTPS support, bcrypt authentication, Security enhancements |
| 1.1.0 | 2026-02-01 | Stable | Excel reports, GUI launcher, Enhanced features |
| 1.0.0 | 2026-01-15 | Stable | First production release, Complete features |
| 0.5.0 | 2025-12-20 | Beta | Prototype with core functionality |
| 0.1.0 | 2025-12-01 | Alpha | Initial development version |

---

## Component Versions

### Current (v1.3.0)

| Component | Version | Technology |
|-----------|---------|------------|
| Java Backend | 1.2.0 | Spring Boot 3.4.1, Java 21 |
| Node.js Frontend | 1.3.0 | Express.js 4.18.2, Node.js 18+ |
| GUI Launcher | 1.1.0 | Java Swing, Java 21 |
| Database | PostgreSQL 12+ | Relational Database |

### Dependencies

**Java Backend:**
- Spring Boot 3.4.1
- Spring Data JPA
- Hibernate 6.x
- PostgreSQL Driver 42.7.1
- Maven 3.8+

**Node.js Frontend:**
- Express.js 4.18.2
- EJS 3.1.9
- bcrypt 5.1.1
- express-session 1.18.2
- ExcelJS 4.4.0
- Node.js 18.x+

---

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
**Last Updated**: February 25, 2026
