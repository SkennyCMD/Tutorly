/**
 * Middleware per verificare l'autenticazione dell'utente
 */
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

/**
 * Middleware per verificare ruoli specifici
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
            error: 'Non hai i permessi per accedere a questa risorsa' 
        });
    };
};

/**
 * Middleware per verificare se l'utente è già autenticato
 */
const isGuest = (req, res, next) => {
    if (req.session && req.session.userId) {
        return res.redirect('/dashboard');
    }
    next();
};

/**
 * Middleware per logging delle richieste autenticate
 */
const logAuthentication = (req, res, next) => {
    if (req.session && req.session.userId) {
        console.log(`[${new Date().toISOString()}] User ${req.session.username} (${req.session.role}) accessed ${req.method} ${req.path}`);
    }
    next();
};

module.exports = {
    isAuthenticated,
    hasRole,
    isGuest,
    logAuthentication
};
