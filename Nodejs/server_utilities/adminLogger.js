/**
 * 
 * ADMIN LOGIN LOGGER
 * 
 * Description: Utility module for logging admin login attempts to file
 * Purpose:
 *   - Track all admin authentication attempts (successful and failed)
 *   - Record timestamp, IP address, username, and status for each attempt
 *   - Write logs to admin_login_attempts.txt for security auditing
 *   - Help identify potential security threats and unauthorized access attempts
 * 
 */

// Node.js file system module for writing to log file
const fs = require('fs');
// Node.js path module for constructing file paths
const path = require('path');

/**
 * Log admin login attempts to file
 * Appends a timestamped log entry to admin_login_attempts.txt with IP, username, and status
 * @param {string} username - Admin username attempting to log in
 * @param {string} ip - Client IP address from request
 * @param {boolean} success - Whether login was successful (true) or failed (false)
 */
function logAdminLoginAttempt(username, ip, success) {
    // Construct path to log file in project root directory
    const logFile = path.join(__dirname, '..', 'admin_login_attempts.txt');
    
    // Generate ISO timestamp for log entry (YYYY-MM-DDTHH:mm:ss.sssZ format)
    const timestamp = new Date().toISOString();
    // Determine status label based on success boolean
    const status = success ? 'SUCCESS' : 'FAILED';
    // Format log entry with timestamp, IP, username, and status
    const logEntry = `[${timestamp}] IP: ${ip} | Username: ${username} | Status: ${status}\n`;
    
    // Append log entry to file (creates file if it doesn't exist)
    fs.appendFile(logFile, logEntry, (err) => {
        if (err) {
            // Log error to console if file write fails (non-blocking)
            console.error('Error writing to admin login log:', err);
        }
    });
}

// Export logger function for use in authentication routes
module.exports = {
    logAdminLoginAttempt
};
