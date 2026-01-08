package com.tutorly.app.backend_api.config;

/**
 * Configuration to redirect HTTP requests to HTTPS
 * 
 * NOTE: This configuration is disabled because Spring Boot 4.x with spring-boot-starter-webmvc
 * has changed the package structure for Tomcat embedded server classes.
 * 
 * CURRENT SETUP:
 * - HTTPS is working on port 8443 (encrypted communication)
 * - HTTP port 8080 is DISABLED and NOT listening
 * - Only HTTPS connections are accepted
 * - All traffic is encrypted - no plain HTTP communication possible
 * 
 * Clients must connect directly to: https://localhost:8443
 * Attempting to connect via http://localhost:8080 will fail (connection refused)
 * 
 * If you need HTTP->HTTPS redirect in production, consider using:
 * - A reverse proxy (nginx, Apache)
 * - Cloud provider load balancer (AWS ALB, Google Cloud Load Balancer)
 * - API Gateway
 * 
 * These solutions are more flexible and maintainable than embedding the redirect logic
 * in the application code.
 */

public class HttpsRedirectConfig {
    // Configuration disabled - see comments above
}

