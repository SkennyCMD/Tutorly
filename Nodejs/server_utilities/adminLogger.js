const fs = require('fs');
const path = require('path');

/**
 * Log admin login attempts to file
 * @param {string} username - Admin username
 * @param {string} ip - Client IP address
 * @param {boolean} success - Whether login was successful
 */
function logAdminLoginAttempt(username, ip, success) {
    const logFile = path.join(__dirname, '..', 'admin_login_attempts.txt');
    
    const timestamp = new Date().toISOString();
    const status = success ? 'SUCCESS' : 'FAILED';
    const logEntry = `[${timestamp}] IP: ${ip} | Username: ${username} | Status: ${status}\n`;
    
    fs.appendFile(logFile, logEntry, (err) => {
        if (err) {
            console.error('Error writing to admin login log:', err);
        }
    });
}

module.exports = {
    logAdminLoginAttempt
};
