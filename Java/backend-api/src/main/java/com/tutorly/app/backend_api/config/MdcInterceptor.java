package com.tutorly.app.backend_api.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.UUID;

/**
 * Interceptor to generate and attach a traceId to the Mapped Diagnostic Context (MDC)
 * This allows tracking a single request across multiple log entries.
 */
@Component
public class MdcInterceptor implements HandlerInterceptor {

    private static final String TRACE_ID_HEADER = "X-Trace-Id";
    private static final String TRACE_ID_MDC_KEY = "traceId";
    private static final String USER_ID_MDC_KEY = "userId";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Retrieve traceId from the request header if sent by the client/LoadBalancer, 
        // otherwise generate a new UUID.
        String traceId = request.getHeader(TRACE_ID_HEADER);
        if (traceId == null || traceId.isEmpty()) {
            traceId = UUID.randomUUID().toString();
        }
        MDC.put(TRACE_ID_MDC_KEY, traceId);

        // Hypothetical: Check for a user ID header or attribute
        // In a real Spring Security scenario, we would use SecurityContextHolder.
        // For this project, we check an "X-User-Id" header just to showcase the capability.
        String userId = request.getHeader("X-User-Id");
        if (userId != null && !userId.isEmpty()) {
            MDC.put(USER_ID_MDC_KEY, userId);
        } else {
            MDC.put(USER_ID_MDC_KEY, "anonymous");
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        // ALWAYS clean the MDC at the end of the request.
        // Failing to do so can cause memory leaks and thread contamination in the thread pool!
        MDC.clear();
    }
}
