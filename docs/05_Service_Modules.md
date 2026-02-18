# Server Utilities

This folder contains utility modules organized by functionality, separating business logic from the main server file.

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

**Exports:**
- `authenticateTutor(username, password)`: Authenticates a tutor with bcrypt password verification, returns `{tutorId, tutorData}` or null
- `authenticateAdmin(username, password)`: Authenticates an admin with bcrypt password verification, returns `{adminId, adminData}` or null
- `authenticateTutorWithJavaAPI(username, password)`: ⚠️ DEPRECATED - Legacy method
- `authenticateAdminWithJavaAPI(username, password)`: ⚠️ DEPRECATED - Legacy method

**Note:** The new authentication methods use bcrypt for secure password verification. Passwords are hashed using bcrypt with 10 salt rounds when creating users.

---

### 🔒 `passwordService.js`
Password security and authentication logging utilities.

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

### 📝 `adminLogger.js`
Logging of administrator login attempts.

**Exports:**
- `logAdminLoginAttempt(username, ip, success)`: Logs an admin login attempt to the `admin_login_attempts.txt` file

---

### 📊 `excel.js`
Excel report generation.

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
