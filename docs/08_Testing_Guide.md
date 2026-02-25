# 🧪 Testing Guide

Comprehensive guide for testing the Tutorly application including unit tests, integration tests, and end-to-end testing strategies.

---

**Document**: 08_Testing_Guide.md  
**Last Updated**: February 25, 2026  
**Version**: 1.0.0  
**Author**: Tutorly Development Team  

---

## 📋 Table of Contents

- [Overview](#overview)
- [Testing Strategy](#testing-strategy)
- [Java Backend Testing](#java-backend-testing)
- [Node.js Frontend Testing](#nodejs-frontend-testing)
- [Database Testing](#database-testing)
- [API Testing](#api-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Test Coverage](#test-coverage)
- [Continuous Integration](#continuous-integration)
- [Best Practices](#best-practices)

---

## Overview

The Tutorly project implements a comprehensive testing strategy covering multiple layers:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test interactions between components
- **API Tests**: Test REST API endpoints
- **E2E Tests**: Test complete user workflows
- **Database Tests**: Test data persistence and queries

### Testing Philosophy

- ✅ Write tests before fixing bugs (TDD approach)
- ✅ Maintain minimum 70% code coverage
- ✅ Test critical paths thoroughly
- ✅ Keep tests independent and repeatable
- ✅ Use meaningful test names
- ✅ Mock external dependencies

---

## Testing Strategy

### Test Pyramid

```
           /\
          /  \    E2E Tests (Few, slow, expensive)
         /____\
        /      \  Integration Tests (Some, medium speed)
       /________\
      /          \ Unit Tests (Many, fast, cheap)
     /____________\
```

### Coverage Goals

| Component | Target Coverage | Current Status |
|-----------|----------------|----------------|
| Java Backend | 80% | 🟡 In Progress |
| Node.js Frontend | 70% | 🔴 Planned |
| Service Modules | 85% | 🟡 In Progress |
| API Endpoints | 90% | 🟡 In Progress |

---

## Java Backend Testing

### Setup

The Java backend uses **JUnit 5** and **Spring Boot Test** for testing.

#### Dependencies (pom.xml)

```xml
<dependencies>
    <!-- Spring Boot Test -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    
    <!-- JUnit 5 -->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <scope>test</scope>
    </dependency>
    
    <!-- Mockito -->
    <dependency>
        <groupId>org.mockito</groupId>
        <artifactId>mockito-core</artifactId>
        <scope>test</scope>
    </dependency>
    
    <!-- H2 Database for testing -->
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### Unit Testing

#### Repository Tests

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class StudentRepositoryTest {
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Test
    void shouldFindStudentById() {
        // Given
        Student student = new Student();
        student.setName("John");
        student.setSurname("Doe");
        student = studentRepository.save(student);
        
        // When
        Optional<Student> found = studentRepository.findById(student.getId());
        
        // Then
        assertTrue(found.isPresent());
        assertEquals("John", found.get().getName());
    }
    
    @Test
    void shouldFindStudentsByClass() {
        // Given
        Student student1 = createStudent("Alice", "Smith", "3A");
        Student student2 = createStudent("Bob", "Jones", "3A");
        studentRepository.saveAll(Arrays.asList(student1, student2));
        
        // When
        List<Student> students = studentRepository.findByClasse("3A");
        
        // Then
        assertEquals(2, students.size());
    }
}
```

#### Service Tests

```java
@ExtendWith(MockitoExtension.class)
class StudentServiceTest {
    
    @Mock
    private StudentRepository studentRepository;
    
    @InjectMocks
    private StudentService studentService;
    
    @Test
    void shouldCreateStudent() {
        // Given
        Student student = new Student();
        student.setName("Jane");
        student.setSurname("Doe");
        
        when(studentRepository.save(any(Student.class)))
            .thenReturn(student);
        
        // When
        Student created = studentService.createStudent(student);
        
        // Then
        assertNotNull(created);
        assertEquals("Jane", created.getName());
        verify(studentRepository, times(1)).save(student);
    }
}
```

#### Controller Tests

```java
@WebMvcTest(StudentController.class)
class StudentControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private StudentService studentService;
    
    @Test
    void shouldGetAllStudents() throws Exception {
        // Given
        List<Student> students = Arrays.asList(
            createStudent(1L, "John", "Doe"),
            createStudent(2L, "Jane", "Smith")
        );
        when(studentService.getAllStudents()).thenReturn(students);
        
        // When & Then
        mockMvc.perform(get("/api/students")
                .header("X-API-Key", "test-key"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].name").value("John"));
    }
}
```

### Running Tests

```bash
# Run all tests
cd Java/backend-api
mvn test

# Run specific test class
mvn test -Dtest=StudentServiceTest

# Run tests with coverage report
mvn test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

---

## Node.js Frontend Testing

### Setup

The Node.js frontend uses **Jest** and **Supertest** for testing.

#### Installation

```bash
cd Nodejs
npm install --save-dev jest supertest @types/jest
```

#### Configuration (package.json)

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "coverageDirectory": "coverage",
    "collectCoverageFrom": [
      "src/**/*.js",
      "server_utilities/**/*.js",
      "!src/index.js"
    ]
  }
}
```

### Unit Testing

#### Service Module Tests

```javascript
// server_utilities/__tests__/passwordService.test.js
const passwordService = require('../passwordService');

describe('passwordService', () => {
    describe('hashPassword', () => {
        it('should hash a plain text password', async () => {
            const password = 'mySecretPassword123';
            const hashedPassword = await passwordService.hashPassword(password);
            
            expect(hashedPassword).toBeDefined();
            expect(hashedPassword).not.toBe(password);
            expect(hashedPassword.startsWith('$2b$')).toBe(true);
        });
    });
    
    describe('comparePassword', () => {
        it('should return true for matching passwords', async () => {
            const password = 'testPassword123';
            const hashedPassword = await passwordService.hashPassword(password);
            
            const isMatch = await passwordService.comparePassword(password, hashedPassword);
            
            expect(isMatch).toBe(true);
        });
        
        it('should return false for non-matching passwords', async () => {
            const hashedPassword = await passwordService.hashPassword('correctPassword');
            
            const isMatch = await passwordService.comparePassword('wrongPassword', hashedPassword);
            
            expect(isMatch).toBe(false);
        });
    });
});
```

#### Logger Tests

```javascript
// server_utilities/__tests__/logger.test.js
const logger = require('../logger');

describe('logger', () => {
    let consoleSpy;
    
    beforeEach(() => {
        consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });
    
    afterEach(() => {
        consoleSpy.mockRestore();
    });
    
    it('should log success messages in green', () => {
        logger.logSuccess('Test message', '127.0.0.1', 'testUser');
        
        expect(consoleSpy).toHaveBeenCalled();
        expect(consoleSpy.mock.calls[0][0]).toContain('[SUCCESS]');
    });
    
    it('should log error messages in red', () => {
        logger.logError('Error occurred', '127.0.0.1', 'testUser');
        
        expect(consoleSpy).toHaveBeenCalled();
        expect(consoleSpy.mock.calls[0][0]).toContain('[ERROR]');
    });
});
```

### Integration Tests

```javascript
// __tests__/routes.test.js
const request = require('supertest');
const app = require('../src/index'); // Export app from index.js

describe('Authentication Routes', () => {
    describe('POST /login', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/login')
                .send({
                    username: 'tutor1',
                    password: 'password123'
                });
            
            expect(response.status).toBe(302); // Redirect
            expect(response.headers['set-cookie']).toBeDefined();
        });
        
        it('should reject invalid credentials', async () => {
            const response = await request(app)
                .post('/login')
                .send({
                    username: 'invalid',
                    password: 'wrong'
                });
            
            expect(response.status).toBe(302);
            // Should redirect back to login
        });
    });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- passwordService.test.js
```

---

## Database Testing

### Test Database Setup

Create a separate test database configuration:

```properties
# src/test/resources/application-test.properties
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.hibernate.ddl-auto=create-drop
```

### Integration Tests with Database

```java
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class LessonIntegrationTest {
    
    @Autowired
    private LessonRepository lessonRepository;
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private TutorRepository tutorRepository;
    
    @Test
    void shouldCreateLessonWithRelationships() {
        // Given
        Student student = createAndSaveStudent();
        Tutor tutor = createAndSaveTutor();
        
        Lesson lesson = new Lesson();
        lesson.setStudent(student);
        lesson.setTutor(tutor);
        lesson.setData("2026-02-25");
        
        // When
        Lesson saved = lessonRepository.save(lesson);
        
        // Then
        assertNotNull(saved.getId());
        assertEquals(student.getId(), saved.getStudent().getId());
        assertEquals(tutor.getId(), saved.getTutor().getId());
    }
}
```

---

## API Testing

### Manual API Testing

#### Using curl

```bash
# Test GET endpoint
curl -X GET https://localhost:8443/api/students \
  -H "X-API-Key: your-api-key" \
  -k

# Test POST endpoint
curl -X POST https://localhost:8443/api/students \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "surname": "Doe",
    "classe": "3A"
  }' \
  -k
```

#### Using test-api.sh

```bash
cd Java/backend-api
./test-api.sh
```

### Automated API Testing

#### Postman/Newman

1. Create Postman collection with all API endpoints
2. Export collection and environment
3. Run with Newman:

```bash
npm install -g newman
newman run api-tests.postman_collection.json -e test-environment.json
```

#### REST Assured (Java)

```java
@Test
void shouldGetStudentById() {
    given()
        .header("X-API-Key", API_KEY)
        .pathParam("id", 1)
    .when()
        .get("/api/students/{id}")
    .then()
        .statusCode(200)
        .body("name", equalTo("John"))
        .body("surname", equalTo("Doe"));
}
```

---

## Integration Testing

### Full Stack Integration Tests

```javascript
describe('Full User Flow', () => {
    let agent;
    
    beforeAll(async () => {
        // Start both servers
        await startJavaBackend();
        await startNodeFrontend();
        agent = request.agent(app);
    });
    
    it('should complete full lesson booking flow', async () => {
        // 1. Login
        await agent.post('/login')
            .send({ username: 'tutor1', password: 'pass123' })
            .expect(302);
        
        // 2. Navigate to lessons page
        const lessonsPage = await agent.get('/lessons').expect(200);
        expect(lessonsPage.text).toContain('Lessons');
        
        // 3. Create new lesson
        const createResponse = await agent.post('/api/lessons/new')
            .send({
                studentId: 1,
                date: '2026-02-26',
                subject: 'Math'
            })
            .expect(200);
        
        expect(createResponse.body.success).toBe(true);
    });
});
```

---

## End-to-End Testing

### Setup with Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### E2E Test Example

```javascript
// e2e/login.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Login Flow', () => {
    test('should login as tutor', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Fill login form
        await page.fill('input[name="username"]', 'tutor1');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        // Verify redirect to home
        await expect(page).toHaveURL(/.*\/home/);
        await expect(page.locator('h1')).toContainText('Dashboard');
    });
    
    test('should display error for invalid credentials', async ({ page }) => {
        await page.goto('http://localhost:3000/login');
        
        await page.fill('input[name="username"]', 'invalid');
        await page.fill('input[name="password"]', 'wrong');
        await page.click('button[type="submit"]');
        
        // Should show error message
        await expect(page.locator('.error-message')).toBeVisible();
    });
});
```

---

## Test Coverage

### Generating Coverage Reports

#### Java (JaCoCo)

```bash
mvn test jacoco:report
open target/site/jacoco/index.html
```

#### Node.js (Jest)

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### Coverage Thresholds

```json
// package.json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 70,
        "statements": 70
      }
    }
  }
}
```

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Run Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up JDK 21
        uses: actions/setup-java@v3
        with:
          java-version: '21'
      - name: Run Backend Tests
        run: |
          cd Java/backend-api
          mvn test
          
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd Nodejs
          npm install
      - name: Run Frontend Tests
        run: |
          cd Nodejs
          npm test
```

---

## Best Practices

### General Testing Principles

1. **Keep tests independent**: Each test should run in isolation
2. **Use descriptive names**: Test names should explain what they test
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Test edge cases**: Don't just test happy paths
5. **Mock external dependencies**: Database, APIs, file system
6. **Keep tests fast**: Unit tests should run in milliseconds
7. **Maintain test data**: Use factories or fixtures for test data

### Test Naming Convention

```java
// Good
@Test
void shouldReturnEmptyListWhenNoStudentsExist() { }

@Test
void shouldThrowExceptionWhenStudentNotFound() { }

// Bad  
@Test
void test1() { }

@Test
void testStudent() { }
```

### Test Organization

```
Java/backend-api/src/test/java/
├── com/tutorly/app/backend_api/
│   ├── controller/          # Controller tests
│   ├── service/             # Service tests
│   ├── repository/          # Repository tests
│   └── integration/         # Integration tests

Nodejs/
├── __tests__/               # Integration tests
├── server_utilities/__tests__/  # Unit tests for services
└── e2e/                     # E2E tests
```

---

**Navigation**  
⬅️ **Previous**: [07_Database_Configuration.md](07_Database_Configuration.md) | **Next**: [09_Deployment_Guide.md](09_Deployment_Guide.md) ➡️  
🏠 **Home**: [Documentation Index](README.md)

---

**Last Updated**: February 25, 2026
