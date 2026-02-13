const bcrypt = require('bcrypt');

// ANSI color codes for console logging
const colors = {
    orange: '\x1b[38;5;214m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    reset: '\x1b[0m'
};

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password from database
 * @returns {Promise<boolean>} True if password matches, false otherwise
 */
async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

/**
 * Log authentication attempt with colored output
 * @param {string} type - Type of authentication ('tutor' or 'admin')
 * @param {string} username - Username attempting to authenticate
 * @param {string} ip - IP address of the request
 * @param {boolean} success - Whether authentication was successful
 * @param {string} attemptedHash - Optional: hash of the password attempted by user
 * @param {string} dbHash - Optional: hash stored in database for comparison
 */
function logAuthAttempt(type, username, ip, success, attemptedHash = null, dbHash = null) {
    const timestamp = new Date().toISOString();
    const status = success ? 'SUCCESS' : 'FAILED';
    const statusColor = success ? colors.green : colors.red;
    
    let logMessage = 
        `${colors.orange}[${timestamp}] ${type.toUpperCase()} LOGIN ATTEMPT${colors.reset} | ` +
        `IP: ${colors.orange}${ip}${colors.reset} | ` +
        `Username: ${colors.orange}${username}${colors.reset} | ` +
        `Status: ${statusColor}${status}${colors.reset}`;
    
    // Add attempted hash information if provided
    if (attemptedHash) {
        const hashPreview = attemptedHash.length > 25 
            ? `${attemptedHash}`
            : attemptedHash;
        logMessage += `\n  ${colors.orange}Attempted Hash:${colors.reset} ${hashPreview}`;
    }
    
    // Add database hash for comparison if provided
    if (dbHash) {
        const dbHashPreview = dbHash.length > 25 
            ? `${dbHash}`
            : dbHash;
        logMessage += `\n  ${colors.orange}Database Hash: ${colors.reset} ${dbHashPreview}`;
    }
    
    console.log(logMessage);
}

module.exports = {
    hashPassword,
    verifyPassword,
    logAuthAttempt
};
