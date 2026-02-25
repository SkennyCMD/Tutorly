# Server Utilities

This file contains a list of all the utility modules in Nodejs/server_utilities organized by functionality, separating business logic from the main server file.

## File Structure

### 📋 `config.js`
Centralized application configuration.
- Java Backend API credentials
- Server ports
- Session secrets
- Session durations

**Exports:**
- `JAVA_API_URL`: Java backend URL
- `JAVA_API_KEY`: API key for authentication
- `PORT`: Node.js server port
- `TUTOR_SESSION_SECRET`: Secret for tutor sessions
- `ADMIN_SESSION_SECRET`: Secret for admin sessions
- `TUTOR_SESSION_DURATION`: Tutor session duration (30 days)
- `ADMIN_SESSION_DURATION`: Admin session duration (1 hour)

---

### 🔐 `authService.js`
Authentication services for tutors and administrators.

**Role:** User authentication with bcrypt password verification

**Key Functions:**

#### `authenticateTutor(username, password)`
Authenticates a tutor user against the Java backend API.

**Process:**
1. Hash the attempted password with bcrypt
2. Fetch all tutors from Java API
3. Find tutor by username
4. Check account status (blocked check)
5. Verify password with bcrypt comparison
6. Return authentication result with tutor data

**Return Value:**
```javascript
{
    tutorId: number,
    tutorData: object,
    passwordHash: string,
    dbHash: string,
    blocked: boolean
}
```

#### `authenticateAdmin(username, password)`
Authenticates an admin user with similar process.

**Features:**
- Bcrypt password hashing and verification
- Blocked account detection
- Password hash logging for debugging
- Integration with Java API for user data

**Exports:**
- `authenticateTutor(username, password)`: Authenticates a tutor with bcrypt password verification, returns `{tutorId, tutorData}` or null
- `authenticateAdmin(username, password)`: Authenticates an admin with bcrypt password verification, returns `{adminId, adminData}` or null
- `authenticateTutorWithJavaAPI(username, password)`: ⚠️ DEPRECATED - Legacy method
- `authenticateAdminWithJavaAPI(username, password)`: ⚠️ DEPRECATED - Legacy method

**Note:** The new authentication methods use bcrypt for secure password verification. Passwords are hashed using bcrypt with 10 salt rounds when creating users.

---

### 🔒 `passwordService.js`
Password security and authentication logging utilities.

**Role:** Password hashing and verification with bcrypt

#### `hashPassword(plainPassword)`
Hashes a plain-text password using bcrypt.
```javascript
const hashedPassword = await hashPassword('password123');
// Returns: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcflz...
```

**Features:**
- Salt rounds: 10 (configurable)
- Async/await support
- Automatic salt generation

#### `verifyPassword(plainPassword, hash)`
Verifies a password against its hash.
```javascript
const isValid = await verifyPassword('password123', storedHash);
// Returns: true or false
```

#### `logAuthAttempt(type, username, ip, success, attemptedHash, dbHash)`
Logs authentication attempts with detailed information.

**Log Format:**
```
[2026-02-16T10:30:00.123Z] Tutor Login Attempt
Username: mario.rossi
IP: 192.168.1.100
Success: true
Attempted Hash: $2b$10$abc...
DB Hash: $2b$10$abc...
```

**Exports:**
- `hashPassword(password)`: Hashes a plain text password using bcrypt (10 salt rounds)
- `verifyPassword(password, hash)`: Verifies a plain text password against a bcrypt hash
- `logAuthAttempt(type, username, ip, success)`: Logs authentication attempts with colored console output (orange for attempts, green for success, red for failure)

**Usage example:**
```javascript
const { hashPassword, verifyPassword } = require('./server_utilities/passwordService');

// When creating a user
const hashedPassword = await hashPassword('mySecurePassword123');

// When authenticating
const isValid = await verifyPassword('mySecurePassword123', hashedPassword);
```

---

### 🛡️ `authMiddleware.js`
Express middleware for authentication and authorization control.

**Role:** Protect routes with authentication and authorization checks

#### `isAuthenticated`
Ensures user has active tutor session.
```javascript
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
};
```

**Usage:**
```javascript
app.get('/home', isAuthenticated, (req, res) => {
    // Protected route - only accessible if logged in
});
```

#### `isAdmin`
Ensures user has active admin session.
```javascript
const isAdmin = (req, res, next) => {
    if (req.session && req.session.adminId) {
        return next();
    }
    res.redirect('/adminLogin');
};
```

#### `isStaff`
Verifies user has STAFF role by fetching user data from API.
```javascript
const isStaff = async (req, res, next) => {
    if (!req.session?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const tutorData = await fetchTutorData(req.session.userId);
    if (tutorData?.role === 'STAFF') {
        return next();
    }
    return res.status(403).json({ error: 'Access denied' });
};
```

#### `hasRole(...roles)`
Flexible role verification middleware factory.
```javascript
// Example: Allow both STAFF and ADMIN roles
app.get('/reports', hasRole('STAFF', 'admin'), (req, res) => {
    // Route accessible by STAFF or admin
});
```

**Exports:**
- `isAuthenticated`: Verifies that the user (tutor) is authenticated
- `isAdmin`: Verifies that the admin user is authenticated
- `isStaff`: Verifies that the user has STAFF role
- `hasRole(...roles)`: Verifies that the user has one of the specified roles
- `isGuest`: Verifies that the user is NOT authenticated
- `logAuthentication`: Logs authenticated requests

**Usage example:**
```javascript
const { isAuthenticated, isStaff } = require('./server_utilities/authMiddleware');

// Protected route for authenticated users
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard');
});

// Route for STAFF only
app.get('/reports', isAuthenticated, isStaff, (req, res) => {
    res.render('reports');
});
```

---

### 🌐 `javaApiService.js`
Service for interaction with the Java Backend API.

**Role:** HTTP client for Java Backend API communication

#### Core Function: `fetchFromJavaAPI(path, method, data)`

**Purpose:** Generic wrapper for all API calls

**Features:**
- HTTPS requests with self-signed certificate support
- Automatic X-API-Key header injection
- JSON serialization/deserialization
- Error handling and logging
- Support for GET, POST, PUT, PATCH, DELETE methods

**Example:**
```javascript
// GET request
const tutors = await fetchFromJavaAPI('/api/tutors', 'GET');

// POST request with data
const newLesson = await fetchFromJavaAPI('/api/lessons', 'POST', {
    tutorId: 5,
    studentId: 10,
    startTime: '2026-02-16T10:00:00',
    endTime: '2026-02-16T11:00:00',
    description: 'Mathematics lesson'
});

// PUT request
const updated = await fetchFromJavaAPI('/api/lessons/42', 'PUT', lessonData);

// DELETE request
await fetchFromJavaAPI('/api/lessons/42', 'DELETE');
```

#### Specialized Functions:

| Function | Purpose |
|----------|---------||
| `fetchTutorData(tutorId)` | Get tutor by ID |
| `fetchAllLessons()` | Get all lessons |
| `fetchLessonsByTutor(tutorId)` | Get lessons for specific tutor |
| `fetchAllStudents()` | Get all students |
| `fetchStudentData(studentId)` | Get student by ID |
| `fetchAllPrenotations()` | Get all bookings |
| `fetchPrenotationsByTutor(tutorId)` | Get bookings for tutor |
| `fetchCalendarNotesByTutor(tutorId)` | Get calendar notes for tutor |
| `fetchCalendarNotesByDateRange(start, end)` | Get notes in date range |

**Configuration:**
```javascript
// config.js
JAVA_API_URL: 'https://localhost:8443'
JAVA_API_KEY: 'MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu'
```

**Exports:**
- `fetchFromJavaAPI(path, method, data)`: Generic function for API calls
- `fetchTutorData(tutorId)`: Fetches tutor data
- `fetchCalendarNotesByTutor(tutorId)`: Fetches calendar notes for a tutor
- `fetchCalendarNotesByDateRange(startTime, endTime)`: Fetches notes within a date range
- `fetchLessonsByTutor(tutorId)`: Fetches lessons for a tutor
- `fetchAllLessons()`: Fetches all lessons
- `fetchAllPrenotations()`: Fetches all bookings
- `fetchPrenotationsByTutor(tutorId)`: Fetches bookings for a tutor
- `fetchStudentData(studentId)`: Fetches student data
- `fetchAllStudents()`: Fetches all students

**Usage example:**
```javascript
const { fetchStudentData, fetchAllLessons } = require('./server_utilities/javaApiService');

// Fetch student data
const student = await fetchStudentData(123);

// Fetch all lessons
const lessons = await fetchAllLessons();
```

---

### 📝 `logger.js`
Centralized logging with color-coded console output.

**Role:** Centralized logging with color-coded console output

#### Log Levels:

| Function | Color | Usage |
|----------|-------|-------|
| `logError(message, req, data)` | 🔴 Red | Critical errors |
| `logSuccess(message, req, data)` | 🟢 Green | Successful operations |
| `logWarning(message, req, data)` | 🟠 Orange | Non-critical issues |
| `logInfo(message, req, data)` | 🔵 Blue | General information |

#### Features:
- Automatic timestamp formatting (ISO 8601)
- Client IP extraction from request
- Username from session
- JSON formatting for additional data
- ANSI color support for terminals

**Example Output:**
```
[2026-02-16T10:30:45.123Z] INFO | 192.168.1.100 | mario.rossi
Tutor login successful

[2026-02-16T10:31:12.456Z] ERROR | 192.168.1.100 | mario.rossi
Failed to fetch lessons: Connection refused
```

#### Request Logger Middleware:
```javascript
app.use(requestLogger);

// Logs every HTTP request:
// --> GET /home | 192.168.1.100 | mario.rossi
// <-- GET /home | 200 OK | 45ms
```

---

### 📝 `adminLogger.js`
Logging of administrator login attempts.

**Exports:**
- `logAdminLoginAttempt(username, ip, success)`: Logs an admin login attempt to the `admin_login_attempts.txt` file

---

### 📊 `excel.js`
Excel report generation.

**Role:** Generate Excel reports for lessons and statistics

#### Report Types:

**1. Monthly Lessons Report**
```javascript
const result = await generateLessonsExcel(
    lessons,
    fetchStudentData,
    fetchTutorData,
    9,  // month
    2024 // year
);
```

**Columns:**
- ID, Day, Tutor, Student, Class
- Start Time, End Time, Duration
- Description

**2. Students Lessons Report**
```javascript
const result = await generateStudentsLessonsExcel(
    lessons,
    fetchStudentData,
    fetchTutorData,
    9, 2024
);
```

**Features:**
- Separate sheet per student
- Summary statistics per student
- Class-based sorting

**3. Tutor Monthly Report**
```javascript
const result = await generateTutorMonthlyReport(
    lessons,
    fetchStudentData,
    tutorId,
    year
);
```

**Features:**
- Yearly overview per tutor
- Monthly statistics (hours, classes)
- Overlap detection (double-booked lessons)
- Class distribution (U, M, S)

**Styling:**
- 🔵 Header: Teal background (#14B8A6), white bold text
- ⚪ Total rows: Gray background (#E5E7EB), bold text
- 🔵 Month sections: Light blue background (#DBEAFE)

**Exports:**
- `generateLessonsExcel(lessons, fetchStudent, fetchTutor, month, year)`: Generates monthly lessons report
- `generateStudentsLessonsExcel(lessons, fetchStudent, fetchTutor, month, year)`: Generates lessons report by student
- `generateTutorMonthlyReport(lessons, tutors, fetchStudent, year)`: Generates monthly statistics per tutor

---

### 📄 `userService.js`
User management service (if present).

---

## Best Practices

1. **Imports**: Import only the necessary functions
   ```javascript
   const { fetchStudentData, fetchAllLessons } = require('./server_utilities/javaApiService');
   ```

2. **Password Security**: Always hash passwords before storing
   ```javascript
   const { hashPassword } = require('./server_utilities/passwordService');
   const hashedPassword = await hashPassword(plainTextPassword);
   // Store hashedPassword in database, NEVER store plain text passwords
   ```

3. **Authentication**: Use the new bcrypt-based authentication methods
   ```javascript
   const { authenticateTutor } = require('./server_utilities/authService');
   const authResult = await authenticateTutor(username, password);
   if (authResult) {
       // Login successful, authResult contains tutorId and tutorData
   }
   ```

4. **Error Handling**: Fetch functions already handle errors and return empty arrays or null
   ```javascript
   const students = await fetchAllStudents(); // Returns [] in case of error
   ```

5. **Middleware Chain**: Combine middleware to protect routes
   ```javascript
   app.get('/admin/reports', adminSession, isAdmin, isStaff, (req, res) => {
       // Protected route for admin with STAFF role
   });
   ```

6. **Configuration**: Always import from `config.js` for shared values
   ```javascript
   const { JAVA_API_KEY, PORT } = require('./server_utilities/config');
   ```

7. **Logging**: Authentication attempts are automatically logged with colored output for better visibility

## Maintenance

To add new features:
1. Identify the appropriate module (auth, api, logging, etc.)
2. Add the function to the corresponding module
3. Export the function in `module.exports`
4. Document the function with JSDoc comments
5. Update this README
---

**Last Updated**: February 25, 2026  