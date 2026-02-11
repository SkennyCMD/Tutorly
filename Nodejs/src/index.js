const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const { generateLessonsExcel, generateStudentsLessonsExcel, generateTutorMonthlyReport } = require('../server_utilities/excel');
const { authenticateTutorWithJavaAPI, authenticateAdminWithJavaAPI } = require('../server_utilities/authService');
const { logAdminLoginAttempt } = require('../server_utilities/adminLogger');
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

const app = express();
const PORT = process.env.PORT || 3000;

// Java Backend API configuration
const JAVA_API_URL = 'https://localhost:8443';
const JAVA_API_KEY = 'MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Tutor session configuration
const tutorSession = session({
    name: 'tutorly.tutor.sid', // Cookie name for tutor session
    secret: 'tutorly-tutor-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: false // Set to true in production with HTTPS
    }
});

// Admin session configuration
const adminSession = session({
    name: 'tutorly.admin.sid', // Cookie name for admin session
    secret: 'tutorly-admin-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 1, // 1 hour (shorter for admin sessions)
        httpOnly: true,
        secure: false // Set to true in production with HTTPS
    }
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

// STAFF role middleware
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

// Middleware to check if user is authenticated as admin
const isAdmin = (req, res, next) => {
    if (req.session && req.session.adminId) {
        return next();
    }
    res.redirect('/adminLogin');
};

// Routes

// Root route - use tutor session
app.get('/', tutorSession, (req, res) => {
    if (req.session && req.session.userId) {
        res.redirect('/home');
    } else {
        res.redirect('/login');
    }
});

// Tutor login routes
app.get('/login', tutorSession, (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/home');
    }
    res.render('login', { error: null });
});

// Admin login routes
app.get('/adminLogin', adminSession, (req, res) => {
    if (req.session && req.session.adminId) {
        return res.redirect('/admin');
    }
    res.render('adminLogin', { error: null });
});

app.post('/adminLogin', adminSession, async (req, res) => {
    const { username, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    console.log('Admin Login Attempt:', { username, password: '***', ip: clientIp });

    try {
        // Call Java backend API to authenticate admin
        const adminId = await authenticateAdminWithJavaAPI(username, password);

        if (adminId === null) {
            logAdminLoginAttempt(username, clientIp, false);
            return res.render('adminLogin', { error: 'Username or password incorrect' });
        }

        // Create session with admin data
        req.session.adminId = adminId;
        req.session.adminUsername = username;
        req.session.role = 'admin';

        logAdminLoginAttempt(username, clientIp, true);
        console.log('Admin login successful for:', username);
        res.redirect('/admin');
    } catch (error) {
        console.error('Admin login error:', error);
        logAdminLoginAttempt(username, clientIp, false);
        res.render('adminLogin', { error: 'Error during login. Please ensure the Java server is running.' });
    }
});

app.get('/admin', adminSession, isAdmin, (req, res) => {
    res.render('admin', { 
        adminUsername: req.session.adminUsername,
        adminId: req.session.adminId
    });
});

// Logout route for tutors
app.get('/logout', tutorSession, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/login');
    });
});

// Logout route for admins
app.get('/adminLogout', adminSession, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying admin session:', err);
        }
        res.redirect('/adminLogin');
    });
});

app.post('/login', tutorSession, async (req, res) => {
    const { username, password } = req.body;

    console.log('Login Attempt:', { username, password: '***' });

    try {
        // Call Java backend API to authenticate tutor
        const tutorId = await authenticateTutorWithJavaAPI(username, password);

        console.log('Java API (Server) - Tutor ID:', tutorId);

        if (tutorId === null) {
            return res.render('login', { error: 'Username or password incorrect' });
        }

        // Create session with tutor data
        req.session.userId = tutorId;
        req.session.username = username;
        req.session.role = 'tutor';

        console.log('Login successful for:', username);
        res.redirect('/home');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'Error during login. Please ensure the Java server is running.' });
    }
});

// ===== TUTOR ROUTES =====

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
        console.error('Error fetching home data:', error);
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

app.get('/dashboard', tutorSession, isAuthenticated, (req, res) => {
    res.render('dashboard', {
        username: req.session.username,
        role: req.session.role
    });
});

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
        console.error('Error fetching calendar data:', error);
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
        console.error('Error fetching lessons data:', error);
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
        console.error('Error accessing staff panel:', error);
        res.redirect('/home');
    }
});

// ===== ADMIN API ROUTES =====

// Get all tutors (Admin only)
app.get('/api/admin/tutors', adminSession, isAdmin, async (req, res) => {
    try {
        const tutors = await fetchFromJavaAPI('/api/tutors', 'GET');
        res.json(tutors);
    } catch (error) {
        console.error('Error fetching tutors:', error);
        res.status(500).json({ error: 'Failed to fetch tutors' });
    }
});

// Get all students (Admin only)
app.get('/api/admin/students', adminSession, isAdmin, async (req, res) => {
    try {
        const students = await fetchFromJavaAPI('/api/students', 'GET');
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// Change tutor role (Admin only)
app.patch('/api/admin/tutors/:id/role', adminSession, isAdmin, async (req, res) => {
    try {
        const tutorId = req.params.id;
        const { role } = req.body;

        if (!role || !['STAFF', 'GENERIC'].includes(role)) {
            return res.status(400).json({ error: 'Role must be STAFF or GENERIC' });
        }

        // Use the specific PATCH endpoint for role update
        const updatedTutor = await fetchFromJavaAPI(`/api/tutors/${tutorId}/role`, 'PATCH', { role });
        
        res.json(updatedTutor);
    } catch (error) {
        console.error('Error updating tutor role:', error);
        res.status(500).json({ error: 'Failed to update tutor role' });
    }
});

// Change tutor status (Block/Unblock) (Admin only)
app.patch('/api/admin/tutors/:id/status', adminSession, isAdmin, async (req, res) => {
    try {
        const tutorId = req.params.id;
        const { status } = req.body;

        if (!status || !['ACTIVE', 'BLOCKED'].includes(status)) {
            return res.status(400).json({ error: 'Status must be ACTIVE or BLOCKED' });
        }

        // Use the specific PATCH endpoint for status update
        const updatedTutor = await fetchFromJavaAPI(`/api/tutors/${tutorId}/status`, 'PATCH', { status });
        
        res.json(updatedTutor);
    } catch (error) {
        console.error('Error updating tutor status:', error);
        res.status(500).json({ error: 'Failed to update tutor status' });
    }
});

// Create new tutor (Admin only)
app.post('/api/admin/tutors', adminSession, isAdmin, async (req, res) => {
    try {
        const { username, password, role } = req.body;

        console.log('Create tutor request:', { username, role, passwordLength: password?.length });

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        if (!role || !['STAFF', 'GENERIC'].includes(role)) {
            return res.status(400).json({ error: 'Role must be STAFF or GENERIC' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const tutorData = {
            username: username,
            password: password,
            role: role,
            status: 'ACTIVE'
        };

        console.log('Sending to Java API:', tutorData);

        const newTutor = await fetchFromJavaAPI('/api/tutors', 'POST', tutorData);
        
        console.log('Tutor created successfully:', newTutor);
        res.status(201).json(newTutor);
    } catch (error) {
        console.error('Error creating tutor:', error);
        console.error('Error details:', { statusCode: error.statusCode, message: error.message });
        if (error.statusCode === 409) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Failed to create tutor' });
    }
});

// Change student class (Admin only)
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
        
        res.json(updatedStudent);
    } catch (error) {
        console.error('Error updating student class:', error);
        res.status(500).json({ error: 'Failed to update student class' });
    }
});

// 404 page handler
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

// Start server
app.listen(PORT, () => {
    console.log(`Tutorly server running at http://localhost:${PORT}`);
});

module.exports = app;
