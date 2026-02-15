/**
 *
 * Password Service
 *
 * 
 * Secure password hashing and verification service using bcrypt.
 * 
 * Features:
 * - Password hashing with configurable salt rounds
 * - Secure password verification against stored hashes
 * - Authentication attempt logging with colorized output
 * - Hash comparison logging for debugging
 * 
 * Security:
 * - Uses bcrypt algorithm (Blowfish cipher based)
 * - Salt rounds: 10 (2^10 = 1024 iterations)
 * - One-way hashing - cannot reverse hash to get password
 * - Timing-safe comparison to prevent timing attacks
 * 
 * Dependencies:
 * - bcrypt: Industry-standard password hashing library
 * 
 * Best Practices:
 * - Never log plain text passwords
 * - Store only hashed passwords in database
 * - Use verifyPassword for authentication, not manual comparison
 * - Increase salt rounds (e.g., 12) for higher security needs
 * 
 * @module passwordService
 *
 */

const bcrypt = require('bcrypt');


// ANSI Color Constants


/**
 * ANSI escape codes for colorized console logging.
 * Used in authentication attempt logs for visual clarity.
 */
const colors = {
    orange: '\x1b[38;5;214m',  // Information and metadata
    red: '\x1b[31m',           // Failed authentication
    green: '\x1b[32m',         // Successful authentication
    reset: '\x1b[0m'           // Reset to default
};


// Password Hashing and Verification


/**
 * Hash a plain text password using bcrypt.
 * 
 * Generates a secure one-way hash using the Blowfish cipher.
 * The resulting hash includes the salt, so no separate salt storage is needed.
 * 
 * Salt Rounds: 10 (2^10 = 1024 iterations)
 * - Higher values = more secure but slower
 * - 10 rounds is a good balance for most applications
 * - Consider 12+ for high-security applications
 * 
 * @param {string} password - Plain text password to hash (any length)
 * @returns {Promise<string>} Bcrypt hash string (60 characters, includes salt)
 * 
 * @example
 * const hash = await hashPassword('mySecurePassword123');
 * // Returns: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
 * // Format: $2b$[rounds]$[22-char salt][31-char hash]
 * 
 * @example
 * // Store hash in database (never store plain password)
 * const hashedPassword = await hashPassword(req.body.password);
 * await db.users.update({ password: hashedPassword });
 */
async function hashPassword(password) {
    // Salt rounds: number of times to apply the hash function
    // 10 rounds = 2^10 = 1024 iterations (good performance/security balance)
    const saltRounds = 10;
    
    // bcrypt.hash automatically generates a random salt and includes it in the output
    return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a plain text password against a bcrypt hash.
 * 
 * Uses timing-safe comparison to prevent timing attacks.
 * The hash includes the salt, so it's extracted automatically during comparison.
 * 
 * Security:
 * - Constant-time comparison (prevents timing attacks)
 * - Extracts salt from hash automatically
 * - No risk of hash collision due to bcrypt properties
 * 
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Bcrypt hash from database (60 characters)
 * @returns {Promise<boolean>} True if password matches hash, false otherwise
 * 
 * @example
 * // Authentication flow
 * const isValid = await verifyPassword(
 *   req.body.password,      // User's input: 'mySecurePassword123'
 *   user.hashedPassword     // From DB: '$2b$10$N9qo8uLO...'
 * );
 * if (isValid) {
 *   // Grant access
 * } else {
 *   // Deny access
 * }
 * 
 * @example
 * // Returns false for wrong password
 * const result = await verifyPassword('wrongPassword', storedHash);
 * // result === false
 */
async function verifyPassword(password, hash) {
    // bcrypt.compare performs timing-safe comparison
    // Extracts salt from hash and compares after hashing the input password
    return await bcrypt.compare(password, hash);
}


// Authentication Logging


/**
 * Log authentication attempts with colorized console output.
 * 
 * Provides detailed logging for security monitoring and debugging.
 * Includes optional hash comparison for troubleshooting authentication issues.
 * 
 * Use Cases:
 * - Security monitoring: Track failed login attempts
 * - Debugging: Compare attempted vs. stored hashes
 * - Audit logging: Record all authentication attempts
 * - Attack detection: Identify brute force attempts by IP
 * 
 * Colors:
 * - Green: Successful authentication
 * - Red: Failed authentication
 * - Orange: Metadata (timestamp, IP, username)
 * 
 * @param {string} type - Authentication type: 'tutor' or 'admin'
 * @param {string} username - Username attempting to authenticate
 * @param {string} ip - Client IP address for security tracking
 * @param {boolean} success - True if authentication succeeded, false if failed
 * @param {string} attemptedHash - Hash of password attempted by user (optional, for debugging)
 * @param {string} dbHash - Hash stored in database (optional, for comparison)
 * 
 * @example
 * // Successful tutor login
 * logAuthAttempt('tutor', 'mario.rossi', '192.168.1.100', true);
 * // Output: [2024-09-01T10:30:45.123Z] TUTOR LOGIN ATTEMPT | IP: 192.168.1.100 | Username: mario.rossi | Status: SUCCESS
 * 
 * @example
 * // Failed login with hash comparison for debugging
 * logAuthAttempt(
 *   'admin',
 *   'admin123',
 *   '192.168.1.100',
 *   false,
 *   attemptedPasswordHash,  // What the user tried
 *   storedDatabaseHash      // What's in the database
 * );
 * // Outputs attempted hash vs. database hash for comparison
 */
function logAuthAttempt(type, username, ip, success, attemptedHash = null, dbHash = null) {
    const timestamp = new Date().toISOString();
    const status = success ? 'SUCCESS' : 'FAILED';
    const statusColor = success ? colors.green : colors.red;
    
    // Build base log message with timestamp, type, IP, username, and status
    let logMessage = 
        `${colors.orange}[${timestamp}] ${type.toUpperCase()} LOGIN ATTEMPT${colors.reset} | ` +
        `IP: ${colors.orange}${ip}${colors.reset} | ` +
        `Username: ${colors.orange}${username}${colors.reset} | ` +
        `Status: ${statusColor}${status}${colors.reset}`;
    
    // Append attempted hash for debugging (shows what user tried to authenticate with)
    if (attemptedHash) {
        const hashPreview = attemptedHash.length > 25 
            ? `${attemptedHash}`  // Show full hash
            : attemptedHash;
        logMessage += `\n  ${colors.orange}Attempted Hash:${colors.reset} ${hashPreview}`;
    }
    
    // Append database hash for comparison (shows what's stored in DB)
    if (dbHash) {
        const dbHashPreview = dbHash.length > 25 
            ? `${dbHash}`  // Show full hash
            : dbHash;
        logMessage += `\n  ${colors.orange}Database Hash: ${colors.reset} ${dbHashPreview}`;
    }
    
    // Output to console for monitoring
    console.log(logMessage);
}


// Module Exports


/**
 * Export password service functions.
 * 
 * Core Functions:
 * - hashPassword: Create bcrypt hash from plain text password (for registration)
 * - verifyPassword: Verify plain text password against stored hash (for login)
 * - logAuthAttempt: Log authentication attempts with colored output (for monitoring)
 * 
 * Typical Authentication Flow:
 * 1. Registration:
 *    const hash = await hashPassword(plainPassword);
 *    await db.save({ username, password: hash });
 * 
 * 2. Login:
 *    const user = await db.findByUsername(username);
 *    const isValid = await verifyPassword(plainPassword, user.password);
 *    logAuthAttempt('tutor', username, req.ip, isValid);
 *    if (isValid) { grant access }
 * 
 * Security Notes:
 * - Never log plain text passwords
 * - Always use hashPassword for storing passwords
 * - Always use verifyPassword for checking passwords
 * - Never compare hashes manually (timing attacks)
 */
module.exports = {
    hashPassword,
    verifyPassword,
    logAuthAttempt
};
