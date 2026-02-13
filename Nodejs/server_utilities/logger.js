// ANSI color codes for console logging
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    orange: '\x1b[38;5;214m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

/**
 * Extract IP address from request
 * @param {object} req - Express request object
 * @returns {string} IP address
 */
function getClientIp(req) {
    if (!req) return 'N/A';
    return req.ip || req.connection?.remoteAddress || 'unknown';
}

/**
 * Get username from request session
 * @param {object} req - Express request object
 * @returns {string} Username or 'anonymous' if not logged in
 */
function getUsername(req) {
    if (!req || !req.session) return 'anonymous';
    return req.session.username || req.session.adminUsername || 'anonymous';
}

/**
 * Format log message with timestamp, IP, and user
 * @param {string} level - Log level (ERROR, SUCCESS, WARNING, INFO)
 * @param {string} message - Log message
 * @param {object} req - Express request object (optional)
 * @param {object} data - Additional data to log (optional)
 * @returns {string} Formatted log message
 */
function formatLogMessage(level, message, req = null, data = null) {
    const timestamp = new Date().toISOString();
    const ip = getClientIp(req);
    const username = getUsername(req);
    
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
    
    let logMessage = `${color}[${timestamp}] [${level}]${colors.reset} ` +
                     `IP: ${colors.cyan}${ip}${colors.reset} | ` +
                     `User: ${colors.cyan}${username}${colors.reset} | ` +
                     `${message}`;
    
    // Add additional data if provided
    if (data) {
        logMessage += `\n  ${colors.gray}Data: ${JSON.stringify(data, null, 2)}${colors.reset}`;
    }
    
    return logMessage;
}

/**
 * Log error message (red)
 * @param {string} message - Error message
 * @param {object} req - Express request object (optional)
 * @param {object} data - Additional error data (optional)
 */
function logError(message, req = null, data = null) {
    console.error(formatLogMessage('ERROR', message, req, data));
}

/**
 * Log success message (green)
 * @param {string} message - Success message
 * @param {object} req - Express request object (optional)
 * @param {object} data - Additional data (optional)
 */
function logSuccess(message, req = null, data = null) {
    console.log(formatLogMessage('SUCCESS', message, req, data));
}

/**
 * Log warning message (orange)
 * @param {string} message - Warning message
 * @param {object} req - Express request object (optional)
 * @param {object} data - Additional data (optional)
 */
function logWarning(message, req = null, data = null) {
    console.warn(formatLogMessage('WARNING', message, req, data));
}

/**
 * Log info message (blue)
 * @param {string} message - Info message
 * @param {object} req - Express request object (optional)
 * @param {object} data - Additional data (optional)
 */
function logInfo(message, req = null, data = null) {
    console.log(formatLogMessage('INFO', message, req, data));
}

/**
 * Middleware to log all incoming requests
 */
function requestLogger(req, res, next) {
    const method = req.method;
    const path = req.path;
    const timestamp = new Date().toISOString();
    const ip = getClientIp(req);
    const username = getUsername(req);
    
    console.log(
        `${colors.gray}[${timestamp}] ${colors.bold}${method}${colors.reset} ${path} | ` +
        `IP: ${colors.cyan}${ip}${colors.reset} | ` +
        `User: ${colors.cyan}${username}${colors.reset}`
    );
    
    next();
}

module.exports = {
    logError,
    logSuccess,
    logWarning,
    logInfo,
    requestLogger,
    getClientIp,
    getUsername
};
