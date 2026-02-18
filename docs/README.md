# Tutorly - Complete Documentation Index

This directory contains all the documentation for the Tutorly project, organized by component and topic.

---

## 📚 Documentation Structure

### General Documentation

| Document | Description | Original Location |
|----------|-------------|-------------------|
| **[00_Project_Overview.md](00_Project_Overview.md)** | Complete project overview, architecture, features, installation guide | Root README.md |

---

### Java Backend Documentation

| Document | Description | Original Location |
|----------|-------------|-------------------|
| **[01_Java_Backend_API.md](01_Java_Backend_API.md)** | Java Spring Boot backend API documentation with architecture, endpoints, and configuration | Java/backend-api/README.md |
| **[02_Java_GUI_Launcher.md](02_Java_GUI_Launcher.md)** | GUI launcher documentation for managing the Java backend server | Java/backend-api/GUI-README.md |

---

### Node.js Frontend Documentation

| Document | Description | Original Location |
|----------|-------------|-------------------|
| **[03_Nodejs_Frontend.md](03_Nodejs_Frontend.md)** | Node.js Express frontend server documentation with routes, authentication, and services | Nodejs/README.md |
| **[04_HTTPS_Setup_Guide.md](04_HTTPS_Setup_Guide.md)** | Complete guide for setting up HTTPS with self-signed certificates for local development | Nodejs/HTTPS_SETUP.md |
| **[05_Service_Modules.md](05_Service_Modules.md)** | Documentation for Node.js service modules (authentication, API client, logging, etc.) | Nodejs/server_utilities/README.md |
| **[06_Database_Migrations.md](06_Database_Migrations.md)** | Database migration scripts documentation (password hashing migration) | Nodejs/migrations/README.md |
| **[07_SSL_Certificates.md](07_SSL_Certificates.md)** | SSL certificates documentation for HTTPS development | Nodejs/ssl/README.md |

---

## 🚀 Quick Start Guide

### For Developers

1. **Start Here**: [00_Project_Overview.md](00_Project_Overview.md)
   - Understand the project architecture
   - Learn about the technology stack
   - Follow the installation guide

2. **Backend Setup**: [01_Java_Backend_API.md](01_Java_Backend_API.md)
   - Configure and start the Java backend
   - Explore API endpoints
   - Understand the database schema

3. **Frontend Setup**: [03_Nodejs_Frontend.md](03_Nodejs_Frontend.md)
   - Configure and start the Node.js frontend
   - Learn about authentication and sessions
   - Understand the route structure

4. **HTTPS Configuration** (Optional): [04_HTTPS_Setup_Guide.md](04_HTTPS_Setup_Guide.md)
   - Generate self-signed certificates
   - Configure HTTPS for local development
   - Prepare for production deployment

---

## 📖 Documentation by Topic

### Architecture & Design
- **System Architecture**: [00_Project_Overview.md](00_Project_Overview.md#system-architecture)
- **Backend Architecture**: [01_Java_Backend_API.md](01_Java_Backend_API.md#architecture)
- **Frontend Architecture**: [03_Nodejs_Frontend.md](03_Nodejs_Frontend.md#system-architecture)

### Installation & Setup
- **Quick Installation**: [00_Project_Overview.md](00_Project_Overview.md#getting-started)
- **Backend Configuration**: [01_Java_Backend_API.md](01_Java_Backend_API.md#setup-and-configuration)
- **Frontend Configuration**: [03_Nodejs_Frontend.md](03_Nodejs_Frontend.md#setup-and-configuration)
- **HTTPS Setup**: [04_HTTPS_Setup_Guide.md](04_HTTPS_Setup_Guide.md)

### API & Endpoints
- **REST API Endpoints**: [01_Java_Backend_API.md](01_Java_Backend_API.md#api-endpoints)
- **Frontend Routes**: [03_Nodejs_Frontend.md](03_Nodejs_Frontend.md#routes-and-endpoints)

### Security
- **Security Overview**: [00_Project_Overview.md](00_Project_Overview.md#security)
- **Authentication System**: [03_Nodejs_Frontend.md](03_Nodejs_Frontend.md#authentication-system)
- **HTTPS/SSL Configuration**: [04_HTTPS_Setup_Guide.md](04_HTTPS_Setup_Guide.md)
- **Password Migration**: [06_Database_Migrations.md](06_Database_Migrations.md)

### Development Tools
- **GUI Launcher**: [02_Java_GUI_Launcher.md](02_Java_GUI_Launcher.md)
- **Service Modules**: [05_Service_Modules.md](05_Service_Modules.md)
- **SSL Certificates**: [07_SSL_Certificates.md](07_SSL_Certificates.md)

### Database
- **Database Schema**: [01_Java_Backend_API.md](01_Java_Backend_API.md#database-schema)
- **Migrations**: [06_Database_Migrations.md](06_Database_Migrations.md)

### Troubleshooting
- **Common Issues**: [00_Project_Overview.md](00_Project_Overview.md#troubleshooting)
- **HTTPS Issues**: [04_HTTPS_Setup_Guide.md](04_HTTPS_Setup_Guide.md#troubleshooting)
- **GUI Issues**: [02_Java_GUI_Launcher.md](02_Java_GUI_Launcher.md#troubleshooting)

---

## 🔧 Technology Stack Reference

### Backend
- Java 21
- Spring Boot 3.4.1
- Spring Data JPA
- Hibernate 6.4+
- PostgreSQL
- Maven 3.8+

### Frontend
- Node.js 18+
- Express.js 4.18.2
- EJS 3.1.10
- bcrypt 6.0.0
- express-session 1.18.2
- ExcelJS 4.4.0

### Database
- PostgreSQL 12+

### Security
- HTTPS/SSL (self-signed for dev, CA-signed for production)
- bcrypt password hashing (10 rounds)
- API Key authentication
- Session-based authentication
- Role-Based Access Control (RBAC)

---

## 📝 Documentation Maintenance

### Original Locations

All documentation files in this directory are **copies** of the original files. The original files remain in their respective locations:

- **Root README**: `/README.md`
- **Java Backend**: `/Java/backend-api/README.md`
- **Java GUI**: `/Java/backend-api/GUI-README.md`
- **Node.js Frontend**: `/Nodejs/README.md`
- **HTTPS Setup**: `/Nodejs/HTTPS_SETUP.md`
- **Service Modules**: `/Nodejs/server_utilities/README.md`
- **Migrations**: `/Nodejs/migrations/README.md`
- **SSL Certificates**: `/Nodejs/ssl/README.md`

### Updating Documentation

When updating documentation:
1. **Edit the original file** in its component directory
2. **Copy the updated file** to this `docs/` directory with the appropriate name
3. Maintain the numbering prefix for easy sorting

Example:
```bash
# After editing Java/backend-api/README.md
cp Java/backend-api/README.md docs/01_Java_Backend_API.md
```

---

## 🤝 Contributing

For code style guidelines and contribution instructions, see [00_Project_Overview.md](00_Project_Overview.md#contributing).

---

## 📧 Support

For questions or support:
- **Email**: skenny.dev@gmail.com
- **Team**: Tutorly Development Team (Skenny)

---

**Last Updated**: February 18, 2026  
**Version**: 1.0.0
