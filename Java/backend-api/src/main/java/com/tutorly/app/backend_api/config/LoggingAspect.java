package com.tutorly.app.backend_api.config;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

/**
 * Aspect for centralized method logging.
 * Logs method entry, exit, and execution time for Controllers and Services.
 */
@Aspect
@Component
@Slf4j
public class LoggingAspect {

    // Target all public methods in RestControllers and Services
    @Pointcut("within(@org.springframework.web.bind.annotation.RestController *) " +
              "|| within(@org.springframework.stereotype.Service *)")
    public void springBeanPointcut() {
        // Pointcut definition
    }

    @Around("springBeanPointcut()")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getSignature().getDeclaringTypeName();
        String methodName = joinPoint.getSignature().getName();

        // Check isDebugEnabled to prevent unnecessary string evaluations
        if (log.isDebugEnabled()) {
            Object[] args = joinPoint.getArgs();
            // Sanitize potential sensitive data like passwords or tokens
            Object[] sanitizedArgs = new Object[args.length];
            for (int i = 0; i < args.length; i++) {
                if (args[i] != null && args[i].toString().toLowerCase().contains("password")) {
                    sanitizedArgs[i] = "[PROTECTED]";
                } else {
                    sanitizedArgs[i] = args[i];
                }
            }
            log.debug("Entering method: {}.{}() with arguments: {}", className, methodName, sanitizedArgs);
        }

        long start = System.currentTimeMillis();
        try {
            Object result = joinPoint.proceed();
            long elapsedTime = System.currentTimeMillis() - start;

            if (log.isDebugEnabled()) {
                log.debug("Exiting method: {}.{}() successfully. Time taken: {} ms. Result: {}",
                        className, methodName, elapsedTime, result);
            }
            return result;
        } catch (IllegalArgumentException e) {
            log.error("Illegal argument passed to: {}.{}(): {}", className, methodName, e.getMessage());
            throw e;
        } catch (Exception e) {
            long elapsedTime = System.currentTimeMillis() - start;
            // Catching any exception thrown by the method, logging time and standard error message
            log.error("Exception in {}.{}() after {} ms. Error: {}", className, methodName, elapsedTime, e.getMessage());
            throw e;
        }
    }
}
