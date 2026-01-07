package com.tutorly.app.backend_api.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Component
public class ApiKeyInterceptor implements HandlerInterceptor {
    
    private static final String API_KEY_HEADER = "X-API-Key";
    
    @Value("${api.security.keys}")
    private String validApiKeysString;
    
    private Set<String> validApiKeys;
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Initialize valid keys set if not done yet
        if (validApiKeys == null) {
            validApiKeys = new HashSet<>();
            for (String key : validApiKeysString.split(",")) {
                validApiKeys.add(key.trim());
            }
        }
        
        String requestApiKey = request.getHeader(API_KEY_HEADER);
        
        if (requestApiKey == null || !validApiKeys.contains(requestApiKey.trim())) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Invalid or missing API key\"}");
            return false;
        }
        
        return true;
    }
}
