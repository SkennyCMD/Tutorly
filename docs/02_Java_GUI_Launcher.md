# Tutorly API Server Manager - GUI

**Java Swing-based graphical interface for managing the Tutorly API Server startup and configuration.**

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [System Requirements](#system-requirements)
- [How to Launch](#how-to-launch)
- [Using the GUI](#using-the-gui)
- [Configuration Files](#configuration-files)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

---

## Overview

The **Tutorly API Server Manager** is a Java Swing-based desktop application that provides a user-friendly graphical interface to configure and manage the Tutorly Spring Boot backend server. It eliminates the need to manually edit configuration files and provides real-time server logs directly within the application.

### Why Use the GUI?

- ✅ **No manual configuration editing** - Visual forms instead of text files
- ✅ **Configuration persistence** - Automatically remembers your last settings
- ✅ **Real-time server logs** - Monitor server activity without terminal windows
- ✅ **Quick server management** - Start/stop server with one click
- ✅ **Validation** - Built-in input validation to prevent configuration errors
- ✅ **Cross-platform** - Works on Windows, Linux, and macOS

---

## Features

### 🗄️ Database Configuration Management
- **Host**: Database server hostname (e.g., `localhost`)
- **Port**: PostgreSQL port (default: `5432`)
- **Database Name**: Name of the Tutorly database (e.g., `tutorly_db`)
- **Username**: Database user credentials
- **Password**: Secure password field with masking
- **Auto-save**: Last used configuration is automatically saved

### 🔧 Server Configuration Management
- **Server Port**: HTTP/HTTPS port (e.g., `8080`, `8443`)
- **SSL Toggle**: Enable/disable HTTPS with SSL/TLS
- **Keystore Path**: Location of SSL certificate (e.g., `classpath:keystore.p12`)
- **Keystore Password**: Password for SSL certificate
- **API Key**: Security token for API authentication (32-character hex string)

### 🚀 Server Control
- **Start Server**: Launches Spring Boot application with configured settings
- **Stop Server**: Gracefully shuts down the running server
- **Process Management**: Tracks server process and status
- **Auto-restart**: Option to restart server when configuration changes

### 📄 Real-Time Logging
- **Live Log Stream**: Server output displayed in real-time
- **Colored Output**: Syntax highlighting for different log levels
- **Scrollable View**: Navigate through server logs
- **Auto-scroll**: Automatically follows latest log entries

### 💾 Configuration Persistence
- **Auto-load**: Last configuration loaded on startup
- **Manual Save**: Save configuration at any time
- **Properties File**: Stored in `launcher-config.properties`
- **Hot Reload**: Changes applied without restarting GUI

---

## System Requirements

### Prerequisites
- **Java 21** or higher (JDK required for compilation)
- **Maven 3.8+** (included via Maven Wrapper)
- **PostgreSQL 12+** (must be running if connecting to database)
- **Operating System**: Windows, Linux, or macOS

### Optional
- **IDE**: IntelliJ IDEA, Eclipse, or VS Code (for development)
- **Git**: For version control

---

## How to Launch

### Option 1: Launch Scripts (Recommended)

#### Linux/macOS:
```bash
chmod +x run-gui.sh
./run-gui.sh
```

#### Windows:
```cmd
run-gui.bat
```

The scripts automatically:
- Compile the GUI if needed
- Set up the classpath
- Launch the application
- Handle platform-specific differences

---

### Option 2: Manual Compilation and Execution

#### Compile:
```bash
javac -cp ".:target/classes" \
  src/main/java/com/tutorly/app/backend_api/gui/ServerLauncherGUI.java
```

#### Execute:
```bash
cd src/main/java
java com.tutorly.app.backend_api.gui.ServerLauncherGUI
```

**Note**: On Windows, use `;` instead of `:` as classpath separator.

---

### Option 3: Run from IDE

1. Open the project in your IDE (IntelliJ IDEA, Eclipse, VS Code)
2. Navigate to `src/main/java/com/tutorly/app/backend_api/gui/ServerLauncherGUI.java`
3. Right-click and select **Run 'ServerLauncherGUI.main()'**
4. The GUI window will appear

---

## Using the GUI

### Initial Setup

1. **Launch the GUI** using one of the methods above
2. **Configuration loads automatically** from `launcher-config.properties` (if exists)
3. **GUI window appears** with two main sections:
   - **Configuration Panel** (top): Database and server settings
   - **Log Panel** (bottom): Real-time server output

---

### Step-by-Step Usage

#### 1. Configure Database Connection

Fill in the **Database Configuration** section:

| Field | Example Value | Description |
|-------|--------------|-------------|
| **DB Host** | `localhost` | PostgreSQL server hostname |
| **DB Port** | `5432` | PostgreSQL port (default: 5432) |
| **DB Name** | `tutorly_db` | Database name |
| **DB Username** | `postgres` | Database user |
| **DB Password** | `your_password` | Database password |

---

#### 2. Configure Server Settings

Fill in the **Server Configuration** section:

| Field | Example Value | Description |
|-------|--------------|-------------|
| **Server Port** | `8443` | Port for HTTPS (or `8080` for HTTP) |
| **SSL Enabled** | ☑️ Checked | Enable HTTPS with SSL/TLS |
| **Keystore Path** | `classpath:keystore.p12` | SSL certificate location |
| **Keystore Password** | `tutorly123` | Password for keystore |
| **API Key** | `MLkOj0KWeVxppf7s...` | 32-character security token |

**SSL Notes:**
- If SSL is **enabled**, use port `8443` and provide keystore details
- If SSL is **disabled**, use port `8080` (HTTP only)
- Keystore path can use `classpath:` prefix for resources

---

#### 3. Save Configuration

Click **"Save Configuration"** button to:
- Save all settings to `launcher-config.properties`
- Update `application.properties` in `src/main/resources/`
- Persist configuration for next launch

**Success message**: "Configuration saved successfully!"

---

#### 4. Start Server

Click **"Start Server"** button to:
1. Validate all configuration fields
2. Write settings to `application.properties`
3. Execute Maven command to start Spring Boot:
   ```bash
   ./mvnw spring-boot:run
   ```
4. Stream server logs to the Log Panel
5. Enable **"Stop Server"** button

**Server Status**: Monitor in the log panel
```
[INFO] Starting BackendApiApplication...
[INFO] Tomcat started on port(s): 8443 (https)
[INFO] Application is ready
```

---

#### 5. Stop Server

Click **"Stop Server"** button to:
1. Send termination signal to server process
2. Wait for graceful shutdown
3. Display shutdown confirmation in logs
4. Re-enable **"Start Server"** button

---

### Configuration Persistence Flow

```
┌─────────────────────────────────────────────────────────┐
│                      GUI Startup                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Load launcher-config.properties (if exists)             │
│ - Database settings                                     │
│ - Server settings                                       │
│ - SSL configuration                                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            Populate GUI Form Fields                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           User Edits Configuration                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│        User Clicks "Save Configuration"                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Write to launcher-config.properties                    │
│  Write to application.properties                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│    Configuration Ready for Next Launch                  │
└─────────────────────────────────────────────────────────┘
```

---

## Configuration Files

### 1. `launcher-config.properties`

**Location**: Project root directory (`backend-api/`)

**Purpose**: Stores GUI configuration for persistence between launches

**Example Content**:
```properties
# Database Configuration
db.host=localhost
db.port=5432
db.name=tutorly_db
db.username=postgres
db.password=your_password

# Server Configuration
server.port=8443
server.ssl.enabled=true
server.ssl.keystore=classpath:keystore.p12
server.ssl.keystore-password=tutorly123
api.key=MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu
```

**Auto-generated**: Created automatically on first save

---

### 2. `application.properties`

**Location**: `src/main/resources/application.properties`

**Purpose**: Spring Boot configuration file (updated by GUI before server start)

**Example Content**:
```properties
# Database Connection
spring.datasource.url=jdbc:postgresql://localhost:5432/tutorly_db
spring.datasource.username=postgres
spring.datasource.password=your_password

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# Server Configuration
server.port=8443

# SSL Configuration
server.ssl.enabled=true
server.ssl.key-store=classpath:keystore.p12
server.ssl.key-store-password=tutorly123
server.ssl.key-store-type=PKCS12

# API Security
api.security.key=MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu
```

**Updated automatically**: When "Save Configuration" or "Start Server" is clicked

---

## Architecture

### GUI Components

```
┌─────────────────────────────────────────────────────────┐
│              ServerLauncherGUI (Main Class)             │
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Configuration Panel (JPanel)             │ │
│  │                                                    │ │
│  │  ┌───────────────────────────────────────────────┐ │ │
│  │  │   Database Configuration (JTextField)         │ │ │
│  │  │   - Host, Port, Name, Username, Password      │ │ │
│  │  └───────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  ┌───────────────────────────────────────────────┐ │ │
│  │  │   Server Configuration (JTextField, JCheckBox)│ │ │
│  │  │   - Port, SSL Toggle, Keystore, API Key       │ │ │
│  │  └───────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  ┌───────────────────────────────────────────────┐ │ │
│  │  │   Action Buttons (JButton)                    │ │ │
│  │  │   - Save Config, Start Server, Stop Server    │ │ │
│  │  └───────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Log Panel (JScrollPane)                  │ │
│  │                                                    │ │
│  │  ┌───────────────────────────────────────────────┐ │ │
│  │  │   JTextArea (Non-editable)                    │ │ │
│  │  │   - Real-time server logs                     │ │ │
│  │  │   - Auto-scroll enabled                       │ │ │
│  │  └───────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Event Flow

```
User Action → Event Listener → Business Logic → UI Update

Examples:

1. Save Button Click:
   Click → saveConfiguration() → Write Files → Show Success

2. Start Server:
   Click → startServer() → Maven Process → Stream Logs → Update UI

3. Stop Server:
   Click → stopServer() → Destroy Process → Update UI
```

---

## Troubleshooting

### ❌ Problem: Server Won't Start

**Symptoms**:
```
Error: Address already in use
or
Error: Could not connect to database
```

**Solutions**:
1. **Check if port is in use**:
   ```bash
   # Linux/Mac
   lsof -i :8443
   
   # Windows
   netstat -ano | findstr :8443
   ```
   
2. **Kill process using the port**:
   ```bash
   # Linux/Mac
   kill -9 <PID>
   
   # Windows
   taskkill /PID <PID> /F
   ```

3. **Verify database is running**:
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql  # Linux
   pg_ctl status                      # macOS/Windows
   ```

4. **Test database connection**:
   ```bash
   psql -h localhost -U postgres -d tutorly_db
   ```

---

### ❌ Problem: SSL/HTTPS Not Working

**Symptoms**:
```
Error: Keystore not found
or
Error: Invalid keystore password
```

**Solutions**:
1. **Verify keystore exists**:
   ```bash
   ls src/main/resources/keystore.p12
   ```

2. **Check keystore path format**:
   - Use `classpath:keystore.p12` for resources folder
   - Use absolute path: `/full/path/to/keystore.p12`

3. **Verify keystore password**:
   ```bash
   keytool -list -v -keystore src/main/resources/keystore.p12 -storetype PKCS12
   # Enter password when prompted
   ```

4. **Generate new keystore if needed**:
   ```bash
   keytool -genkeypair -alias tutorly -keyalg RSA -keysize 2048 \
     -storetype PKCS12 -keystore keystore.p12 -validity 3650 \
     -storepass tutorly123
   ```

---

### ❌ Problem: GUI Can't Find application.properties

**Symptoms**:
```
FileNotFoundException: application.properties not found
```

**Solutions**:
1. **Run GUI from correct directory**:
   ```bash
   cd backend-api
   ./run-gui.sh  # or run-gui.bat
   ```

2. **Verify file exists**:
   ```bash
   ls src/main/resources/application.properties
   ```

3. **Check working directory**:
   ```bash
   # In GUI logs, check:
   Working directory: /path/to/backend-api
   ```

---

### ❌ Problem: Configuration Not Persisting

**Symptoms**:
Configuration resets to defaults on restart

**Solutions**:
1. **Check write permissions**:
   ```bash
   ls -l launcher-config.properties
   # Should be writable
   ```

2. **Verify save was successful**:
   - Look for "Configuration saved successfully!" message
   - Check if `launcher-config.properties` was updated

3. **Check for errors in logs**:
   - Look for write errors in GUI log panel

---

### ❌ Problem: Maven Command Not Found

**Symptoms**:
```
Error: mvnw: command not found
or
Error: mvnw is not recognized as an internal or external command
```

**Solutions**:
1. **Make mvnw executable** (Linux/Mac):
   ```bash
   chmod +x mvnw
   ```

2. **Use Maven Wrapper explicitly**:
   ```bash
   # Linux/Mac
   ./mvnw spring-boot:run
   
   # Windows
   mvnw.cmd spring-boot:run
   ```

3. **Install Maven globally** (alternative):
   ```bash
   # Linux
   sudo apt install maven
   
   # macOS
   brew install maven
   
   # Windows
   # Download from https://maven.apache.org/download.cgi
   ```

---

### ❌ Problem: Server Logs Not Appearing

**Symptoms**:
Log panel remains empty after starting server

**Solutions**:
1. **Check if server actually started**:
   - Look at terminal output (if running from terminal)
   - Check system processes

2. **Verify log streaming**:
   - GUI redirects process output to log panel
   - May take 5-10 seconds for first logs to appear

3. **Check for compilation errors**:
   - Server may fail to start due to code errors
   - Look for red error text in logs

---

## Development

### Project Structure

```
backend-api/
├── src/main/java/com/tutorly/app/backend_api/
│   └── gui/
│       └── ServerLauncherGUI.java    # Main GUI class
│
├── launcher-config.properties         # GUI configuration (auto-generated)
├── run-gui.sh                        # Linux/Mac launcher
├── run-gui.bat                       # Windows launcher
└── GUI-README.md                     # This file
```

---

### Key Classes and Methods

#### `ServerLauncherGUI.java`

**Main Methods**:

| Method | Description |
|--------|-------------|
| `main(String[] args)` | Entry point, creates and shows GUI |
| `loadConfiguration()` | Loads settings from `launcher-config.properties` |
| `saveConfiguration()` | Saves GUI fields to properties files |
| `startServer()` | Starts Spring Boot server via Maven |
| `stopServer()` | Terminates running server process |
| `appendLog(String message)` | Adds text to log panel |

**Key Components**:

```java
// Text fields for configuration
private JTextField dbHostField;
private JTextField dbPortField;
private JTextField dbNameField;
private JTextField dbUsernameField;
private JPasswordField dbPasswordField;

private JTextField serverPortField;
private JCheckBox sslEnabledCheckbox;
private JTextField keystorePathField;
private JPasswordField keystorePasswordField;
private JTextField apiKeyField;

// Control buttons
private JButton saveConfigButton;
private JButton startServerButton;
private JButton stopServerButton;

// Log display
private JTextArea logTextArea;

// Server process
private Process serverProcess;
```

---

### Extending the GUI

#### Add a New Configuration Field

1. **Add field declaration**:
```java
private JTextField myNewField;
```

2. **Initialize in constructor**:
```java
myNewField = new JTextField(20);
configPanel.add(new JLabel("My Setting:"));
configPanel.add(myNewField);
```

3. **Load in `loadConfiguration()`**:
```java
myNewField.setText(props.getProperty("my.setting", "default"));
```

4. **Save in `saveConfiguration()`**:
```java
props.setProperty("my.setting", myNewField.getText());
```

---

### Building Executable JAR

To distribute the GUI as a standalone JAR:

```bash
# Create executable JAR with dependencies
mvn clean package -DskipTests

# Run the JAR
java -jar target/backend-api-1.0.0.jar com.tutorly.app.backend_api.gui.ServerLauncherGUI
```

---

## Best Practices

### ✅ DO:
- Run GUI from project root directory (`backend-api/`)
- Save configuration before starting server
- Check logs for errors after starting server
- Test database connection before starting server
- Use SSL in production environments

### ❌ DON'T:
- Run GUI from arbitrary directories
- Start server without saving configuration first
- Ignore error messages in logs
- Use default passwords in production
- Expose API keys in version control

---

## Additional Resources

- **Backend API Endpoints**: [01_Java_Backend_API.md](01_Java_Backend_API.md)
- **Spring Boot Documentation**: https://spring.io/projects/spring-boot
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/

---

**Last updated:** February 25, 2026
