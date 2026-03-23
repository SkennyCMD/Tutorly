# Tutorly Backend API - Technical Documentation

---

**Document**: 01_Java_Backend_API.md  
**Last Updated**: February 25, 2026  
**Version**: 1.2.0  
**Author**: Tutorly Development Team  

---

## 📋 Table of Contents
- [Overview](#overview)
- [Quick Reference](#quick-reference)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Data Model](#data-model)
- [Architectural Pattern](#architectural-pattern)
- [Main Components](#main-components)
- [Request Flow](#request-flow)
- [Setup and Configuration](#setup-and-configuration)
- [API Endpoints](#api-endpoints)

---

## Overview

The **Tutorly Backend API** is a RESTful application developed in Java with Spring Boot that manages the tutoring system. It provides complete functionality for managing students, tutors, lessons, bookings, tests, and calendar notes.

### Main Features
- ✅ Complete RESTful API with API Key authentication
- ✅ Data persistence with PostgreSQL and JPA/Hibernate
- ✅ 3-tier architecture (Controller-Service-Repository)
- ✅ HTTPS support with SSL certificates
- ✅ Desktop GUI for server management
- ✅ Relational database with referential integrity

---

## ⚡ Quick Reference

### Common Commands

| Command | Description |
|---------|-------------|
| `mvn spring-boot:run` | Start backend server (development) |
| `mvn clean package` | Build JAR file for production |
| `mvn test` | Run all tests |
| `./run-gui.sh` | Start GUI launcher (Linux/Mac) |
| `run-gui.bat` | Start GUI launcher (Windows) |
| `./test-api.sh` | Test API endpoints |

### Key Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/students` | GET | List all students | API Key |
| `/api/students/{id}` | GET | Get student by ID | API Key |
| `/api/students` | POST | Create new student | API Key |
| `/api/students/{id}` | PUT | Update student | API Key |
| `/api/students/{id}` | DELETE | Delete student | API Key |
| `/api/tutors` | GET | List all tutors | API Key |
| `/api/lessons` | GET | List all lessons | API Key |
| `/api/lessons` | POST | Create new lesson | API Key |
| `/api/prenotations` | GET | List bookings | API Key |
| `/api/calendar-notes` | GET | List calendar notes | API Key |

### Configuration Files

| File | Purpose | Location |
|------|---------|----------|
| `application.properties` | Main configuration | `src/main/resources/` |
| `pom.xml` | Maven dependencies | Root directory |
| `launcher-config.properties` | GUI configuration | `src/main/java/` |
| `keystore.p12` | SSL certificate | `src/main/resources/` |

### Default Ports

- **HTTPS**: 8443 (production and development)
- **Database**: 5432 (PostgreSQL default)

### Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 8443 already in use | Change `server.port` in application.properties or kill process |
| Database connection failed | Verify PostgreSQL is running and credentials are correct |
| API key invalid | Check `X-API-Key` header matches configured key |
| SSL certificate error | Regenerate keystore or use HTTP in development |

---

## System Architecture

> **📖 For the complete system architecture**, see [00_Project_Overview.md - System Architecture](00_Project_Overview.md#system-architecture)

### Spring Boot Application Internal Architecture

This section details the internal structure of the Java backend component:

```
┌─────────────────────────────────────────────────────────────┐
│                    SPRING BOOT APPLICATION                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              CONFIG LAYER                            │   │
│  │  - ApiKeyInterceptor (Authentication)                │   │
│  │  - WebConfig (CORS, Interceptors)                    │   │
│  │  - HttpsRedirectConfig (SSL)                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                        │                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              CONTROLLER LAYER                        │   │
│  │  - StudentController    - TutorController            │   │
│  │  - LessonController     - PrenotationController      │   │
│  │  - AdminController      - TestController             │   │
│  │  - CalendarNoteController                            │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              SERVICE LAYER (Business Logic)          │   │
│  │  - StudentService       - TutorService               │   │
│  │  - LessonService        - PrenotationService         │   │
│  │  - AdminService         - TestService                │   │
│  │  - CalendarNoteService                               │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              REPOSITORY LAYER (Data Access)          │   │
│  │  - StudentRepository    - TutorRepository            │   │
│  │  - LessonRepository     - PrenotationRepository      │   │
│  │  - AdminRepository      - TestRepository             │   │
│  │  - CalendarNoteRepository                            │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              ENTITY LAYER (Domain Model)             │   │
│  │  @Entity Classes with JPA annotations                │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                     │
└───────────────────────┼─────────────────────────────────────┘
                        │ JDBC/Hibernate
                        ▼
                 PostgreSQL Database
```

---

## Technology Stack

> **📖 For the complete technology stack overview**, see [00_Project_Overview.md - Technology Stack](00_Project_Overview.md#technology-stack)

### Java Backend Specific Technologies

**Core:**
- **Java 21** - Programming language  
- **Spring Boot 3.4.1** - Application framework  
- **Spring Data JPA** - Persistence abstraction  
- **Hibernate** - ORM (Object-Relational Mapping)  
- **Maven** - Build tool and dependency management

**Security:**
- **API Key Authentication** - Authentication via HTTP headers  
- **SSL/TLS (HTTPS)** - Encrypted communication  
- **Keystore PKCS12** - Certificate management

**UI:**
- **Swing GUI** - Graphical interface for server configuration

---

## Data Model

### Main Entities

```
┌──────────────┐         ┌──────────────┐
│    Admin     │────┐    │    Tutor     │
│              │    │    │              │
│ -id          │    │    │ -id          │
│ -mail        │    │    │ -username    │
│ -password    │    │    │ -password    │
│ -username    │    │    │ -status      │
└──────────────┘    │    │ -role        │
                    │    └──────┬───────┘
                    │           │
      ┌─────────────┴────┐      │
      │ AdminCreatesTutor│      │
      │ -admin_id (FK)   │      │
      │ -tutor_id (FK)   │      │
      │ -timestamp       │      │
      └──────────────────┘      │
                                │
    ┌─────────────┬─────────────┼─────────────┬─────────────┐
    │             │             │             │             │
    ▼             ▼             ▼             ▼             ▼
┌────────┐  ┌───────────┐  ┌───────────┐  ┌──────┐  ┌──────────────┐
│ Lesson │  │Prenotation│  │   Test    │  │      │  │ CalendarNote │
│        │  │           │  │           │  │      │  │              │
│ -id    │  │ -id       │  │ -id       │  │      │  │ -id          │
│ -desc  │  │ -startTime│  │ -testType │  │      │  │ -description │
│ -start │  │ -endTime  │  │ -grade    │  │      │  │ -startTime   │
│ -end   │  │ -flag     │  │ -date     │  │      │  │ -endTime     │
│ -tutor ├──┤ -student  │  │ -tutor    ├──┘      │  │ -creator     │
│ -student  │ -tutor    │  │ -student  │         │  │ -tutors      │
└────┬───┘  │ -creator  │  └────┬──────┘         │  └──────────────┘
     │      └───────────┘       │                │
     │                          │                │
     │         ┌────────────────┴────────────────┘
     │         │
     ▼         ▼
┌─────────────────┐
│    Student      │
│                 │
│ -id             │
│ -name           │
│ -surname        │
│ -studentClass   │
│ -description    │
│ -status         │
│                 │
│ -lessons        │
│ -prenotations   │
│ -tests          │
└─────────────────┘
```

#### 1. **Admin → Tutor** (Many-to-Many with associative entity)
- An admin can create multiple tutors
- A tutor can be created by multiple admins (joint management)
- Tracking through `AdminCreatesTutor` entity with timestamp

#### 2. **Tutor → Lesson** (One-to-Many)
- A tutor conducts many lessons
- A lesson has exactly one tutor

#### 3. **Student → Lesson** (One-to-Many)
- A student participates in many lessons
- A lesson has exactly one student

#### 4. **Tutor → Prenotation** (One-to-Many, dual role)
- **As assigned tutor**: manages the booking
- **As creator**: created the booking (can be different from the tutor)

#### 5. **Student → Prenotation** (One-to-Many)
- A student has many bookings
- A booking belongs to one student

#### 6. **Tutor → Test** (One-to-Many)
- A tutor administers many tests
- A test is administered by one tutor

#### 7. **Student → Test** (One-to-Many)
- A student takes many tests
- A test is taken by one student

#### 8. **Tutor ↔ CalendarNote** (Many-to-Many)
- A tutor can have many calendar notes
- A note can be associated with multiple tutors
- A tutor (creator) creates the note

📚 **For complete database documentation** (installation, configuration, migrations):  
See [07_Database_Configuration.md](07_Database_Configuration.md)

---

## Architectural Pattern

The application follows the **MVC (Model-View-Controller)** pattern adapted for a RESTful architecture, organized into **3 main layers**:

### 1. **Controller Layer** (Presentation)

**Responsibilities:**
- Expose REST endpoints
- Validate HTTP request parameters
- Handle HTTP responses (status codes, headers)
- Convert between JSON and Java objects (via Jackson)

**Example: StudentController**
```java
@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {
    
    @Autowired
    private StudentService studentService;
    
    @GetMapping
    public ResponseEntity<List<Student>> getAllStudents() {
        return ResponseEntity.ok(studentService.getAllStudents());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable Long id) {
        Optional<Student> student = studentService.getStudentById(id);
        return student.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Student> createStudent(@RequestBody Student student) {
        Student saved = studentService.saveStudent(student);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
```

**Interactions:**
- Receives HTTP requests from the client
- Delegates business logic to the **Service Layer**
- Returns formatted HTTP responses

---

### 2. **Service Layer** (Business Logic)

**Responsibilities:**
- Implement business logic
- Orchestrate complex operations across multiple repositories
- Validate data before persistence
- Manage transactions

**Example: StudentService**
```java
@Service
public class StudentService {
    
    @Autowired
    private StudentRepository studentRepository;
    
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }
    
    public Optional<Student> getStudentById(Long id) {
        return studentRepository.findById(id);
    }
    
    public List<Student> searchStudents(String searchTerm) {
        return studentRepository.findByNameContainingOrSurnameContaining(
            searchTerm, searchTerm
        );
    }
    
    public Student saveStudent(Student student) {
        // Validation logic or pre-processing
        return studentRepository.save(student);
    }
}
```

**Interactions:**
- Receives requests from the **Controller Layer**
- Calls **Repository Layer** methods to access data
- Can call other Services for complex operations

---

### 3. **Repository Layer** (Data Access)

**Responsibilities:**
- Manage database access
- Provide custom JPA/JPQL queries
- Abstract CRUD operations

**Example: StudentRepository**
```java
@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    
    // Queries automatically derived by Spring Data JPA
    List<Student> findByStatus(String status);
    
    List<Student> findByStudentClass(String studentClass);
    
    List<Student> findByNameContainingOrSurnameContaining(
        String name, String surname
    );
    
    // Custom queries with @Query if needed
    // @Query("SELECT s FROM Student s WHERE s.status = :status")
    // List<Student> customQuery(@Param("status") String status);
}
```

**Interactions:**
- Extends `JpaRepository<Entity, ID>` from Spring Data JPA
- Provides standard methods (findAll, findById, save, delete)
- Allows custom queries via naming convention or `@Query`
- Communicates with **Hibernate/JPA** to translate into SQL

---

### 4. **Entity Layer** (Domain Model)

**Responsibilities:**
- Represent database tables as Java classes
- Define relationships between entities
- Map columns and primary/foreign keys

**Example: Student Entity**
```java
@Entity
@Table(name = "student")
@JsonIgnoreProperties(value = {"lessons", "prenotations", "tests"}, 
                      allowGetters = true)
public class Student {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "surname", nullable = false)
    private String surname;
    
    @Column(name = "student_class")
    private String studentClass;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "status")
    private String status;
    
    // Relationships
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, 
               orphanRemoval = true)
    private Set<Lesson> lessons = new HashSet<>();
    
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL)
    private Set<Prenotation> prenotations = new HashSet<>();
    
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL)
    private Set<Test> tests = new HashSet<>();
    
    // Constructors, getters, setters...
}
```

**Key Annotations:**
- `@Entity`: Marks the class as a JPA entity
- `@Table(name = "...")`: Specifies the table name
- `@Id`: Defines the primary key
- `@GeneratedValue`: Auto-increment ID
- `@Column`: Maps fields to columns
- `@OneToMany`, `@ManyToOne`, `@ManyToMany`: Define relationships
- `@JsonIgnoreProperties`: Prevents infinite loops in JSON serialization

---

### 5. **DTO Layer** (Data Transfer Objects)

**Responsibilities:**
- Separate domain model from API contracts
- Reduce JSON payload complexity
- Prevent exposure of sensitive data

**Example: LessonCreateDTO**
```java
public class LessonCreateDTO {
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long tutorId;      // Only ID, not the entire Tutor object
    private Long studentId;    // Only ID, not the entire Student object
    
    // Getters, setters, constructors...
}
```

**Advantages:**
- Avoids sending complete objects with circular references
- Simplifies input data validation
- Allows for lighter APIs

---

### 6. **Config Layer** (Configuration)

**Responsibilities:**
- Configure Spring application
- Implement security (API Key)
- Manage CORS and HTTPS

#### **ApiKeyInterceptor**
Intercepts all requests to `/api/**` and validates the API Key:

```java
@Component
public class ApiKeyInterceptor implements HandlerInterceptor {
    
    private static final String API_KEY_HEADER = "X-API-Key";
    
    @Value("${api.security.keys}")
    private String validApiKeysString;
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                            HttpServletResponse response, 
                            Object handler) throws Exception {
        String apiKey = request.getHeader(API_KEY_HEADER);
        
        if (apiKey == null || !validApiKeys.contains(apiKey)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false; // Block the request
        }
        
        return true; // Allow the request
    }
}
```

#### **WebConfig**
Registers interceptors and configures CORS:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Autowired
    private ApiKeyInterceptor apiKeyInterceptor;
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(apiKeyInterceptor)
                .addPathPatterns("/api/**");
    }
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
```

---

## Request Flow

### Example: Creating a Student

```
1. CLIENT
   POST https://localhost:8443/api/students
   Headers: {
       "X-API-Key": "MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu",
       "Content-Type": "application/json"
   }
   Body: {
       "name": "Marco",
       "surname": "Rossi",
       "studentClass": "3A",
       "description": "Good at mathematics",
       "status": "ACTIVE"
   }

2. ApiKeyInterceptor
   ✓ Validates X-API-Key header
   ✓ Compares with api.security.keys
   ✓ If valid → continue, otherwise → 401 Unauthorized

3. StudentController.createStudent()
   ✓ Receives @RequestBody Student
   ✓ Jackson deserializes JSON → Student object
   ✓ Calls studentService.saveStudent(student)

4. StudentService.saveStudent()
   ✓ Can validate business rules
   ✓ Calls studentRepository.save(student)

5. StudentRepository (Spring Data JPA)
   ✓ Generates SQL query: INSERT INTO student VALUES (...)
   ✓ Hibernate executes the query on PostgreSQL
   ✓ Returns Student with generated ID

6. Return to Controller
   ✓ StudentService returns saved Student
   ✓ Controller creates ResponseEntity with status 201 CREATED
   ✓ Jackson serializes Student → JSON

7. RESPONSE to CLIENT
   HTTP 201 Created
   Body: {
       "id": 42,
       "name": "Marco",
       "surname": "Rossi",
       "studentClass": "3A",
       "description": "Good at mathematics",
       "status": "ACTIVE"
   }
```

---

### Example: Retrieving Student's Lessons (with Relationships)

```
1. CLIENT
   GET https://localhost:8443/api/students/42
   Headers: { "X-API-Key": "..." }

2. ApiKeyInterceptor → ✓ Validates API Key

3. StudentController.getStudentById(42)
   ✓ Calls studentService.getStudentById(42)

4. StudentService.getStudentById(42)
   ✓ Calls studentRepository.findById(42)

5. StudentRepository (JPA)
   ✓ SELECT * FROM student WHERE id = 42
   ✓ Hibernate loads Student entity

6. Lazy Loading of Relationships
   ✓ @OneToMany for lessons is LAZY by default
   ✓ If the controller accesses student.getLessons():
      → Hibernate executes SELECT * FROM lesson WHERE id_student = 42
   ✓ Loads the connected Lesson entities

7. JSON Serialization
   ✓ @JsonIgnoreProperties on Student prevents infinite loops
   ✓ lessons is excluded from standard serialization

8. RESPONSE
   {
       "id": 42,
       "name": "Marco",
       "surname": "Rossi",
       "studentClass": "3A",
       "status": "ACTIVE"
       // "lessons" excluded to avoid excessive payloads
   }
```

---

## Main Components

### 1. Controllers

| Controller | Base Endpoint | Responsibilities |
|------------|--------------|------------------|
| `StudentController` | `/api/students` | Student CRUD, search by status/class |
| `TutorController` | `/api/tutors` | Tutor CRUD, authentication, role management |
| `LessonController` | `/api/lessons` | Lesson CRUD, search by tutor/student/period |
| `PrenotationController` | `/api/prenotations` | Booking CRUD, confirm/reject |
| `AdminController` | `/api/admins` | Admin CRUD, tutor creation |
| `TestController` | `/api/tests` | Test CRUD, search by student/tutor |
| `CalendarNoteController` | `/api/calendar-notes` | Calendar note CRUD, event management |

### 2. Services

Each controller has its dedicated service with the same naming:
- `StudentService`
- `TutorService`
- `LessonService`
- `PrenotationService`
- `AdminService`
- `TestService`
- `CalendarNoteService`

**Common Service Functions:**
- Business logic validation
- Orchestration of complex operations
- Transaction management (`@Transactional`)
- DTO ↔ Entity transformation

### 3. Repositories

Based on **Spring Data JPA** with derived methods:

```java
// Example of derived queries
List<Student> findByStatus(String status);
List<Lesson> findByTutorIdAndStartTimeBetween(Long tutorId, 
                                               LocalDateTime start, 
                                               LocalDateTime end);
Optional<Tutor> findByUsername(String username);
```

### 4. Entity Relationships

#### Cascading Behavior
```java
// Example: deleting a Student removes all their Lessons
@OneToMany(mappedBy = "student", 
           cascade = CascadeType.ALL, 
           orphanRemoval = true)
private Set<Lesson> lessons;
```

#### JSON Handling
```java
// Prevents infinite loops in serialization
@JsonIgnoreProperties(value = {"lessons", "prenotations"}, 
                      allowGetters = true)
```

---

## Security

### API Key Authentication

**Mechanism:**
1. Client sends request with `X-API-Key` header
2. `ApiKeyInterceptor` intercepts the request
3. Compares the key with valid ones in `application.properties`
4. If valid → proceed, otherwise → `401 Unauthorized`

**Configuration:**
```properties
api.security.keys=MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu,AnotherKey123
```

**Example request:**
```bash
curl -X GET https://localhost:8443/api/students \
     -H "X-API-Key: MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu"
```

### HTTPS/SSL

**SSL Configuration:**
```properties
server.ssl.enabled=true
server.ssl.key-store=classpath:keystore.p12
server.ssl.key-store-password=tutorly123
server.ssl.key-store-type=PKCS12
server.ssl.key-alias=tutorly
```

**Keystore Generation:**
```bash
keytool -genkeypair -alias tutorly \
        -keyalg RSA -keysize 2048 \
        -storetype PKCS12 -keystore keystore.p12 \
        -validity 3650
```

### CORS (Cross-Origin Resource Sharing)

Configured in `WebConfig` to allow requests from Node.js frontend:

```java
registry.addMapping("/**")
        .allowedOrigins("*")  // In production: specify domains
        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .allowedHeaders("*");
```

---

## Setup and Configuration

> **📖 For complete system prerequisites**, see [00_Project_Overview.md - Prerequisites](00_Project_Overview.md#prerequisites)

### Component-Specific Requirements

- **Java 21** or higher (JDK required)
- **Maven 3.8+** (included via Maven Wrapper)
- **PostgreSQL 12+** running and accessible

### 1. Clone Repository

```bash
git clone <repository-url>
cd Tutorly/Java/backend-api
```

### 2. Database Configuration

Create the PostgreSQL database:

```sql
CREATE DATABASE tutorly_db;
CREATE USER tutorly_admin WITH PASSWORD 'tutorly1234?';
GRANT ALL PRIVILEGES ON DATABASE tutorly_db TO tutorly_admin;
```

### 3. Application Properties Configuration

Modify `src/main/resources/application.properties`:

```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/tutorly_db
spring.datasource.username=tutorly_admin
spring.datasource.password=tutorly1234?
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# Server Configuration
server.port=8443
server.ssl.enabled=true
server.ssl.key-store=classpath:keystore.p12
server.ssl.key-store-password=tutorly123
server.ssl.key-store-type=PKCS12
server.ssl.key-alias=tutorly

# API Security
api.security.keys=MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu
```

### 4. Build and Run

#### Option A: Maven Command Line

```bash
# Build
mvn clean install

# Run
mvn spring-boot:run

# In case those commands doasn't work use the following command before calling them:
set JAVA_HOME=C:\Program Files\Java\jdk-21
```

#### Option B: GUI Launcher

```bash
# Start the GUI
java -jar target/backend-api-0.0.1-SNAPSHOT.jar com.tutorly.app.backend_api.gui.ServerLauncherGUI
```

The GUI allows you to:
- Configure database parameters
- Start/stop the server
- View real-time logs

#### Option C: Bash Script (Linux/Mac)

```bash
chmod +x run-gui.sh
./run-gui.sh
```

#### Option D: Batch Script (Windows)

```cmd
run-gui.bat
```

### 5. Verify Startup

```bash
# Test endpoint
curl -k -X GET https://localhost:8443/api/students \
     -H "X-API-Key: MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu"
```

**Expected output:** `[]` (empty list if no students exist)

---

## API Endpoints

### Base URL
```
https://localhost:8443/api
```

### Required Header
```
X-API-Key: <your-api-key>
```

---

### Students

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/students` | List all students |
| GET | `/students/{id}` | Student details by ID |
| GET | `/students/status/{status}` | Students by status (ACTIVE, INACTIVE) |
| GET | `/students/class/{class}` | Students by class (e.g., "3A") |
| GET | `/students/search?q={query}` | Search by name/surname |
| POST | `/students` | Create new student |
| PUT | `/students/{id}` | Update student |
| DELETE | `/students/{id}` | Delete student |

**Example Request Body (POST):**
```json
{
  "name": "Marco",
  "surname": "Rossi",
  "studentClass": "3A",
  "description": "Excellent in mathematics",
  "status": "ACTIVE"
}
```

---

### Tutors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tutors` | List all tutors |
| GET | `/tutors/{id}` | Tutor details by ID |
| GET | `/tutors/username/{username}` | Tutor by username |
| GET | `/tutors/status/{status}` | Tutors by status |
| GET | `/tutors/role/{role}` | Tutors by role |
| POST | `/tutors` | Create new tutor |
| PUT | `/tutors/{id}` | Update tutor |
| DELETE | `/tutors/{id}` | Delete tutor |

**Example Request Body (POST):**
```json
{
  "username": "mario.rossi",
  "password": "hashedPassword123",
  "status": "ACTIVE",
  "role": "TEACHER"
}
```

---

### Lessons

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/lessons` | List all lessons |
| GET | `/lessons/{id}` | Lesson details by ID |
| GET | `/lessons/tutor/{tutorId}` | Lessons by tutor |
| GET | `/lessons/student/{studentId}` | Lessons by student |
| GET | `/lessons/date-range?start={start}&end={end}` | Lessons in period |
| POST | `/lessons` | Create new lesson |
| PUT | `/lessons/{id}` | Update lesson |
| DELETE | `/lessons/{id}` | Delete lesson |

**Example Request Body (POST) - with DTO:**
```json
{
  "description": "Mathematics lesson - Algebra",
  "startTime": "2026-02-16T14:00:00",
  "endTime": "2026-02-16T15:30:00",
  "tutorId": 5,
  "studentId": 10
}
```

---

### Prenotations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/prenotations` | List all bookings |
| GET | `/prenotations/{id}` | Booking details by ID |
| GET | `/prenotations/student/{studentId}` | Bookings by student |
| GET | `/prenotations/tutor/{tutorId}` | Bookings by tutor |
| GET | `/prenotations/confirmed` | Only confirmed bookings |
| POST | `/prenotations` | Create new booking |
| PUT | `/prenotations/{id}` | Update booking |
| PUT | `/prenotations/{id}/confirm` | Confirm booking |
| DELETE | `/prenotations/{id}` | Delete booking |

**Example Request Body (POST) - with DTO:**
```json
{
  "startTime": "2026-02-20T10:00:00",
  "endTime": "2026-02-20T11:30:00",
  "studentId": 10,
  "tutorId": 5,
  "creatorId": 3
}
```

---

### Tests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tests` | List all tests |
| GET | `/tests/{id}` | Test details by ID |
| GET | `/tests/student/{studentId}` | Tests by student |
| GET | `/tests/tutor/{tutorId}` | Tests administered by tutor |
| POST | `/tests` | Create new test |
| PUT | `/tests/{id}` | Update test |
| DELETE | `/tests/{id}` | Delete test |

**Example Request Body (POST):**
```json
{
  "testType": "Mathematics",
  "grade": "8.5",
  "testDate": "2026-02-15T10:00:00",
  "tutorId": 5,
  "studentId": 10
}
```

---

### Calendar Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/calendar-notes` | List all notes |
| GET | `/calendar-notes/{id}` | Note details by ID |
| GET | `/calendar-notes/tutor/{tutorId}` | Notes by tutor |
| GET | `/calendar-notes/range?start={start}&end={end}` | Notes in period |
| POST | `/calendar-notes` | Create new note |
| PUT | `/calendar-notes/{id}` | Update note |
| DELETE | `/calendar-notes/{id}` | Delete note |

**Example Request Body (POST) - with DTO:**
```json
{
  "description": "Staff meeting",
  "startTime": "2026-02-16T10:00:00",
  "endTime": "2026-02-16T11:00:00",
  "creatorId": 3,
  "tutorIds": [3, 5, 7]
}
```

---

### Admins

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admins` | List all admins |
| GET | `/admins/{id}` | Admin details by ID |
| GET | `/admins/username/{username}` | Admin by username |
| POST | `/admins` | Create new admin |
| PUT | `/admins/{id}` | Update admin |
| DELETE | `/admins/{id}` | Delete admin |

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | When It Occurs |
|------|---------|----------------|
| 200 OK | Success | Successful GET, PUT |
| 201 Created | Resource created | Successful POST |
| 204 No Content | Success without body | Successful DELETE |
| 400 Bad Request | Invalid data | Validation failed |
| 401 Unauthorized | Missing/invalid API Key | Incorrect X-API-Key header |
| 404 Not Found | Resource not found | Non-existent ID |
| 500 Internal Server Error | Server error | Unhandled exception |

### Example Error Response

```json
{
  "timestamp": "2026-02-16T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Student with id 999 not found",
  "path": "/api/students/999"
}
```

---

## API Testing

### With cURL

```bash
# GET all students
curl -k -X GET https://localhost:8443/api/students \
     -H "X-API-Key: MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu"

# POST new student
curl -k -X POST https://localhost:8443/api/students \
     -H "X-API-Key: MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Marco",
       "surname": "Rossi",
       "studentClass": "3A",
       "status": "ACTIVE"
     }'

# GET student by ID
curl -k -X GET https://localhost:8443/api/students/1 \
     -H "X-API-Key: MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu"
```

### With Bash Script

```bash
#!/bin/bash
chmod +x test-api.sh
./test-api.sh
```

Contents of `test-api.sh`:

```bash
#!/bin/bash

API_KEY="MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu"
BASE_URL="https://localhost:8443/api"

echo "Testing Students endpoint..."
curl -k -X GET "$BASE_URL/students" \
     -H "X-API-Key: $API_KEY"

echo "\n\nTesting Tutors endpoint..."
curl -k -X GET "$BASE_URL/tutors" \
     -H "X-API-Key: $API_KEY"
```

---

## Troubleshooting

> **📖 For common issues**, see [00_Project_Overview.md - Troubleshooting](00_Project_Overview.md#troubleshooting)

### Backend-Specific Issues

#### Problem: 401 Unauthorized

**Symptoms:**
```
HTTP 401 Unauthorized
```

**Solution:**
- Verify `X-API-Key` header in the request
- Check that the key is in `api.security.keys` in `application.properties`
- Test with curl: `curl -k https://localhost:8443/api/tutors -H "X-API-Key: your-key"`

---

#### Problem: Circular Reference in JSON

**Symptoms:**
```
JsonMappingException: Infinite recursion (StackOverflowError)
```

**Solution:**
- Use `@JsonIgnoreProperties` on collections:
  ```java
  @JsonIgnoreProperties(value = {"lessons"}, allowGetters = true)
  public class Student { ... }
  ```
- Or use DTOs to expose only necessary data

---

## Project File Structure

```
backend-api/
├── src/
│   ├── main/
│   │   ├── java/com/tutorly/app/backend_api/
│   │   │   ├── BackendApiApplication.java        # Main entry point
│   │   │   ├── config/
│   │   │   │   ├── ApiKeyInterceptor.java        # API Key validation
│   │   │   │   ├── WebConfig.java                # Spring MVC config
│   │   │   │   └── HttpsRedirectConfig.java      # SSL config
│   │   │   ├── controller/
│   │   │   │   ├── StudentController.java
│   │   │   │   ├── TutorController.java
│   │   │   │   ├── LessonController.java
│   │   │   │   ├── PrenotationController.java
│   │   │   │   ├── AdminController.java
│   │   │   │   ├── TestController.java
│   │   │   │   └── CalendarNoteController.java
│   │   │   ├── service/
│   │   │   │   ├── StudentService.java
│   │   │   │   ├── TutorService.java
│   │   │   │   ├── LessonService.java
│   │   │   │   ├── PrenotationService.java
│   │   │   │   ├── AdminService.java
│   │   │   │   ├── TestService.java
│   │   │   │   └── CalendarNoteService.java
│   │   │   ├── repository/
│   │   │   │   ├── StudentRepository.java
│   │   │   │   ├── TutorRepository.java
│   │   │   │   ├── LessonRepository.java
│   │   │   │   ├── PrenotationRepository.java
│   │   │   │   ├── AdminRepository.java
│   │   │   │   ├── TestRepository.java
│   │   │   │   ├── CalendarNoteRepository.java
│   │   │   │   └── AdminCreatesTutorRepository.java
│   │   │   ├── entity/
│   │   │   │   ├── Student.java
│   │   │   │   ├── Tutor.java
│   │   │   │   ├── Lesson.java
│   │   │   │   ├── Prenotation.java
│   │   │   │   ├── Admin.java
│   │   │   │   ├── Test.java
│   │   │   │   ├── CalendarNote.java
│   │   │   │   ├── AdminCreatesTutor.java
│   │   │   │   └── AdminCreatesTutorId.java
│   │   │   ├── dto/
│   │   │   │   ├── LessonCreateDTO.java
│   │   │   │   ├── PrenotationCreateDTO.java
│   │   │   │   ├── PrenotationResponseDTO.java
│   │   │   │   └── CalendarNoteCreateDTO.java
│   │   │   └── gui/
│   │   │       └── ServerLauncherGUI.java        # Swing GUI for server
│   │   └── resources/
│   │       ├── application.properties             # Main config file
│   │       ├── keystore.p12                       # SSL certificate
│   │       ├── static/                            # Static web resources
│   │       └── templates/                         # Templates (if any)
│   └── test/
│       └── java/com/tutorly/app/backend_api/
│           └── BackendApiApplicationTests.java
├── target/                                        # Compiled classes
├── pom.xml                                        # Maven dependencies
├── mvnw                                          # Maven wrapper (Unix)
├── mvnw.cmd                                      # Maven wrapper (Windows)
├── run-gui.sh                                    # Launch script (Unix)
├── run-gui.bat                                   # Launch script (Windows)
├── test-api.sh                                   # API testing script
├── launcher-config.properties                    # GUI config
└── HELP.md                                       # Spring Boot help
```

---

## Interaction Diagrams

### Sequence Diagram: Lesson Creation

```
Client          Controller        Service           Repository      Database
  |                 |                |                    |              |
  |---POST /api/lessons------------->|                    |              |
  |  (LessonCreateDTO)               |                    |              |
  |                 |                |                    |              |
  |                 |---saveLesson()-|                    |              |
  |                 |                |                    |              |
  |                 |                |---findById(tutorId)|              |
  |                 |                |                    |------------->|
  |                 |                |<-------------------|  SELECT      |
  |                 |                |   Optional<Tutor>  |<-------------|
  |                 |                |                    |              |
  |                 |                |---findById(studentId)             |
  |                 |                |                    |------------->|
  |                 |                |<-------------------|  SELECT      |
  |                 |                | Optional<Student>  |<-------------|
  |                 |                |                    |              |
  |                 |                |---save(lesson)---->|              |
  |                 |                |                    |------------->|
  |                 |                |<-------------------|  INSERT      |
  |                 |                |   Lesson entity    |<-------------|
  |                 |                |                    |              |
  |                 |<---Lesson------|                    |              |
  |                 |                |                    |              |
  |<--ResponseEntity(201, Lesson)----|                    |              |
  |                 |                |                    |              |
```

---

## Performance and Optimization

### 1. **Lazy Loading vs Eager Loading**

Spring Data JPA uses **Lazy Loading** by default on `@OneToMany` and `@ManyToMany`:

```java
@OneToMany(mappedBy = "student", fetch = FetchType.LAZY)
private Set<Lesson> lessons;
```

**Pros:**
- Doesn't load unnecessary data
- Reduces initial payload

**Cons:**
- Can cause N+1 query problem
- Requires open session to access lazy data

**Solution: Fetch Join with JPQL**
```java
@Query("SELECT s FROM Student s LEFT JOIN FETCH s.lessons WHERE s.id = :id")
Optional<Student> findByIdWithLessons(@Param("id") Long id);
```

### 2. **Pagination**

For long lists, use `Pageable`:

```java
@GetMapping
public ResponseEntity<Page<Student>> getAllStudents(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
    
    Pageable pageable = PageRequest.of(page, size);
    Page<Student> students = studentService.getAllStudents(pageable);
    return ResponseEntity.ok(students);
}
```

In the repository:
```java
Page<Student> findAll(Pageable pageable);
```

### 3. **Caching**

Enable Spring Cache for frequent queries:

```java
@Service
public class StudentService {
    
    @Cacheable("students")
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }
    
    @CacheEvict(value = "students", allEntries = true)
    public Student saveStudent(Student student) {
        return studentRepository.save(student);
    }
}
```

Configuration in `@SpringBootApplication`:
```java
@EnableCaching
public class BackendApiApplication { ... }
```

---

## Continuous Integration / Deployment

### Build with Maven

```bash
# Clean + Compile + Test
mvn clean verify

# Package JAR
mvn clean package

# Skip tests
mvn clean package -DskipTests
```

### JAR Execution

```bash
java -jar target/backend-api-0.0.1-SNAPSHOT.jar
```

---

## Changelog

### v1.0.0 (2026-02-16)
- ✅ Initial implementation with all entities
- ✅ Complete REST API with API Key authentication
- ✅ GUI for server management
- ✅ HTTPS/SSL support
- ✅ PostgreSQL integration

---

**Navigation**  
⬅️ **Previous**: [00_Project_Overview.md](00_Project_Overview.md) | **Next**: [02_Java_GUI_Launcher.md](02_Java_GUI_Launcher.md) ➡️  
🏠 **Home**: [Documentation Index](README.md)

---

**Last updated:** February 25, 2026
