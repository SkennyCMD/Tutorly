package com.tutorly.app.backend_api.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC Configuration for the Tutorly API
 * 
 * This class configures:
 * - API key authentication interceptor for all /api/** endpoints
 * - CORS (Cross-Origin Resource Sharing) policies for cross-domain requests
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Autowired
    private ApiKeyInterceptor apiKeyInterceptor;
    
    /**
     * Register interceptors to handle incoming requests
     * 
     * Adds the API key interceptor to validate authentication on all /api/** endpoints.
     * All requests to /api/** must include a valid X-API-Key header.
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(apiKeyInterceptor)
                .addPathPatterns("/api/**");
    }
    
    /**
     * Configure CORS (Cross-Origin Resource Sharing) settings
     * 
     * Current configuration:
     * - Allows requests from any origin (*)
     * - Allows HTTP methods: GET, POST, PUT, DELETE, OPTIONS
     * - Allows all headers
     * 
     * WARNING: Allowing all origins (*) is suitable for development only.
     * In production, restrict to specific trusted domains for security.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")  // TODO: In production, replace with specific domains
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
