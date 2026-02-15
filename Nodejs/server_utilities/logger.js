/**
 *
 * Application Logger Service
 *
 * 
 * Centralized logging utility with colorized console output and context tracking.
 * 
 * Features:
 * - Color-coded log levels (ERROR, SUCCESS, WARNING, INFO)
 * - Automatic timestamp formatting (ISO 8601)
 * - Client IP address extraction
 * - User context from session (username)
 * - Additional data JSON formatting
 * - Express middleware for request logging
 * 
 * Log Levels:
 * - ERROR (red): Critical errors and exceptions
 * - SUCCESS (green): Successful operations
 * - WARNING (orange): Non-critical issues
 * - INFO (blue): General information
 * 
 * ANSI Color Support:
 * Uses ANSI escape codes for terminal colors. Works in most modern terminals.
 * Colors may not display correctly in some environments (e.g., Windows CMD).
 * 
 * Usage:
 * Import specific logging functions as needed:
 * const { logError, logSuccess, requestLogger } = require('./logger');
 * 
 * @module logger
 *
 */


// ANSI Color Constants


/**
 * ANSI escape codes for terminal colors and text formatting.
 * 
 * Standard colors:
 * - red, green, blue, yellow, cyan, gray: Basic terminal colors
 * - orange: 256-color code (214) for better visibility
 * 
 * Formatting:
 * - bold: Bold text
 * - reset: Reset all formatting to default
 */
const colors = {
    red: '\x1b[31m',         // Error messages
    green: '\x1b[32m',       // Success messages
    orange: '\x1b[38;5;214m', // Warning messages (256-color)
    blue: '\x1b[34m',        // Info messages
    yellow: '\x1b[33m',      // Alternative highlight
    cyan: '\x1b[36m',        // IP and username highlighting
    gray: '\x1b[90m',        // Timestamps and metadata
    reset: '\x1b[0m',        // Reset to default
    bold: '\x1b[1m'          // Bold text
};


// Context Extraction Helpers


/**
 * Extract client IP address from Express request object.
 * 
 * Attempts to get IP from multiple sources:
 * 1. req.ip (Express default, respects X-Forwarded-For if trust proxy is set)
 * 2. req.connection.remoteAddress (direct connection IP)
 * 3. Returns 'unknown' if none available
 * 
 * @param {object} req - Express request object
 * @returns {string} Client IP address (IPv4 or IPv6) or 'N/A'/'unknown'
 * 
 * @example
 * const ip = getClientIp(req);
 * // Returns: '192.168.1.100' or '::1' or 'unknown'
 */
function getClientIp(req) {
    // Handle null/undefined request object
    if (!req) return 'N/A';
    
    // Try Express IP first, then connection remote address
    return req.ip || req.connection?.remoteAddress || 'unknown';
}

/**
 * Extract username from Express session.
 * 
 * Checks both tutor and admin sessions to find authenticated username.
 * Returns 'anonymous' if no session or user is not logged in.
 * 
 * @param {object} req - Express request object with session
 * @returns {string} Username from session or 'anonymous' if not logged in
 * 
 * @example
 * const username = getUsername(req);
 * // Returns: 'mario.rossi' (tutor) or 'admin123' (admin) or 'anonymous'
 */
function getUsername(req) {
    // Handle null/undefined request or missing session
    if (!req || !req.session) return 'anonymous';
    
    // Check tutor session first, then admin session, default to anonymous
    return req.session.username || req.session.adminUsername || 'anonymous';
}


// Log Message Formatting


/**
 * Format a log message with timestamp, level, IP, username, and optional data.
 * 
 * Creates a structured, colorized log message with:
 * - ISO 8601 timestamp for precise timing
 * - Log level (ERROR/SUCCESS/WARNING/INFO) with color coding
 * - Client IP address for security tracking
 * - Username for user-specific context
 * - Additional JSON data (optional) for debugging
 * 
 * @param {string} level - Log level: 'ERROR', 'SUCCESS', 'WARNING', or 'INFO'
 * @param {string} message - Main log message text
 * @param {object} req - Express request object for context (optional)
 * @param {object} data - Additional data object to log as JSON (optional)
 * @returns {string} Formatted, colorized log message
 * 
 * @example
 * const formatted = formatLogMessage('ERROR', 'Failed to save data', req, { error: 'DB timeout' });
 * // Returns: "[2024-09-01T10:30:45.123Z] [ERROR] IP: 192.168.1.100 | User: mario.rossi | Failed to save data
 *             Data: { "error": "DB timeout" }"
 */
function formatLogMessage(level, message, req = null, data = null) {
    // Generate ISO 8601 timestamp
    const timestamp = new Date().toISOString();
    const ip = getClientIp(req);
    const username = getUsername(req);
    
    // Select color based on log level
    let color;
    switch (level) {
        case 'ERROR':
            color = colors.red;
            break;
        case 'SUCCESS':
            color = colors.green;
            break;
        case 'WARNING':
            color = colors.orange;
            break;
        case 'INFO':
            color = colors.blue;
            break;
        default:
            color = colors.reset;
    }
    
    // Build formatted log message with color codes
    let logMessage = `${color}[${timestamp}] [${level}]${colors.reset} ` +
                     `IP: ${colors.cyan}${ip}${colors.reset} | ` +
                     `User: ${colors.cyan}${username}${colors.reset} | ` +
                     `${message}`;
    
    // Append additional data if provided (formatted as indented JSON)
    if (data) {
        logMessage += `\n  ${colors.gray}Data: ${JSON.stringify(data, null, 2)}${colors.reset}`;
    }
    
    return logMessage;
}


// Logging Functions


/**
 * Log an error message (red color, console.error).
 * 
 * Use for critical errors, exceptions, and failures that require attention.
 * Outputs to stderr for proper error stream handling.
 * 
 * @param {string} message - Error description
 * @param {object} req - Express request object for context (optional)
 * @param {object} data - Additional error data (stack trace, error object, etc.) (optional)
 * 
 * @example
 * logError('Database connection failed', req, { error: err.message, stack: err.stack });
 * 
 * @example
 * logError('User authentication failed');
 */
function logError(message, req = null, data = null) {
    console.error(formatLogMessage('ERROR', message, req, data));
}

/**
 * Log a success message (green color, console.log).
 * 
 * Use for successful operations, completed tasks, and positive confirmations.
 * Helps track successful flows and verify expected behavior.
 * 
 * @param {string} message - Success description
 * @param {object} req - Express request object for context (optional)
 * @param {object} data - Additional success data (created resource, response, etc.) (optional)
 * 
 * @example
 * logSuccess('Lesson created successfully', req, { lessonId: 123 });
 * 
 * @example
 * logSuccess('User logged in successfully', req);
 */
function logSuccess(message, req = null, data = null) {
    console.log(formatLogMessage('SUCCESS', message, req, data));
}

/**
 * Log a warning message (orange color, console.warn).
 * 
 * Use for non-critical issues, deprecated features, or situations that
 * don't prevent operation but should be addressed.
 * 
 * @param {string} message - Warning description
 * @param {object} req - Express request object for context (optional)
 * @param {object} data - Additional warning data (deprecated usage, threshold exceeded, etc.) (optional)
 * 
 * @example
 * logWarning('Using deprecated API endpoint', req);
 * 
 * @example
 * logWarning('High memory usage detected', null, { memoryUsage: '85%' });
 */
function logWarning(message, req = null, data = null) {
    console.warn(formatLogMessage('WARNING', message, req, data));
}

/**
 * Log an informational message (blue color, console.log).
 * 
 * Use for general information, status updates, and operational messages
 * that don't indicate success or failure.
 * 
 * @param {string} message - Information description
 * @param {object} req - Express request object for context (optional)
 * @param {object} data - Additional informational data (config, status, etc.) (optional)
 * 
 * @example
 * logInfo('Server started on port 3000', null, { port: 3000, env: 'production' });
 * 
 * @example
 * logInfo('Processing payment', req);
 */
function logInfo(message, req = null, data = null) {
    console.log(formatLogMessage('INFO', message, req, data));
}


// Express Middleware


/**
 * Express middleware to log all incoming HTTP requests.
 * 
 * Automatically logs every request with:
 * - HTTP method (GET, POST, PUT, DELETE, etc.)
 * - Request path/URL
 * - Timestamp
 * - Client IP address
 * - Authenticated username (if logged in)
 * 
 * Useful for:
 * - Debugging request flow
 * - Security monitoring
 * - Performance tracking
 * - Audit logging
 * 
 * Usage:
 * Add to Express app before route handlers:
 * app.use(requestLogger);
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 * 
 * @example
 * // In your Express app setup:
 * const { requestLogger } = require('./server_utilities/logger');
 * app.use(requestLogger);
 * 
 * // Logs every request like:
 * // [2024-09-01T10:30:45.123Z] GET /api/lessons | IP: 192.168.1.100 | User: mario.rossi
 */
function requestLogger(req, res, next) {
    const method = req.method;
    const path = req.path;
    const timestamp = new Date().toISOString();
    const ip = getClientIp(req);
    const username = getUsername(req);
    
    // Log request with gray timestamp, bold method, and cyan context
    console.log(
        `${colors.gray}[${timestamp}] ${colors.bold}${method}${colors.reset} ${path} | ` +
        `IP: ${colors.cyan}${ip}${colors.reset} | ` +
        `User: ${colors.cyan}${username}${colors.reset}`
    );
    
    // Continue to next middleware/route handler
    next();
}


// Module Exports


/**
 * Export logger functions and utilities.
 * 
 * Logging Functions:
 * - logError: Log errors (red, stderr)
 * - logSuccess: Log successful operations (green)
 * - logWarning: Log warnings (orange)
 * - logInfo: Log informational messages (blue)
 * 
 * Middleware:
 * - requestLogger: Express middleware to log all HTTP requests
 * 
 * Utility Functions:
 * - getClientIp: Extract client IP from request
 * - getUsername: Extract username from session
 * 
 * Usage Pattern:
 * All logging functions accept: (message, req, data)
 * - message: Required string message
 * - req: Optional Express request for context
 * - data: Optional object for additional structured data
 * 
 * @example
 * const { logError, logSuccess, requestLogger } = require('./logger');
 * 
 * // Use in routes
 * app.post('/api/lessons', (req, res) => {
 *   try {
 *     // ... create lesson ...
 *     logSuccess('Lesson created', req, { lessonId: newLesson.id });
 *   } catch (error) {
 *     logError('Failed to create lesson', req, { error: error.message });
 *   }
 * });
 */
module.exports = {
    logError,
    logSuccess,
    logWarning,
    logInfo,
    requestLogger,
    getClientIp,
    getUsername
};
