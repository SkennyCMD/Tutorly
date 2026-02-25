# 🔒 HTTPS Setup Guide for Local Development

This guide explains how to enable HTTPS on the Node.js server for local development using self-signed SSL certificates.

---

**Document**: 04_HTTPS_Setup_Guide.md  
**Last Updated**: February 25, 2026  
**Version**: 1.0.0  
**Author**: Tutorly Development Team  

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Testing HTTPS](#testing-https)
- [Project Structure](#project-structure)
- [Security Notes](#security-notes)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)
- [Summary](#summary)
- [Production Setup with CA-Signed Certificates](#production-setup-with-ca-signed-certificates)
- [Checklist](#checklist)

---

## 📋 Prerequisites

- **OpenSSL** installed on your system
  ```bash
  # Check if OpenSSL is installed
  openssl version
  
  # Install if needed:
  # Ubuntu/Debian:
  sudo apt install openssl

  # Fedora:
  sudo dnf install openssl
  
  # macOS (usually pre-installed):
  brew install openssl
  ```

---

## 🚀 Quick Start

### 1. Generate SSL Certificates

```bash
cd Nodejs
npm run generate-cert
```

This will create:
- `ssl/private-key.pem` - Private key
- `ssl/certificate.pem` - Public certificate

The certificates are valid for **365 days**.

### 2. Start HTTPS Server

```bash
# Production mode with HTTPS
npm run https

# Development mode with HTTPS and auto-reload
npm run dev:https
```

The server will run on:
- **HTTPS**: `https://localhost:3443`
- **HTTP**: `http://localhost:3000` (redirects to HTTPS)

### 3. Access in Browser

1. Open `https://localhost:3443` in your browser
2. You'll see a security warning (**this is expected for self-signed certificates**)
3. Click **"Advanced"** or **"Show details"**
4. Click **"Proceed to localhost (unsafe)"** or similar option

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file (or use `.env.example` as template):

```bash
# Copy example file
cp .env.example .env
```

Edit `.env`:

```env
# Enable HTTPS
USE_HTTPS=true

# HTTPS port (default: 3443)
HTTPS_PORT=3443

# HTTP port for redirect (default: 3000)
PORT=3000

# Certificate paths (relative to Nodejs directory)
SSL_KEY_PATH=./ssl/private-key.pem
SSL_CERT_PATH=./ssl/certificate.pem
```

### Manual Configuration

You can also set environment variables directly:

```bash
# Linux/macOS
USE_HTTPS=true HTTPS_PORT=3443 node src/index.js

# Windows (PowerShell)
$env:USE_HTTPS="true"; $env:HTTPS_PORT="3443"; node src/index.js

# Windows (CMD)
set USE_HTTPS=true && set HTTPS_PORT=3443 && node src/index.js
```

---

## 🧪 Testing HTTPS

### Test with curl

```bash
# Test HTTPS (ignore self-signed certificate warning)
curl -k https://localhost:3443

# Test HTTP redirect
curl -I http://localhost:3000
# Should return: HTTP/1.1 301 Moved Permanently
```

### Test Certificate Details

```bash
# View certificate information
openssl s_client -connect localhost:3443 -showcerts
```

### Test in Different Browsers

- **Chrome/Edge**: Advanced → Proceed to localhost
- **Firefox**: Advanced → Accept the Risk and Continue
- **Safari**: Show Details → Visit This Website

---

## 📁 Project Structure

```
Nodejs/
├── ssl/                         # SSL certificates directory
│   ├── private-key.pem          # Private key (gitignored)
│   └── certificate.pem          # Public certificate (gitignored)
├── generate-ssl-cert.sh         # Certificate generation script
├── .env.example                 # Environment variables template
├── .env                         # Your local environment variables (gitignored)
└── src/
    └── index.js                 # Server with HTTPS support
```

---

## 🔐 Security Notes

### For Development

- ✅ Self-signed certificates are **perfect for local development**
- ✅ Certificates are automatically **ignored by Git** (see `.gitignore`)
- ⚠️ Browser warnings are **expected and normal**
- ⚠️ **Never commit** certificate files to version control

### For Production

**Self-signed certificates are NOT suitable for production!**

For production, use certificates from a trusted Certificate Authority:

1. **Let's Encrypt** (Free)
   ```bash
   # Install Certbot
   sudo apt install certbot
   
   # Generate certificate
   sudo certbot certonly --standalone -d yourdomain.com
   ```

2. **Commercial CAs**
   - DigiCert
   - Comodo/Sectigo
   - GlobalSign
   - GoDaddy

3. **Reverse Proxy** (Recommended)
   - Use **Nginx** or **Apache** as reverse proxy
   - Handle SSL/TLS termination at proxy level
   - Keep Node.js app on HTTP internally

---

## 🛠️ Troubleshooting

> **📖 For common issues**, see [00_Project_Overview.md - Troubleshooting](00_Project_Overview.md#troubleshooting)

### HTTPS-Specific Issues

#### Certificate Not Found Error

**Problem**: `SSL certificates not found!`

**Solution**:
```bash
cd Nodejs
npm run generate-cert
```

---

#### OpenSSL Not Found

**Problem**: `openssl: command not found`

**Solution**: Install OpenSSL
```bash
# Ubuntu/Debian
sudo apt install openssl

# macOS
brew install openssl

# Windows
# Download from: https://slproweb.com/products/Win32OpenSSL.html
```

---

#### Browser Doesn't Redirect to HTTPS

**Problem**: Browser still shows HTTP

**Solution**: 
1. Check `USE_HTTPS=true` in `.env` or environment
2. Restart the server
3. Clear browser cache
4. Try `https://localhost:3443` directly

---

## 📚 Additional Resources

### Using mkcert (No Browser Warnings!)

**mkcert** creates locally-trusted certificates:

```bash
# Install mkcert
# Ubuntu/Debian
sudo apt install libnss3-tools
wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert-v1.4.4-linux-amd64
sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert

# Install local CA
mkcert -install

# Generate certificates
cd Nodejs/ssl
mkcert localhost 127.0.0.1 ::1

# Rename files
mv localhost+2-key.pem private-key.pem
mv localhost+2.pem certificate.pem
```

**Advantage**: ✅ **No browser warnings!**

### Nginx Reverse Proxy

For production-like setup:

```nginx
server {
    listen 80;
    server_name localhost;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name localhost;

    ssl_certificate /path/to/certificate.pem;
    ssl_certificate_key /path/to/private-key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🎯 Summary

| Command | Description |
|---------|-------------|
| `npm run generate-cert` | Generate self-signed SSL certificates |
| `npm run https` | Start server in HTTPS mode |
| `npm run dev:https` | Start server in HTTPS mode with auto-reload |
| `npm start` | Start server in HTTP mode (default) |
| `npm run dev` | Start server in HTTP mode with auto-reload |

**Default URLs:**
- HTTP: `http://localhost:3000` → Redirects to HTTPS
- HTTPS: `https://localhost:3443` 

---

## 🚀 Production Setup with CA-Signed Certificates

For production environments, you **must** use certificates issued by a trusted Certificate Authority (CA). Self-signed certificates will show browser warnings and are not suitable for public-facing websites.

---

### Option 1: Let's Encrypt (Free & Automated)

**Let's Encrypt** provides free SSL certificates with automatic renewal.

#### Step 1: Install Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot

# Fedora/RHEL
sudo dnf install certbot

# macOS
brew install certbot
```

#### Step 2: Obtain Certificate

**Method A: Standalone (requires port 80/443 temporarily free)**

```bash
# Stop your servers temporarily
sudo systemctl stop tutorly-frontend
sudo systemctl stop tutorly-backend

# Generate certificate
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email your-email@example.com \
  --agree-tos

# Restart servers
sudo systemctl start tutorly-frontend
sudo systemctl start tutorly-backend
```

**Method B: Webroot (with running server)**

```bash
# If you have a web server running
sudo certbot certonly --webroot \
  -w /var/www/html \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email your-email@example.com \
  --agree-tos
```

#### Step 3: Certificate Locations

Certbot stores certificates in `/etc/letsencrypt/live/yourdomain.com/`:

```bash
# Certificate files
/etc/letsencrypt/live/yourdomain.com/
├── fullchain.pem       # Complete certificate chain (use this for certificate)
├── privkey.pem         # Private key
├── chain.pem           # Intermediate certificates (CA bundle)
└── cert.pem            # Your domain certificate only
```

#### Step 4: Configure Node.js for Let's Encrypt

**Update `server_utilities/config.js`:**

```javascript
module.exports = {
  // ..existing config...
  
  // Production SSL paths (Let's Encrypt)
  SSL_KEY_PATH: process.env.SSL_KEY_PATH || '/etc/letsencrypt/live/yourdomain.com/privkey.pem',
  SSL_CERT_PATH: process.env.SSL_CERT_PATH || '/etc/letsencrypt/live/yourdomain.com/fullchain.pem',
  SSL_CA_PATH: process.env.SSL_CA_PATH || '/etc/letsencrypt/live/yourdomain.com/chain.pem',
  
  // Use standard HTTPS port in production
  HTTPS_PORT: process.env.HTTPS_PORT || 443,
  PORT: process.env.PORT || 80,
  
  // ..existing config..
};
```

**Update `.env` for production:**

```env
NODE_ENV=production
USE_HTTPS=true
PORT=80
HTTPS_PORT=443

# Let's Encrypt certificate paths
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_CA_PATH=/etc/letsencrypt/live/yourdomain.com/chain.pem
```

#### Step 5: Set Permissions

```bash
# Let's Encrypt files are only readable by root
# Add your user to ssl-cert group
sudo usermod -a -G ssl-cert $USER

# Set proper permissions
sudo chmod 755 /etc/letsencrypt/live
sudo chmod 755 /etc/letsencrypt/archive

# Allow Node.js to bind to port 443 (< 1024)
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```

#### Step 6: Configure Automatic Renewal

Let's Encrypt certificates expire after **90 days**. Set up automatic renewal:

```bash
# Test renewal (dry run)
sudo certbot renew --dry-run

# Certbot automatically creates a cron job/systemd timer
# Check renewal timer status
sudo systemctl status certbot.timer
```

**Create post-renewal hook** to restart services:

```bash
# Create hook script
sudo nano /etc/letsencrypt/renewal-hooks/post/restart-tutorly.sh
```

**Content:**

```bash
#!/bin/bash

# Restart Node.js frontend
systemctl restart tutorly-frontend

# Convert and restart Java backend
openssl pkcs12 -export \
  -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem \
  -inkey /etc/letsencrypt/live/yourdomain.com/privkey.pem \
  -out /path/to/Java/backend-api/src/main/resources/keystore.p12 \
  -name tutorly \
  -password pass:YourStrongPassword

systemctl restart tutorly-backend

echo "✅ Tutorly services restarted after SSL renewal - $(date)"
```

```bash
# Make executable
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/restart-tutorly.sh

# Test manual renewal
sudo certbot renew --force-renewal
```

---

### Option 2: Commercial CA Certificates

If you purchase from DigiCert, Comodo, GoDaddy, etc.:

#### Step 1: Receive Certificate Files

You'll typically receive:
- `yourdomain.com.crt` - Your domain certificate
- `yourdomain.com.key` - Private key (may be generated by you)
- `ca-bundle.crt` - Intermediate certificates (CA chain)

#### Step 2: Install Certificates

```bash
# Create secure directory
sudo mkdir -p /etc/ssl/tutorly
sudo chmod 700 /etc/ssl/tutorly

# Copy certificates
sudo cp yourdomain.com.crt /etc/ssl/tutorly/certificate.pem
sudo cp yourdomain.com.key /etc/ssl/tutorly/private-key.pem
sudo cp ca-bundle.crt /etc/ssl/tutorly/ca-bundle.pem

# Set permissions
sudo chmod 600 /etc/ssl/tutorly/private-key.pem
sudo chmod 644 /etc/ssl/tutorly/certificate.pem
sudo chmod 644 /etc/ssl/tutorly/ca-bundle.pem
```

#### Step 3: Configure Node.js

**Update `.env`:**

```env
USE_HTTPS=true
HTTPS_PORT=443
PORT=80

SSL_KEY_PATH=/etc/ssl/tutorly/private-key.pem
SSL_CERT_PATH=/etc/ssl/tutorly/certificate.pem
SSL_CA_PATH=/etc/ssl/tutorly/ca-bundle.pem
```

---

### Configure Java Backend with CA-Signed Certificates

Java requires certificates in **PKCS12** or **JKS** format.

#### Step 1: Convert to PKCS12

```bash
# Using Let's Encrypt certificates
sudo openssl pkcs12 -export \
  -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem \
  -inkey /etc/letsencrypt/live/yourdomain.com/privkey.pem \
  -out keystore.p12 \
  -name tutorly \
  -password pass:YourStrongPassword

# Copy to Java resources
sudo cp keystore.p12 /path/to/Java/backend-api/src/main/resources/
sudo chmod 600 /path/to/Java/backend-api/src/main/resources/keystore.p12
```

#### Step 2: Update Java Configuration

**Edit `application.properties`:**

```properties
# Server Configuration
server.port=8443
server.ssl.enabled=true

# CA-Signed Certificate (PKCS12)
server.ssl.key-store=classpath:keystore.p12
server.ssl.key-store-password=YourStrongPassword
server.ssl.key-store-type=PKCS12
server.ssl.key-alias=tutorly

# TLS Protocol Configuration
server.ssl.protocol=TLS
server.ssl.enabled-protocols=TLSv1.2,TLSv1.3

# Secure Cipher Suites
server.ssl.ciphers=TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256
```

---

### Update Node.js Code for CA-Signed Certificates

**Important**: Remove `rejectUnauthorized: false` for production!

**Edit `server_utilities/javaApiService.js`:**

```javascript
const https = require('https');
const config = require('./config');

// HTTPS Agent for CA-signed certificates
const httpsAgent = new https.Agent({
  // ❌ REMOVE THIS in production with CA-signed certificates:
  // rejectUnauthorized: false,  
  
  // ✅ For CA-signed certificates (production):
  rejectUnauthorized: true,
  
  keepAlive: true,
  maxSockets: 50
});

// ..rest of code..
```

**Update `src/index.js` to load CA bundle:**

```javascript
function loadSSLCertificates() {
  try {
    const keyPath = path.resolve(config.SSL_KEY_PATH);
    const certPath = path.resolve(config.SSL_CERT_PATH);
    const caPath = path.resolve(config.SSL_CA_PATH);

    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      logError('SSL certificates not found!');
      return null;
    }

    const sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };

    // Add CA bundle for CA-signed certificates
    if (fs.existsSync(caPath)) {
      sslOptions.ca = fs.readFileSync(caPath);
      logInfo('✅ CA bundle loaded (production certificates)');
    }

    return sslOptions;
  } catch (error) {
    logError(`Error loading SSL certificates: ${error.message}`);
    return null;
  }
}
```

---

### Using Reverse Proxy (Recommended for Production)

For production, it's **highly recommended** to use **Nginx** or **Apache** as a reverse proxy to handle SSL termination.

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/tutorly

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;

    # SSL Configuration (Mozilla Modern)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;

    # SSL Session
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logs
    access_log /var/log/nginx/tutorly-access.log;
    error_log /var/log/nginx/tutorly-error.log;

    # Proxy to Node.js Frontend (can now run on HTTP internally)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static files (optional optimization)
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

**Enable and test:**

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/tutorly /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Enable automatic start
sudo systemctl enable nginx
```

**Benefits of Reverse Proxy:**
- ✅ Centralized SSL management
- ✅ Better performance (static file caching)
- ✅ Load balancing capability
- ✅ DDoS protection
- ✅ Rate limiting
- ✅ Node.js can run on HTTP internally (simpler)

**With Nginx, update Node.js `.env`:**

```env
# Node.js runs on HTTP internally, Nginx handles HTTPS
USE_HTTPS=false
PORT=3000

# Java Backend can still use HTTPS
JAVA_API_URL=https://localhost:8443
```

---

### Firewall Configuration

```bash
# Open HTTP and HTTPS ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8443/tcp  # Java Backend

# If using Nginx reverse proxy, restrict direct access to Node.js
sudo ufw deny 3000/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

### SSL Testing and Verification

#### Test Certificate Chain

```bash
# Test SSL connection
openssl s_client -connect yourdomain.com:443 -showcerts

# Check certificate expiry
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | \
  openssl x509 -noout -dates

# Verify certificate chain
openssl s_client -connect yourdomain.com:443 -CApath /etc/ssl/certs

# Check with curl (should NOT need -k flag)
curl -I https://yourdomain.com
```

#### Online SSL Testing

- **[SSL Labs](https://www.ssllabs.com/ssltest/)** - Comprehensive SSL/TLS analysis
- **[SSL Checker](https://www.sslshopper.com/ssl-checker.html)** - Certificate validation
- **[Security Headers](https://securityheaders.com/)** - Security header analysis

---

### Production Checklist for CA-Signed Certificates

#### Node.js Frontend
- [ ] CA-signed certificates obtained (Let's Encrypt or commercial)
- [ ] Certificates installed in `/etc/letsencrypt/live/` or `/etc/ssl/tutorly/`
- [ ] `USE_HTTPS=true` and ports set to 80/443
- [ ] `rejectUnauthorized: false` **REMOVED** from `javaApiService.js`
- [ ] CA bundle loaded in `loadSSLCertificates()` function
- [ ] Session cookies `secure` flag enabled
- [ ] Automatic certificate renewal configured (Let's Encrypt)
- [ ] Post-renewal hooks set up for service restart
- [ ] Firewall rules configured (80, 443, 8443)
- [ ] Node.js has permission to bind to port 443 (`setcap`)

#### Java Backend
- [ ] Certificates converted to PKCS12 format
- [ ] `keystore.p12` in `src/main/resources/`
- [ ] `application.properties` updated with keystore path
- [ ] TLS 1.2/1.3 enabled, secure cipher suites configured
- [ ] Backend accessible on port 8443

#### Reverse Proxy (if using Nginx)
- [ ] Nginx installed and configured
- [ ] SSL certificates configured in Nginx
- [ ] Proxy headers properly set
- [ ] Security headers enabled (HSTS, X-Frame-Options, etc.)
- [ ] HTTP → HTTPS redirect working
- [ ] Static file caching configured
- [ ] Nginx auto-start enabled

#### Testing
- [ ] No browser security warnings
- [ ] Certificate shows padlock icon in browser
- [ ] Certificate CN/SAN matches domain
- [ ] Certificate chain is complete
- [ ] All pages load over HTTPS
- [ ] Mixed content warnings resolved
- [ ] SSL Labs test shows A/A+ rating
- [ ] HSTS header present
- [ ] Auto-renewal tested (dry-run)

---

### Monitoring & Maintenance

#### Certificate Expiry Monitoring

```bash
# Check certificate expiry
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | \
  openssl x509 -noout -enddate

# Get days until expiry
certbot certificates
```

**Set up monitoring alerts:**

```bash
# Create monitoring script
sudo nano /usr/local/bin/check-ssl-expiry.sh
```

```bash
#!/bin/bash

DOMAIN="yourdomain.com"
WARN_DAYS=30
EMAIL="your-email@example.com"

# Get expiry date
EXPIRY=$(echo | openssl s_client -connect $DOMAIN:443 2>/dev/null | \
  openssl x509 -noout -enddate | cut -d= -f2)

EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

if [ $DAYS_LEFT -lt $WARN_DAYS ]; then
  echo "WARNING: SSL certificate for $DOMAIN expires in $DAYS_LEFT days!" | \
    mail -s "SSL Certificate Expiring Soon" $EMAIL
fi
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/check-ssl-expiry.sh

# Add to crontab (check daily at 9 AM)
sudo crontab -e
# Add line:
0 9 * * * /usr/local/bin/check-ssl-expiry.sh
```

---

### Troubleshooting CA-Signed Certificates

#### Certificate Chain Issues

**Problem**: Browser shows "NET::ERR_CERT_AUTHORITY_INVALID"

**Solution**: Missing intermediate certificates

```bash
# Verify chain is complete
openssl s_client -connect yourdomain.com:443 -showcerts

# Should show 2-3 certificates (domain + intermediates)
# If only 1 certificate, add CA bundle
```

#### Port Permission Denied

**Problem**: `Error: listen EACCES: permission denied 0.0.0.0:443`

**Solution**:

```bash
# Allow Node.js to bind to privileged ports
sudo setcap 'cap_net_bind_service=+ep' $(which node)

# Verify
getcap $(which node)
# Should show: cap_net_bind_service+ep
```

#### Certificate Not Trusted

**Problem**: `unable to verify the first certificate`

**Solution**: Update system CA certificates

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install ca-certificates
sudo update-ca-certificates

# Fedora/RHEL
sudo dnf install ca-certificates
sudo update-ca-trust
```

---

## ✅ Checklist

Before starting development with HTTPS:

- [ ] OpenSSL is installed
- [ ] Generated SSL certificates (`npm run generate-cert`)
- [ ] Set `USE_HTTPS=true` in `.env` or environment
- [ ] Certificates are in `Nodejs/ssl/` directory
- [ ] Started server with `npm run https`
- [ ] Accessed `https://localhost:3443` and accepted security warning
- [ ] Verified session cookies are working

---

**Navigation**  
⬅️ **Previous**: [03_Nodejs_Frontend.md](03_Nodejs_Frontend.md) | **Next**: [05_Service_Modules.md](05_Service_Modules.md) ➡️  
🏠 **Home**: [Documentation Index](README.md)

---

**Last Updated**: February 25, 2026  