# Tutorly Frontend Server - Technical Documentation

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Application Structure](#application-structure)
- [Architectural Pattern](#architectural-pattern)
- [Core Components](#core-components)
- [Request Flow](#request-flow)
- [Authentication System](#authentication-system)
- [Session Management](#session-management)
- [API Integration](#api-integration)
- [Setup and Configuration](#setup-and-configuration)
- [Routes and Endpoints](#routes-and-endpoints)

---

## Overview

The **Tutorly Frontend Server** is a Node.js/Express.js web application that serves as the user-facing interface for the Tutorly tutoring management system. It acts as an intermediary between users (tutors and admins) and the Java Backend API, providing authentication, session management, and a rich web interface.

### Main Features
- ✅ Dual authentication system (Tutors and Admins)
- ✅ Session-based authentication with bcrypt password hashing
- ✅ Role-based access control (STAFF, GENERIC, ADMIN)
- ✅ Dynamic web interface with EJS templating
- ✅ Excel report generation for lessons and statistics
- ✅ Real-time data synchronization Java Backend API
- ✅ Comprehensive logging system with color-coded output
- ✅ Responsive design with modern CSS
- ✅ Client-side JavaScript for interactive features

---

## System Architecture

### High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         WEB BROWSER                            │
│                    (Client - User Interface)                   │
└────────────────────┬───────────────────────────────────────────┘
                     │ HTTP/HTTPS
                     ▼
┌────────────────────────────────────────────────────────────────┐
│                  NODE.JS EXPRESS SERVER                        │
│                  (Frontend/Middle Tier)                        │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              MIDDLEWARE LAYER                            │  │
│  │  - Session Management (express-session)                  │  │
│  │  - Authentication (isAuthenticated, isAdmin, isStaff)    │  │
│  │  - Request Logging                                       │  │
│  │  - Static File Serving                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              ROUTE HANDLERS                              │  │
│  │  - Authentication Routes (/login, /logout)               │  │
│  │  - Dashboard Routes (/home)                              │  │
│  │  - Lesson Management (/lessons, /calendar)               │  │
│  │  - Admin Panel (/admin, /staffPanel)                     │  │
│  │  - API Endpoints (/api/*)                                │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              SERVICE LAYER                               │  │
│  │  - authService: User authentication                      │  │
│  │  - javaApiService: Backend API communication             │  │
│  │  - passwordService: Password hashing/verification        │  │
│  │  - logger: Centralized logging                           │  │
│  │  - excel: Report generation                              │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                            │
└───────────────────┼────────────────────────────────────────────┘
                    │ HTTPS + API Key
                    ▼
┌────────────────────────────────────────────────────────────────┐
│                  JAVA SPRING BOOT API                          │
│                  (Backend - Data Layer)                        │
│                  Port 8443                                     │
└────────────────────┬───────────────────────────────────────────┘
                     │ JDBC
                     ▼
┌────────────────────────────────────────────────────────────────┐
│                  POSTGRESQL DATABASE                           │
│                  (tutorly_db)                                  │
└────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Browser ←→ Express Server ←→ Java API ←→ PostgreSQL
     │               │                │            │
     │               │                │            │
  [HTML/CSS]    [Middleware]      [REST API]   [Database]
  [JavaScript]  [Services]        [JPA/Hibernate]
     │               │                │
     │               │                │
  [EJS Views]   [Route Handlers] [Controllers]
```

---

## Technology Stack

### Frontend Server (Node.js)
- **Node.js** - JavaScript runtime environment
- **Express.js 4.18.2** - Web application framework
- **EJS 3.1.10** - Embedded JavaScript templating
- **express-session 1.18.2** - Session management middleware
- **bcrypt 6.0.0** - Password hashing and verification
- **ExcelJS 4.4.0** - Excel report generation
- **nodemon 3.0.1** - Development auto-reload (dev dependency)

### Backend Integration
- **HTTPS Module** - Native Node.js HTTPS client for API communication
- **SSL/TLS Support** - Self-signed certificates for local HTTPS development
- **Java Backend API** - RESTful API (Spring Boot on port 8443)
- **API Key Authentication** - X-API-Key header-based authentication

### Client-Side
- **Vanilla JavaScript** - Interactive DOM manipulation
- **CSS3** - Modern responsive styling
- **Fetch API** - Asynchronous HTTP requests

### Development Tools
- **npm** - Package manager
- **Git** - Version control
- **nodemon** - Auto-restart during development

---

## Application Structure

### Directory Tree

```
Nodejs/
├── src/
│   └── index.js                    # Main Express server and route definitions
│
├── server_utilities/               # Service modules (business logic)
│   ├── authService.js              # User authentication (tutor/admin)
│   ├── authMiddleware.js           # Authentication middleware
│   ├── javaApiService.js           # Java Backend API client
│   ├── passwordService.js          # Password hashing with bcrypt
│   ├── logger.js                   # Centralized logging system
│   ├── adminLogger.js              # Admin login attempt logging
│   ├── userService.js              # User management utilities
│   ├── excel.js                    # Excel report generation
│   ├── config.js                   # Application configuration
│   └── README.md                   # Service module documentation
│
├── views/                          # EJS templates (server-rendered HTML)
│   ├── login.ejs                   # Tutor login page
│   ├── adminLogin.ejs              # Admin login page
│   ├── home.ejs                    # Tutor home dashboard
│   ├── lessons.ejs                 # Lesson management interface
│   ├── calendar.ejs                # Calendar view with notes
│   ├── admin.ejs                   # Admin panel
│   ├── staffPanel.ejs              # Staff panel (STAFF role only)
│   └── 404.ejs                     # Error page
│
├── public/                         # Static files (client-side)
│   ├── css/                        # Stylesheets
│   │   ├── login.css               # Login page styles
│   │   ├── adminLogin.css          # Admin login styles
│   │   ├── home.css                # Home dashboard styles
│   │   ├── lessons.css             # Lesson management styles
│   │   ├── calendar.css            # Calendar view styles
│   │   ├── admin.css               # Admin panel styles
│   │   └── staffPanel.css          # Staff panel styles
│   │
│   └── js/                         # Client-side JavaScript
│       ├── adminLogin.js           # Admin login form handling
│       ├── admin.js                # Admin panel interactions
│       ├── homeScript.js           # Home page interactions
│       ├── lessonsScript.js        # Lesson management logic
│       ├── calendarScript.js       # Calendar interactions
│       ├── staffPanel.js           # Staff panel functionality
│       ├── modalShared.js          # Shared modal utilities
│       └── 404.js                  # Error page interactions
│
├── ssl/                            # SSL certificates (gitignored)
│   ├── private-key.pem             # Private key for HTTPS
│   ├── certificate.pem             # Self-signed certificate
│   └── README.md                   # SSL certificate documentation
│
├── migrations/                     # Database migration scripts
│   ├── hashExistingPasswords.js    # Migrate plain-text passwords to bcrypt
│   └── README.md                   # Migration documentation
│
├── admin_login_attempts.txt        # Admin login attempt log file
├── generate-ssl-cert.sh            # Script to generate SSL certificates
├── package.json                    # Node.js dependencies and scripts
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── HTTPS_SETUP.md                  # HTTPS configuration guide
└── README.md                       # This file
```

---

## Architectural Pattern

The application follows an **MVC-inspired architecture** adapted for server-side rendering with Express.js:

### Layer Breakdown

```
┌───────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                     │
│                                                               │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │
│  │  EJS Views   │   │ Static Files │   │  Client JS   │       │
│  │  (Server)    │   │  (CSS/HTML)  │   │  (Browser)   │       │
│  └──────────────┘   └──────────────┘   └──────────────┘       │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                       CONTROLLER LAYER                        │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐     │
│  │              Route Handlers (index.js)               │     │
│  │                                                      │     │
│  │  - Authentication Routes (login, logout)             │     │
│  │  - View Routes (home, lessons, calendar)             │     │
│  │  - API Routes (CRUD operations)                      │     │
│  │  - Admin Routes (admin panel, staff panel)           │     │
│  └──────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                       MIDDLEWARE LAYER                        │
│                                                               │
│  ┌────────────────┐   ┌──────────────┐   ┌──────────────┐     │
│  │ isAuthenticated|   │  isAdmin     │   │  isStaff     │     │
│  │ (Session Check)|   │ (Role Check) │   │ (Role Check) │     │
│  └────────────────┘   └──────────────┘   └──────────────┘     │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER                          │
│                                                               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │  authService  │  │ javaApiService│  │    logger     │      │
│  │  (Auth Logic) │  │  (HTTP Client)│  │   (Logging)   │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│                                                               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │passwordService│  │     excel     │  │  userService  │      │
│  │   (Hashing)   │  │   (Reports)   │  │  (User Mgmt)  │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                     INTEGRATION LAYER                         │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐     │
│  │           Java Backend API Client (HTTPS)            │     │
│  │                                                      │     │
│  │  - fetchFromJavaAPI(path, method, data)              │     │
│  │  - Automatic X-API-Key authentication                │     │
│  │  - JSON request/response handling                    │     │
│  │  - Self-signed SSL certificate support               │     │
│  └──────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. **Main Server (src/index.js)**

**Role:** Central application entry point and route orchestrator

**Responsibilities:**
- Initialize Express application
- Configure middleware (sessions, static files, body parsers)
- Define all HTTP routes
- Handle view rendering with EJS
- Manage request/response lifecycle
- Error handling and logging

**Key Features:**
- 1675 lines of comprehensive route definitions
- Dual authentication systems (tutor/admin)
- RESTful API endpoints
- Excel report generation endpoints
- Real-time data fetching from Java API

**Example Route Structure:**
```javascript
// Authentication routes
app.get('/login', ...)
app.post('/login', ...)
app.get('/logout', ...)

// Protected tutor routes
app.get('/home', isAuthenticated, ...)
app.get('/lessons', isAuthenticated, ...)
app.get('/calendar', isAuthenticated, ...)

// Admin routes
app.get('/admin', isAdmin, ...)
app.get('/staffPanel', isStaff, ...)

// API endpoints
app.get('/api/lessons', isAuthenticated, ...)
app.post('/api/lessons', isAuthenticated, ...)
app.put('/api/lessons/:id', isAuthenticated, ...)
app.delete('/api/lessons/:id', isAuthenticated, ...)
```

---

### 2. **Service Modules (server_utilities/)**

The application uses several service modules for authentication, API communication, logging, and report generation. These modules separate business logic from the main server file and provide reusable functionality.

**Available Service Modules:**
- **authService.js**: User authentication with bcrypt
- **authMiddleware.js**: Route protection middleware
- **javaApiService.js**: Java Backend API client
- **passwordService.js**: Password hashing and verification
- **logger.js**: Centralized color-coded logging
- **adminLogger.js**: Admin login attempt logging
- **excel.js**: Excel report generation
- **userService.js**: User management utilities
- **config.js**: Application configuration

📚 **Complete documentation for all service modules**: [05_Service_Modules.md](05_Service_Modules.md)

---

### 3. **Session Management**

**Configuration:**
```javascript
const sessionMiddleware = session({
    name: 'tutorly.sid',
    secret: TUTOR_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: false // Set to true in production with HTTPS
    }
});
```

**Session Data Structure:**

**Tutor Session:**
```javascript
req.session = {
    userId: 5,
    username: 'mario.rossi',
    role: 'staff'
}
```

**Admin Session:**
```javascript
req.session = {
    adminId: 1,
    adminUsername: 'admin',
    isAdmin: true
}
```

**Lifecycle:**
1. **Login:** Create session with user data
2. **Request:** Session cookie sent automatically
3. **Verification:** Middleware checks session validity
4. **Logout:** Destroy session and clear cookie

---

## Request Flow

### Example: Tutor Login Flow

```
1. USER
   Browser → GET /login
   
2. EXPRESS SERVER
   ✓ Render login.ejs template
   ✓ Send HTML to browser

3. USER
   Browser → POST /login
   Body: {
       username: "mario.rossi",
       password: "password123"
   }

4. EXPRESS SERVER - Route Handler
   ✓ Extract username and password from req.body
   ✓ Get client IP from req.ip

5. authService.authenticateTutor()
   ✓ Hash attempted password with bcrypt
   ✓ Call Java API: GET /api/tutors

6. JAVA API
   ✓ Verify X-API-Key header
   ✓ Query PostgreSQL for tutors
   ✓ Return JSON array of tutors

7. authService (continued)
   ✓ Find tutor by username
   ✓ Check if account is BLOCKED
   ✓ Verify password with bcrypt.compare()
   ✓ Return authentication result

8. EXPRESS SERVER - Route Handler
   ✓ Check authentication result
   ✓ If successful:
      - Create session: req.session.userId = tutorId
      - Store username: req.session.username = username
      - Store role: req.session.role = role
   ✓ Log authentication attempt
   ✓ Redirect to /home

9. EXPRESS SERVER - /home Route
   ✓ Middleware: isAuthenticated checks req.session.userId
   ✓ If authenticated, proceed to route handler
   ✓ Fetch data from Java API:
      - Calendar notes for today
      - Today's lessons
      - Today's prenotations
      - Student list
   ✓ Render home.ejs with data

10. USER
    Browser displays home dashboard with:
    - Today's tasks (calendar notes)
    - Scheduled lessons
    - Pending prenotations
    - Student list
```

---

### Example: Creating a Lesson Flow

```
1. USER (Client-Side JavaScript)
   Browser → POST /api/lessons
   Headers: { Content-Type: 'application/json' }
   Body: {
       tutorId: 5,
       studentId: 10,
       startTime: "2026-02-16T14:00:00",
       endTime: "2026-02-16T15:30:00",
       description: "Mathematics"
   }

2. EXPRESS SERVER - Middleware Chain
   ✓ sessionMiddleware: Restore session from cookie
   ✓ isAuthenticated: Check req.session.userId exists
   ✓ requestLogger: Log incoming request

3. EXPRESS SERVER - Route Handler (index.js)
   ✓ Extract lesson data from req.body
   ✓ Validate required fields
   ✓ Log action

4. javaApiService.fetchFromJavaAPI()
   ✓ Build HTTPS request to Java API
   ✓ Add X-API-Key header
   ✓ Stringify JSON body
   ✓ Send: POST https://localhost:8443/api/lessons

5. JAVA BACKEND API
   ✓ ApiKeyInterceptor validates X-API-Key
   ✓ LessonController.createLesson()
   ✓ LessonService validates business rules
   ✓ LessonRepository.save() → PostgreSQL INSERT
   ✓ Return created Lesson entity with ID

6. javaApiService (continued)
   ✓ Parse JSON response
   ✓ Return lesson object to route handler

7. EXPRESS SERVER - Route Handler
   ✓ Log success
   ✓ Send JSON response to client

8. USER (Client-Side JavaScript)
   ✓ Receive response
   ✓ Update UI (add lesson to table)
   ✓ Show success notification
   ✓ Clear form
```

---

## Authentication System

### Dual Authentication Architecture

The system supports two separate authentication contexts:

#### 1. **Tutor Authentication**

**Login Endpoint:** `POST /login`

**Process:**
1. User enters username and password
2. Server calls `authenticateTutor(username, password)`
3. Fetches tutor data from Java API
4. Checks if account status is "BLOCKED"
5. Verifies password with bcrypt
6. Creates session with tutor data
7. Redirects to `/home` dashboard

**Session Data:**
```javascript
{
    userId: number,        // Tutor ID
    username: string,      // Username
    role: string          // 'staff', 'generic', etc.
}
```

**Protected Routes:**
- `/home` - Home dashboard
- `/lessons` - Lesson management
- `/calendar` - Calendar view
- `/staffPanel` - Staff panel (STAFF role only)

#### 2. **Admin Authentication**

**Login Endpoint:** `POST /adminLogin`

**Process:**
1. Admin enters username and password
2. Server calls `authenticateAdmin(username, password)`
3. Fetches admin data from Java API
4. Verifies password with bcrypt
5. Creates admin session
6. Logs attempt to `admin_login_attempts.txt`
7. Redirects to `/admin` panel

**Session Data:**
```javascript
{
    adminId: number,       // Admin ID
    adminUsername: string, // Admin username
    isAdmin: true         // Admin flag
}
```

**Protected Routes:**
- `/admin` - Admin panel
- Admin-specific API endpoints

### Password Security

**Hashing Algorithm:** bcrypt
**Salt Rounds:** 10
**Storage:** Passwords stored as bcrypt hashes in PostgreSQL

**Example Hash:**
```
$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl.z9xpfMpvpGJzMN1xZBR0ue
```

**Migration:**
Plain-text passwords can be migrated using:
```bash
node migrations/hashExistingPasswords.js
```

---

## Session Management

### Configuration

**Session Store:** In-memory (default express-session)
**Session Secret:** Configurable via `config.js`
**Cookie Name:** `tutorly.sid`
**Cookie Settings:**
- `maxAge`: 30 days (tutor), 1 day (admin)
- `httpOnly`: true (prevents XSS)
- `secure`: false (set to true for HTTPS in production)

### Session Lifecycle

**1. Session Creation (Login)**
```javascript
app.post('/login', async (req, res) => {
    const authResult = await authenticateTutor(username, password);
    if (authResult.tutorId) {
        req.session.userId = authResult.tutorId;
        req.session.username = username;
        req.session.role = authResult.tutorData.role.toLowerCase();
        res.redirect('/home');
    }
});
```

**2. Session Validation (Middleware)**
```javascript
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
};
```

**3. Session Destruction (Logout)**
```javascript
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            logError('Session destruction failed', req);
        }
        res.redirect('/login');
    });
});
```

### Best Practices

✅ **DO:**
- Always use `httpOnly` cookies
- Set appropriate `maxAge` for security
- Use HTTPS in production with `secure: true`
- Destroy sessions on logout
- Rotate session secrets periodically

❌ **DON'T:**
- Store sensitive data in sessions
- Use predictable session secrets
- Allow sessions to persist indefinitely
- Expose session IDs in URLs

---

## API Integration

### Communication Architecture

```
Node.js Express                           Java Spring Boot
    │                                           │
    │  1. User Action (Create Lesson)           │
    │─────────────────────────────────────────▶│
    │                                           │
    │  2. HTTPS POST /api/lessons               │
    │     Headers: { X-API-Key: "..." }         │
    │     Body: { tutorId, studentId, ... }     │
    │                                           │
    │                                    3. Validate API Key
    │                                           │
    │                                    4. Process Request
    │                                           │
    │                                    5. Save to PostgreSQL
    │                                           │
    │  6. JSON Response (Created Lesson)        │
    │◀─────────────────────────────────────────│
    │     Status: 201 Created                   │
    │     Body: { id: 42, tutorId: 5, ... }     │
    │                                           │
    │  7. Update UI                             │
    │                                           │
```

### API Client Configuration

**Base URL:** `https://localhost:8443`
**Authentication:** X-API-Key header
**SSL:** Self-signed certificate (rejectUnauthorized: false)

**Request Example:**
```javascript
const options = {
    hostname: 'localhost',
    port: 8443,
    path: '/api/lessons',
    method: 'POST',
    headers: {
        'X-API-Key': 'MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu',
        'Content-Type': 'application/json'
    },
    rejectUnauthorized: false
};
```

### Error Handling

**Network Errors:**
```javascript
req.on('error', (error) => {
    console.error('Network error:', error);
    reject(error);
});
```

**HTTP Errors:**
```javascript
if (res.statusCode < 200 || res.statusCode >= 300) {
    reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
}
```

**Parse Errors:**
```javascript
try {
    const data = JSON.parse(responseData);
    resolve(data);
} catch (error) {
    reject(new Error('Invalid JSON response'));
}
```

---

## Setup and Configuration

### Prerequisites

- **Node.js 18+** (LTS recommended)
- **npm 9+** (comes with Node.js)
- **Java Backend API** running on port 8443
- **PostgreSQL Database** configured and running

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Tutorly/Nodejs

# Install dependencies
npm install
```

### Configuration

Edit `server_utilities/config.js`:

```javascript
module.exports = {
    // Java Backend API
    JAVA_API_URL: 'https://localhost:8443',
    JAVA_API_KEY: 'MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu',
    
    // Server Configuration
    PORT: process.env.PORT || 3000,
    
    // Session Management
    TUTOR_SESSION_SECRET: 'your-secret-key-here',
    ADMIN_SESSION_SECRET: 'your-admin-secret-here',
    TUTOR_SESSION_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
    ADMIN_SESSION_DURATION: 24 * 60 * 60 * 1000       // 1 day
};
```

### Running the Application

#### Production Mode:
```bash
npm start
```

#### Development Mode (with auto-reload):
```bash
npm run dev
```

#### HTTPS Mode (with self-signed certificates):
```bash
# Generate SSL certificates (first time only)
npm run generate-cert

# Start server in HTTPS mode
npm run https

# Development with HTTPS and auto-reload
npm run dev:https
```

**Default URLs:**
- **HTTP:** `http://localhost:3000`
- **HTTPS:** `https://localhost:3443` (with self-signed certificate)

📚 **For detailed HTTPS setup instructions, see:** [04_HTTPS_Setup_Guide.md](04_HTTPS_Setup_Guide.md)

### HTTPS Configuration

The server supports HTTPS with self-signed certificates for local development.

**Environment Variables:**

```bash
# Enable HTTPS mode
USE_HTTPS=true

# Configure ports
PORT=3000          # HTTP port (redirects to HTTPS when USE_HTTPS=true)
HTTPS_PORT=3443    # HTTPS port

# SSL certificate paths (relative to Nodejs directory)
SSL_KEY_PATH=./ssl/private-key.pem
SSL_CERT_PATH=./ssl/certificate.pem
```

**Quick Setup:**

```bash
# 1. Generate certificates
npm run generate-cert

# 2. Start HTTPS server
USE_HTTPS=true npm start
# or simply:
npm run https
```

**Browser Access:**
- Open `https://localhost:3443`
- Accept security warning (expected for self-signed certificates)
- Click "Advanced" → "Proceed to localhost"

⚠️ **Note:** Self-signed certificates are for development only. For production, use certificates from a trusted Certificate Authority (Let's Encrypt, DigiCert, etc.).

### First-Time Setup

1. **Ensure Java Backend is running:**
```bash
cd ../Java/backend-api
mvn spring-boot:run
```

2. **Verify API connectivity:**
```bash
curl -k -X GET https://localhost:8443/api/tutors \
     -H "X-API-Key: MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu"
```

3. **Start Node.js server:**
```bash
npm start
```

4. **Access login page:**
```
http://localhost:3000/login
```

### Demo Accounts

#### Tutors:
These must be created via the Java Backend API or Admin Panel.

#### Admin:
Default admin account (created via Java API):
- **Username:** admin
- **Email:** admin@tutorly.com
- **Password:** (set via bcrypt hash)

---

## Routes and Endpoints

### Public Routes (No Authentication Required)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Homepage (redirects to login or home) |
| GET | `/login` | Tutor login page |
| POST | `/login` | Tutor authentication |
| GET | `/adminLogin` | Admin login page |
| POST | `/adminLogin` | Admin authentication |

---

### Protected Tutor Routes (Requires `isAuthenticated`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/logout` | Destroy tutor session and redirect to login |
| GET | `/home` | Home dashboard (today's tasks, lessons, prenotations) |
| GET | `/lessons` | Lesson management interface |
| GET | `/calendar` | Calendar view with notes |

---

### Protected Admin Routes (Requires `isAdmin`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/admin` | Admin panel (tutor/student management) |
| GET | `/adminLogout` | Destroy admin session and redirect to admin login |

---

### Protected Staff Routes (Requires `isStaff`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/staffPanel` | Staff panel with advanced features |

---

### API Endpoints - Lessons

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/lessons` | Tutor | Get all lessons or filter by date range |
| GET | `/api/lessons/:id` | Tutor | Get lesson by ID |
| POST | `/api/lessons` | Tutor | Create new lesson |
| PUT | `/api/lessons/:id` | Tutor | Update lesson |
| DELETE | `/api/lessons/:id` | Tutor | Delete lesson |
| GET | `/api/lessons/tutor/:tutorId` | Tutor | Get lessons for specific tutor |

**Example - Create Lesson:**
```javascript
POST /api/lessons
Body: {
    tutorId: 5,
    studentId: 10,
    startTime: "2026-02-16T14:00:00",
    endTime: "2026-02-16T15:30:00",
    description: "Mathematics - Algebra"
}
```

---

### API Endpoints - Students

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/students` | Tutor | Get all students |
| GET | `/api/students/:id` | Tutor | Get student by ID |
| POST | `/api/students` | Tutor | Create new student |
| PUT | `/api/students/:id` | Tutor | Update student |
| DELETE | `/api/students/:id` | Tutor | Delete student |
| GET | `/api/students/search` | Tutor | Search students by query |

---

### API Endpoints - Prenotations (Bookings)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/prenotations` | Tutor | Get all prenotations |
| GET | `/api/prenotations/:id` | Tutor | Get prenotation by ID |
| POST | `/api/prenotations` | Tutor | Create new prenotation |
| PUT | `/api/prenotations/:id` | Tutor | Update prenotation |
| DELETE | `/api/prenotations/:id` | Tutor | Delete prenotation |
| PATCH | `/api/prenotations/:id/confirm` | Tutor | Confirm prenotation |

---

### API Endpoints - Tutors

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/tutors` | Tutor | Get all tutors |
| GET | `/api/tutors/:id` | Tutor | Get tutor by ID |
| POST | `/api/tutors` | Admin | Create new tutor |
| PUT | `/api/tutors/:id` | Admin | Update tutor |
| DELETE | `/api/tutors/:id` | Admin | Delete tutor |

---

### API Endpoints - Calendar Notes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/calendar-notes` | Tutor | Get all calendar notes |
| GET | `/api/calendar-notes/:id` | Tutor | Get note by ID |
| POST | `/api/calendar-notes` | Staff | Create new note |
| PUT | `/api/calendar-notes/:id` | Staff | Update note |
| DELETE | `/api/calendar-notes/:id` | Staff | Delete note |
| GET | `/api/calendar-notes/range` | Tutor | Get notes by date range |

---

### Excel Report Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/export/lessons/:month/:year` | Tutor | Download monthly lessons Excel report |
| GET | `/export/students-lessons/:month/:year` | Tutor | Download student-specific lessons report |
| GET | `/export/tutor-monthly/:tutorId/:year` | Tutor | Download tutor's yearly report |

**Example:**
```
GET /export/lessons/9/2024
Response: lessons_september_2024.xlsx (file download)
```

---

## Client-Side JavaScript

### Structure

Client-side JavaScript is organized by page/feature:

| File | Purpose |
|------|---------|
| `adminLogin.js` | Admin login form handling |
| `admin.js` | Admin panel interactions (add/edit/delete users) |
| `homeScript.js` | Home dashboard (task completion, quick actions) |
| `lessonsScript.js` | Lesson management (CRUD operations, filters) |
| `calendarScript.js` | Calendar view (event handling, date navigation) |
| `staffPanel.js` | Staff panel functionality |
| `modalShared.js` | Shared modal utilities (open, close, populate) |
| `404.js` | Error page interactions |

### Common Patterns

#### 1. **Fetch API for AJAX Requests**

```javascript
// GET request
async function fetchLessons() {
    const response = await fetch('/api/lessons');
    const lessons = await response.json();
    displayLessons(lessons);
}

// POST request
async function createLesson(lessonData) {
    const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(lessonData)
    });
    const result = await response.json();
    return result;
}
```

#### 2. **Modal Management**

```javascript
// Open modal
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Populate edit modal with data
function populateEditModal(lessonData) {
    document.getElementById('edit-lesson-id').value = lessonData.id;
    document.getElementById('edit-description').value = lessonData.description;
    // ... populate other fields
}
```

#### 3. **Dynamic Table Updates**

```javascript
function addLessonToTable(lesson) {
    const tableBody = document.getElementById('lessons-table-body');
    const row = tableBody.insertRow();
    row.innerHTML = `
        <td>${lesson.id}</td>
        <td>${lesson.tutorName}</td>
        <td>${lesson.studentName}</td>
        <td>${formatDate(lesson.startTime)}</td>
        <td>
            <button onclick="editLesson(${lesson.id})">Edit</button>
            <button onclick="deleteLesson(${lesson.id})">Delete</button>
        </td>
    `;
}
```

---

## Error Handling

### Server-Side Error Handling

**Try-Catch Blocks:**
```javascript
app.get('/home', isAuthenticated, async (req, res) => {
    try {
        const lessons = await fetchAllLessons();
        res.render('home', { lessons });
    } catch (error) {
        logError('Failed to fetch lessons', req, { error: error.stack });
        res.status(500).render('error', { 
            message: 'Failed to load dashboard' 
        });
    }
});
```

**API Error Responses:**
```javascript
if (!lesson) {
    return res.status(404).json({ 
        error: 'Lesson not found' 
    });
}

if (!req.body.tutorId) {
    return res.status(400).json({ 
        error: 'Tutor ID is required' 
    });
}
```

### Client-Side Error Handling

```javascript
async function createLesson(data) {
    try {
        const response = await fetch('/api/lessons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create lesson');
        }
        
        const lesson = await response.json();
        showSuccessMessage('Lesson created successfully');
        return lesson;
    } catch (error) {
        showErrorMessage(error.message);
        console.error('Create lesson error:', error);
    }
}
```

---

## Performance Optimization

### Caching Strategies

**1. Static File Caching**
```javascript
// Express static middleware with cache control
app.use(express.static('public', {
    maxAge: '1d' // Cache static files for 1 day
}));
```

**2. Session Store Optimization**

For production, use a persistent session store:
```javascript
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');

const redisClient = redis.createClient();

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
```

### API Call Optimization

**1. Parallel Requests with Promise.all()**
```javascript
const [lessons, students, prenotations] = await Promise.all([
    fetchAllLessons(),
    fetchAllStudents(),
    fetchAllPrenotations()
]);
```

**2. Request Batching**
```javascript
// Instead of multiple requests
const lesson1 = await fetchLesson(1);
const lesson2 = await fetchLesson(2);
const lesson3 = await fetchLesson(3);

// Use a single request with filters
const lessons = await fetchLessons({ ids: [1, 2, 3] });
```

---

## Security Best Practices

### 1. **Password Security**
✅ Using bcrypt with salt rounds 10
✅ Never store plain-text passwords
✅ Verify passwords with constant-time comparison

### 2. **Session Security**
✅ httpOnly cookies to prevent XSS
✅ Appropriate session expiration times
✅ Session destruction on logout
✅ Secure flag in production (HTTPS)

### 3. **API Security**
✅ API key authentication for backend calls
✅ HTTPS communication with backend
✅ Request validation and sanitization
✅ Error messages don't leak sensitive info

### 4. **Authentication**
✅ Role-based access control
✅ Middleware-protected routes
✅ Blocked account detection
✅ Login attempt logging

### 5. **Input Validation**
✅ Validate all user inputs
✅ Sanitize data before database operations
✅ Use parameterized queries (handled by Java backend)

---

## Logging and Monitoring

### Log Types

**1. Authentication Logs**
```
[2026-02-16T10:30:45] Tutor Login Attempt
Username: mario.rossi
IP: 192.168.1.100
Success: true
```

**2. Request Logs**
```
--> GET /home | 192.168.1.100 | mario.rossi
<-- GET /home | 200 OK | 45ms
```

**3. Error Logs**
```
[2026-02-16T10:31:12] ERROR | 192.168.1.100 | mario.rossi
Failed to fetch lessons: ECONNREFUSED
Stack: Error: connect ECONNREFUSED 127.0.0.1:8443
```

**4. Admin Login Logs**
File: `admin_login_attempts.txt`
```
[2026-02-16T10:32:00] Admin Login Attempt
Username: admin
IP: 192.168.1.100
Success: true
```

### Monitoring Best Practices

1. **Enable Request Logging**
```javascript
app.use(requestLogger);
```

2. **Log All Authentication Attempts**
```javascript
logAuthAttempt('tutor', username, ip, success, hash, dbHash);
```

3. **Monitor API Failures**
```javascript
try {
    await fetchFromJavaAPI('/api/lessons', 'GET');
} catch (error) {
    logError('API call failed', req, { error });
}
```

---

## Troubleshooting

### Problem: Server won't start

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
- Check if another process is using port 3000
- Kill the process: `lsof -ti:3000 | xargs kill -9`
- Or change PORT in `config.js`

---

### Problem: Cannot connect to Java API

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:8443
```

**Solution:**
- Verify Java backend is running
- Check `JAVA_API_URL` in `config.js`
- Test connectivity: `curl -k https://localhost:8443/api/tutors -H "X-API-Key: ..."`

---

### Problem: Login fails with "Username or password incorrect"

**Symptoms:**
User cannot login even with correct credentials

**Solution:**
1. Check password hashes in database match bcrypt format
2. Run password migration: `node migrations/hashExistingPasswords.js`
3. Verify API key in `config.js` matches Java backend
4. Check authentication logs for detailed error info

---

### Problem: Session not persisting

**Symptoms:**
User logged out on page refresh

**Solution:**
- Verify session secret is set in `config.js`
- Check cookie settings (httpOnly, maxAge)
- For production, use persistent session store (Redis)

---

### Problem: Excel export fails

**Symptoms:**
```
Error: Cannot read property 'length' of undefined
```

**Solution:**
- Ensure lessons data is being fetched correctly
- Verify student/tutor data exists for all lessons
- Check ExcelJS version compatibility

---

## Development Workflow

### Adding a New Route

**1. Define route in `src/index.js`:**
```javascript
app.get('/my-feature', isAuthenticated, async (req, res) => {
    try {
        const data = await fetchFromJavaAPI('/api/my-data', 'GET');
        res.render('my-feature', { data });
    } catch (error) {
        logError('Failed to load feature', req, { error });
        res.status(500).render('error');
    }
});
```

**2. Create EJS view in `views/my-feature.ejs`:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Feature</title>
    <link rel="stylesheet" href="/css/my-feature.css">
</head>
<body>
    <h1>My Feature</h1>
    <!-- Your content -->
    <script src="/js/my-feature.js"></script>
</body>
</html>
```

**3. Add CSS in `public/css/my-feature.css`**

**4. Add client-side JS in `public/js/my-feature.js`**

**5. Test:**
```bash
npm run dev
# Visit http://localhost:3000/my-feature
```

---

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Change session secrets in `config.js`
- [ ] Enable HTTPS with SSL certificates
- [ ] Set `cookie.secure = true` for sessions
- [ ] Use persistent session store (Redis/MongoDB)
- [ ] Enable production logging (Winston, Morgan)
- [ ] Set up process manager (PM2)
- [ ] Configure reverse proxy (Nginx)
- [ ] Enable CORS with specific domains
- [ ] Set up monitoring (New Relic, DataDog)
- [ ] Configure backups for session data

### PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/index.js --name tutorly-frontend

# View logs
pm2 logs tutorly-frontend

# Monitor
pm2 monit

# Auto-restart on system reboot
pm2 startup
pm2 save
```

---

### Code Style

- Use async/await for asynchronous operations
- Add JSDoc comments for functions
- Follow existing naming conventions
- Log errors with `logError()`
- Use middleware for repeated logic

---

## Changelog

### v1.0.0 (2026-02-16)
- ✅ Initial release with dual authentication
- ✅ Complete lesson management system
- ✅ Excel report generation
- ✅ Calendar and prenotation features
- ✅ Admin and staff panels
- ✅ Comprehensive logging system
- ✅ Java Backend API integration

---

**Last updated:** February 25, 2026
