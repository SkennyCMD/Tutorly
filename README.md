# Tutorly - Tutoring Management System

**Tutorly** is a complete platform for managing tutoring and academic support activities. The system allows you to organize lessons, manage students, track bookings, and generate detailed reports on educational activities.

---

## 📖 Project Overview

Tutorly is a full-stack web application designed to simplify tutoring activity management. The system offers an intuitive interface for tutors and administrators, allowing you to:

- **Manage lessons**: Create, edit, and delete lessons with specific students
- **Organize students**: Complete registry with information on classes and subjects
- **Track bookings**: Lesson booking system with confirmation
- **Plan activities**: Integrated calendar with notes and reminders
- **Generate reports**: Excel export of lessons, monthly statistics, and student reports
- **Control access**: Dual authentication system (tutors and administrators) with differentiated roles

The system is designed for tutoring centers, private teachers, or educational organizations that need a complete tool to manage their activities.

---

## 🏗️ System Architecture

Tutorly follows a **three-tier** architecture with separation between user interface, application logic, and data persistence:

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                    (Browser - User Interface)                    │
│                                                                   │
│  Technologies: HTML5, CSS3, JavaScript (Vanilla), EJS Templates │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│                   Node.js Express Frontend                       │
│                         (Port 3000)                              │
│                                                                   │
│  • Session-based authentication                                 │
│  • EJS page rendering                                           │
│  • Middleware management (auth, logging)                        │
│  • Static files (CSS, JavaScript, images)                       │
│  • Excel report generation                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS + API Key
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                         │
│                   Java Spring Boot Backend                       │
│                         (Port 8443)                              │
│                                                                   │
│  • REST API (50+ endpoints)                                     │
│  • Business logic validation                                    │
│  • JPA/Hibernate ORM                                            │
│  • API Key authentication                                       │
│  • SSL/TLS encryption                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │ JDBC
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
│                    PostgreSQL Database                           │
│                                                                   │
│  • Relational tables (tutors, students, lessons, etc.)         │
│  • Foreign keys and constraints                                 │
│  • Performance indexes                                          │
│  • Automatic backup                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Communication Flow

1. User interacts with web interface (browser)
2. Node.js frontend handles sessions and page rendering
3. Data requests are forwarded to Java backend via HTTPS
4. Backend processes business logic and queries the database
5. Data returns through the same layers back to the user

---

## 🔧 Main Components

### 1. **Backend API (Java Spring Boot)**

The heart of the system is a robust RESTful API built with Spring Boot 3.4.1 and Java 21.

**Main features**:
- ✅ **50+ REST endpoints** for all CRUD operations
- ✅ **3-layer architecture**: Controller → Service → Repository
- ✅ **JPA/Hibernate** for ORM (Object-Relational Mapping)
- ✅ **API Key Security** for API authentication
- ✅ **SSL/TLS** for secure communications (HTTPS)
- ✅ **Data validation** with Bean Validation
- ✅ **Centralized error handling** with @ControllerAdvice

**Managed entities**:
- `Tutor`: Teachers/tutors with roles (STAFF, GENERIC)
- `Student`: Students with class and information
- `Lesson`: Lessons with tutor, student, schedules
- `Prenotation`: Lesson bookings (confirmed/unconfirmed)
- `CalendarNote`: Notes and reminders for the calendar
- `Admin`: System administrators

**Technologies**:
- Java 21
- Spring Boot 3.4.1
- Spring Data JPA
- Hibernate
- PostgreSQL Driver
- Maven

📚 **Detailed documentation**: [Java/backend-api/README.md](Java/backend-api/README.md)

---

### 2. **Frontend Server (Node.js Express)**

User-friendly web interface that handles authentication, sessions and presents data to users.

**Main features**:
- ✅ **Dual authentication**: Separate system for tutors and administrators
- ✅ **Session management** with express-session
- ✅ **Password hashing** with bcrypt (10 salt rounds)
- ✅ **Role-based access control** (RBAC)
- ✅ **Server-side rendering** with EJS templates
- ✅ **Excel export** for reports and statistics
- ✅ **Advanced logging** with colors and timestamps
- ✅ **Middleware chain** for authentication and authorization

**Main pages**:
- **Login/Admin Login**: Dual authentication for tutors and admins
- **Home**: Dashboard with daily lessons and tasks
- **Lessons**: Complete lesson management (CRUD)
- **Calendar**: Interactive calendar with notes
- **Admin Panel**: Tutor and student management (admin only)
- **Staff Panel**: Advanced features for STAFF role

**Technologies**:
- Node.js 18+
- Express.js 4.18.2
- EJS 3.1.10
- bcrypt 6.0.0
- express-session 1.18.2
- ExcelJS 4.4.0

📚 **Detailed documentation**: [Nodejs/README.md](Nodejs/README.md)

---

### 3. **Database (PostgreSQL)**

PostgreSQL relational database for data persistence.

**Main schema**:

```
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│    Tutors    │        │   Students   │        │    Admins    │
├──────────────┤        ├──────────────┤        ├──────────────┤
│ id (PK)      │        │ id (PK)      │        │ id (PK)      │
│ name         │───┐    │ name         │───┐    │ username     │
│ email        │   │    │ email        │   │    │ password     │
│ username     │   │    │ phone        │   │    │ email        │
│ password     │   │    │ class        │   │    └──────────────┘
│ role         │   │    │ ...          │   │
│ status       │   │    └──────────────┘   │
└──────────────┘   │                       │
                   │    ┌──────────────┐   │
                   │    │   Lessons    │   │
                   │    ├──────────────┤   │
                   └───→│ tutor_id(FK) │   │
                        │ student_id   │←──┘
                        │ start_time   │
                        │ end_time     │
                        │ description  │
                        └──────────────┘
                             │
                             │
                        ┌────┴─────────┐
                        │              │
                   ┌────▼────┐   ┌─────▼─────┐
                   │Prenotat.│   │CalendarNot│
                   ├─────────┤   ├───────────┤
                   │ ...     │   │ ...       │
                   └─────────┘   └───────────┘
```

**Features**:
- Foreign key relationships between tables
- Indexes for query optimization
- Constraints for data integrity
- Timezone support for dates/times
- Auto-increment for IDs

---

## ✨ Main Features

### For Tutors

#### 🏠 Home Dashboard
- View today's lessons
- Tasks and notes from calendar
- Pending bookings
- Quick actions for common operations

#### 📚 Lesson Management
- **Create lesson**: Select student, set times, add description
- **Edit lesson**: Update times, student or details
- **Delete lesson**: Cancel lessons no longer needed
- **Filter lessons**: By date, student, tutor
- **List view**: Complete table with all information

#### 👨‍🎓 Student Management
- Student registry with name, email, phone
- Class information (U, M, S)
- Lesson history per student
- Quick student search

#### 📅 Calendar
- Monthly calendar view
- Display of scheduled lessons
- Daily notes and reminders
- Month navigation
- Color-coding by event type

#### 📊 Excel Reports
- **Monthly lesson report**: All lessons of the month
- **Student report**: Lessons specific to each student
- **Tutor report**: Annual statistics per tutor (own account only)

#### 📝 Bookings
- View received bookings
- Confirm or reject bookings
- Create new bookings for students

---

### For Administrators

#### 👥 Tutor Management
- **View all tutors**: Complete list with status
- **Create new tutor**: Add tutors with credentials
- **Edit tutor**: Update information and roles
- **Block/Unblock account**: Account status management (ACTIVE/BLOCKED)
- **Delete tutor**: Permanent removal (with confirmation)
- **Assign roles**: STAFF (advanced) or GENERIC (basic)

#### 👨‍🎓 Student Management (Admin)
- Full access to all students
- Edit and delete without restrictions
- Global view of lesson history

#### 📊 Complete Reports
- Access to all reports from all tutors
- Global center statistics
- Custom exports

#### 🔐 Security
- Separate login with admin credentials
- Log of all admin login attempts
- Passwords hashed with bcrypt
- Configurable session timeout

---

### For STAFF Role

Tutors with **STAFF** role have additional features:

- **Staff Panel**: Dedicated panel with advanced functions
- **Calendar note management**: Create notes visible to all
- **Extended reports**: Access to reports from other tutors (if authorized)
- **Advanced configurations**: System settings

---

## 🛠️ Technology Stack

### Backend
| Technology | Version | Usage |
|------------|----------|-------|
| Java | 21 | Main language |
| Spring Boot | 3.4.1 | Application framework |
| Spring Data JPA | 3.4.1 | ORM and repositories |
| Hibernate | 6.4+ | Object-Relational Mapping |
| PostgreSQL Driver | Latest | Database connection |
| Maven | 3.8+ | Build and dependency management |

### Frontend
| Technology | Version | Usage |
|------------|----------|-------|
| Node.js | 18+ | JavaScript runtime |
| Express.js | 4.18.2 | Web framework |
| EJS | 3.1.10 | Template engine |
| bcrypt | 6.0.0 | Password hashing |
| express-session | 1.18.2 | Session management |
| ExcelJS | 4.4.0 | Excel generation |

### Database
| Technology | Version | Usage |
|------------|----------|-------|
| PostgreSQL | 12+ | Relational database |

### Security
- **HTTPS/SSL**: Encrypted communication
- **API Key**: API request authentication
- **bcrypt**: Password hashing (10 rounds)
- **Session-based auth**: httpOnly cookies
- **Role-based access**: Authorization control

---

## 🚀 Getting Started

### Prerequisites

1. **Java 21** or higher ([Download](https://www.oracle.com/java/technologies/downloads/))
2. **Node.js 18+** and npm ([Download](https://nodejs.org/))
3. **PostgreSQL 12+** installed and running ([Download](https://www.postgresql.org/download/))
4. **Maven 3.8+** (included via Maven Wrapper)
5. **Git** to clone the repository

---

### Quick Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd Tutorly
```

#### 2. Configure the Database

```bash
# Access PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE tutorly_db;

# Exit
\q
```

#### 3. Configure Java Backend

```bash
cd Java/backend-api

# Copy and edit application.properties (if needed)
nano src/main/resources/application.properties

# Update database credentials:
# spring.datasource.url=jdbc:postgresql://localhost:5432/tutorly_db
# spring.datasource.username=postgres
# spring.datasource.password=your_password
```

#### 4. Start Java Backend

**Option A: From command line**
```bash
./mvnw spring-boot:run
```

**Option B: With GUI (recommended for development)**
```bash
# Linux/Mac
./run-gui.sh

# Windows
run-gui.bat
```

Backend will be available at: `https://localhost:8443`

📚 **GUI Documentation**: [Java/backend-api/GUI-README.md](Java/backend-api/GUI-README.md)

#### 5. Configure Node.js Frontend

```bash
cd ../../Nodejs

# Install dependencies
npm install

# Check configuration in server_utilities/config.js
# JAVA_API_URL: 'https://localhost:8443'
# JAVA_API_KEY: 'MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu'
```

#### 6. Start Node.js Frontend

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

Frontend will be available at: `http://localhost:3000`

#### 7. Access the System

Open browser and go to: `http://localhost:3000`

**Tutor Login**: `http://localhost:3000/login`
- Username/password: (create users via admin panel)

**Admin Login**: `http://localhost:3000/adminLogin`
- Username/password: (configure in database or via API)

---

## 📁 Project Structure

```
Tutorly/
│
├── Java/                           # Backend API
│   └── backend-api/
│       ├── src/
│       │   └── main/
│       │       ├── java/com/tutorly/app/backend_api/
│       │       │   ├── controller/     # REST Controllers
│       │       │   ├── service/        # Business Logic
│       │       │   ├── repository/     # Data Access Layer
│       │       │   ├── entity/         # JPA Entities
│       │       │   ├── dto/            # Data Transfer Objects
│       │       │   ├── config/         # Configuration
│       │       │   └── gui/            # GUI Launcher
│       │       └── resources/
│       │           └── application.properties
│       ├── pom.xml                 # Maven dependencies
│       ├── README.md               # Backend documentation
│       ├── GUI-README.md           # GUI documentation
│       └── run-gui.sh/bat          # GUI launcher scripts
│
├── Nodejs/                         # Frontend Server
│   ├── src/
│   │   └── index.js                # Main Express server
│   ├── server_utilities/           # Service modules
│   │   ├── authService.js          # Authentication
│   │   ├── authMiddleware.js       # Middleware
│   │   ├── javaApiService.js       # API client
│   │   ├── passwordService.js      # Password hashing
│   │   ├── logger.js               # Logging
│   │   ├── excel.js                # Excel reports
│   │   └── config.js               # Configuration
│   ├── views/                      # EJS templates
│   │   ├── login.ejs
│   │   ├── adminLogin.ejs
│   │   ├── home.ejs
│   │   ├── lessons.ejs
│   │   ├── calendar.ejs
│   │   ├── admin.ejs
│   │   └── staffPanel.ejs
│   ├── public/                     # Static files
│   │   ├── css/                    # Stylesheets
│   │   └── js/                     # Client JavaScript
│   ├── migrations/                 # DB migrations
│   ├── package.json                # npm dependencies
│   └── README.md                   # Frontend documentation
│
├── Database/                       # Database scripts
│   └── POSTGRE_DB_CONFIG.TXT
│
└── README.md                       # This file
```

---

## 📚 Complete Documentation

Each component has its own detailed documentation:

| Component | Documentation | Description |
|------------|---------------|-------------|
| **Java Backend API** | [Java/backend-api/README.md](Java/backend-api/README.md) | Architecture, API endpoints, configuration |
| **Java GUI** | [Java/backend-api/GUI-README.md](Java/backend-api/GUI-README.md) | Graphical interface for server management |
| **Node.js Frontend** | [Nodejs/README.md](Nodejs/README.md) | Architecture, routes, authentication, middleware |

---

## 🔐 Security

### Authentication
- **Password hashing**: Bcrypt with 10 salt rounds
- **Session-based**: httpOnly cookies to prevent XSS
- **Dual authentication**: Separate systems for tutors and admins
- **API Key**: Backend request authentication

### Authorization
- **Role-Based Access Control (RBAC)**: ADMIN, STAFF, GENERIC roles
- **Middleware protection**: Routes protected with middleware
- **Account blocking**: Ability to block compromised accounts

### Communication
- **HTTPS/SSL**: Encrypted communication between frontend and backend
- **API Key header**: X-API-Key for every API request
- **Certificate-based**: Self-signed certificate support in development

### Best Practices
- ✅ Never store passwords in plain text
- ✅ Configurable session timeout
- ✅ Logging of all login attempts
- ✅ Input validation on client and server
- ✅ Data sanitization before database operations

---

## 🧪 Testing

### Backend Testing

```bash
cd Java/backend-api

# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=LessonServiceTest

# Run with coverage
./mvnw test jacoco:report
```

### Frontend Testing

```bash
cd Nodejs

# Add test framework (example: Jest)
npm install --save-dev jest

# Run tests
npm test
```

---

## 🐛 Troubleshooting

### Backend won't start

**Symptom**: `Error: Port 8443 already in use`

**Solution**:
```bash
# Linux/Mac
lsof -ti:8443 | xargs kill -9

# Windows
netstat -ano | findstr :8443
taskkill /PID <PID> /F
```

---

### Frontend can't connect to backend

**Symptom**: `Error: connect ECONNREFUSED`

**Solution**:
1. Verify backend is running on port 8443
2. Check `server_utilities/config.js`:
   - `JAVA_API_URL` must be `https://localhost:8443`
   - `JAVA_API_KEY` must match the backend

---

### Database connection error

**Symptom**: `Connection refused` or `Authentication failed`

**Solution**:
1. Verify PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql  # Linux
   pg_ctl status                      # Mac/Windows
   ```

2. Check credentials in `application.properties`:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/tutorly_db
   spring.datasource.username=postgres
   spring.datasource.password=<your_password>
   ```

3. Manual connection test:
   ```bash
   psql -h localhost -U postgres -d tutorly_db
   ```

---

### Sessions don't persist

**Symptom**: User gets logged out on every system refresh

**Solution**:
- Verify `server_utilities/config.js`: `TUTOR_SESSION_SECRET` must be set
- For production, use a persistent session store (Redis)
- Check that cookies are enabled in the browser

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

### How to contribute:

1. **Fork the project**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Code Style

- **Java**: Follow standard Java conventions (Google Java Style)
- **JavaScript**: Use ESLint (config included)
- **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)

---

## 📝 Roadmap

### Version 1.1 (Next Release)
- [ ] Implement email notifications
- [ ] Dashboard analytics with charts
- [ ] Google Calendar integration

### Version 1.2
- [ ] Student evaluation system


### Version 2.0
- [ ] Mobile app
- [ ] Multi-tenant support
- [ ] AI-powered scheduling
- [ ] Public REST API with OpenAPI documentation

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.


---

## 👥 Team

Developed by Matteo Schintu (Skenny)

---

## 📧 Contacts

For questions, support or feedback:

- **Email**: skenny.dev@gamil.con
- **Team**: Tutorly Development Team (Skenny)

---

## 🎓 Notes for Students/Developers

This project is an excellent example of:
- ✅ Complete **three-tier architecture**
- ✅ **REST API design** with Spring Boot
- ✅ **Frontend/Backend separation**
- ✅ **Relational database** with JPA
- ✅ **Authentication and authorization**
- ✅ **Session management**
- ✅ **Password security** (bcrypt)
- ✅ **Logging and monitoring**
- ✅ **Excel generation**
- ✅ **HTTPS/SSL configuration**



---

**Last updated**: February 17, 2026

**Version**: 1.0.0
