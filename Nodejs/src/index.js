const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Session configuration
app.use(session({
    secret: 'tutorly-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        httpOnly: true,
        secure: false // Set to true in production with HTTPS
    }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Mock database - In production, use a real database
const users = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@tutorly.com',
        password: '$2b$10$8kZqhQxVXYvR5EJ5YhZN3.RJBY7qXy2GZXzqwM6IqYGjXLqRIqK6G', // password: admin123
        role: 'admin'
    },
    {
        id: 2,
        username: 'student',
        email: 'student@tutorly.com',
        password: '$2b$10$8kZqhQxVXYvR5EJ5YhZN3.RJBY7qXy2GZXzqwM6IqYGjXLqRIqK6G', // password: admin123
        role: 'student'
    }
];

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

// Routes
app.get('/', (req, res) => {
    if (req.session && req.session.userId) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by username or email
        const user = users.find(u => u.username === username || u.email === username);

        if (!user) {
            return res.render('login', { error: 'Username o password errati' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.render('login', { error: 'Username o password errati' });
        }

        // Create session
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'Errore durante il login' });
    }
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', {
        username: req.session.username,
        role: req.session.role
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login');
    });
});

// API endpoint to check authentication status
app.get('/api/auth/status', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({
            authenticated: true,
            user: {
                id: req.session.userId,
                username: req.session.username,
                role: req.session.role
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server Tutorly in esecuzione su http://localhost:${PORT}`);
    console.log(`📝 Accedi con: admin / admin123 o student / admin123`);
});

module.exports = app;
