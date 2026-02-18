# SSL Certificates Directory

This directory contains SSL certificates for local HTTPS development.

## Files

- **private-key.pem** - Private key (keep secret!)
- **certificate.pem** - Public self-signed certificate

## Generation

These certificates were generated using the `generate-ssl-cert.sh` script:

```bash
# From Nodejs directory
npm run generate-cert
```

## Usage

The certificates are automatically loaded when starting the server in HTTPS mode:

```bash
npm run https
```

## Important Notes

⚠️ **These are SELF-SIGNED certificates for DEVELOPMENT ONLY**

- **DO NOT** use these certificates in production
- **DO NOT** commit these files to Git (already in .gitignore)
- Valid for 365 days from generation date
- Browser will show security warnings (expected behavior)

## Regeneration

To regenerate certificates (e.g., after expiration):

```bash
cd ..
npm run generate-cert
```

This will overwrite the existing certificates.

## For Production

For production environments, obtain certificates from a trusted Certificate Authority:
- **Let's Encrypt** (free, automated)
- **DigiCert**, **Comodo**, **GlobalSign** (commercial)

Or use a reverse proxy (Nginx/Apache) to handle SSL termination.

---

**Generated**: Run `openssl x509 -in certificate.pem -noout -dates` to see validity dates
