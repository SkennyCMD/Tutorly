package com.tutorly.app.backend_api.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.HashSet;
import java.util.Set;

/**
 * API Key Authentication Interceptor
 * 
 * This interceptor validates API keys for all incoming requests to protected endpoints.
 * It checks for the presence of a valid API key in the X-API-Key header.
 * 
 * Valid API keys are configured in application.properties as a comma-separated list:
 * api.security.keys=key1,key2,key3
 * 
 * If the API key is missing or invalid, the request is rejected with HTTP 401 Unauthorized.
 */
@Component
public class ApiKeyInterceptor implements HandlerInterceptor {
    
    // Header name where API key is expected
    private static final String API_KEY_HEADER = "X-API-Key";
    
    // Comma-separated list of valid API keys from application.properties
    @Value("${api.security.keys}")
    private String validApiKeysString;
    
    // Set of valid API keys for fast lookup
    private Set<String> validApiKeys;
    
    /**
     * Intercepts incoming requests before they reach the controller
     * 
     * Validates that the request contains a valid API key in the X-API-Key header.
     * 
     * @param request  The HTTP request
     * @param response The HTTP response
     * @param handler  The handler (controller method) that will process the request
     * @return true if authentication succeeds, false otherwise
     * @throws Exception if an error occurs during processing
     */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Lazy initialization of valid keys set (done only once)
        if (validApiKeys == null) {
            validApiKeys = new HashSet<>();
            for (String key : validApiKeysString.split(",")) {
                validApiKeys.add(key.trim());
            }
        }
        
        // Extract API key from request header
        String requestApiKey = request.getHeader(API_KEY_HEADER);
        
        // Validate API key
        if (requestApiKey == null || !validApiKeys.contains(requestApiKey.trim())) {
            // Authentication failed - return 401 Unauthorized
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Invalid or missing API key\"}\n");
            return false;  // Stop request processing
        }
        
        // Authentication successful - proceed to controller
        return true;
    }
}
