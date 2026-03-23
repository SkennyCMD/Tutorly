# Tutorly - Complete Documentation Index

This directory contains all the documentation for the Tutorly project, organized by component and topic.

---

**Document**: README.md  
**Last Updated**: February 25, 2026  
**Version**: 1.1.0  
**Maintained by**: Tutorly Development Team  

---

## 📋 Table of Contents

- [Documentation Structure](#documentation-structure)
- [Quick Start Guide](#quick-start-guide)
- [Documentation by Topic](#documentation-by-topic)
- [Documentation Maintenance](#documentation-maintenance)
- [Contributing](#contributing)
- [Support](#support)

---

## 📚 Documentation Structure

### General Documentation

| Document | Description |
|----------|-------------|
| **[00_Project_Overview.md](00_Project_Overview.md)** | Complete project overview, architecture, features, installation guide |

---

### Java Backend Documentation

| Document | Description |
|----------|-------------|
| **[01_Java_Backend_API.md](01_Java_Backend_API.md)** | Java Spring Boot backend API documentation with architecture, endpoints, and configuration |
| **[02_Java_GUI_Launcher.md](02_Java_GUI_Launcher.md)** | GUI launcher documentation for managing the Java backend server |

---

### Node.js Frontend Documentation

| Document | Description |
|----------|-------------|
| **[03_Nodejs_Frontend.md](03_Nodejs_Frontend.md)** | Node.js Express frontend server documentation with routes, authentication, and services |
| **[04_HTTPS_Setup_Guide.md](04_HTTPS_Setup_Guide.md)** | Complete guide for setting up HTTPS with self-signed certificates for local development |
| **[05_Service_Modules.md](05_Service_Modules.md)** | Documentation for Node.js service modules (authentication, API client, logging, etc.) |
| **[06_Database_Migrations.md](06_Database_Migrations.md)** | Database migration scripts documentation (password hashing migration) |
| **[12_PWA_Guide.md](12_PWA_Guide.md)** | Complete guide on the Progressive Web App architecture, service worker, and caching strategies. |

### Database Documentation

| Document | Description |
|----------|-------------|
| **[07_Database_Configuration.md](07_Database_Configuration.md)** | Complete PostgreSQL database configuration guide with ER model, schema, setup, and migrations |

---

### Development & Operations

| Document | Description |
|----------|-------------|
| **[08_Testing_Guide.md](08_Testing_Guide.md)** | Comprehensive testing guide including unit, integration, and E2E testing strategies |
| **[09_Deployment_Guide.md](09_Deployment_Guide.md)** | Production deployment guide with server setup, SSL configuration, and monitoring |
| **[10_Contributing_Guide.md](10_Contributing_Guide.md)** | Guidelines for contributing to the project including code style and PR process |

---

### Reference Documentation

| Document | Description |
|----------|-------------|
| **[11_Glossary.md](11_Glossary.md)** | Technical terms, acronyms, and definitions used in the project |
| **[CHANGELOG.md](../CHANGELOG.md)** | Project version history and release notes |

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
- **SSL Certificates**: [04_HTTPS_Setup_Guide.md](04_HTTPS_Setup_Guide.md)

### Database
- **Database Configuration & Schema**: [07_Database_Configuration.md](07_Database_Configuration.md)
- **Entity Relationships**: [07_Database_Configuration.md](07_Database_Configuration.md#entity-relationship-model)
- **Installation & Setup**: [07_Database_Configuration.md](07_Database_Configuration.md#installation-and-setup)
- **Migrations**: [06_Database_Migrations.md](06_Database_Migrations.md)

### Testing & Quality
- **Testing Strategy**: [08_Testing_Guide.md](08_Testing_Guide.md#testing-strategy)
- **Unit Testing**: [08_Testing_Guide.md](08_Testing_Guide.md#java-backend-testing)
- **Integration Testing**: [08_Testing_Guide.md](08_Testing_Guide.md#integration-testing)
- **E2E Testing**: [08_Testing_Guide.md](08_Testing_Guide.md#end-to-end-testing)
- **Test Coverage**: [08_Testing_Guide.md](08_Testing_Guide.md#test-coverage)

### Deployment & Production
- **Deployment Guide**: [09_Deployment_Guide.md](09_Deployment_Guide.md)
- **Server Setup**: [09_Deployment_Guide.md](09_Deployment_Guide.md#production-environment-setup)
- **SSL Configuration**: [09_Deployment_Guide.md](09_Deployment_Guide.md#ssltls-configuration)
- **Monitoring**: [09_Deployment_Guide.md](09_Deployment_Guide.md#monitoring-and-logging)
- **Backup Strategy**: [09_Deployment_Guide.md](09_Deployment_Guide.md#backup-and-recovery)

### Contributing
- **How to Contribute**: [10_Contributing_Guide.md](10_Contributing_Guide.md)
- **Code Style Guidelines**: [10_Contributing_Guide.md](10_Contributing_Guide.md#code-style-guidelines)
- **Pull Request Process**: [10_Contributing_Guide.md](10_Contributing_Guide.md#pull-request-process)
- **Testing Requirements**: [10_Contributing_Guide.md](10_Contributing_Guide.md#testing-requirements)

### Reference
- **Glossary**: [11_Glossary.md](11_Glossary.md)
- **Changelog**: [CHANGELOG.md](../CHANGELOG.md)
- **Quick Reference (Backend)**: [01_Java_Backend_API.md](01_Java_Backend_API.md#quick-reference)
- **Quick Reference (Frontend)**: [03_Nodejs_Frontend.md](03_Nodejs_Frontend.md#quick-reference)

### Troubleshooting
- **Common Issues**: [00_Project_Overview.md](00_Project_Overview.md#troubleshooting)
- **HTTPS Issues**: [04_HTTPS_Setup_Guide.md](04_HTTPS_Setup_Guide.md#troubleshooting)
- **GUI Issues**: [02_Java_GUI_Launcher.md](02_Java_GUI_Launcher.md#troubleshooting)

---

## 📝 Documentation Maintenance

All documentation for the Tutorly project is centralized in this `docs/` directory. This is the single source of truth for the project's documentation.

### Updating Documentation

When updating or adding new documentation:
1. **Edit the file directly** in this `docs/` directory.
2. Maintain the numbering prefix (`00_`, `01_`, etc.) if creating a new file for easy sorting.
3. Remember to update the index in this `README.md` and in `00_Project_Overview.md`.

---

## 🤝 Contributing

For code style guidelines and contribution instructions, see [00_Project_Overview.md](00_Project_Overview.md#contributing).

---

## 📧 Support

For questions or support:
- **Email**: skenny.dev@gmail.com
- **Team**: Tutorly Development Team (Skenny)

---

**Last Updated**: February 25, 2026  
**Version**: 1.1.0
