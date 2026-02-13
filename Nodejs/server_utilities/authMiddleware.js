const { fetchTutorData } = require('./javaApiService');

/**
 * Middleware to verify user (tutor) authentication
 */
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

/**
 * Middleware to verify if user is admin
 */
const isAdmin = (req, res, next) => {
    if (req.session && req.session.adminId) {
        return next();
    }
    res.redirect('/adminLogin');
};

/**
 * Middleware to verify if user has STAFF role
 */
const isStaff = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const tutorData = await fetchTutorData(req.session.userId);
        if (tutorData && tutorData.role === 'STAFF') {
            return next();
        }
        return res.status(403).json({ error: 'Access denied. STAFF role required.' });
    } catch (error) {
        console.error('Error verifying STAFF role:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Middleware to verify specific roles
 */
const hasRole = (...roles) => {
    return (req, res, next) => {
        if (!req.session || !req.session.userId) {
            return res.redirect('/login');
        }

        if (roles.includes(req.session.role)) {
            return next();
        }

        res.status(403).json({ 
            error: 'You do not have permission to access this resource' 
        });
    };
};

/**
 * Middleware to verify if user is already authenticated
 */
const isGuest = (req, res, next) => {
    if (req.session && req.session.userId) {
        return res.redirect('/dashboard');
    }
    next();
};

/**
 * Middleware for logging authenticated requests
 */
const logAuthentication = (req, res, next) => {
    if (req.session && req.session.userId) {
        console.log(`[${new Date().toISOString()}] User ${req.session.username} (${req.session.role}) accessed ${req.method} ${req.path}`);
    }
    next();
};

module.exports = {
    isAuthenticated,
    isAdmin,
    isStaff,
    hasRole,
    isGuest,
    logAuthentication
};
