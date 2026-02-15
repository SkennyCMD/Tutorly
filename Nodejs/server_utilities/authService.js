/**
 *
 * Authentication Service
 *
 * 
 * Provides authentication functions for tutor and admin users.
 * 
 * Features:
 * - Tutor authentication with bcrypt password verification
 * - Admin authentication with bcrypt password verification
 * - Blocked account detection for tutors (BLOCKED status)
 * - Password hash comparison and logging
 * - Legacy Java API authentication (deprecated)
 * 
 * Dependencies:
 * - https: Node.js HTTPS module for Java API calls
 * - passwordService: Password hashing and verification with bcrypt
 * - javaApiService: Java backend API integration for fetching user data
 * 
 * @module authService
 *
 */

const https = require('https');
const { JAVA_API_KEY } = require('./config');
const { verifyPassword, hashPassword } = require('./passwordService');
const { fetchFromJavaAPI } = require('./javaApiService');


// Tutor Authentication


/**
 * Authenticate a tutor with bcrypt password verification.
 * 
 * Fetches tutor data from Java API, checks account status, and verifies password.
 * Returns password hashes for logging and comparison purposes.
 * 
 * @param {string} username - Tutor username to authenticate
 * @param {string} password - Plain text password provided by user
 * @returns {Promise<{tutorId: number, tutorData: object, passwordHash: string, dbHash: string}|null>} 
 *          Tutor data if authenticated, null if authentication fails or user not found
 * 
 * @example
 * const result = await authenticateTutor('mario.rossi', 'password123');
 * if (result && result.tutorId) {
 *   console.log('Tutor authenticated:', result.tutorId);
 * } else if (result?.blocked) {
 *   console.log('Account is blocked');
 * }
 */
async function authenticateTutor(username, password) {
    try {
        // Calculate hash of the attempted password for logging purposes
        const attemptedPasswordHash = await hashPassword(password);

        // Fetch all tutors from Java backend API
        const tutors = await fetchFromJavaAPI('/api/tutors', 'GET');
        const tutor = tutors?.find(t => t.username === username);
        
        // User not found in database
        if (!tutor) {
            return null;
        }

        // Store database hash for comparison and logging
        const dbHash = tutor.password;

        // Check if account is blocked - deny access if status is BLOCKED
        if (tutor.status === 'BLOCKED') {
            return { tutorId: null, tutorData: null, passwordHash: attemptedPasswordHash, dbHash, blocked: true };
        }

        // Verify password using bcrypt comparison
        const isPasswordValid = await verifyPassword(password, tutor.password);
        
        // Password verification failed
        if (!isPasswordValid) {
            return { tutorId: null, tutorData: null, passwordHash: attemptedPasswordHash, dbHash, blocked: false };
        }

        // Authentication successful - return tutor data
        return {
            tutorId: tutor.id,
            tutorData: tutor,
            passwordHash: attemptedPasswordHash,
            dbHash
        };
    } catch (error) {
        console.error('Error authenticating tutor:', error);
        return null;
    }
}


// Admin Authentication


/**
 * Authenticate an admin with bcrypt password verification.
 * 
 * Fetches admin data from Java API and verifies password.
 * Similar to authenticateTutor but without blocked account check.
 * 
 * @param {string} username - Admin username to authenticate
 * @param {string} password - Plain text password provided by user
 * @returns {Promise<{adminId: number, adminData: object, passwordHash: string, dbHash: string}|null>} 
 *          Admin data if authenticated, null if authentication fails or user not found
 * 
 * @example
 * const result = await authenticateAdmin('admin123', 'securePassword');
 * if (result && result.adminId) {
 *   console.log('Admin authenticated:', result.adminId);
 * }
 */
async function authenticateAdmin(username, password) {
    try {
        // Calculate hash of the attempted password for logging purposes
        const attemptedPasswordHash = await hashPassword(password);

        // Fetch all admins from Java backend API
        const admins = await fetchFromJavaAPI('/api/admins', 'GET');
        const admin = admins?.find(a => a.username === username);
        
        // User not found in database
        if (!admin) {
            return null;
        }

        // Store database hash for comparison and logging
        const dbHash = admin.password;

        // Verify password using bcrypt comparison
        const isPasswordValid = await verifyPassword(password, admin.password);
        
        // Password verification failed
        if (!isPasswordValid) {
            return { adminId: null, adminData: null, passwordHash: attemptedPasswordHash, dbHash };
        }

        // Authentication successful - return admin data
        return {
            adminId: admin.id,
            adminData: admin,
            passwordHash: attemptedPasswordHash,
            dbHash
        };
    } catch (error) {
        console.error('Error authenticating admin:', error);
        return null;
    }
}


// Legacy Java API Authentication (DEPRECATED)


/**
 * Authenticate tutor with Java backend API directly (DEPRECATED).
 * 
 * @deprecated This method is deprecated. Use authenticateTutor() instead for bcrypt authentication.
 * 
 * Makes direct HTTPS request to Java backend /api/tutors/login endpoint.
 * Bypasses bcrypt verification and blocked account checks.
 * 
 * @param {string} username - Tutor username
 * @param {string} password - Tutor password
 * @returns {Promise<number|null>} Tutor ID if authenticated, null otherwise
 */
function authenticateTutorWithJavaAPI(username, password) {
    return new Promise((resolve, reject) => {
        // Prepare JSON payload for API request
        const postData = JSON.stringify({
            username: username,
            password: password
        });

        console.log('Java API Call:', {
            url: `https://localhost:8443/api/tutors/login`,
            data: { username, password: '***' }  // Hide password in logs
        });

        // Configure HTTPS request to Java backend
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: '/api/tutors/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'X-API-Key': JAVA_API_KEY  // API key for backend authentication
            },
            rejectUnauthorized: false  // Accept self-signed SSL certificate
        };

        // Make HTTPS request to Java API
        const req = https.request(options, (res) => {
            let data = '';

            console.log('Status Code API Java:', res.statusCode);

            // Accumulate response data chunks
            res.on('data', (chunk) => {
                data += chunk;
            });

            // Process complete response
            res.on('end', () => {
                console.log('Java API Full Response:', data);
                
                try {
                    // Success - parse tutor ID from response
                    if (res.statusCode === 200) {
                        const tutorId = data ? parseInt(data) : null;
                        console.log('Parsed Tutor ID:', tutorId);
                        resolve(tutorId);
                    } else {
                        // Authentication failed
                        console.log('Non-200 status code, returning null');
                        resolve(null);
                    }
                } catch (error) {
                    console.error('Error parsing response:', error);
                    resolve(null);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error calling Java API:', error);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Authenticate admin with Java backend API directly.
 * 
 * Makes direct HTTPS request to Java backend /api/admins/login endpoint.
 * Similar to authenticateTutorWithJavaAPI but for admin users.
 * 
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 * @returns {Promise<number|null>} Admin ID if authenticated, null otherwise
 * 
 * @example
 * const adminId = await authenticateAdminWithJavaAPI('admin123', 'pass');
 */
function authenticateAdminWithJavaAPI(username, password) {
    return new Promise((resolve, reject) => {
        // Prepare JSON payload for admin authentication
        const postData = JSON.stringify({
            username: username,
            password: password
        });

        console.log('Java API Call (Admin):', {
            url: `https://localhost:8443/api/admins/login`,
            data: { username, password: '***' }  // Hide password in logs
        });

        // Configure HTTPS request for admin endpoint
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: '/api/admins/login',  // Admin-specific endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'X-API-Key': JAVA_API_KEY  // API key for backend authentication
            },
            rejectUnauthorized: false  // Accept self-signed SSL certificate
        };

        // Make HTTPS request to Java API
        const req = https.request(options, (res) => {
            let data = '';

            console.log('Status Code API Java (Admin):', res.statusCode);

            // Accumulate response data chunks
            res.on('data', (chunk) => {
                data += chunk;
            });

            // Process complete response
            res.on('end', () => {
                console.log('Java API Full Response (Admin):', data);
                
                try {
                    // Success - parse admin ID from response
                    if (res.statusCode === 200) {
                        const adminId = data ? parseInt(data) : null;
                        console.log('Parsed Admin ID:', adminId);
                        resolve(adminId);
                    } else {
                        // Authentication failed
                        console.log('Non-200 status code, returning null');
                        resolve(null);
                    }
                } catch (error) {
                    console.error('Error parsing response:', error);
                    resolve(null);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error calling Java API (Admin):', error);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}


// Module Exports


/**
 * Export authentication functions
 * 
 * Primary methods:
 * - authenticateTutor: Recommended bcrypt-based tutor authentication
 * - authenticateAdmin: Recommended bcrypt-based admin authentication
 * 
 * Legacy methods (deprecated):
 * - authenticateTutorWithJavaAPI: Direct Java API authentication (bypass bcrypt)
 * - authenticateAdminWithJavaAPI: Direct Java API admin authentication
 */
module.exports = {
    authenticateTutor,
    authenticateAdmin,
    authenticateTutorWithJavaAPI,
    authenticateAdminWithJavaAPI
};
