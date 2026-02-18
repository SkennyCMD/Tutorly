#!/bin/bash

#-------------------------------------------------------------------------------------
# SSL Certificate Generator for Local Development
#-------------------------------------------------------------------------------------
# 
# This script generates self-signed SSL certificates for HTTPS testing
# during local development. These certificates are NOT suitable for production.
#
# Usage:
#   ./generate-ssl-cert.sh
#
# Generated Files:
#   - ssl/private-key.pem  (Private key)
#   - ssl/certificate.pem  (Public certificate)
#
# Note: Browsers will show a security warning for self-signed certificates.
#       This is expected behavior for development. Click "Advanced" -> "Proceed"
#       to access your local HTTPS server.
#
# For production, use certificates from a trusted Certificate Authority
# (e.g., Let's Encrypt, DigiCert, Comodo).
#
#-------------------------------------------------------------------------------------

# Configuration
SSL_DIR="./ssl"
DAYS=365
COUNTRY="IT"
STATE="Sardinia"
CITY="Cagliari"
ORG="Tutorly"
OU="Development"
CN="localhost"

echo "----------------------------------------------"
echo "SSL Certificate Generator"
echo "----------------------------------------------"
echo ""
echo "Generating self-signed certificate for local HTTPS development..."
echo ""

# Create SSL directory if it doesn't exist
if [ ! -d "$SSL_DIR" ]; then
    mkdir -p "$SSL_DIR"
    echo "Created directory: $SSL_DIR"
fi

# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 \
  -keyout "$SSL_DIR/private-key.pem" \
  -out "$SSL_DIR/certificate.pem" \
  -days $DAYS \
  -nodes \
  -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/OU=$OU/CN=$CN"

# Check if generation was successful
if [ $? -eq 0 ]; then
    # Set correct permissions
    chmod 600 "$SSL_DIR/private-key.pem"
    chmod 644 "$SSL_DIR/certificate.pem"
    
    echo ""
    echo "----------------------------------------------"
    echo "Certificate generated successfully!"
    echo "----------------------------------------------"
    echo ""
    echo "Location: $SSL_DIR/"
    echo "Private Key: private-key.pem"
    echo "Certificate: certificate.pem"
    echo "Valid for: $DAYS days"
    echo ""
    echo "----------------------------------------------"
    echo "IMPORTANT NOTES"
    echo "----------------------------------------------"
    echo ""
    echo "1. This is a SELF-SIGNED certificate for development only"
    echo "2. Browsers will show a security warning (this is expected)"
    echo "3. To proceed in browser:"
    echo "   - Click 'Advanced' or 'Show details'"
    echo "   - Click 'Proceed to localhost (unsafe)' or similar"
    echo ""
    echo "4. To start the HTTPS server:"
    echo "   npm run https"
    echo ""
    echo "5. Access your app at:"
    echo "   https://localhost:3443"
    echo ""
    echo "----------------------------------------------"
    echo "Ready to use HTTPS in development!"
    echo "----------------------------------------------"
else
    echo ""
    echo "Error: Failed to generate certificate"
    echo "Please check that OpenSSL is installed:"
    echo "  openssl version"
    exit 1
fi
