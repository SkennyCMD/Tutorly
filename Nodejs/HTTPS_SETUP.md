# 🔒 HTTPS Setup Guide for Local Development

This guide explains how to enable HTTPS on the Node.js server for local development using self-signed SSL certificates.

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
├── ssl/                          # SSL certificates directory
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

### Certificate Not Found Error

**Problem**: `SSL certificates not found!`

**Solution**:
```bash
cd Nodejs
npm run generate-cert
```

### OpenSSL Not Found

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

### Browser Still Shows HTTP

**Problem**: Browser doesn't redirect to HTTPS

**Solution**: 
1. Check `USE_HTTPS=true` in `.env` or environment
2. Restart the server
3. Clear browser cache
4. Try `https://localhost:3443` directly

### Port Already in Use

**Problem**: `Error: Port 3443 already in use`

**Solution**:
```bash
# Linux/macOS
lsof -ti:3443 | xargs kill -9

# Windows
netstat -ano | findstr :3443
taskkill /PID <PID> /F
```

### Session Cookies Not Working

**Problem**: User gets logged out frequently

**Solution**: 
- If using HTTPS, ensure `secure: true` in session config
- If using HTTP, ensure `secure: false` in session config
- Clear browser cookies and try again

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

**Last Updated**: February 18, 2026  
**Version**: 1.0.0
