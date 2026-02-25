# 🚀 Deployment Guide

Comprehensive guide for deploying the Tutorly application to production environments.

---

**Document**: 09_Deployment_Guide.md  
**Last Updated**: February 25, 2026  
**Version**: 1.0.0  
**Author**: Tutorly Development Team  

---

## 📋 Table of Contents

- [Overview](#overview)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Production Environment Setup](#production-environment-setup)
- [Database Deployment](#database-deployment)
- [Java Backend Deployment](#java-backend-deployment)
- [Node.js Frontend Deployment](#nodejs-frontend-deployment)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Reverse Proxy Setup](#reverse-proxy-setup)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup and Recovery](#backup-and-recovery)
- [Scaling Strategy](#scaling-strategy)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers the complete deployment process for the Tutorly application in production environments. The recommended architecture uses:

- **PostgreSQL**: Production database
- **Java Backend**: Running as systemd service or containerized
- **Node.js Frontend**: Running behind Nginx reverse proxy
- **SSL/TLS**: CA-signed certificates from Let's Encrypt
- **Monitoring**: Prometheus + Grafana or similar

### Deployment Architecture

```
                    Internet
                       │
                       ▼
              [Load Balancer (Optional)]
                       │
                       ▼
                [Nginx Reverse Proxy]
                   HTTPS (443)
                       │
         ┌─────────────┴──────────────┐
         ▼                            ▼
  [Node.js Frontend]         [Java Backend API]
  Port 3000/3443             Port 8443
         │                            │
         └─────────────┬──────────────┘
                       ▼
              [PostgreSQL Database]
                   Port 5432
```

---

## Pre-Deployment Checklist

### Code Preparation

- [ ] All tests passing (`mvn test` and `npm test`)
- [ ] Code reviewed and merged to `main` branch
- [ ] Version numbers updated in `pom.xml` and `package.json`
- [ ] CHANGELOG.md updated with release notes
- [ ] Dependencies updated and vulnerabilities checked
- [ ] Environment-specific configurations separated

### Security Checklist

- [ ] API keys regenerated for production
- [ ] Database passwords using strong credentials
- [ ] SSL certificates obtained (Let's Encrypt or CA)
- [ ] CORS configured for production domains only
- [ ] Session secrets changed from development values
- [ ] Rate limiting configured
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented

### Infrastructure Checklist

- [ ] Server(s) provisioned with adequate resources
- [ ] Firewall rules configured
- [ ] Database backup strategy in place
- [ ] Monitoring tools installed
- [ ] Log aggregation configured
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Email service configured (if needed)

---

## Production Environment Setup

### Server Requirements

#### Minimum Specifications

**Single Server Setup:**
- CPU: 4 cores
- RAM: 8 GB
- Storage: 50 GB SSD
- OS: Ubuntu 22.04 LTS or similar

**Multi-Server Setup:**
- **Database Server**: 4 cores, 8 GB RAM, 100 GB SSD
- **Application Server**: 4 cores, 8 GB RAM, 50 GB SSD
- **Frontend Server**: 2 cores, 4 GB RAM, 20 GB SSD

### Operating System Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git ufw fail2ban

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Install Java 21
sudo apt install -y openjdk-21-jdk

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx
```

---

## Database Deployment

### PostgreSQL Production Setup

```bash
# Access PostgreSQL
sudo -u postgres psql

# Create production database
CREATE DATABASE tutorly_db_prod;

# Create dedicated user
CREATE USER tutorly_prod WITH PASSWORD 'your-strong-password-here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE tutorly_db_prod TO tutorly_prod;

# Exit
\q
```

### Configure PostgreSQL for Production

```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/14/main/postgresql.conf
```

**Key settings:**
```conf
# Connection settings
listen_addresses = 'localhost'  # Or specific IP
max_connections = 100

# Memory settings
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
work_mem = 16MB

# Write-Ahead Logging
wal_level = replica
max_wal_size = 1GB

# Logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d.log'
log_rotation_age = 1d
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

### Database Migration

```bash
# Backup development database
pg_dump tutorly_db > tutorly_backup.sql

# Restore to production
psql -U tutorly_prod -d tutorly_db_prod < tutorly_backup.sql

# Or use Hibernate auto-schema creation on first run
```

---

## Java Backend Deployment

### Build Production JAR

```bash
cd Java/backend-api

# Build with Maven
mvn clean package -DskipTests

# JAR file will be in target/
ls -lh target/*.jar
```

### Production Configuration

Create `application-prod.properties`:

```properties
# Server configuration
server.port=8443
server.ssl.enabled=true
server.ssl.key-store=classpath:production-keystore.p12
server.ssl.key-store-password=${SSL_KEYSTORE_PASSWORD}
server.ssl.key-store-type=PKCS12

# Database configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/tutorly_db_prod
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

# Hibernate configuration
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false

# Logging
logging.level.root=INFO
logging.level.com.tutorly=INFO
logging.file.name=/var/log/tutorly/backend.log
logging.file.max-size=10MB
logging.file.max-history=30

# API Key
api.key=${API_KEY}
```

### Create Systemd Service

```bash
sudo nano /etc/systemd/system/tutorly-backend.service
```

```ini
[Unit]
Description=Tutorly Backend API
After=postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=tutorly
WorkingDirectory=/opt/tutorly/backend
ExecStart=/usr/bin/java -jar \
    -Dspring.profiles.active=prod \
    -Xmx2g -Xms1g \
    /opt/tutorly/backend/backend-api-1.0.0.jar
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

# Environment variables
Environment="DB_USERNAME=tutorly_prod"
Environment="DB_PASSWORD=your-password"
Environment="API_KEY=your-api-key"
Environment="SSL_KEYSTORE_PASSWORD=your-keystore-pass"

[Install]
WantedBy=multi-user.target
```

### Deploy Backend

```bash
# Create application directory
sudo mkdir -p /opt/tutorly/backend
sudo mkdir -p /var/log/tutorly

# Copy JAR file
sudo cp target/backend-api-*.jar /opt/tutorly/backend/

# Create application user
sudo useradd -r -s /bin/false tutorly
sudo chown -R tutorly:tutorly /opt/tutorly
sudo chown -R tutorly:tutorly /var/log/tutorly

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable tutorly-backend
sudo systemctl start tutorly-backend

# Check status
sudo systemctl status tutorly-backend

# View logs
sudo journalctl -u tutorly-backend -f
```

---

## Node.js Frontend Deployment

### Build for Production

```bash
cd Nodejs

# Install production dependencies only
npm ci --production

# Set production environment variables
cp .env.example .env.production
```

### Production Configuration

Create `.env.production`:

```bash
NODE_ENV=production
PORT=3000
HTTPS_PORT=3443
USE_HTTPS=true

# Database (if direct access needed)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tutorly_db_prod

# Java API
JAVA_API_URL=https://localhost:8443
JAVA_API_KEY=your-production-api-key

# Session secrets
TUTOR_SESSION_SECRET=your-long-random-secret-here
ADMIN_SESSION_SECRET=your-long-random-secret-here

# SSL
SSL_KEY_PATH=/etc/ssl/private/tutorly-key.pem
SSL_CERT_PATH=/etc/ssl/certs/tutorly-cert.pem
```

### Create Systemd Service

```bash
sudo nano /etc/systemd/system/tutorly-frontend.service
```

```ini
[Unit]
Description=Tutorly Frontend Server
After=network.target tutorly-backend.service
Requires=tutorly-backend.service

[Service]
Type=simple
User=tutorly
WorkingDirectory=/opt/tutorly/frontend
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

# Environment
Environment="NODE_ENV=production"
Environment="PORT=3000"
EnvironmentFile=/opt/tutorly/frontend/.env.production

[Install]
WantedBy=multi-user.target
```

### Deploy Frontend

```bash
# Create directory
sudo mkdir -p /opt/tutorly/frontend

# Copy application files
sudo cp -r Nodejs/* /opt/tutorly/frontend/
sudo chown -R tutorly:tutorly /opt/tutorly/frontend

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable tutorly-frontend
sudo systemctl start tutorly-frontend

# Check status
sudo systemctl status tutorly-frontend
```

---

## SSL/TLS Configuration

### Using Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d tutorly.example.com

# Certificates will be at:
# /etc/letsencrypt/live/tutorly.example.com/fullchain.pem
# /etc/letsencrypt/live/tutorly.example.com/privkey.pem

# Auto-renewal is configured automatically
sudo systemctl status certbot.timer
```

### Convert for Java Backend (PKCS12)

```bash
# Convert PEM to PKCS12 for Java
sudo openssl pkcs12 -export \
  -in /etc/letsencrypt/live/tutorly.example.com/fullchain.pem \
  -inkey /etc/letsencrypt/live/tutorly.example.com/privkey.pem \
  -out /opt/tutorly/backend/keystore.p12 \
  -name tutorly \
  -password pass:your-keystore-password

sudo chown tutorly:tutorly /opt/tutorly/backend/keystore.p12
```

---

## Reverse Proxy Setup

### Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/tutorly
```

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name tutorly.example.com;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tutorly.example.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/tutorly.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tutorly.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/tutorly_access.log;
    error_log /var/log/nginx/tutorly_error.log;

    # Frontend (Node.js)
    location / {
        proxy_pass https://localhost:3443;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass https://localhost:8443/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass https://localhost:3443;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable Site

```bash
# Enable configuration
sudo ln -s /etc/nginx/sites-available/tutorly /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Monitoring and Logging

### System Monitoring

```bash
# Install monitoring tools
sudo apt install -y prometheus grafana node-exporter

# Configure Prometheus
sudo nano /etc/prometheus/prometheus.yml
```

### Application Monitoring

#### Java Backend (Spring Boot Actuator)

Add to `pom.xml`:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

Enable endpoints:
```properties
management.endpoints.web.exposure.include=health,metrics,info
management.endpoint.health.show-details=always
```

#### Log Aggregation

```bash
# Install Logrotate for log management
sudo nano /etc/logrotate.d/tutorly
```

```
/var/log/tutorly/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 tutorly tutorly
    sharedscripts
    postrotate
        systemctl reload tutorly-backend > /dev/null
        systemctl reload tutorly-frontend > /dev/null
    endscript
}
```

---

## Backup and Recovery

### Automated Database Backups

```bash
# Create backup script
sudo nano /opt/tutorly/scripts/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/tutorly/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/tutorly_backup_$TIMESTAMP.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -U tutorly_prod tutorly_db_prod > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### Schedule Backups

```bash
# Make script executable
sudo chmod +x /opt/tutorly/scripts/backup-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
```

```cron
0 2 * * * /opt/tutorly/scripts/backup-db.sh >> /var/log/tutorly/backup.log 2>&1
```

---

## Scaling Strategy

### Vertical Scaling
- Increase server resources (CPU, RAM)
- Optimize database queries and indexes
- Enable caching (Redis)

### Horizontal Scaling
- Multiple frontend servers behind load balancer
- Database replication (master-slave)
- Session storage in Redis for shared sessions

### Load Balancer Configuration (HAProxy Example)

```
frontend http_front
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/tutorly.pem
    default_backend tutorly_servers

backend tutorly_servers
    balance roundrobin
    option httpchk GET /health
    server frontend1 10.0.1.10:3443 check ssl verify none
    server frontend2 10.0.1.11:3443 check ssl verify none
```

---

## CI/CD Pipeline

### GitHub Actions Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Backend
        run: |
          cd Java/backend-api
          mvn clean package -DskipTests
      
      - name: Deploy to Server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          source: "Java/backend-api/target/*.jar,Nodejs/*"
          target: "/tmp/tutorly-deploy"
      
      - name: Restart Services
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            sudo systemctl restart tutorly-backend
            sudo systemctl restart tutorly-frontend
```

---

## Troubleshooting

### Service Not Starting

```bash
# Check service status
sudo systemctl status tutorly-backend
sudo systemctl status tutorly-frontend

# View logs
sudo journalctl -u tutorly-backend -n 100
sudo journalctl -u tutorly-frontend -n 100

# Check port availability
sudo netstat -tulpn | grep :8443
sudo netstat -tulpn | grep :3443
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U tutorly_prod -d tutorly_db_prod -h localhost

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### SSL Certificate Issues

```bash
# Test certificate
openssl s_client -connect tutorly.example.com:443

# Check certificate expiration
sudo certbot certificates

# Renew manually
sudo certbot renew
```

---

**Navigation**  
⬅️ **Previous**: [08_Testing_Guide.md](08_Testing_Guide.md) | **Next**: [10_Contributing_Guide.md](10_Contributing_Guide.md) ➡️  
🏠 **Home**: [Documentation Index](README.md)

---

**Last Updated**: February 25, 2026
