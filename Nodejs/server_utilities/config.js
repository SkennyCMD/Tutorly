/**
 *
 * Application Configuration
 *
 * 
 * Central configuration file for the Tutorly Node.js application.
 * Contains all environment-specific settings and constants.
 * 
 * Configuration Sections:
 * - Java Backend API: Connection settings for Java Spring Boot backend
 * - Server: Node.js Express server configuration
 * - Session Management: Session secrets and duration settings for auth
 * 
 * Security Notes:
 * - Change all secret keys in production environments
 * - Use environment variables for sensitive data in production
 * - API key is used for authenticating requests to Java backend
 * 
 * @module config
 *
 */

module.exports = {
    
    // Java Backend API Configuration
    
    
    /**
     * Base URL for Java Spring Boot backend API
     * Uses HTTPS on port 8443 with self-signed certificate
     */
    JAVA_API_URL: 'https://localhost:8443',
    
    /**
     * API key for authenticating requests to Java backend
     * Sent in X-API-Key header for all API calls
     * WARNING: Change this value in production
     */
    JAVA_API_KEY: 'MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu',
    
    
    // Server Configuration
    
    
    /**
     * Express server port (HTTP)
     * Defaults to 3000 if PORT environment variable is not set
     */
    PORT: process.env.PORT || 3000,
    
    /**
     * HTTPS server port
     * Defaults to 3443 if HTTPS_PORT environment variable is not set
     */
    HTTPS_PORT: process.env.HTTPS_PORT || 3443,
    
    /**
     * Enable HTTPS mode
     * Set to 'true' to enable HTTPS with self-signed certificates
     * Requires SSL certificates in ssl/ directory
     */
    USE_HTTPS: process.env.USE_HTTPS === 'true' || false,
    
    /**
     * SSL Certificate paths
     * Paths relative to project root for SSL certificate files
     */
    SSL_KEY_PATH: process.env.SSL_KEY_PATH || './ssl/private-key.pem',
    SSL_CERT_PATH: process.env.SSL_CERT_PATH || './ssl/certificate.pem',
    
    
    // Session Configuration
    
    
    /**
     * Secret key for signing tutor session cookies
     * Used by express-session to sign and verify session IDs
     * WARNING: Change this value in production
     */
    TUTOR_SESSION_SECRET: 'tutorly-tutor-secret-key-change-in-production',
    
    /**
     * Secret key for signing admin session cookies
     * Separate secret for admin sessions for additional security
     * WARNING: Change this value in production
     */
    ADMIN_SESSION_SECRET: 'tutorly-admin-secret-key-change-in-production',
    
    
    // Session Duration Settings
    
    
    /**
     * Tutor session duration in milliseconds
     * Default: 30 days (1000ms * 60s * 60m * 24h * 30d)
     * Longer duration for convenience since tutors use the system frequently
     */
    TUTOR_SESSION_DURATION: 1000 * 60 * 60 * 24 * 30, // 30 days
    
    /**
     * Admin session duration in milliseconds
     * Default: 1 hour (1000ms * 60s * 60m)
     * Shorter duration for security since admins have elevated privileges
     */
    ADMIN_SESSION_DURATION: 1000 * 60 * 60 * 1 // 1 hour
};
