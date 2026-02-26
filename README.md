# Tutorly - Tutoring Management System

> A complete full-stack platform for managing tutoring and academic support activities.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.txt)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://www.postgresql.org/)

---

## ✨ Features

Tutorly is a full-stack web application that allows you to:

- **Manage lessons**: Create, edit, and delete lessons with specific students
- **Organize students**: Complete registry with information on classes and subjects
- **Track bookings**: Lesson booking system with confirmation
- **Plan activities**: Integrated calendar with notes and reminders
- **Generate reports**: Excel export of lessons, monthly statistics, and student reports
- **Control access**: Dual authentication system (tutors and administrators) with differentiated roles

---

## 🛠️ Technology Stack

- **Backend**: Java 21, Spring Boot 3.4.1, PostgreSQL
- **Frontend**: Node.js 18+, Express.js, EJS
- **Security**: HTTPS/SSL, bcrypt, API Key authentication
- **Architecture**: Three-tier (Client → Presentation → Business Logic → Data)

---

## 🚀 Quick Start

### Prerequisites

- Java 21+
- Node.js 18+
- PostgreSQL 12+
- Maven 3.8+

### Installation

```bash
# Clone repository
git clone <repository-url>
cd Tutorly

# Setup database
psql -U postgres
CREATE DATABASE tutorly_db;
CREATE USER tutorly_admin WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE tutorly_db TO tutorly_admin;

# Start Java backend (port 8443)
cd Java/backend-api
mvn spring-boot:run

# Start Node.js frontend (port 3000/3443)
cd ../../Nodejs
npm install
npm start
```

Access the application at `http://localhost:3000`

---

## 📚 Documentation

**Complete documentation is available in the [`docs/`](docs/) folder:**

- **[📖 Project Overview](docs/00_Project_Overview.md)** - Architecture, features, and getting started
- **[☕ Java Backend API](docs/01_Java_Backend_API.md)** - Spring Boot backend documentation
- **[🖥️ GUI Launcher](docs/02_Java_GUI_Launcher.md)** - Desktop management interface
- **[🌐 Node.js Frontend](docs/03_Nodejs_Frontend.md)** - Express.js frontend server
- **[🔒 HTTPS Setup](docs/04_HTTPS_Setup_Guide.md)** - SSL/TLS configuration guide
- **[⚙️ Service Modules](docs/05_Service_Modules.md)** - Node.js utility modules
- **[🗄️ Database Migrations](docs/06_Database_Migrations.md)** - Migration scripts
- **[💾 Database Configuration](docs/07_Database_Configuration.md)** - PostgreSQL setup
- **[🧪 Testing Guide](docs/08_Testing_Guide.md)** - Testing strategies
- **[🚀 Deployment Guide](docs/09_Deployment_Guide.md)** - Production deployment
- **[🤝 Contributing Guide](docs/10_Contributing_Guide.md)** - How to contribute
- **[📖 Glossary](docs/11_Glossary.md)** - Technical terms reference
- **[📝 Changelog](docs/CHANGELOG.md)** - Version history

### Quick Links

- 🏁 [Getting Started](docs/00_Project_Overview.md#getting-started)
- 🏗️ [Architecture](docs/00_Project_Overview.md#system-architecture)
- 🔧 [Troubleshooting](docs/00_Project_Overview.md#troubleshooting)
- 🛡️ [Security](docs/00_Project_Overview.md#security)

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](docs/10_Contributing_Guide.md) for details on:

- Opening issues (required before PRs)
- Code style guidelines
- Pull request process
- Testing requirements

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.

---

## 👤 Author

**Matteo Schintu (Skenny)**

- Email: skenny.dev@gmail.com
- GitHub: [@SkennyCMD](https://github.com/SkennyCMD)

---

## 📧 Support

For questions, support, or feedback:

- 📧 Email: skenny.dev@gmail.com
- 📖 Documentation: [docs/](docs/)
- 🐛 Issues: Open an issue on GitHub

---

**Version**: 1.3.0  
**Last Updated**: February 26, 2026

