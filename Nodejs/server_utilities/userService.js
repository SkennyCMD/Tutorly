/**
 *
 * User Service (Mock Implementation)
 *
 * 
 * Mock user management service with in-memory user storage.
 * 
 * WARNING: This is a MOCK implementation for development/testing.
 * In production, this should be replaced with a real database implementation.
 * 
 * Features:
 * - Password hashing with bcrypt
 * - Password verification
 * - User lookup by username, email, or ID
 * - Mock user database with admin, student, and tutor roles
 * 
 * Mock Users:
 * - admin (admin@tutorly.com) - password: admin123
 * - student (student@tutorly.com) - password: admin123
 * - tutor (tutor@tutorly.com) - password: admin123
 * 
 * Production TODO:
 * - Replace in-memory users array with PostgreSQL/MongoDB queries
 * - Add user registration/creation functions
 * - Add password reset functionality
 * - Add user update/delete operations
 * - Add proper validation and error handling
 * - Store users in actual database with proper indexing
 * 
 * Security:
 * - All passwords are hashed with bcrypt (salt rounds: 10)
 * - getAllUsers() strips password field before returning
 * 
 * Dependencies:
 * - bcrypt: Password hashing library
 * 
 * @module userService
 *
 */

const bcrypt = require('bcrypt');


// Password Management


/**
 * Generate bcrypt hash from plain text password.
 * 
 * Used for creating password hashes during user registration.
 * Uses 10 salt rounds (2^10 = 1024 iterations) for good security/performance balance.
 * 
 * @param {string} password - Plain text password to hash
 * @returns {Promise<string>} Bcrypt hash string (60 characters)
 * 
 * @example
 * const hash = await hashPassword('myPassword123');
 * // Returns: '$2b$10$abc...xyz' (60 char bcrypt hash)
 */
async function hashPassword(password) {
    const saltRounds = 10;  // 2^10 = 1024 iterations
    return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify plain text password against bcrypt hash.
 * 
 * Used for authentication during login.
 * Performs timing-safe comparison to prevent timing attacks.
 * 
 * @param {string} password - Plain text password to verify
 * @param {string} hashedPassword - Bcrypt hash from database
 * @returns {Promise<boolean>} True if password matches, false otherwise
 * 
 * @example
 * const isValid = await verifyPassword('myPassword123', user.password);
 * if (isValid) {
 *   // Login successful
 * }
 */
async function verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}


// Mock User Database


/**
 * In-memory mock user database.
 * 
 * WARNING: This is for DEVELOPMENT/TESTING ONLY.
 * In production, replace with actual database queries (PostgreSQL, MongoDB, etc.)
 * 
 * Mock Users:
 * 1. Admin: username='admin', email='admin@tutorly.com', password='admin123'
 * 2. Student: username='student', email='student@tutorly.com', password='admin123'
 * 3. Tutor: username='tutor', email='tutor@tutorly.com', password='admin123'
 * 
 * All passwords are pre-hashed with bcrypt (hash shown below).
 * The plain text password for all users is: 'admin123'
 * 
 * Fields:
 * - id: Unique user identifier
 * - username: Unique username for login
 * - email: User's email address (also can be used for login)
 * - password: Bcrypt hash of the password
 * - role: User role (admin, student, tutor)
 * - firstName: User's first name
 * - lastName: User's last name
 */
const users = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@tutorly.com',
        password: '$2b$10$8kZqhQxVXYvR5EJ5YhZN3.RJBY7qXy2GZXzqwM6IqYGjXLqRIqK6G', // admin123
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User'
    },
    {
        id: 2,
        username: 'student',
        email: 'student@tutorly.com',
        password: '$2b$10$8kZqhQxVXYvR5EJ5YhZN3.RJBY7qXy2GZXzqwM6IqYGjXLqRIqK6G', // admin123
        role: 'student',
        firstName: 'Mario',
        lastName: 'Rossi'
    },
    {
        id: 3,
        username: 'tutor',
        email: 'tutor@tutorly.com',
        password: '$2b$10$8kZqhQxVXYvR5EJ5YhZN3.RJBY7qXy2GZXzqwM6IqYGjXLqRIqK6G', // admin123
        role: 'tutor',
        firstName: 'Giulia',
        lastName: 'Bianchi'
    }
];


// User Query Functions


/**
 * Find a user by username or email.
 * 
 * Searches the mock user database for a matching username OR email.
 * Useful for authentication where user can log in with either.
 * 
 * @param {string} username - Username or email to search for
 * @returns {object|undefined} User object if found, undefined if not found
 * 
 * @example
 * // Search by username
 * const user = findUserByUsername('admin');
 * // Returns: { id: 1, username: 'admin', ... }
 * 
 * @example
 * // Search by email
 * const user = findUserByUsername('admin@tutorly.com');
 * // Returns: { id: 1, username: 'admin', email: 'admin@tutorly.com', ... }
 * 
 * @example
 * // User not found
 * const user = findUserByUsername('nonexistent');
 * // Returns: undefined
 */
function findUserByUsername(username) {
    // Search by username OR email (flexible login)
    return users.find(u => u.username === username || u.email === username);
}

/**
 * Find a user by their unique ID.
 * 
 * Used for looking up user details after authentication,
 * or for fetching user information from session.
 * 
 * @param {number} id - Unique user ID
 * @returns {object|undefined} User object if found, undefined if not found
 * 
 * @example
 * const user = findUserById(1);
 * // Returns: { id: 1, username: 'admin', ... }
 * 
 * @example
 * const user = findUserById(999);
 * // Returns: undefined
 */
function findUserById(id) {
    return users.find(u => u.id === id);
}

/**
 * Get all users without password fields.
 * 
 * Returns a list of all users with password field removed for security.
 * Useful for admin panels, user lists, or any public-facing user data.
 * 
 * Security:
 * - Password hashes are stripped before returning
 * - Safe to send to client-side without exposing credentials
 * 
 * @returns {Array<object>} Array of user objects without password fields
 * 
 * @example
 * const users = getAllUsers();
 * // Returns: [
 * //   { id: 1, username: 'admin', email: 'admin@tutorly.com', role: 'admin', ... },
 * //   { id: 2, username: 'student', ... },
 * //   { id: 3, username: 'tutor', ... }
 * // ]
 * // Note: password field is NOT included
 */
function getAllUsers() {
    // Use destructuring to remove password field from each user
    return users.map(({ password, ...user }) => user);
}


// Module Exports


/**
 * Export user service functions.
 * 
 * Password Functions:
 * - hashPassword: Create bcrypt hash (for registration)
 * - verifyPassword: Verify password against hash (for login)
 * 
 * User Query Functions:
 * - findUserByUsername: Find user by username OR email
 * - findUserById: Find user by ID
 * - getAllUsers: Get all users without passwords (safe for client)
 * 
 * Data:
 * - users: Raw users array (includes passwords - use carefully!)
 * 
 * Typical Authentication Flow:
 * 1. User submits login form with username and password
 * 2. const user = findUserByUsername(username);
 * 3. if (!user) return 'User not found';
 * 4. const isValid = await verifyPassword(password, user.password);
 * 5. if (isValid) { // Authentication successful }
 * 
 * WARNING:
 * This is a MOCK service. In production:
 * - Replace users array with database queries
 * - Add user CRUD operations (create, update, delete)
 * - Add proper validation and error handling
 * - Use actual database transactions
 */
module.exports = {
    hashPassword,
    verifyPassword,
    findUserByUsername,
    findUserById,
    getAllUsers,
    users  // Export for direct access (be careful with passwords!)
};
