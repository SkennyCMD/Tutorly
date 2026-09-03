# Tutorly Frontend Server - Technical Documentation

---

**Document**: 03_Nodejs_Frontend.md  
**Last Updated**: September 3, 2026  
**Version**: 1.0.0  
**Author**: Tutrly Development Team  

---

## 📋 Table of Contents
- [Overview](#overview)
- [Quick Reference](#quick-reference)
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
- ✅ **Progressive Web App (PWA)** capabilities, with service worker caching and offline resilience
- ✅ **Internationalization (i18n)**: automatic English/Italian translation based on the browser's language, no manual switcher
- ✅ Calendar weekly-repeat prenotations and continuous multi-day/all-day notes
- ✅ Student evaluations (test marks) with per-student progress chart and running average
- ✅ STAFF-only Student Profile page: per-subject/tutor marks chart with toggleable lines, hours breakdown, prenotation management, and lesson-package (Pack) tracking with auto-assignment

---

## Quick Reference

### Common Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start server (HTTP on port 3000) |
| `npm run https` | Start server with HTTPS (port 3443) |
| `npm run dev` | Start with auto-reload (HTTP) |
| `npm run dev:https` | Start with auto-reload (HTTPS) |
| `npm test` | Run tests |
| `npm run generate-cert` | Generate self-signed SSL certificates |

### Key Routes

| Route | Method | Description | Authentication |
|-------|--------|-------------|----------------|
| `/` | GET | Home page (redirects to /login or /home) | - |
| `/login` | GET | Tutor login page | Public |
| `/login` | POST | Process tutor login | Public |
| `/adminLogin` | GET | Admin login page | Public |
| `/adminLogin` | POST | Process admin login | Public |
| `/home` | GET | Dashboard | Tutor/Admin |
| `/lessons` | GET | Lessons management | Tutor/Admin |
| `/calendar` | GET | Calendar view | Tutor/Admin |
| `/reports` | GET | Evaluations (student marks/tests, with per-student stats chart) | Tutor/Admin |
| `/student/:id` | GET | Student profile (marks chart, hours, prenotations, lesson packages) | STAFF only |
| `/admin` | GET | Admin panel | Admin only |
| `/staffPanel` | GET | Staff management | Staff/Admin |
| `/logout` | GET | Logout | Tutor/Admin |

### API Routes (Internal)

| Route | Method | Description | Access |
|-------|--------|-------------|--------|
| `/api/students` | GET | Fetch all students | Authenticated |
| `/api/users` | GET | Fetch all users (tutors/STAFF/GUEST) | Authenticated |
| `/api/lessons/new` | POST | Create new lesson | Authenticated |
| `/api/lessons/delete/:id` | DELETE | Delete lesson | Staff/Admin |
| `/api/export/lessons` | GET | Export lessons to Excel | Authenticated |

### Configuration Files

| File | Purpose | Location |
|------|---------|----------|
| `package.json` | Dependencies and scripts | Root directory |
| `config.js` | App configuration | `server_utilities/` |
| `.env` | Environment variables (if used) | Root directory |
| `ssl/certificate.pem` | SSL certificate | `ssl/` directory |
| `ssl/private-key.pem` | SSL private key | `ssl/` directory |

### Default Ports

- **HTTP**: 3000 (redirects to HTTPS if enabled)
- **HTTPS**: 3443
- **Java API**: 8443 (backend connection)

### Session Configuration

| User Type | Session Duration | Secret Location |
|-----------|-----------------|-----------------|
| Tutor | 30 days | `TUTOR_SESSION_SECRET` in config.js |
| Admin | 1 hour | `ADMIN_SESSION_SECRET` in config.js |

### Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot connect to backend | Verify Java API is running on port 8443 |
| Session expires immediately | Check session configuration in config.js |
| SSL certificate error | Regenerate certificates with `npm run generate-cert` |
| Port 3000/3443 in use | Change PORT in config.js or kill existing process |
| Login fails | Check bcrypt password hashing, verify user exists in DB |

### Environment Variables

```bash
# Optional environment configuration
NODE_ENV=development       # or 'production'
PORT=3000                  # HTTP port
HTTPS_PORT=3443           # HTTPS port
USE_HTTPS=true            # Enable HTTPS
```

---

## System Architecture

> **📖 For the complete system architecture**, see [00_Project_Overview.md - System Architecture](00_Project_Overview.md#system-architecture)

### Node.js Express Server Internal Architecture

This section details the internal structure of the Node.js frontend component:

```
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
              Java Backend API (Port 8443)
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

> **📖 For the complete technology stack overview**, see [00_Project_Overview.md - Technology Stack](00_Project_Overview.md#technology-stack)

### Node.js Frontend Specific Technologies

**Core:**
- **Node.js 18+** - JavaScript runtime (LTS recommended)  
- **Express.js 4.18.2** - Web application framework  
- **EJS 3.1.10** - Templating engine

**Authentication & Security:**
- **bcrypt 6.0.0** - Password hashing  
- **express-session 1.18.2** - Session management  
- **API Key Authentication** - X-API-Key header-based authentication

**Utilities:**
- **ExcelJS 4.4.0** - Excel report generation  
- **Native HTTPS Module** - SSL/TLS support  
- **Vanilla JavaScript** - Client-side interactivity

**Development:**
- **npm** - Package manager  
- **nodemon 3.0.1** - Auto-restart during development

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
│   ├── i18n.js                     # Language detection and translation lookup
│   └── config.js                   # Application configuration
│
├── locales/                        # i18n dictionaries
│   ├── en.json                     # English translations
│   └── it.json                     # Italian translations
│
├── config/                         # Static reference data
│   └── subjects.json               # Fixed subject list (Evaluations page dropdown)
│
├── views/                          # EJS templates (server-rendered HTML)
│   ├── login.ejs                   # Tutor login page
│   ├── adminLogin.ejs              # Admin login page
│   ├── home.ejs                    # Tutor home dashboard
│   ├── lessons.ejs                 # Lesson management interface
│   ├── calendar.ejs                # Calendar view with notes
│   ├── reports.ejs                 # Evaluations (student marks/tests)
│   ├── student.ejs                 # Student profile (STAFF only)
│   ├── admin.ejs                   # Admin panel
│   ├── staffPanel.ejs              # Staff panel (STAFF role only)
│   ├── 404.ejs                     # Error page
│   └── partials/                   # Shared EJS includes
│       ├── pwa-setup.ejs           # PWA manifest/service-worker registration
│       ├── theme-init.ejs          # Inline light/dark theme bootstrap (runs before first paint)
│       ├── theme-config.ejs        # Maps theme.css variables into Tailwind's color palette
│       ├── theme-toggle.ejs        # Icon-only theme toggle button (desktop headers)
│       └── theme-toggle-mobile.ejs # Full-width theme toggle row (mobile menus)
│
├── public/                         # Static files (client-side)
│   ├── css/                        # Stylesheets
│   │   ├── login.css               # Login page styles
│   │   ├── adminLogin.css          # Admin login styles
│   │   ├── home.css                # Home dashboard styles
│   │   ├── lessons.css             # Lesson management styles
│   │   ├── calendar.css            # Calendar view styles
│   │   ├── reports.css             # Evaluations page styles
│   │   ├── student.css             # Student profile page styles
│   │   ├── admin.css               # Admin panel styles
│   │   ├── staffPanel.css          # Staff panel styles
│   │   └── theme.css               # Light/dark theme CSS variables (all pages)
│   │
│   └── js/                         # Client-side JavaScript
│       ├── adminLogin.js           # Admin login form handling
│       ├── admin.js                # Admin panel interactions
│       ├── homeScript.js           # Home page interactions
│       ├── lessonsScript.js        # Lesson management logic
│       ├── calendarScript.js       # Calendar interactions
│       ├── reports.js              # Evaluations page logic
│       ├── student.js              # Student profile page logic
│       ├── staffPanel.js           # Staff panel functionality
│       ├── modalShared.js          # Shared modal utilities
│       ├── theme.js                # Theme toggle behavior (all pages)
│       ├── i18n.js                 # Client-side t() translation helper
│       └── 404.js                  # Error page interactions
│
├── ssl/                            # SSL certificates (gitignored)
│   ├── private-key.pem             # Private key for HTTPS
│   └── certificate.pem             # Self-signed certificate
│
├── migrations/                     # Database migration scripts
│   └── hashExistingPasswords.js    # Migrate plain-text passwords to bcrypt
│
├── admin_login_attempts.txt        # Admin login attempt log file
├── generate-ssl-cert.sh            # Script to generate SSL certificates
├── package.json                    # Node.js dependencies and scripts
├── .env.example                    # Environment variables template
└── .gitignore                      # Git ignore rules
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
- **i18n.js**: Language detection and translation lookup for the i18n system (see [Internationalization (i18n)](#internationalization-i18n))

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
   ✓ Call Java API: GET /api/users

6. JAVA API
   ✓ Verify X-API-Key header
   ✓ Query PostgreSQL for users
   ✓ Return JSON array of users

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
    role: string          // 'staff', 'generic', or 'guest'
}
```

**Protected Routes:**
- `/home` - Home dashboard
- `/lessons` - Lesson management (blocked for `guest`, see [GUEST Role Access Control](#guest-role-access-control))
- `/calendar` - Calendar view
- `/reports` - Evaluations page (blocked for `guest`)
- `/staffPanel` - Staff panel (STAFF role only, also blocked for `guest`)
- `/student/:id` - Student profile (STAFF, or `guest` for their own assigned student(s) only - see [GUEST Role Access Control](#guest-role-access-control))

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

### GUEST Role Access Control

A `GUEST` account (e.g. a parent/guardian, created via the [Admin Panel - Guest Accounts](#admin-panel---guest-accounts)) authenticates through the same `POST /login` flow as any tutor, but is restricted at every layer once logged in - unlike the `role` field itself, which was added to the data model long before any of this enforcement existed (see [01_Java_Backend_API.md - Users](01_Java_Backend_API.md#users)).

**Two middleware functions in `server_utilities/authMiddleware.js` do the enforcement:**
- **`blockGuest`** - for page (`GET`) routes. Redirects to `/home` if `req.session.role === 'guest'`, otherwise calls `next()`. Applied to `/lessons`, `/reports`, `/staffPanel` - the only pages a GUEST can reach are `/home`, `/calendar`, and their own assigned student's `/student/:id` (see below).
- **`blockGuestApi`** - for write (`POST`/`PUT`) API routes a GUEST might otherwise reach via a raw `fetch()` even with the UI hidden. Returns `403 { error: '...' }` JSON instead of redirecting. Applied to every creation/modification endpoint: `POST /api/lessons`, `PUT /api/lessons/:id`, `POST /api/prenotations`, `PUT /api/prenotations/:id`, `POST /api/calendar-notes`, `PUT /api/calendar-notes/:id`, `POST /api/packs`, `PUT /api/packs/:id/close`. This is the actual enforcement boundary - hiding the corresponding buttons client-side (see below) is only a courtesy on top of it.

**Data scoping for GUEST on `/home` and `/calendar`:** a GUEST has no lessons/prenotations of their own (they don't teach), so both routes special-case `userRole === 'guest'` and filter by the student(s) assigned to that guest (via `fetchStudentsByGuest(guestId)`, backed by `GET /api/students/guest/{userId}`) instead of by `tutorId`. `/home` additionally renders a GUEST-only "My Students" card grid: one card per assigned student (name, class, average mark - same style and color-by-mark logic as the Staff Panel's student cards), linking to `/student/:id`. The route computes each student's average from `fetchTestsByStudent`, mirroring how `/staffPanel` computes `avgMark` for its own cards. See [01_Java_Backend_API.md - Students](01_Java_Backend_API.md#students).

**UI hardening for GUEST:** on `/home` and `/calendar`, the "Add Lesson"/"Add Prenotation"/"Add Note" buttons aren't rendered, and every lesson/prenotation/note row is rendered without its click handler or pointer cursor (no edit/convert-to-lesson modal reachable) - covering grid clicks, drag-to-select, and all-day note chips, not just the obvious buttons. Nav links to pages a GUEST can't reach (`My Lessons`, `Reports`, `Staff Panel`) are hidden rather than left as dead ends.

**GUEST accounts excluded from tutor-assignment lists:** a `GUEST` isn't a tutor - they don't teach and shouldn't be selectable when a STAFF tutor assigns a lesson/prenotation's tutor or a note's assignees. `/calendar` and `/student/:id` both filter `role !== 'GUEST'` out of the `tutors` list fetched from `GET /api/users` before rendering it (same filter `GET /api/admin/tutors` already applied for the Admin Panel), so a `GUEST` account never appears in the Calendar's tutor filter/assignment UI or the Student Profile page's prenotation tutor-reassignment list.

---

## Privacy and Cookie Policy Pages

Two public, unauthenticated pages (`GET /privacy`, `GET /cookies`) linked from the login page footer, sharing the same header/footer chrome as `login.ejs` for visual consistency. Both are static, translated content pages - neither reads from the Java API or `req.session`.

- **`/privacy`** (`views/privacy.ejs`): states that privacy consent is collected by the tutoring center itself, in person at enrollment, before any account on this platform is created - Tutorly is the software the center uses, not the data controller. Points users to the center's own website or a direct request to the center to review the full policy.
- **`/cookies`** (`views/cookies.ejs`): documents the single cookie the app sets, `tutorly.sid` (the session cookie - see [Session Management](#session-management) below for its `httpOnly`/`sameSite` settings), and states plainly that there are no third-party, advertising, or tracking cookies. Also notes that the light/dark theme preference is stored in `localStorage`, not a cookie - see [Theming (Light/Dark Mode)](#theming-lightdark-mode).

The login footer's previous dead "Terms" and "Help" links (`href="#"`, no real destination) were removed rather than pointed anywhere, since there was no content to link them to; the "Privacy" link now points to `/privacy` instead of `href="#"`.

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

> **📖 For complete system prerequisites**, see [00_Project_Overview.md - Prerequisites](00_Project_Overview.md#prerequisites)

### Component-Specific Requirements

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
curl -k -X GET https://localhost:8443/api/users \
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
| GET | `/privacy` | Privacy policy page (linked from the login footer) |
| GET | `/cookies` | Cookie policy page (linked from the login footer) |

---

### Protected Tutor Routes (Requires `isAuthenticated`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/logout` | Destroy tutor session and redirect to login |
| GET | `/home` | Home dashboard (today's tasks, lessons, prenotations; GUEST-only "My Students" section) |
| GET | `/lessons` | Lesson management interface (blocked for `guest` via `blockGuest`) |
| GET | `/calendar` | Calendar view with notes |
| GET | `/reports` | Evaluations page (blocked for `guest` via `blockGuest`) |

---

### Protected Admin Routes (Requires `isAdmin`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/admin` | Admin panel (tutor/student management, GUEST account management - see [Admin Panel - Guest Accounts](#admin-panel---guest-accounts)) |
| GET | `/adminLogout` | Destroy admin session and redirect to admin login |

---

### Staff Panel and Student Profile (Manual Role Check, not a role middleware)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/staffPanel` | Staff panel with advanced features |
| GET | `/student/:id` | Student profile - see [Student Profile Page](#student-profile-page) |

Neither route uses the `isStaff` middleware (which returns a JSON 401/403 - appropriate for an API route, not a page route where a redirect is expected). Both require `isAuthenticated` first, then do their own inline role check:
- **`/staffPanel`**: redirects to `/home` if `role !== 'STAFF'`. Also passes through `blockGuest`, though the inline check alone would already exclude GUEST.
- **`/student/:id`**: STAFF may view any student. A GUEST may view a student's profile **only if that student is assigned to them** (checked via `fetchStudentsByGuest`, see [GUEST Role Access Control](#guest-role-access-control)) - any other student ID, or any other role, redirects to `/home`.

---

### API Endpoints - Lessons

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/lessons` | Tutor | Get all lessons or filter by date range |
| GET | `/api/lessons/:id` | Tutor | Get lesson by ID |
| POST | `/api/lessons` | Tutor, blocked for `guest` (`blockGuestApi`) | Create new lesson |
| PUT | `/api/lessons/:id` | Tutor, blocked for `guest` (`blockGuestApi`) | Update lesson |
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

### API Endpoints - Packs (Lesson Packages)

Backs the Student Profile page's "Packs" card - see [Lesson Packages (Packs)](#lesson-packages-packs) above. Thin proxies to the Java `Pack` API ([01_Java_Backend_API.md - Packs](01_Java_Backend_API.md#packs)).

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/packs` | Tutor, blocked for `guest` (`blockGuestApi`) | Create new pack; body `{ studentId, hours, startDate, startTime }` |
| PUT | `/api/packs/:id/close` | Tutor, blocked for `guest` (`blockGuestApi`) | Close a pack (sets its closure date) |

**Example - Create Pack:**
```javascript
POST /api/packs
Body: {
    studentId: 10,
    hours: 10,
    startDate: "2026-08-01",
    startTime: "09:00"
}
```

---

### API Endpoints - Prenotations (Bookings)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/prenotations` | Tutor | Get all prenotations |
| GET | `/api/prenotations/:id` | Tutor | Get prenotation by ID |
| POST | `/api/prenotations` | Tutor, blocked for `guest` (`blockGuestApi`) | Create new prenotation |
| PUT | `/api/prenotations/:id` | Tutor, blocked for `guest` (`blockGuestApi`) | Update prenotation |
| DELETE | `/api/prenotations/:id` | Tutor | Delete prenotation |
| PATCH | `/api/prenotations/:id/confirm` | Tutor | Confirm prenotation |

`PUT`/`DELETE /api/prenotations/:id` are also what the Student Profile page's edit-prenotation modal calls (see [Student Profile Page](#student-profile-page)) - same endpoints as the Calendar page, no dedicated routes were added.

---

### API Endpoints - Admin (Tutors, Students, Guest Accounts)

Every route below requires an admin session (`isAdmin`) and proxies to the Java `User`/`Student` API ([01_Java_Backend_API.md - Users](01_Java_Backend_API.md#users), [01_Java_Backend_API.md - Students](01_Java_Backend_API.md#students)). There is **no** generic `/api/users/*` route in the Node.js app (that path only exists on the Java backend, called internally) - every admin-facing user/student management route lives under `/api/admin/*`.

**Tutors and Students:**

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/tutors` | List all tutors (`GENERIC`/`STAFF` - `GUEST` accounts are filtered out, see Guest Accounts below) |
| POST | `/api/admin/tutors` | Create new tutor; body `{ username, password, role }`, password hashed with bcrypt |
| PATCH | `/api/admin/tutors/:id/role` | Update a tutor's role (`GENERIC`/`STAFF`) |
| PATCH | `/api/admin/tutors/:id/status` | Update a tutor's status (e.g. block/unblock) |
| GET | `/api/admin/students` | List all students |
| PATCH | `/api/admin/students/:id/class` | Update a student's class (`M`/`S`/`U`) |

**Guest Accounts** (see [Admin Panel - Guest Accounts](#admin-panel---guest-accounts) below):

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/guests` | List all `GUEST`-role users |
| POST | `/api/admin/guests` | Create new guest account; body `{ username, mail, password }`, password hashed with bcrypt, role always `GUEST` |
| PATCH | `/api/admin/guests/:id` | Update a guest's profile; body `{ username, mail, password? }` - password only changed if provided, never nulled out by omission |
| GET | `/api/admin/guests/:id/students` | List the students currently assigned to a guest account |
| GET | `/api/admin/students/unassigned` | List students with no guest assigned (`id_user IS NULL`) - the pool a guest can be assigned from |
| PATCH | `/api/admin/students/:id/guest` | Assign or unassign a student's guest account; body `{ userId }` (`null` to unassign) |

**Example - Create Guest Account:**
```javascript
POST /api/admin/guests
Body: {
    username: "jane.doe",
    mail: "jane.doe@email.com",
    password: "securePassword123"
}
```

---

### API Endpoints - Calendar Notes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/calendar-notes` | Tutor | Get all calendar notes |
| GET | `/api/calendar-notes/:id` | Tutor | Get note by ID |
| POST | `/api/calendar-notes` | Staff, blocked for `guest` (`blockGuestApi`) | Create new note |
| PUT | `/api/calendar-notes/:id` | Staff, blocked for `guest` (`blockGuestApi`) | Update note |
| DELETE | `/api/calendar-notes/:id` | Staff | Delete note |
| GET | `/api/calendar-notes/range` | Tutor | Get notes by date range |

---

### API Endpoints - Tests (Evaluations)

Backs the `/reports` (Evaluations) page. `tutorId` is always taken from the session on create - there's no tutor-assignment field on this form.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/tests` | Tutor | Create new test/evaluation |
| DELETE | `/api/tests/:id` | Tutor | Delete test/evaluation |

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
| `admin.js` | Admin panel interactions (add/edit/delete tutors and students, GUEST account management) - see [Admin Panel - Guest Accounts](#admin-panel---guest-accounts) |
| `homeScript.js` | Home dashboard (task completion, quick actions) |
| `lessonsScript.js` | Lesson management (CRUD operations, filters) |
| `calendarScript.js` | Calendar view (event handling, date navigation) |
| `staffPanel.js` | Staff panel functionality |
| `reports.js` | Evaluations page (add/delete tests, per-student SVG chart, search/date filters) |
| `student.js` | Student profile page (per-subject/tutor SVG chart with toggleable lines, hours breakdown, prenotation edit/delete) - see [Student Profile Page](#student-profile-page) |
| `modalShared.js` | Shared modal utilities (open, close, populate) |
| `theme.js` | Light/dark theme toggle and OS-preference syncing |
| `i18n.js` | Client-side `t()` translation helper, reading from `window.translations` |
| `settingsMenu.js` | Open/close wiring for the gear-icon Settings Menu - see [Settings Menu](#settings-menu-theme-notifications-logout) |
| `push.js` | Web Push subscribe/unsubscribe flow for the bell toggle - see [Web Push Notifications](#web-push-notifications) |
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

## Theming (Light/Dark Mode)

Every page supports a light and dark theme, toggled by a sun/moon icon button included in each view's header (and, on mobile, in the slide-out menu).

**Files:**
- `public/css/theme.css` - Defines the `--color-*` CSS variables for both themes as `:root` (light) and `:root[data-theme="dark"]` overrides, plus the sun/moon icon-swap rules for `.theme-toggle` buttons.
- `views/partials/theme-init.ejs` - Inlined at the top of `<head>` on every page, before any stylesheet/Tailwind CDN paint. Defines `window.__theme` (get/set/preferred/apply) and immediately applies the stored or OS-preferred theme, avoiding a flash of the wrong theme.
- `views/partials/theme-config.ejs` - Maps the `theme.css` variables into Tailwind's `tailwind.config.theme.extend.colors` (e.g. `background`, `primary`, `border`) using `rgb(var(--color-x) / <alpha-value>)`, so Tailwind's opacity modifiers (`bg-primary/90`) keep working under both themes.
- `public/js/theme.js` - Defines `window.toggleTheme()` (bound to every toggle button's `onclick`) and listens for `prefers-color-scheme` changes to keep following the OS theme live, unless the user has explicitly picked one.
- `views/partials/theme-toggle.ejs` / `theme-toggle-mobile.ejs` - The toggle button markup for desktop headers and mobile menus respectively.

**How it works:**
1. The chosen theme is persisted in `localStorage` under the `tutorly-theme` key.
2. If nothing is stored, the theme falls back to the browser's `prefers-color-scheme` and updates live if that OS setting changes.
3. The active theme is reflected as `data-theme="light"|"dark"` on `<html>`, which both the CSS variables and Tailwind's generated classes key off of.

To add theming to a new page, include `partials/theme-init.ejs` (early in `<head>`, before the Tailwind CDN `<script>` tag), link `css/theme.css`, then include `partials/theme-config.ejs` (right after the Tailwind CDN `<script>` tag, so it can extend `tailwind.config`), load `js/theme.js`, and drop in `partials/theme-toggle.ejs` (and `theme-toggle-mobile.ejs` if the page has a mobile menu).

`theme-toggle.ejs` used standalone like this is now only found on the pre-auth pages (`login.ejs`, `privacy.ejs`, `cookies.ejs`) and the separate admin panel (`admin.ejs`, `adminLogin.ejs`). The six main app pages instead nest `theme-toggle-mobile.ejs` inside the gear-icon [Settings Menu](#settings-menu-theme-notifications-logout).

---

## Settings Menu (Theme, Notifications, Logout)

The six main app pages (`home.ejs`, `calendar.ejs`, `lessons.ejs`, `reports.ejs`, `staffPanel.ejs`, `student.ejs`) consolidate the theme toggle, the push-notification toggle (see [Web Push Notifications](#web-push-notifications)), and logout into a single gear-icon menu, replacing what used to be three separate items in the header and mobile menu.

**Files:**
- `views/partials/settings-menu.ejs` - Desktop header: a gear button that opens an absolutely-positioned dropdown (`#settingsMenuBtn` / `#settingsMenu`), closed on an outside click - the same button+panel+outside-click-close pattern as the Calendar's tutor filter dropdown (`calendarScript.js`). Reuses `theme-toggle-mobile.ejs` and `push-toggle-mobile.ejs`'s existing full-width "row" markup as the dropdown's menu items instead of duplicating their icons/markup, followed by a divider and a logout row.
- `views/partials/settings-menu-mobile.ejs` - Mobile sidebar: a full-width gear row (`#settingsMenuBtnMobile`) that expands an inline accordion (`#settingsMenuMobile`) with the same three rows - an accordion rather than a popup, since the sidebar already scrolls in its own flow.
- `public/js/settingsMenu.js` - Shared open/close wiring for both variants, loaded on all six pages right after `i18n.js`. The mobile accordion is also auto-collapsed whenever the mobile sidebar itself closes (`#closeMenu` / `#menuOverlay`), so it starts closed again the next time it's opened.

**Not used here:** `admin.ejs` / `adminLogin.ejs` is a structurally separate admin area (its own `/adminLogout` route and session, no linked `app_user` row and therefore no push subscriptions), and the pre-auth pages `login.ejs` / `privacy.ejs` / `cookies.ejs` have no logout to consolidate - all of these keep the plain, standalone `theme-toggle.ejs` icon button instead.

---

## Web Push Notifications

Standard Web Push (a VAPID keypair), not Firebase Cloud Messaging. Notifies a `GUEST` account when a lesson is booked for their linked student, and notifies a tutor (`STAFF` or `GENERIC`) when a prenotation or calendar note is assigned to them. Available from every page that has the [Settings Menu](#settings-menu-theme-notifications-logout) - the bell toggle works the same wherever the user happens to be in the app.

**Storage:** subscriptions (`endpoint`, `p256dh`, `auth`, `userAgent`) are stored in Postgres via the Java backend's `push_subscription` table, one row per browser/device a user has subscribed on - not a Node-side file store. See [01_Java_Backend_API.md - Push Subscriptions](01_Java_Backend_API.md#push-subscriptions) and [06_Database_Migrations.md](06_Database_Migrations.md).

**Files:**
- `server_utilities/config.js` - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (env-configured; the one-time keypair is generated with `node -e "console.log(require('web-push').generateVAPIDKeys())"`). Push silently becomes a no-op if the keys are unset.
- `server_utilities/javaApiService.js` - `fetchPushSubscriptionsByUser`, `upsertPushSubscription`, `deletePushSubscriptionByEndpoint` wrap the Java `/api/push-subscriptions` endpoints.
- `server_utilities/pushService.js` - `sendPushToUser(userId, payload)`: fetches a user's subscriptions, sends to each via the `web-push` package, and prunes any subscription the push service reports as gone (HTTP 404/410). Never throws, so callers can fire-and-forget it.
- `src/index.js` - `GET /api/push/vapid-public-key`, `POST /api/push/subscribe`, `POST /api/push/unsubscribe` (all `isAuthenticated` only, deliberately **not** behind `blockGuestApi` - a `GUEST` must be able to register their own device). The two triggers: inside `POST /api/prenotations`'s success branch (notifies the assigned tutor, and - via a student lookup - the student's linked `GUEST`, if any) and inside `POST /api/calendar-notes`'s success branch (notifies each assigned tutor except the creator). Both fire *after* `res.json(...)`, so a slow or failed send can never delay or break the HTTP response.
- `public/service-worker.js` - the `push` event shows a notification from the server's JSON payload (`{ title, body, url, tag }`); `notificationclick` focuses an existing tab or opens a new one at `url` (always `/calendar`, where both prenotations and notes are rendered).
- `public/js/push.js` - client-side subscribe/unsubscribe flow for the bell toggle: `Notification.requestPermission()` → `pushManager.subscribe()` → `POST /api/push/subscribe`, or the reverse to unsubscribe. Subscription state is per-browser, reflected as `[data-push-subscribed]` on `<html>` (same pattern as `[data-theme]` for the theme toggle), so every toggle instance on the page stays in sync. Feature-detects `serviceWorker`/`PushManager`/`Notification` support and leaves the toggle hidden entirely if any is missing.
- `views/partials/push-toggle-mobile.ejs` - the toggle's row markup, included in both the desktop and mobile [Settings Menu](#settings-menu-theme-notifications-logout).

**Caveats:**
- `pushManager.subscribe()` requires a secure context - `localhost` is exempt regardless of port/scheme, but a real hostname needs a trusted HTTPS certificate.
- iOS Safari only supports Web Push once the app is added to the home screen as a PWA - it does not work from Safari-in-tab, even on iOS 16.4+.

---

## Internationalization (i18n)

The application auto-detects each visitor's language from the browser's `Accept-Language` header and serves fully translated pages — there is no manual language switcher, no cookie, and no new npm dependency. English and Italian are currently supported, with English as the fallback for unsupported languages.

**Translated pages:** Dashboard (`home.ejs`), Calendar (`calendar.ejs`), Lessons (`lessons.ejs`), Staff Panel (`staffPanel.ejs`), Login (`login.ejs`), Evaluations/Reports (`reports.ejs`), and Student Profile (`student.ejs`). Admin, Admin Login, and the 404 page are not yet translated. The `student` locale namespace (page title, headings, labels, modals, status badges, validation/error messages) reuses keys from `common`/`lessons`/`reports`/`calendar`/`staffPanel` wherever the text already matched, rather than duplicating them.

**Files:**
- `locales/en.json` / `locales/it.json` - Dictionaries of dot-notation keys (e.g. `common.cancel`, `home.welcomeBack`) grouped by page/feature (`common`, `home`, `calendar`, `lessons`, `staffPanel`, `login`). Values can include `{placeholder}` tokens (e.g. `"lessonCount": "{count} lesson"`) and arrays (e.g. `common.months`, `common.daysFull`) for calendar labels.
- `server_utilities/i18n.js` - `detectLanguage(req)` ranks the `Accept-Language` header by q-value and returns the first supported language; `translate(lang, key, params)` resolves a dot-notation key against the dictionaries (falling back to English, then to the key itself, if missing) and substitutes any `{placeholder}` params; `i18nMiddleware` runs on every request and sets `req.lang` plus `res.locals.lang`, `res.locals.t`, and `res.locals.translations` so every `res.render()` call gets them for free.
- `public/js/i18n.js` - Client-side `window.t(key, params)`, mirroring the server-side lookup but reading from `window.translations`, which each translated view injects into a small inline `<script>` block (alongside its other server-rendered data) as `window.translations = <%- JSON.stringify(translations) %>;`. This lets page scripts like `calendarScript.js` and `homeScript.js` translate dynamically-rendered content, `alert()`/`confirm()` messages, and locale-aware date formatting (via `window.lang`).

**How it works:**
1. `i18nMiddleware` reads `Accept-Language` on every request and resolves it to `en` or `it`.
2. EJS templates call `<%= t('common.cancel') %>` (or `<% t('common.daysShort').forEach(...) %>` for arrays); no per-route changes are needed since `t`/`lang`/`translations` come from `res.locals`.
3. Server-rendered error messages (e.g. the `/login` POST route's invalid-credentials message) call `res.locals.t(...)` directly.
4. Client-side scripts call the global `t(key, params)` from `public/js/i18n.js` for anything rendered or alerted after page load.

**To add a new translated page:** add its keys to both `locales/en.json` and `locales/it.json`, replace hardcoded strings in the `.ejs` view with `<%= t('namespace.key') %>`, inject `window.translations`/`window.lang` in its data-injection `<script>` block, load `<script src="/js/i18n.js"></script>` before the page's own script, and replace hardcoded strings in that script with `t('namespace.key')`.

---

## Calendar Features

### Weekly Repeat (Prenotations)
The "Add Prenotation" form has a "Repeat weekly" checkbox with a Repeat From / Repeat Until date range. When checked, the client computes every matching day-of-week between the two dates and submits one `POST /api/prenotations` call per occurrence (capped at a maximum number of occurrences to avoid runaway batches), reporting how many succeeded if any individual date failed.

### Continuous Multi-Day Notes and All-Day Notes
Calendar notes are a single record spanning a Start Date/Time to an End Date/Time, rather than one record per day - e.g. a note from Monday 14:00 to Wednesday 10:00 is one note that renders across all three days. Checking "All day" sets the time range to `00:00`-`23:59` for the selected day(s) instead of requiring manual times. All-day notes are rendered in a dedicated all-day row above the hourly time grid (desktop week view and mobile day view) instead of being stretched across the 24-hour grid like timed events, and that row is hidden entirely when the visible week/day has no all-day notes.

### Per-Tutor Prenotation Colors (STAFF)

In STAFF's Calendar view, every tutor's prenotations get their own color instead of all rendering in the same blue - useful once several tutors' slots are visible at once. Implemented entirely client-side in `calendarScript.js`:

- **Palette:** 48 colors defined as CSS custom properties in `theme.css` (`--color-tutor-1` through `--color-tutor-48`, both light and dark theme variants) - 12 hues spaced ~24° apart around the color wheel (excluding only the ranges already used by `--color-note` and `--color-destructive`; blue is included, since the logged-in tutor's own events never draw from this palette) x 4 lightness/saturation tiers, laid out so any run of 12 consecutive palette slots sweeps the full set of distinct hues. Regenerate with `Nodejs/scripts/gen-tutor-palette.js` if the tutor count outgrows 48.
- **Assignment:** `getTutorColorVar(tutorId)` picks a palette slot deterministically (`tutorId % 48`), so a given tutor always gets the same color across reloads. `applyTutorColor()` applies it (background + left border only) to a prenotation's event box, but only when the viewer is STAFF **and** the event's tutor isn't the logged-in user - the logged-in tutor's own prenotations always keep the default `--color-lesson` blue.
- **Text color** is intentionally decoupled from the assigned color for readability: `.event-lesson` always uses `--color-foreground` (black in light theme), with a softer off-white override (`rgb(220 220 224)`, less stark than `--color-foreground`'s `250 250 250`) specifically in dark theme.
- **Tutor filter dropdown:** the STAFF-only tutor filter is a custom dropdown (button + popover list, `#tutorFilterBtn`/`#tutorFilterMenu` in `calendar.ejs`, built by `setupTutorFilter()`) rather than a native `<select>` - a plain `<option>` can't mix a colored icon with separately-colored text. Each row shows a small square in that tutor's color (same rule as above: blue for the logged-in tutor, palette color otherwise) next to their name in plain white text. The popover is positioned `absolute` with `z-30`, above the calendar grid's sticky day-header row (`z-20`) so it doesn't render underneath it.

### Note Coloring by Creator

Calendar notes render in one of two colors depending on who created them, computed client-side from each note's `creatorId` (added to the event objects `buildNoteSegments()` produces, sourced from the note's `creator.id` field) versus `window.serverData.currentUserId`:

- **Orange** (`--color-note`, unchanged from before) if the viewing tutor is the note's creator.
- **Red** (`--color-destructive`, via an `.event-note-other` class added alongside `.event-note`) if it was created by someone else and merely assigned to the viewer - most relevant for STAFF, since only STAFF can assign a note to a tutor other than themselves.

The `isOwnNote()` helper defaults to "own" (orange) if a note's creator is somehow unknown, rather than flagging it red. Both note text color and background opacity (`0.45`, up from the original `0.2`) were tuned per-theme and per-category (own vs. other) directly in `calendar.css` for contrast against the more opaque background - not derived from `--color-note`/`--color-destructive` directly.

**Fetching notes by creator, not just by assignment:** `/calendar` previously fetched a tutor's notes only via `GET /api/calendar-notes/tutor/:id` (assignment-based - the `tutors` many-to-many side). A STAFF tutor who created a note for someone else, without also assigning it to themselves, never saw that note on their own calendar. The route now also calls `GET /api/calendar-notes/creator/:id` (an existing Java endpoint the Node route never used before) and merges the two lists, deduplicated by note `id`.

**Legend:** the Calendar toolbar's color legend now has three swatches instead of two - blue "Your Prenotation" (`calendar.prenotation`, renamed from "Prenotation"), orange "Your Note" (`calendar.note`, renamed from "Note"), and a new red "Assigned by someone else" (`calendar.assignedNote`) covering the case above.

---

## Evaluations (Reports) Page

The `/reports` page (`views/reports.ejs` + `public/js/reports.js`) tracks student test marks, backed by the Java backend's `Test` entity (see [01_Java_Backend_API.md - Tests](01_Java_Backend_API.md#tests)).

- **Add Evaluation**: a modal with a real student dropdown (populated from `window.allStudents`, injected server-side), a subject dropdown (populated from `window.allSubjects`, see [Subjects Reference List](#subjects-reference-list) below), a 0-10 mark (half-point steps), a date, and an optional description. Submits via `POST /api/tests`; the tutor is always the logged-in session user - there's no tutor-assignment field. On success the page reloads so the newly-created record (with its server-enriched student name) comes from the server, same as every other creation flow in the app.
- **Recent Evaluations**: a scrollable sidebar list of all the tutor's evaluations, sorted most-recent-first, filtered live by the search bar, showing the subject (if set) alongside the test ID and date.
- **Student Statistics**: per-student cards, each with a running average and an inline SVG line chart (marks over time plus a dashed running-average line), built by hand in `renderChart()` - no charting library. Filtered by the From/To date range and the search bar (student name). Each chart point's tooltip includes the subject when set.
- **Test Details / Delete**: clicking a mark (in the sidebar list or on a chart point) opens a details popup showing the subject alongside date/student/description, with a Delete button (`DELETE /api/tests/:id`, confirms first, then reloads).
- **Default date range**: From defaults to the most recent September 1st that's already occurred (start of the current school year), To defaults to today - see `getLastSeptemberFirst()` in `reports.js`.
- There's no backend `testId`/test-code field - the `TST-{id}` shown in the UI is synthesized client-side from the real database `id` purely for display.

### Subjects Reference List

`Nodejs/config/subjects.json` is a flat JSON array of subject names (e.g. `"Matematica"`, `"Inglese"`) used only to populate the "Add Evaluation" subject dropdown - it is **not** translated (single fixed list regardless of UI language) and has no server-side validation: `Test.subject` in the Java entity is a plain unconstrained `String`, so the list is a UI convenience, not an enum. Edit the JSON file directly to add/remove subjects; `require()` caches it in memory, so the Node.js server needs a restart to pick up changes (no Java/DB change needed).

---

## Admin Panel - Guest Accounts

The `/admin` page (`views/admin.ejs` + `public/js/admin.js`) manages tutors, students, and - alongside the pre-existing tutor management - `GUEST` accounts (parents/guardians), kept in a genuinely separate list/form pair from tutors rather than folded into the existing "Tutors" column, per how the feature was scoped: `GET /api/admin/tutors` filters out `GUEST`-role users server-side, so a newly-created guest never shows up in the Tutors list even though both are rows in the same `app_user` table.

**Guest Accounts list + Create form:** a second row below the existing Tutors/Students/Create-Tutor grid, with its own search box and a "Create New Guest" form (Username, Email, Password, Confirm Password - same show/hide-password and confirm-match UX as the tutor form). Submits to `POST /api/admin/guests`.

**Guest detail/edit modal:** clicking a guest account card opens a modal with:
- **Profile edit form** (Username, Email, optional New Password/Confirm - blank leaves the password unchanged). Submits to `PATCH /api/admin/guests/:id`; the Node.js route only includes `password` in the payload it forwards to Java if the admin actually typed one, so a blank field can never accidentally null out the stored password.
- **Assigned Students list**, each with an "Unassign" button (`PATCH /api/admin/students/:id/guest` with `{ userId: null }`).
- **"Assign a Student" dropdown**, populated from `GET /api/admin/students/unassigned` - **mandatorily filtered server-side** to students with no guest linked yet, so an already-assigned student can never appear as a choice regardless of what the client does. A client-side search box filters this already-fetched pool locally by name (no extra requests per keystroke). Selecting a student and clicking "Assign" calls `PATCH /api/admin/students/:id/guest` with `{ userId: <this guest's id> }`.

See [01_Java_Backend_API.md - Students](01_Java_Backend_API.md#students) for the underlying `Student.id_user` relationship and Java endpoints, and [GUEST Role Access Control](#guest-role-access-control) above for what a guest account can actually do once it logs in.

---

## Student Profile Page

The `/student/:id` page (`views/student.ejs` + `public/js/student.js` + `public/css/student.css`) is a deep-dive into a single student: their evaluation history, hours, prenotations, and lesson packages, pulled together across every tutor who has ever worked with them (not just the viewing tutor). Reachable by **STAFF** (any student) and by **GUEST** accounts (only their own assigned student(s)) - see [GUEST Role Access Control](#guest-role-access-control) above.

**Access control:** requires `isAuthenticated`, then the route handler fetches the viewing user's own data. STAFF is authorized for any `:id`. A GUEST is authorized only if `:id` is one of the students returned by `fetchStudentsByGuest(guestId)`; any other student, or any other role, redirects to `/home`. If `:id` doesn't resolve to a real student at all, the route renders the shared `404.ejs` instead of crashing - this required fixing `fetchStudentData()` in `javaApiService.js`, which previously let a Java 404 reject the promise instead of resolving `null` like every other single-item fetch helper does.

**Data sources:** unlike most of the app (which scopes lessons/tests/prenotations to the logged-in tutor), this page fetches **all** of a student's tests, prenotations, and lessons/hours regardless of which tutor administered them (`fetchTestsByStudent`, `fetchPrenotationsByStudent`, and `GET /api/lessons/student/:id` directly - not the tutor-scoped `fetchLessonsByTutorAndStudent`, which was removed since nothing calls it anymore) - a full history is the meaningful number here, not just the viewing user's own interactions, and it's the only sensible option for a GUEST anyway (a GUEST isn't a tutor, so "lessons I taught" would always be empty). Packs (`fetchPacksByStudent`) are also fetched student-wide, same as tests/prenotations. Each test/prenotation is enriched server-side with the administering tutor's username (`tutorName`), deduplicating repeated tutor lookups with a small in-memory cache built per-request.

**GUEST read-only hardening:** the page's interactive elements (edit-prenotation click, pack action buttons, header "+ New Package" button) were originally gated by `window.userRole === 'STAFF'` purely as defense-in-depth, back when only STAFF could reach this page at all. Now that a GUEST can reach it too, those same checks are the actual enforcement - a GUEST sees the same data read-only, with no buttons or click handlers to modify anything. The GUEST-only "My Students" card grid on `/home` (see [GUEST Role Access Control](#guest-role-access-control) above) is what links a GUEST into this page in the first place.

### Marks Chart (subject + tutor lines)

- Evaluations are grouped by **subject + tutor pair** - if a student took Philosophy tests from two different tutors, that's two separate lines, not one blended average. Each group gets a stable color from a fixed 10-color palette (cycling if there are more groups than colors) and its own average, shown in a card-grid legend below the chart.
- **Click a legend card to toggle its line** on/off in the chart (the card stays visible, dimmed, so it can be clicked again) - state persists across re-renders (e.g. re-applying the date filter) via a `Set` of hidden group keys.
- Date labels on the x-axis are thinned dynamically (evenly spaced, always including the last point) so they don't overlap regardless of how many evaluations are plotted - the point/line data itself is never thinned, only the text labels.
- Clicking a point opens the same kind of details popup as the Evaluations page, additionally showing which subject and tutor that mark belongs to.

### From/To Date Filter

Same UX and default range as the Evaluations page (last September 1st through today - see `getLastSeptemberFirst()`), but wider in scope here: it drives the marks chart, the "All Tests" list, the "Hours per Month" breakdown, and both the "Avg mark" and "Tests" profile header stats, all via a shared `getFilteredEvaluations()`/`getFilteredLessons()` pair (`updateAvgMarkStat()`/`updateTotalTestsStat()`, re-run on both initial load and "Apply"). The third stat, **"Month's Hours"**, is deliberately *not* filtered by the date range - it always reflects the real current calendar month (looked up directly from `hoursByMonth[currentMonthKey]`), regardless of what From/To is set to.

### Hours per Month

Shown as exact hours and minutes (e.g. `2h 15m`, computed from the real `endTime - startTime` of each lesson) rather than a decimal, capped to the 6 most recent months with lessons in the filtered range (fewer if less history exists).

### Prenotations

Below the mini lesson-calendar, a scrollable list (`max-h-[32rem]`, same `scrollbar-thin` pattern as the Evaluations page's sidebar) of the student's prenotations across every tutor, soonest-first. A prenotation dated before today is shown with a red border/background and labeled "Expired" instead of "Pending" (a confirmed-but-past prenotation still shows "Confirmed" - only the pending state changes wording).

**STAFF can click a card to edit or delete it** - opens the same kind of modal as the Calendar page's edit-prenotation flow (date, start/end time, tutor reassignment via radio buttons populated from `window.allTutors`), calling the existing `PUT`/`DELETE /api/prenotations/:id` endpoints (no new backend routes). The click handler and edit modal are gated by `window.userRole === 'STAFF'` in `student.js` - for a GUEST viewing their own student's page, this means the cards are shown but aren't clickable at all.

### Lesson Packages (Packs)

Below the "Hours per Month" card, a "Packs" card lists the student's still-active packages (a pack is active if it has no closure date - closed packs simply aren't shown here) plus a "+ New Package" button. Backed by the Java `Pack` REST API - see [01_Java_Backend_API.md - Packs](01_Java_Backend_API.md#packs) for the full field list and server-side matching/splitting logic.

**Each pack card shows:**
- `usedHours` / `hours` (e.g. "4.5h / 10h") and a progress bar, both driven by `usedHours` computed server-side by `PackController.getPacksByStudent` (sum of the durations of every lesson currently drawn from that pack) - the Node.js route and `student.js` just pass it through.
- **Once full** (`usedHours >= hours`), the card turns red (border + tinted background + red progress bar) and gains a **"Close Package"** button, which calls `PUT /api/packs/:id/close` (a thin proxy to the Java endpoint of the same shape) and reloads the page on success.
- **If the pack is full, still open, and the student has hours outside any pack** (`unassignedHours > 0` - lessons booked once the pack ran out, with no other pack available to absorb them), the card also shows that hour count and a **"+ New Package"** button. Clicking it opens the New Package modal pre-filled with the *first* such unassigned lesson's date/time (`firstUnassignedLessonStart`, both computed server-side by `PackService`) instead of "now" - so the new pack, once created, retroactively absorbs those lessons (see [01_Java_Backend_API.md - Packs](01_Java_Backend_API.md#packs) for `assignUnassignedLessonsSince`).

**New Package modal:** Hours, Start Date, and Start Time fields. Hours defaults to `10`; Start Date/Time default to today and the current time rounded down to the previous quarter-hour (e.g. `10:56` → `10:45`, via `roundDownToQuarterHour()` - matches the `step="900"` 15-minute increment every time input in the app uses), or, per above, to the first unassigned lesson's date/time when opened from a full pack's "+ New Package" button. Submits via `POST /api/packs` with `{ studentId, hours, startDate, startTime }`; the Node.js route combines `startDate`+`startTime` into a single ISO datetime string before forwarding to the Java API, same convention as prenotations elsewhere in the app. The header's own "+ New Package" button (next to the card title) opens the same modal with the same rounded-down-to-now defaults.

All of the click handlers above (`close-pack-btn`, `new-pack-from-unassigned-btn`, the header button, and the form submit) are gated by `window.userRole === 'STAFF'`, same as the Prenotations card. Now that GUEST accounts can reach this page, this check is the *actual* enforcement, not just defense-in-depth: `renderPacks()` doesn't even render the action buttons for a non-STAFF viewer (only the read-only progress bar/hours), and the header "+ New Package" button isn't rendered by the EJS template at all unless `user.role === 'STAFF'`. Server-side, `blockGuestApi` on `POST /api/packs` and `PUT /api/packs/:id/close` backs this up regardless of what the client does.

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

> **📖 For common issues**, see [00_Project_Overview.md - Troubleshooting](00_Project_Overview.md#troubleshooting)

### Frontend-Specific Issues

#### Problem: Login fails with "Username or password incorrect"

**Symptoms:**
User cannot login even with correct credentials

**Solution:**
1. Check password hashes in database match bcrypt format
2. Run password migration: `node migrations/hashExistingPasswords.js`
3. Verify API key in `config.js` matches Java backend
4. Check authentication logs for detailed error info

---

#### Problem: Excel export fails

**Symptoms:**
```
Error: Cannot read property 'length' of undefined
```

**Solution:**
- Ensure lessons data is being fetched correctly
- Verify student/tutor data exists for all lessons
- Check ExcelJS version compatibility
- Verify Java backend API is accessible

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

**Navigation**  
⬅️ **Previous**: [02_Java_GUI_Launcher.md](02_Java_GUI_Launcher.md) | **Next**: [04_HTTPS_Setup_Guide.md](04_HTTPS_Setup_Guide.md) ➡️  
🏠 **Home**: [Documentation Index](README.md)

---

**Last updated:** August 6, 2026
