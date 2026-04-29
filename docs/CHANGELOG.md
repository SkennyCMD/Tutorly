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
**Last Updated**: February 25, 2026
