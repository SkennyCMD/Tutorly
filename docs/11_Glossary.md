# 📖 Glossary

Technical terms and acronyms used in the Tutorly project.

---

**Document**: 11_Glossary.md  
**Last Updated**: February 25, 2026  
**Version**: 1.0.0  
**Author**: Tutorly Development Team  

---

## A

**Admin**  
Administrator user with elevated privileges to manage the entire system, including tutors, students, and system configuration.

**API (Application Programming Interface)**  
Set of rules and protocols for building and interacting with software applications. Tutorly uses a RESTful API for backend communication.

**API Key**  
A unique identifier used to authenticate requests to the Java backend API. Provides security layer between frontend and backend.

**Authentication**  
Process of verifying the identity of a user. Tutorly uses bcrypt-hashed passwords for secure authentication.

**Authorization**  
Process of determining what an authenticated user is allowed to do. Tutorly has role-based authorization (STAFF, GENERIC, ADMIN).

---

## B

**Backend**  
Server-side component of the application. In Tutorly, this refers to the Java Spring Boot API running on port 8443.

**bcrypt**  
Password hashing algorithm used to securely store user passwords. Provides salt and multiple rounds of hashing.

**Bean**  
In Spring Framework, an object managed by the Spring IoC (Inversion of Control) container.

**Business Logic Layer**  
The middle tier in a three-tier architecture that processes business rules and data transformations.

---

## C

**CA (Certificate Authority)**  
Trusted entity that issues digital certificates for SSL/TLS encryption. Let's Encrypt is a free CA.

**CalendarNote**  
Entity representing notes and reminders in the system calendar.

**CORS (Cross-Origin Resource Sharing)**  
Security feature that controls which domains can access the API. Configured in the Java backend.

**CRUD**  
Create, Read, Update, Delete - the four basic operations for persistent storage.

**CSRF (Cross-Site Request Forgery)**  
Security vulnerability where unauthorized commands are transmitted from a user the web application trusts.

**Controller**  
In MVC architecture, handles HTTP requests and returns responses. Maps URL paths to service methods.

---

## D

**DAO (Data Access Object)**  
Design pattern for abstracting database operations. In Spring Data JPA, these are called Repositories.

**Database Migration**  
Process of updating database schema or data. Tutorly includes a migration script for password hashing.

**Dependency Injection**  
Design pattern where dependencies are "injected" rather than created by the class itself. Core feature of Spring Framework.

**DTO (Data Transfer Object)**  
Object used to transfer data between layers or processes, often with specific fields for API responses.

---

## E

**EJS (Embedded JavaScript)**  
Templating language used in the Node.js frontend to generate HTML pages dynamically.

**Entity**  
Java class representing a database table, annotated with JPA `@Entity`. Examples: Student, Tutor, Lesson.

**Express.js**  
Web application framework for Node.js used in Tutorly's frontend server.

**ExcelJS**  
Library used to generate Excel reports for lessons and statistics.

---

## F

**Foreign Key**  
Database constraint that links one table to another. Used extensively in Tutorly's relational schema.

**Frontend**  
Client-facing component of the application. In Tutorly, refers to the Node.js Express server serving web pages.

---

## G

**GENERIC**  
Role assigned to regular tutors with standard permissions (cannot delete or modify all entities).

**GUI (Graphical User Interface)**  
Visual interface for interacting with software. Tutorly has a Java Swing GUI for server management.

---

## H

**Hibernate**  
Object-Relational Mapping (ORM) framework used by Spring Data JPA to map Java objects to database tables.

**HTTPS (Hypertext Transfer Protocol Secure)**  
Encrypted version of HTTP. Tutorly uses HTTPS for secure communication between components.

**HTTP Status Code**  
Standardized code indicating the result of an HTTP request (e.g., 200 OK, 404 Not Found, 500 Internal Server Error).

---

## I

**Interceptor**  
Component that intercepts requests before they reach the controller. Used for API key validation in Tutorly.

**IoC (Inversion of Control)**  
Design principle where the framework controls the flow of the program. Core concept in Spring Framework.

---

## J

**Jackson**  
JSON processing library used by Spring Boot for serialization/deserialization.

**JAR (Java Archive)**  
Package file format for distributing Java applications. The backend is deployed as an executable JAR.

**JDBC (Java Database Connectivity)**  
API for connecting Java applications to databases.

**JPA (Java Persistence API)**  
Specification for Object-Relational Mapping in Java. Implemented by Hibernate.

**JSON (JavaScript Object Notation)**  
Lightweight data interchange format used for API responses.

**JUnit**  
Testing framework for Java. Used for unit and integration tests in the backend.

---

## K

**Keystore**  
File storing cryptographic keys and certificates. Used for SSL/TLS in Java applications (PKCS12 format).

---

## L

**Lesson (Lezione)**  
Core entity representing a completed tutoring session with a specific student.

**Let's Encrypt**  
Free Certificate Authority providing SSL/TLS certificates for HTTPS.

**Logger**  
Component responsible for recording application events and errors. Tutorly has a custom color-coded logger.

---

## M

**Maven**  
Build automation and dependency management tool for Java projects.

**Middleware**  
Software layer between the operating system and applications. In Express.js, functions that process requests before reaching route handlers.

**Migration Script**  
Script for modifying database structure or data. Tutorly includes `hashExistingPasswords.js`.

**MVC (Model-View-Controller)**  
Architectural pattern separating data (Model), presentation (View), and logic (Controller).

---

## N

**Nginx**  
High-performance web server and reverse proxy used in production deployments.

**Node.js**  
JavaScript runtime environment. Powers Tutorly's frontend server.

**npm (Node Package Manager)**  
Package manager for Node.js dependencies.

---

## O

**ORM (Object-Relational Mapping)**  
Technique for converting data between incompatible type systems (objects ↔ database tables). Hibernate is an ORM.

---

## P

**PKCS12**  
Public Key Cryptography Standard #12 - keystore format used for SSL certificates in Java.

**PostgreSQL**  
Open-source relational database management system. Tutorly's primary data store.

**Prenotation (Prenotazione)**  
Entity representing a booking or future scheduled lesson.

**Primary Key**  
Unique identifier for a database record. Usually an auto-incremented ID.

---

## R

**Repository**  
In Spring Data JPA, an interface for database operations (extends `JpaRepository`).

**REST (Representational State Transfer)**  
Architectural style for APIs using HTTP methods (GET, POST, PUT, DELETE).

**RESTful API**  
API following REST principles. Tutorly's backend is a RESTful API.

**Reverse Proxy**  
Server that forwards requests to backend servers. Nginx acts as a reverse proxy in production.

**Role**  
Classification of user permissions. Tutorly roles: STAFF (full access), GENERIC (limited), ADMIN (system-wide).

---

## S

**Salt**  
Random data added to passwords before hashing to prevent rainbow table attacks. bcrypt includes automatic salting.

**Service Layer**  
Contains business logic. In Tutorly, services handle data processing between controllers and repositories.

**Session**  
Server-side storage of user authentication state. Tutorly uses express-session with different durations for tutors (30 days) and admins (1 hour).

**Spring Boot**  
Framework for building production-ready Java applications. Powers Tutorly's backend.

**Spring Data JPA**  
Spring module simplifying database access with JPA and Hibernate.

**SSL/TLS (Secure Sockets Layer / Transport Layer Security)**  
Cryptographic protocols for secure communication over networks.

**STAFF**  
Role assigned to senior tutors with extended permissions (can delete and modify all entities).

**Student (Studente)**  
Core entity representing a student in the tutoring center.

**Systemd**  
System and service manager for Linux. Used to run Tutorly services in production.

---

## T

**Test**  
Entity representing an exam or assessment taken by a student.

**Three-Tier Architecture**  
Architecture with three layers: Presentation (UI), Business Logic (API), Data (Database).

**Tomcat**  
Embedded web server included in Spring Boot applications.

**Transactional**  
Annotation ensuring database operations are atomic (all succeed or all fail).

**Tutor**  
Core entity representing a teacher or tutor in the system.

---

## U

**URI (Uniform Resource Identifier)**  
String identifying a resource. Example: `/api/students/1`

**URL (Uniform Resource Locator)**  
Specific type of URI including protocol and domain. Example: `https://localhost:8443/api/students`

---

## V

**Validation**  
Process of checking data integrity and correctness. Spring uses Bean Validation annotations.

**View**  
In MVC, the presentation layer. In Tutorly, EJS templates are views.

---

## W

**WebConfig**  
Spring configuration class for web-related settings (CORS, interceptors, etc.).

---

## X

**XSS (Cross-Site Scripting)**  
Security vulnerability where malicious scripts are injected into trusted websites.

**X-API-Key**  
HTTP header used for API key authentication in Tutorly.

---

## Acronyms Quick Reference

| Acronym | Full Form |
|---------|-----------|
| API | Application Programming Interface |
| CA | Certificate Authority |
| CORS | Cross-Origin Resource Sharing |
| CRUD | Create, Read, Update, Delete |
| CSRF | Cross-Site Request Forgery |
| DAO | Data Access Object |
| DTO | Data Transfer Object |
| EJS | Embedded JavaScript |
| GUI | Graphical User Interface |
| HTTPS | Hypertext Transfer Protocol Secure |
| IoC | Inversion of Control |
| JAR | Java Archive |
| JDBC | Java Database Connectivity |
| JPA | Java Persistence API |
| JSON | JavaScript Object Notation |
| MVC | Model-View-Controller |
| ORM | Object-Relational Mapping |
| PKCS12 | Public Key Cryptography Standard #12 |
| REST | Representational State Transfer |
| SSL | Secure Sockets Layer |
| TLS | Transport Layer Security |
| URI | Uniform Resource Identifier |
| URL | Uniform Resource Locator |
| XSS | Cross-Site Scripting |

---

## Common File Extensions

| Extension | Description |
|-----------|-------------|
| `.java` | Java source code |
| `.js` | JavaScript source code |
| `.ejs` | EJS template file |
| `.css` | Cascading Style Sheets |
| `.properties` | Java configuration file |
| `.json` | JSON data file |
| `.xml` | XML configuration (Maven pom.xml) |
| `.sql` | SQL script |
| `.md` | Markdown documentation |
| `.jar` | Java Archive executable |
| `.sh` | Shell script (Linux/Mac) |
| `.bat` | Batch script (Windows) |
| `.pem` | PEM certificate file |
| `.p12` | PKCS12 keystore file |

---

## Related Documentation

- **Architecture Overview**: [00_Project_Overview.md](00_Project_Overview.md)
- **Java Backend Details**: [01_Java_Backend_API.md](01_Java_Backend_API.md)
- **Node.js Frontend Details**: [03_Nodejs_Frontend.md](03_Nodejs_Frontend.md)
- **Database Configuration**: [07_Database_Configuration.md](07_Database_Configuration.md)

---

**Navigation**  
⬅️ **Previous**: [10_Contributing_Guide.md](10_Contributing_Guide.md) | **Next**: [CHANGELOG.md](../CHANGELOG.md) ➡️  
🏠 **Home**: [Documentation Index](README.md)

---

**Last Updated**: February 25, 2026
