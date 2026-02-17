/**
 * Tutorly - Main Server Application
 * 
 * Express.js server for managing tutoring sessions, lessons, and student data.
 * Communicates with a Java Backend API for data persistence.
 * Features:
 * - Dual authentication (tutors and admins)
 * - Session management with bcrypt password hashing
 * - Role-based access control (STAFF, GENERIC, ADMIN)
 * - Comprehensive logging system with color-coded output
 * - Excel report generation
 * - RESTful API endpoints
 */

//------------------------------------------------------------------------------------------------------
// DEPENDENCIES
const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const https = require('https');
const fs = require('fs');

// Excel generation utilities
const { generateLessonsExcel, generateStudentsLessonsExcel, generateTutorMonthlyReport } = require('../server_utilities/excel');

// Admin logging utilities
const { logAdminLoginAttempt } = require('../server_utilities/adminLogger');

// Authentication services
const { authenticateTutor, authenticateAdmin } = require('../server_utilities/authService');
const { isAuthenticated, isAdmin, isStaff } = require('../server_utilities/authMiddleware');
const { hashPassword, logAuthAttempt } = require('../server_utilities/passwordService');

// Logging utilities
const { logError, logSuccess, logWarning, logInfo, requestLogger } = require('../server_utilities/logger');
// Java API communication services
const { 
    fetchFromJavaAPI,
    fetchTutorData,
    fetchCalendarNotesByTutor,
    fetchCalendarNotesByDateRange,
    fetchLessonsByTutor,
    fetchAllLessons,
    fetchAllPrenotations,
    fetchPrenotationsByTutor,
    fetchStudentData,
    fetchAllStudents
} = require('../server_utilities/javaApiService');

// Configuration constants
const { 
    JAVA_API_URL, 
    JAVA_API_KEY, 
    PORT, 
    TUTOR_SESSION_SECRET, 
    ADMIN_SESSION_SECRET,
    TUTOR_SESSION_DURATION,
    ADMIN_SESSION_DURATION
} = require('../server_utilities/config');

//------------------------------------------------------------------------------------------------------
// EXPRESS APP INITIALIZATION 
const app = express();

//------------------------------------------------------------------------------------------------------
// MIDDLEWARE CONFIGURATION 
// Parse JSON request bodies
app.use(express.json());
// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));
// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, '../public')));

//------------------------------------------------------------------------------------------------------
// SESSION MANAGEMENT
// Unified session configuration for both tutors and admins
// Uses the same session store to allow proper username tracking in logs
const sessionMiddleware = session({
    name: 'tutorly.sid',
    secret: TUTOR_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: TUTOR_SESSION_DURATION, // 30 days - longer duration for tutors
        httpOnly: true,                  // Prevent XSS attacks
        secure: false                    // Set to true in production with HTTPS
    }
});

// Apply session middleware globally to make req.session available everywhere
app.use(sessionMiddleware);

// Request logging middleware (must be after session middleware to access req.session)
app.use(requestLogger);

// Keep references for backward compatibility with existing route definitions
const tutorSession = (req, res, next) => next();
const adminSession = (req, res, next) => next();

//------------------------------------------------------------------------------------------------------
// VIEW ENGINE SETUP
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

//------------------------------------------------------------------------------------------------------
// !!! ROUTES  !!!

// !! PUBLIC ROUTES !!

/**
 * Root route - Redirect to home if authenticated, otherwise to login
 */
app.get('/', tutorSession, (req, res) => {
    if (req.session && req.session.userId) {
        res.redirect('/home');
    } else {
        res.redirect('/login');
    }
});

/**
 * Tutor login page
 * GET /login - Display login form
 */
app.get('/login', tutorSession, (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/home');
    }
    res.render('login', { error: null });
});

/**
 * Admin login page
 * GET /adminLogin - Display admin login form
 */
app.get('/adminLogin', adminSession, (req, res) => {
    if (req.session && req.session.adminId) {
        return res.redirect('/admin');
    }
    res.render('adminLogin', { error: null });
});

/**
 * Admin login authentication
 * POST /adminLogin - Authenticate admin credentials with bcrypt
 * Logs all authentication attempts with hashes for debugging
 */
app.post('/adminLogin', adminSession, async (req, res) => {
    const { username, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    try {
        // Authenticate admin with bcrypt password verification
        const authResult = await authenticateAdmin(username, password);

        if (authResult === null) {
            logAuthAttempt('admin', username, clientIp, false, null, null);
            logAdminLoginAttempt(username, clientIp, false);
            return res.render('adminLogin', { error: 'Username or password incorrect' });
        }

        if (!authResult.adminId) {
            // Password incorrect - show both hashes for comparison
            logAuthAttempt('admin', username, clientIp, false, authResult.passwordHash, authResult.dbHash);
            logAdminLoginAttempt(username, clientIp, false);
            return res.render('adminLogin', { error: 'Username or password incorrect' });
        }

        // Create session with admin data
        req.session.adminId = authResult.adminId;
        req.session.adminUsername = username;
        req.session.role = 'admin';

        logAuthAttempt('admin', username, clientIp, true, authResult.passwordHash, authResult.dbHash);
        logAdminLoginAttempt(username, clientIp, true);
        logSuccess(`Admin login successful: ${username}`, req);
        res.redirect('/admin');
    } catch (error) {
        logError(`Admin login error for ${username}: ${error.message}`, req, { error: error.stack });
        logAuthAttempt('admin', username, clientIp, false, null, null);
        logAdminLoginAttempt(username, clientIp, false);
        res.render('adminLogin', { error: 'Error during login. Please ensure the Java server is running.' });
    }
});

/**
 * Admin dashboard
 * GET /admin - Display admin panel (requires admin authentication)
 */
app.get('/admin', adminSession, isAdmin, (req, res) => {
    res.render('admin', { 
        adminUsername: req.session.adminUsername,
        adminId: req.session.adminId
    });
});

/**
 * Tutor logout
 * GET /logout - Destroy tutor session and redirect to login
 */
app.get('/logout', tutorSession, (req, res) => {
    const username = req.session?.username || 'unknown';
    req.session.destroy((err) => {
        if (err) {
            logError(`Error destroying tutor session for ${username}: ${err.message}`, req);
        } else {
            logInfo(`Tutor logged out: ${username}`, req);
        }
        res.redirect('/login');
    });
});

/**
 * Admin logout
 * GET /adminLogout - Destroy admin session and redirect to admin login
 */
app.get('/adminLogout', adminSession, (req, res) => {
    const username = req.session?.adminUsername || 'unknown';
    req.session.destroy((err) => {
        if (err) {
            logError(`Error destroying admin session for ${username}: ${err.message}`, req);
        } else {
            logInfo(`Admin logged out: ${username}`, req);
        }
        res.redirect('/adminLogin');
    });
});

/**
 * Tutor login authentication
 * POST /login - Authenticate tutor credentials with bcrypt
 * Checks for blocked accounts and logs all authentication attempts
 */
app.post('/login', tutorSession, async (req, res) => {
    const { username, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    try {
        // Authenticate tutor with bcrypt password verification
        const authResult = await authenticateTutor(username, password);

        if (authResult === null) {
            logAuthAttempt('tutor', username, clientIp, false, null, null);
            return res.render('login', { error: 'Username or password incorrect' });
        }

        if (!authResult.tutorId) {
            // Check if account is blocked
            if (authResult.blocked) {
                logAuthAttempt('tutor', username, clientIp, false, authResult.passwordHash, authResult.dbHash);
                return res.render('login', { error: 'Account is blocked. Contact administrator.' });
            }
            // Password incorrect - show both hashes for comparison
            logAuthAttempt('tutor', username, clientIp, false, authResult.passwordHash, authResult.dbHash);
            return res.render('login', { error: 'Username or password incorrect' });
        }

        // Create session with tutor data
        req.session.userId = authResult.tutorId;
        req.session.username = username;
        req.session.role = authResult.tutorData.role.toLowerCase();

        logAuthAttempt('tutor', username, clientIp, true, authResult.passwordHash, authResult.dbHash);
        logSuccess(`Tutor login successful: ${username}`, req);
        res.redirect('/home');
    } catch (error) {
        logError(`Login error for tutor ${username}: ${error.message}`, req, { error: error.stack });
        logAuthAttempt('tutor', username, clientIp, false, null, null);
        res.render('login', { error: 'Error during login. Please ensure the Java server is running.' });
    }
});

// !! AUTHENTICATED TUTOR ROUTES !!

/**
 * Home dashboard
 * GET /home - Display tutor's home page with today's lessons and tasks
 * Shows: calendar notes (tasks), lessons, prenotations, and students
 */
app.get('/home', tutorSession, isAuthenticated, async (req, res) => {
    try {
        const tutorId = req.session.userId;
        const userRole = req.session.role; 
        
        // Fetch tutor data to get the role
        const tutorData = await fetchTutorData(tutorId);
        const isStaff = tutorData && tutorData.role === 'STAFF';
        
        // Get today's date range
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        const startTime = startOfDay.toISOString().slice(0, 19);
        const endTime = endOfDay.toISOString().slice(0, 19);
        
        // Fetch tasks (calendar notes)
        let calendarNotes = [];
        if (isStaff) {
            calendarNotes = await fetchCalendarNotesByDateRange(startTime, endTime);
        } else {
            const allNotes = await fetchCalendarNotesByTutor(tutorId);
            calendarNotes = allNotes.filter(note => {
                const noteStart = new Date(note.startTime);
                return noteStart >= startOfDay && noteStart <= endOfDay;
            });
        }
        
        const tasks = calendarNotes.map(note => ({
            id: note.id,
            text: note.description || 'No description',
            completed: false,
            startTime: note.startTime,
            endTime: note.endTime
        }));
        
        // Fetch lessons, prenotations and students
        const [allLessons, allPrenotations, students] = await Promise.all([
            fetchAllLessons(),
            fetchAllPrenotations(),
            fetchAllStudents()
        ]);
        
        const lessons = allLessons.filter(lesson => lesson.tutorId === tutorId);
        const prenotations = allPrenotations.filter(prenotation => prenotation.tutorId === tutorId);
        
        // Filter to only today's lessons and fetch student data
        const todayLessonsPromises = lessons.filter(lesson => {
            const lessonStart = new Date(lesson.startTime);
            return lessonStart >= startOfDay && lessonStart <= endOfDay;
        }).map(async lesson => {
            const studentId = lesson.studentId;
            const student = studentId ? await fetchStudentData(studentId) : null;
            
            return {
                id: `lesson-${lesson.id}`,
                firstName: student?.name || 'Unknown',
                lastName: student?.surname || '',
                classType: student?.studentClass || 'N/A',
                startTime: lesson.startTime,
                endTime: lesson.endTime,
                type: 'lesson',
                status: 'Done'
            };
        });
        
        // Filter to only today's prenotations and fetch student data
        const todayPrenotationsPromises = prenotations.filter(prenotation => {
            const prenotationStart = new Date(prenotation.startTime);
            return prenotationStart >= startOfDay && prenotationStart <= endOfDay;
        }).map(async prenotation => {
            const studentId = prenotation.studentId;
            const student = studentId ? await fetchStudentData(studentId) : null;
            
            return {
                id: `prenotation-${prenotation.id}`,
                firstName: student?.name || 'Unknown',
                lastName: student?.surname || '',
                classType: student?.studentClass || 'N/A',
                startTime: prenotation.startTime,
                endTime: prenotation.endTime,
                type: 'prenotation',
                confirmed: prenotation.flag,
                status: prenotation.flag ? 'Confirmed' : 'Pending'
            };
        });
        
        const todayLessons = await Promise.all(todayLessonsPromises);
        const todayPrenotations = await Promise.all(todayPrenotationsPromises);
        
        // Combine and sort by start time
        const combinedLessons = [...todayLessons, ...todayPrenotations].sort((a, b) => {
            return a.startTime.localeCompare(b.startTime);
        });
        
        res.render('home', {
            userId: req.session.userId,
            user: { username: req.session.username, role: tutorData ? tutorData.role : userRole },
            tasks: tasks,
            lessons: combinedLessons,
            students: students || []
        });
    } catch (error) {
        logError('Error fetching home data', req, { error: error.message });
        res.render('home', {
            username: req.session.username,
            userId: req.session.userId,
            role: 'GENERIC',
            tasks: [],
            lessons: [],
            students: []
        });
    }
});

/**
 * Dashboard view
 * GET /dashboard - Display tutor dashboard
 */
/*
app.get('/dashboard', tutorSession, isAuthenticated, (req, res) => {
    res.render('dashboard', {
        username: req.session.username,
        role: req.session.role
    });
});
*/

/**
 * Calendar view
 * GET /calendar - Display calendar with prenotations and notes
 * STAFF role: sees all prenotations
 * GENERIC role: sees only own prenotations
 */
app.get('/calendar', tutorSession, isAuthenticated, async (req, res) => {
    try {
        const tutorId = req.session.userId;
        const userRole = req.session.role;
        
        // Fetch tutor data to get the role
        const tutorData = await fetchTutorData(tutorId);
        const isStaff = tutorData && tutorData.role === 'STAFF';
        
        // Fetch prenotations: all if STAFF, only own if not
        const prenotationsEndpoint = isStaff 
            ? '/api/prenotations' 
            : `/api/prenotations/tutor/${tutorId}`;
        
        // Fetch all required data in parallel
        const [prenotations, calendarNotes, students, tutors] = await Promise.all([
            fetchFromJavaAPI(prenotationsEndpoint),
            fetchFromJavaAPI(`/api/calendar-notes/tutor/${tutorId}`),
            fetchFromJavaAPI('/api/students'),
            fetchFromJavaAPI('/api/tutors')
        ]);
        
        // Enrich prenotations with student and tutor data
        const enrichedPrenotations = await Promise.all((prenotations || []).map(async prenotation => {
            const studentId = prenotation.studentId;
            const prenotationTutorId = prenotation.tutorId;
            const student = studentId ? await fetchStudentData(studentId) : null;
            const tutor = prenotationTutorId ? await fetchTutorData(prenotationTutorId) : null;
            
            return {
                id: prenotation.id,
                startTime: prenotation.startTime,
                endTime: prenotation.endTime,
                createdAt: prenotation.createdAt,
                flag: prenotation.flag,
                studentId: studentId,
                student: student,
                studentName: student?.name || 'Unknown',
                studentSurname: student?.surname || '',
                studentClass: student?.studentClass || '',
                tutorId: prenotationTutorId,
                tutor: tutor,
                tutorUsername: tutor?.username || 'Unknown'
            };
        }));
        
        // Calendar notes - pass as-is since API doesn't return creator info in list
        // Creator verification will be done server-side on PUT/DELETE operations
        const enrichedCalendarNotes = calendarNotes || [];
        
        res.render('calendar', {
            userId: req.session.userId,
            user: { username: req.session.username, role: tutorData ? tutorData.role : userRole },
            prenotations: enrichedPrenotations,
            calendarNotes: enrichedCalendarNotes,
            students: students || [],
            tutors: tutors || []
        });
    } catch (error) {
        logError('Error fetching calendar data', req, { error: error.message });
        res.render('calendar', {
            username: req.session.username,
            userId: req.session.userId,
            role: 'GENERIC',
            prenotations: [],
            calendarNotes: [],
            students: [],
            tutors: []
        });
    }
});

/**
 * Lessons view
 * GET /lessons - Display all lessons and prenotations for the logged-in tutor
 * Shows confirmed lessons and pending prenotations
 */
app.get('/lessons', tutorSession, isAuthenticated, async (req, res) => {
    try {
        const tutorId = req.session.userId;
        const userRole = req.session.role; 
        
        // Fetch all required data in parallel
        const [tutorData, students, allLessons, allPrenotations] = await Promise.all([
            fetchTutorData(tutorId),
            fetchAllStudents(),
            fetchLessonsByTutor(tutorId),
            fetchAllPrenotations()
        ]);
        
        // Enrich lessons with student data
        const lessonsWithStudents = await Promise.all(allLessons.map(async lesson => {
            const studentId = lesson.studentId;
            const student = studentId ? await fetchStudentData(studentId) : null;
            
            return {
                id: lesson.id,
                firstName: student?.name || 'Unknown',
                lastName: student?.surname || '',
                classType: student?.studentClass || 'M',
                startTime: lesson.startTime,
                endTime: lesson.endTime,
                description: lesson.description || ''
            };
        }));
        
        // Filter prenotations by tutor ID and enrich with student data
        const tutorPrenotations = allPrenotations.filter(prenotation => prenotation.tutorId === tutorId);
        const prenotationsWithStudents = await Promise.all(tutorPrenotations.map(async prenotation => {
            const studentId = prenotation.studentId;
            const student = studentId ? await fetchStudentData(studentId) : null;
            
            return {
                id: prenotation.id,
                firstName: student?.name || 'Unknown',
                lastName: student?.surname || '',
                classType: student?.studentClass || 'M',
                startTime: prenotation.startTime,
                endTime: prenotation.endTime,
                createdAt: prenotation.createdAt,
                flag: prenotation.flag,
                confirmed: prenotation.flag
            };
        }));
        
        res.render('lessons', {
            userId: req.session.userId,
            user: { username: req.session.username, role: tutorData ? tutorData.role : userRole },
            students: students || [],
            lessons: lessonsWithStudents,
            totalLessons: allLessons.length,
            prenotations: prenotationsWithStudents
        });
    } catch (error) {
        logError('Error fetching lessons data', req, { error: error.message });
        res.render('lessons', {
            username: req.session.username,
            userId: req.session.userId,
            role: 'GENERIC',
            students: [],
            lessons: [],
            totalLessons: 0,
            prenotations: []
        });
    }
});

/**
 * Staff panel
 * GET /staffPanel - Display staff management panel (STAFF role only)
 * Allows viewing and managing all tutors
 */
app.get('/staffPanel', tutorSession, isAuthenticated, async (req, res) => {
    try {
        const tutorId = req.session.userId;
        const userRole = req.session.role;
        
        // Fetch tutor data to verify STAFF role
        const tutorData = await fetchTutorData(tutorId);
        
        // Check if user is STAFF
        if (!tutorData || tutorData.role !== 'STAFF') {
            return res.redirect('/home');
        }
        
        // Fetch all tutors from database
        const allTutors = await fetchFromJavaAPI('/api/tutors');
        
        res.render('staffPanel', {
            userId: req.session.userId,
            user: { username: req.session.username, role: tutorData.role },
            tutors: allTutors || []
        });
    } catch (error) {
        logError('Error accessing staff panel', req, { error: error.message });
        res.redirect('/home');
    }
});

// ! REPORT GENERATION API ROUTES (STAFF only) !

/**
 * Generate Excel report for lessons in a specific month
 * GET /api/reports/lessons-by-month?month=YYYY-MM
 * Returns: Excel file download with lessons grouped by tutor
 */
app.get('/api/reports/lessons-by-month', tutorSession, isAuthenticated, isStaff, async (req, res) => {
    try {
        const { month } = req.query; // Format: YYYY-MM (e.g., "2026-02")
        
        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM (e.g., 2026-02)' });
        }

        // Parse month and calculate start/end dates
        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, 1, 0, 0, 0);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59);
        
        const startTime = startDate.toISOString().slice(0, 19);
        const endTime = endDate.toISOString().slice(0, 19);

        // Fetch lessons from Java API
        const lessons = await fetchFromJavaAPI(`/api/lessons/date-range?start=${startTime}&end=${endTime}`);
        
        if (!lessons || lessons.length === 0) {
            return res.status(404).json({ error: 'No lessons found for this month' });
        }

        // Generate Excel using utility function
        const { workbook, fileName } = await generateLessonsExcel(
            lessons,
            fetchStudentData,
            fetchTutorData,
            monthNum,
            year
        );

        // Set response headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
        
        logSuccess('Lessons report generated', req, { month, fileName });

    } catch (error) {
        logError('Error generating Excel report', req, { month: req.query.month, error: error.message });
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

/**
 * Generate Excel report for lessons grouped by student in a specific month
 * GET /api/reports/lessons-by-student?month=YYYY-MM
 * Returns: Excel file download with lessons grouped by student
 */
app.get('/api/reports/lessons-by-student', tutorSession, isAuthenticated, isStaff, async (req, res) => {
    try {
        const { month } = req.query; // Format: YYYY-MM (e.g., "2026-02")
        
        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM (e.g., 2026-02)' });
        }

        // Parse month and calculate start/end dates
        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, 1, 0, 0, 0);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59);
        
        const startTime = startDate.toISOString().slice(0, 19);
        const endTime = endDate.toISOString().slice(0, 19);

        // Fetch lessons from Java API
        const lessons = await fetchFromJavaAPI(`/api/lessons/date-range?start=${startTime}&end=${endTime}`);
        
        if (!lessons || lessons.length === 0) {
            return res.status(404).json({ error: 'No lessons found for this month' });
        }

        // Generate Excel using utility function
        const { workbook, fileName } = await generateStudentsLessonsExcel(
            lessons,
            fetchStudentData,
            fetchTutorData,
            monthNum,
            year
        );

        // Set response headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
        
        logSuccess('Students lessons report generated', req, { month, fileName });

    } catch (error) {
        logError('Error generating students Excel report', req, { month: req.query.month, error: error.message });
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

/**
 * Generate yearly tutors statistics report
 * GET /api/reports/tutors-monthly-stats?year=YYYY
 * Returns: Excel file with monthly statistics for each tutor across 12 months
 */
app.get('/api/reports/tutors-monthly-stats', tutorSession, isAuthenticated, isStaff, async (req, res) => {
    try {
        const { year } = req.query; // Format: YYYY (e.g., "2026")
        
        if (!year || !/^\d{4}$/.test(year)) {
            return res.status(400).json({ error: 'Invalid year format. Use YYYY (e.g., 2026)' });
        }

        const yearNum = parseInt(year);
        
        // Calculate start/end dates for the entire year
        const startDate = new Date(yearNum, 0, 1, 0, 0, 0);
        const endDate = new Date(yearNum, 11, 31, 23, 59, 59);
        
        const startTime = startDate.toISOString().slice(0, 19);
        const endTime = endDate.toISOString().slice(0, 19);

        // Fetch all lessons for the year from Java API
        const lessons = await fetchFromJavaAPI(`/api/lessons/date-range?start=${startTime}&end=${endTime}`);
        
        if (!lessons || lessons.length === 0) {
            return res.status(404).json({ error: 'No lessons found for this year' });
        }

        // Fetch all tutors
        const tutors = await fetchFromJavaAPI('/api/tutors');
        
        if (!tutors || tutors.length === 0) {
            return res.status(404).json({ error: 'No tutors found' });
        }

        // Generate Excel using utility function
        const { workbook, filename } = await generateTutorMonthlyReport(
            lessons,
            tutors,
            fetchStudentData,
            yearNum
        );

        // Set response headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
        
        logSuccess('Tutors monthly stats report generated', req, { year, filename });

    } catch (error) {
        logError('Error generating tutors monthly stats report', req, { year: req.query.year, error: error.message });
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

app.get('/logout', tutorSession, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            logError('Error destroying session', req, { error: err.message });
        }
        res.redirect('/login');
    });
});

app.post('/logout', tutorSession, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            logError('Logout error', req, { error: err.message });
        }
        res.redirect('/login');
    });
});

// !!! AUTHENTICATION & SESSION API ROUTES !!!

/**
 * Check authentication status
 * GET /api/auth/status
 * Returns: JSON with authentication status and user info if logged in
 */
app.get('/api/auth/status', tutorSession, (req, res) => {
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

// !!! LESSONS API ROUTES !!!

/**
 * Create a new lesson
 * POST /api/lessons
 * Body: { studentId, description, lessonDate, startTime, endTime }
 * Supports multiple date/time formats for flexibility
 */
app.post('/api/lessons', tutorSession, isAuthenticated, async (req, res) => {
    try {
        const { studentId, description, lessonDate, startTime, endTime } = req.body;
        const tutorId = req.session.userId;
        
        let startDateTime, endDateTime;
        
        // Check if lessonDate is provided
        if (lessonDate) {
            // Use the provided date
            const [startHour, startMinute] = startTime.split(':');
            const [endHour, endMinute] = endTime.split(':');
            
            const startHourPadded = String(startHour).padStart(2, '0');
            const startMinutePadded = String(startMinute).padStart(2, '0');
            const endHourPadded = String(endHour).padStart(2, '0');
            const endMinutePadded = String(endMinute).padStart(2, '0');
            
            startDateTime = `${lessonDate}T${startHourPadded}:${startMinutePadded}:00`;
            endDateTime = `${lessonDate}T${endHourPadded}:${endMinutePadded}:00`;
        } else if (startTime.includes('T')) {
            // Already in full format, use as is
            startDateTime = startTime;
            endDateTime = endTime;
        } else {
            // Old format (HH:MM), use today's date
            const today = new Date();
            const [startHour, startMinute] = startTime.split(':');
            const [endHour, endMinute] = endTime.split(':');
            
            // Create datetime string in local time without UTC conversion
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const startHourPadded = String(startHour).padStart(2, '0');
            const startMinutePadded = String(startMinute).padStart(2, '0');
            const endHourPadded = String(endHour).padStart(2, '0');
            const endMinutePadded = String(endMinute).padStart(2, '0');
            
            startDateTime = `${year}-${month}-${day}T${startHourPadded}:${startMinutePadded}:00`;
            endDateTime = `${year}-${month}-${day}T${endHourPadded}:${endMinutePadded}:00`;
        }
        
        const lessonData = {
            description: description || '',
            startTime: startDateTime,
            endTime: endDateTime,
            tutorId: parseInt(tutorId),
            studentId: parseInt(studentId)
        };
        
        logInfo('Creating new lesson', req, { studentId, tutorId });
        
        const postData = JSON.stringify(lessonData);
        
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: '/api/lessons',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };
        
        const httpsReq = https.request(options, (httpsRes) => {
            let data = '';
            
            httpsRes.on('data', (chunk) => {
                data += chunk;
            });
            
            httpsRes.on('end', () => {
                if (httpsRes.statusCode === 200 || httpsRes.statusCode === 201) {
                    logSuccess('Lesson created successfully', req, { studentId, tutorId });
                    try {
                        const lesson = JSON.parse(data);
                        res.json(lesson);
                    } catch (e) {
                        res.json({ success: true, message: 'Lesson created' });
                    }
                } else {
                    logError(`Error creating lesson, status: ${httpsRes.statusCode}`, req, { response: data });
                    res.status(httpsRes.statusCode).json({ error: data || 'Failed to create lesson' });
                }
            });
        });
        
        httpsReq.on('error', (error) => {
            logError('Error calling Java API for lesson creation', req, { error: error.message });
            res.status(500).json({ error: 'Failed to create lesson' });
        });
        
        httpsReq.write(postData);
        httpsReq.end();
        
    } catch (error) {
        logError('Error creating lesson', req, { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to create lesson' });
    }
});

// !!! PRENOTATIONS (BOOKINGS) API ROUTES !!!

/**
 * Create a new prenotation (lesson booking)
 * POST /api/prenotations
 * Body: { studentId, startTime, endTime, tutorId (optional for STAFF) }
 * STAFF can create prenotations for other tutors
 */
app.post('/api/prenotations', tutorSession, isAuthenticated, async (req, res) => {
    try {
        const { studentId, startTime, endTime, tutorId: requestedTutorId } = req.body;
        const currentUserId = req.session.userId;
        
        // Use requested tutorId if provided (for STAFF), otherwise use current user
        const tutorId = requestedTutorId || currentUserId;
        
        let startDateTime, endDateTime;
        
        // Check if startTime is already in full datetime format (YYYY-MM-DDTHH:MM:SS)
        if (startTime.includes('T')) {
            // Already in full format, use as is
            startDateTime = startTime;
            endDateTime = endTime;
        } else {
            // Old format (HH:MM), use today's date
            const today = new Date();
            const [startHour, startMinute] = startTime.split(':');
            const [endHour, endMinute] = endTime.split(':');
            
            // Create datetime string in local time without UTC conversion
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const startHourPadded = String(startHour).padStart(2, '0');
            const startMinutePadded = String(startMinute).padStart(2, '0');
            const endHourPadded = String(endHour).padStart(2, '0');
            const endMinutePadded = String(endMinute).padStart(2, '0');
            
            startDateTime = `${year}-${month}-${day}T${startHourPadded}:${startMinutePadded}:00`;
            endDateTime = `${year}-${month}-${day}T${endHourPadded}:${endMinutePadded}:00`;
        }
        
        // Build prenotation DTO with IDs
        const prenotationData = {
            startTime: startDateTime,
            endTime: endDateTime,
            flag: false,
            studentId: parseInt(studentId),
            tutorId: parseInt(tutorId),
            creatorId: parseInt(currentUserId) // Always use the current logged-in user as creator
        };
        
        logInfo('Creating prenotation', req, { studentId, tutorId, startDateTime, endDateTime });
        
        const postData = JSON.stringify(prenotationData);
        
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: '/api/prenotations/create',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };
        
        const httpsReq = https.request(options, (httpsRes) => {
            let data = '';
            
            httpsRes.on('data', (chunk) => {
                data += chunk;
            });
            
            httpsRes.on('end', () => {
                if (httpsRes.statusCode === 200 || httpsRes.statusCode === 201) {
                    logSuccess('Prenotation created successfully', req, { data });
                    try {
                        const prenotation = JSON.parse(data);
                        res.json(prenotation);
                    } catch (e) {
                        res.json({ success: true, message: 'Prenotation created' });
                    }
                } else {
                    logError(`Error creating prenotation, status: ${httpsRes.statusCode}`, req, { response: data });
                    res.status(httpsRes.statusCode).json({ error: data || 'Failed to create prenotation' });
                }
            });
        });
        
        httpsReq.on('error', (error) => {
            logError('Error calling Java API for prenotation creation', req, { error: error.message });
            res.status(500).json({ error: 'Failed to create prenotation' });
        });
        
        httpsReq.write(postData);
        httpsReq.end();
        
    } catch (error) {
        logError('Error creating prenotation', req, { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to create prenotation' });
    }
});

/**
 * Update an existing prenotation
 * PUT /api/prenotations/:id
 * Body: { studentId, startTime, endTime, tutorId (optional for STAFF) }
 */
app.put('/api/prenotations/:id', tutorSession, isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { studentId, startTime, endTime, tutorId: requestedTutorId } = req.body;
        const currentUserId = req.session.userId;
        
        // Use requested tutorId if provided (for STAFF), otherwise use current user
        const tutorId = requestedTutorId || currentUserId;
        
        // Build prenotation DTO with IDs
        const prenotationData = {
            startTime: startTime,
            endTime: endTime,
            flag: false,
            studentId: parseInt(studentId),
            tutorId: parseInt(tutorId),
            creatorId: parseInt(currentUserId)
        };
        
        logInfo('Updating prenotation', req, { id, studentId, tutorId, startTime, endTime });
        
        const postData = JSON.stringify(prenotationData);
        
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: `/api/prenotations/${id}`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };
        
        const httpsReq = https.request(options, (httpsRes) => {
            let data = '';
            
            httpsRes.on('data', (chunk) => {
                data += chunk;
            });
            
            httpsRes.on('end', () => {
                if (httpsRes.statusCode === 200 || httpsRes.statusCode === 201) {
                    logSuccess('Prenotation updated successfully', req, { id });
                    try {
                        const prenotation = JSON.parse(data);
                        res.json(prenotation);
                    } catch (e) {
                        res.json({ success: true, message: 'Prenotation updated' });
                    }
                } else {
                    logError(`Error updating prenotation, status: ${httpsRes.statusCode}`, req, { id, response: data });
                    res.status(httpsRes.statusCode).json({ error: data || 'Failed to update prenotation' });
                }
            });
        });
        
        httpsReq.on('error', (error) => {
            logError('Error calling Java API for prenotation update', req, { id, error: error.message });
            res.status(500).json({ error: 'Failed to update prenotation' });
        });
        
        httpsReq.write(postData);
        httpsReq.end();
        
    } catch (error) {
        logError('Error updating prenotation', req, { id: req.params.id, error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to update prenotation' });
    }
});

/**
 * Delete a prenotation
 * DELETE /api/prenotations/:id
 */
app.delete('/api/prenotations/:id', tutorSession, isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        
        logInfo('Deleting prenotation', req, { id });
        
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: `/api/prenotations/${id}`,
            method: 'DELETE',
            headers: {
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };
        
        const httpsReq = https.request(options, (httpsRes) => {
            let data = '';
            
            httpsRes.on('data', (chunk) => {
                data += chunk;
            });
            
            httpsRes.on('end', () => {
                if (httpsRes.statusCode === 200 || httpsRes.statusCode === 204) {
                    logSuccess('Prenotation deleted successfully', req, { id });
                    res.json({ success: true, message: 'Prenotation deleted' });
                } else {
                    logError(`Error deleting prenotation, status: ${httpsRes.statusCode}`, req, { id, response: data });
                    res.status(httpsRes.statusCode).json({ error: data || 'Failed to delete prenotation' });
                }
            });
        });
        
        httpsReq.on('error', (error) => {
            logError('Error calling Java API for prenotation deletion', req, { id, error: error.message });
            res.status(500).json({ error: 'Failed to delete prenotation' });
        });
        
        httpsReq.end();
        
    } catch (error) {
        logError('Error deleting prenotation', req, { id: req.params.id, error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to delete prenotation' });
    }
});

// !!! CALENDAR NOTES API ROUTES !!!

/**
 * Create a new calendar note (task/reminder)
 * POST /api/calendar-notes
 * Body: { description, startTime, endTime, tutorIds[] }
 * Can be shared with multiple tutors
 */
app.post('/api/calendar-notes', tutorSession, isAuthenticated, async (req, res) => {
    try {
        const { description, startTime, endTime, tutorIds } = req.body;
        const creatorId = req.session.userId;
        
        if (!description || !startTime || !endTime) {
            return res.status(400).json({ error: 'Description, start time, and end time are required' });
        }
        
        // Build calendar note data with DTO format
        const calendarNoteData = {
            description: description,
            startTime: startTime,
            endTime: endTime,
            creatorId: parseInt(creatorId),
            tutorIds: tutorIds || [] // Empty array if no tutors selected
        };
        
        logInfo('Creating calendar note', req, { description, startTime, endTime, tutorIds });
        
        const postData = JSON.stringify(calendarNoteData);
        
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: '/api/calendar-notes',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };
        
        const httpsReq = https.request(options, (httpsRes) => {
            let data = '';
            
            httpsRes.on('data', (chunk) => {
                data += chunk;
            });
            
            httpsRes.on('end', () => {
                if (httpsRes.statusCode === 200 || httpsRes.statusCode === 201) {
                    logSuccess('Calendar note created successfully', req);
                    try {
                        const note = JSON.parse(data);
                        res.json(note);
                    } catch (e) {
                        res.json({ success: true, message: 'Calendar note created' });
                    }
                } else {
                    logError(`Error creating calendar note, status: ${httpsRes.statusCode}`, req, { response: data });
                    res.status(httpsRes.statusCode).json({ error: data || 'Failed to create calendar note' });
                }
            });
        });
        
        httpsReq.on('error', (error) => {
            logError('Error calling Java API for calendar note creation', req, { error: error.message });
            res.status(500).json({ error: 'Failed to create calendar note' });
        });
        
        httpsReq.write(postData);
        httpsReq.end();
        
    } catch (error) {
        logError('Error creating calendar note', req, { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to create calendar note' });
    }
});

/**
 * Get a single calendar note by ID
 * GET /api/calendar-notes/:id
 */
app.get('/api/calendar-notes/:id', tutorSession, isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const note = await fetchFromJavaAPI(`/api/calendar-notes/${id}`);
        
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }
        
        res.json(note);
    } catch (error) {
        logError('Error fetching calendar note', req, { id: req.params.id, error: error.message });
        res.status(500).json({ error: 'Failed to fetch calendar note' });
    }
});

/**
 * Update a calendar note
 * PUT /api/calendar-notes/:id
 * Body: { description, startTime, endTime, tutorIds[] }
 * Only the creator can edit the note (authorization check included)
 */
app.put('/api/calendar-notes/:id', tutorSession, isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { description, startTime, endTime, tutorIds } = req.body;
        const currentUserId = req.session.userId;
        
        if (!description || !startTime || !endTime) {
            return res.status(400).json({ error: 'Description, start time, and end time are required' });
        }
        
        // Fetch the note to verify creator
        const existingNote = await fetchFromJavaAPI(`/api/calendar-notes/${id}`);
        if (existingNote && existingNote.creator && existingNote.creator.id !== currentUserId) {
            logWarning('Unauthorized attempt to edit calendar note', req, { noteId: id, noteCreatorId: existingNote.creator.id });
            return res.status(403).json({ error: 'Only the creator can edit this note' });
        }
        
        // Build calendar note data with DTO format
        const calendarNoteData = {
            description: description,
            startTime: startTime,
            endTime: endTime,
            creatorId: parseInt(currentUserId),
            tutorIds: tutorIds || []
        };
        
        logInfo('Updating calendar note', req, { id, description });
        
        const postData = JSON.stringify(calendarNoteData);
        
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: `/api/calendar-notes/${id}`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };
        
        const httpsReq = https.request(options, (httpsRes) => {
            let data = '';
            
            httpsRes.on('data', (chunk) => {
                data += chunk;
            });
            
            httpsRes.on('end', () => {
                if (httpsRes.statusCode === 200 || httpsRes.statusCode === 201) {
                    logSuccess('Calendar note updated successfully', req, { id });
                    try {
                        const note = JSON.parse(data);
                        res.json(note);
                    } catch (e) {
                        res.json({ success: true, message: 'Calendar note updated' });
                    }
                } else {
                    logError(`Error updating calendar note, status: ${httpsRes.statusCode}`, req, { id, response: data });
                    res.status(httpsRes.statusCode).json({ error: data || 'Failed to update calendar note' });
                }
            });
        });
        
        httpsReq.on('error', (error) => {
            logError('Error calling Java API for calendar note update', req, { id, error: error.message });
            res.status(500).json({ error: 'Failed to update calendar note' });
        });
        
        httpsReq.write(postData);
        httpsReq.end();
        
    } catch (error) {
        logError('Error updating calendar note', req, { id: req.params.id, error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to update calendar note' });
    }
});

/**
 * Delete a calendar note
 * DELETE /api/calendar-notes/:id
 * Only the creator can delete the note (authorization check included)
 */
app.delete('/api/calendar-notes/:id', tutorSession, isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.session.userId;
        
        // Fetch the note to verify creator
        const existingNote = await fetchFromJavaAPI(`/api/calendar-notes/${id}`);
        if (existingNote && existingNote.creator && existingNote.creator.id !== currentUserId) {
            logWarning('Unauthorized attempt to delete calendar note', req, { noteId: id, noteCreatorId: existingNote.creator.id });
            return res.status(403).json({ error: 'Only the creator can delete this note' });
        }
        
        logInfo('Deleting calendar note', req, { id });
        
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: `/api/calendar-notes/${id}?userId=${currentUserId}`,
            method: 'DELETE',
            headers: {
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };
        
        const httpsReq = https.request(options, (httpsRes) => {
            let data = '';
            
            httpsRes.on('data', (chunk) => {
                data += chunk;
            });
            
            httpsRes.on('end', () => {
                if (httpsRes.statusCode === 200 || httpsRes.statusCode === 204) {
                    logSuccess('Calendar note deleted successfully', req, { id });
                    res.json({ success: true, message: 'Calendar note deleted' });
                } else {
                    logError(`Error deleting calendar note, status: ${httpsRes.statusCode}`, req, { id, response: data });
                    res.status(httpsRes.statusCode).json({ error: data || 'Failed to delete calendar note' });
                }
            });
        });
        
        httpsReq.on('error', (error) => {
            logError('Error calling Java API for calendar note deletion', req, { id, error: error.message });
            res.status(500).json({ error: 'Failed to delete calendar note' });
        });
        
        httpsReq.end();
        
    } catch (error) {
        logError('Error deleting calendar note', req, { id: req.params.id, error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to delete calendar note' });
    }
});

// !!! STUDENTS API ROUTES !!!

/**
 * Create a new student
 * POST /api/students
 * Body: { name, surname, studentClass, description (optional) }
 * studentClass must be M (Middle), S (Secondary), or U (University)
 */
app.post('/api/students', tutorSession, isAuthenticated, async (req, res) => {
    try {
        const { name, surname, studentClass, description } = req.body;
        
        if (!name || !surname || !studentClass) {
            return res.status(400).json({ error: 'Name, surname, and class are required' });
        }
        
        // Validate class
        if (!['M', 'S', 'U'].includes(studentClass)) {
            return res.status(400).json({ error: 'Class must be M, S, or U' });
        }
        
        // Build student data
        const studentData = {
            name: name,
            surname: surname,
            studentClass: studentClass,
            description: description || '',
            status: 'ACTIVE'
        };
        
        logInfo('Creating student', req, { name, surname, studentClass });
        
        const postData = JSON.stringify(studentData);
        
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: '/api/students',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };
        
        const httpsReq = https.request(options, (httpsRes) => {
            let data = '';
            
            httpsRes.on('data', (chunk) => {
                data += chunk;
            });
            
            httpsRes.on('end', () => {
                if (httpsRes.statusCode === 200 || httpsRes.statusCode === 201) {
                    logSuccess('Student created successfully', req, { name, surname });
                    try {
                        const student = JSON.parse(data);
                        res.json(student);
                    } catch (e) {
                        res.json({ success: true, message: 'Student created' });
                    }
                } else {
                    logError(`Error creating student, status: ${httpsRes.statusCode}`, req, { response: data });
                    res.status(httpsRes.statusCode).json({ error: data || 'Failed to create student' });
                }
            });
        });
        
        httpsReq.on('error', (error) => {
            logError('Error calling Java API for student creation', req, { error: error.message });
            res.status(500).json({ error: 'Failed to create student' });
        });
        
        httpsReq.write(postData);
        httpsReq.end();
        
    } catch (error) {
        logError('Error creating student', req, { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to create student' });
    }
});

// !!! ADMIN API ROUTES (Admin only) !!!

/**
 * Get all tutors
 * GET /api/admin/tutors
 * Returns list of all tutors in the system
 */
app.get('/api/admin/tutors', adminSession, isAdmin, async (req, res) => {
    try {
        const tutors = await fetchFromJavaAPI('/api/tutors', 'GET');
        res.json(tutors);
    } catch (error) {
        logError('Error fetching tutors', req, { error: error.message });
        res.status(500).json({ error: 'Failed to fetch tutors' });
    }
});

/**
 * Get all students
 * GET /api/admin/students
 * Returns list of all students in the system
 */
app.get('/api/admin/students', adminSession, isAdmin, async (req, res) => {
    try {
        const students = await fetchFromJavaAPI('/api/students', 'GET');
        res.json(students);
    } catch (error) {
        logError('Error fetching students', req, { error: error.message });
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

/**
 * Change tutor role
 * PATCH /api/admin/tutors/:id/role
 * Body: { role: 'STAFF' | 'GENERIC' }
 * Updates tutor's role for access control
 */
app.patch('/api/admin/tutors/:id/role', adminSession, isAdmin, async (req, res) => {
    try {
        const tutorId = req.params.id;
        const { role } = req.body;

        if (!role || !['STAFF', 'GENERIC'].includes(role)) {
            return res.status(400).json({ error: 'Role must be STAFF or GENERIC' });
        }

        // Use the specific PATCH endpoint for role update
        const updatedTutor = await fetchFromJavaAPI(`/api/tutors/${tutorId}/role`, 'PATCH', { role });
        
        logSuccess('Tutor role updated', req, { tutorId, role });
        res.json(updatedTutor);
    } catch (error) {
        logError('Error updating tutor role', req, { tutorId: req.params.id, error: error.message });
        res.status(500).json({ error: 'Failed to update tutor role' });
    }
});

/**
 * Change tutor status (block/unblock)
 * PATCH /api/admin/tutors/:id/status
 * Body: { status: 'ACTIVE' | 'BLOCKED' }
 * Used to block misbehaving tutors or reactivate accounts
 */
app.patch('/api/admin/tutors/:id/status', adminSession, isAdmin, async (req, res) => {
    try {
        const tutorId = req.params.id;
        const { status } = req.body;

        if (!status || !['ACTIVE', 'BLOCKED'].includes(status)) {
            return res.status(400).json({ error: 'Status must be ACTIVE or BLOCKED' });
        }

        // Use the specific PATCH endpoint for status update
        const updatedTutor = await fetchFromJavaAPI(`/api/tutors/${tutorId}/status`, 'PATCH', { status });
        
        logSuccess('Tutor status updated', req, { tutorId, status });
        res.json(updatedTutor);
    } catch (error) {
        logError('Error updating tutor status', req, { tutorId: req.params.id, error: error.message });
        res.status(500).json({ error: 'Failed to update tutor status' });
    }
});

/**
 * Create a new tutor
 * POST /api/admin/tutors
 * Body: { username, password, role: 'STAFF' | 'GENERIC' }
 * Password is automatically hashed with bcrypt before storing
 */
app.post('/api/admin/tutors', adminSession, isAdmin, async (req, res) => {
    try {
        const { username, password, role } = req.body;

        logInfo('Creating new tutor', req, { username, role });

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        if (!role || !['STAFF', 'GENERIC'].includes(role)) {
            return res.status(400).json({ error: 'Role must be STAFF or GENERIC' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Hash password with bcrypt before saving
        const hashedPassword = await hashPassword(password);
        logInfo('Password hashed for new tutor', req, { username });

        const tutorData = {
            username: username,
            password: hashedPassword,
            role: role,
            status: 'ACTIVE'
        };

        const newTutor = await fetchFromJavaAPI('/api/tutors', 'POST', tutorData);
        
        logSuccess('Tutor created successfully', req, { username });
        res.status(201).json(newTutor);
    } catch (error) {
        logError('Error creating tutor', req, { error: error.message, stack: error.stack });
        if (error.statusCode === 409) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Failed to create tutor' });
    }
});

/**
 * Change student class
 * PATCH /api/admin/students/:id/class
 * Body: { studentClass: 'M' | 'S' | 'U' }
 * M = Middle School, S = Secondary School, U = University
 */
app.patch('/api/admin/students/:id/class', adminSession, isAdmin, async (req, res) => {
    try {
        const studentId = req.params.id;
        const { studentClass } = req.body;

        if (!studentClass || !['M', 'S', 'U'].includes(studentClass)) {
            return res.status(400).json({ error: 'Class must be M, S, or U' });
        }

        // Fetch current student data
        const student = await fetchFromJavaAPI(`/api/students/${studentId}`, 'GET');
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Update student class
        student.studentClass = studentClass;
        const updatedStudent = await fetchFromJavaAPI(`/api/students/${studentId}`, 'PUT', student);
        
        logSuccess('Student class updated', req, { studentId, studentClass });
        res.json(updatedStudent);
    } catch (error) {
        logError('Error updating student class', req, { studentId: req.params.id, error: error.message });
        res.status(500).json({ error: 'Failed to update student class' });
    }
});

// !!! ERROR HANDLERS !!!

/**
 * 404 Not Found handler
 * Renders custom 404 page with user context if authenticated
 */
app.use((req, res) => {
    const hasSession = req.session && (req.session.userId || req.session.adminId);
    res.status(404).render('404', {
        user: hasSession && req.session.userId ? {
            userId: req.session.userId,
            username: req.session.username,
            role: req.session.role
        } : null,
        isAuthenticated: hasSession && !!req.session.userId
    });
});

//------------------------------------------------------------------------------------------------------
// !!! SERVER INITIALIZATION !!!

/**
 * Start the Express server
 * Listens on the configured PORT (default: 3000)
 */
app.listen(PORT, () => {
    console.log(`Tutorly server running at http://localhost:${PORT}`);
});

module.exports = app;
