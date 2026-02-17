/**
 * 
 * AUTHENTICATION MIDDLEWARE
 * 
 * Description: Express middleware functions for authentication and authorization
 * Purpose:
 *   - Protect routes requiring authentication (tutor or admin)
 *   - Enforce role-based access control (STAFF, admin, specific roles)
 *   - Redirect unauthenticated users to appropriate login pages
 *   - Prevent authenticated users from accessing guest-only pages
 *   - Log authenticated user activity for monitoring
 * Dependencies:
 *   - javaApiService: Fetches tutor data from Java backend API
 *   - Express session: Stores user authentication state
 * 
 */

// Import Java API service to fetch tutor data for role verification
const { fetchTutorData } = require('./javaApiService');

/**
 * Middleware to verify user (tutor) authentication
 * Checks if user has an active session with valid userId
 * Use: Protect routes that require tutor login (dashboard, calendar, lessons, etc.)
 * @param {Object} req - Express request object with session
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns Redirects to /login if not authenticated, otherwise calls next()
 */
const isAuthenticated = (req, res, next) => {
    // Check if session exists and contains userId (tutor is logged in)
    if (req.session && req.session.userId) {
        return next(); // User authenticated, proceed to route
    }
    // Not authenticated, redirect to tutor login page
    res.redirect('/login');
};

/**
 * Middleware to verify if user is admin
 * Checks if user has an active admin session with valid adminId
 * Use: Protect admin-only routes (/admin, admin panel features)
 * @param {Object} req - Express request object with session
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns Redirects to /adminLogin if not admin, otherwise calls next()
 */
const isAdmin = (req, res, next) => {
    // Check if session exists and contains adminId (admin is logged in)
    if (req.session && req.session.adminId) {
        return next(); // Admin authenticated, proceed to route
    }
    // Not admin, redirect to admin login page
    res.redirect('/adminLogin');
};

/**
 * Middleware to verify if user has STAFF role
 * Fetches tutor data from Java backend API to verify STAFF role
 * Use: Protect routes requiring STAFF privileges (staff panel, advanced features)
 * @param {Object} req - Express request object with session
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns JSON error if unauthorized/forbidden, otherwise calls next()
 */
const isStaff = async (req, res, next) => {
    // Check if user is authenticated (has active session)
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        // Fetch tutor data from Java backend to get current role
        const tutorData = await fetchTutorData(req.session.userId);
        // Verify tutor has STAFF role
        if (tutorData && tutorData.role === 'STAFF') {
            return next(); // STAFF role confirmed, proceed to route
        }
        // User authenticated but not STAFF, deny access
        return res.status(403).json({ error: 'Access denied. STAFF role required.' });
    } catch (error) {
        // API call failed, log error and return server error
        console.error('Error verifying STAFF role:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Middleware factory to verify specific roles
 * Creates a middleware that checks if user has one of the specified roles
 * Use: Flexible role-based access control (e.g., hasRole('admin', 'STAFF'))
 * @param {...string} roles - Variable number of role names to check
 * @returns {Function} Express middleware function for role verification
 */
const hasRole = (...roles) => {
    return (req, res, next) => {
        // Check if user is authenticated
        if (!req.session || !req.session.userId) {
            return res.redirect('/login');
        }

        // Check if user's role matches any of the allowed roles
        if (roles.includes(req.session.role)) {
            return next(); // Role authorized, proceed to route
        }

        // User authenticated but doesn't have required role
        res.status(403).json({ 
            error: 'You do not have permission to access this resource' 
        });
    };
};

/**
 * Middleware to verify if user is a guest (not authenticated)
 * Prevents authenticated users from accessing guest-only pages
 * Use: Protect login/register pages from authenticated users
 * @param {Object} req - Express request object with session
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns Redirects to /home if authenticated, otherwise calls next()
 */
const isGuest = (req, res, next) => {
    // Check if user is already authenticated
    if (req.session && req.session.userId) {
        return res.redirect('/home'); // Already logged in, redirect to dashboard
    }
    next(); // Not authenticated, proceed to guest page (login/register)
};

/**
 * Middleware for logging authenticated user requests
 * Logs timestamp, username, role, HTTP method, and path for monitoring
 * Use: Activity tracking and debugging (apply globally or to specific routes)
 * @param {Object} req - Express request object with session
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns Always calls next() (non-blocking logging)
 */
const logAuthentication = (req, res, next) => {
    // Only log if user is authenticated
    if (req.session && req.session.userId) {
        // Log ISO timestamp, username, role, HTTP method, and request path
        console.log(`[${new Date().toISOString()}] User ${req.session.username} (${req.session.role}) accessed ${req.method} ${req.path}`);
    }
    next(); // Continue to next middleware/route (non-blocking)
};

// Export all authentication middleware functions for use in route handlers
module.exports = {
    isAuthenticated,   // Verify tutor login
    isAdmin,           // Verify admin login
    isStaff,           // Verify STAFF role (async, queries Java API)
    hasRole,           // Verify specific role(s) - middleware factory
    isGuest,           // Verify user is NOT authenticated
    logAuthentication  // Log authenticated user activity
};
