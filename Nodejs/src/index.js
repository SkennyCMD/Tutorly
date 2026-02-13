const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const https = require('https');
const fs = require('fs');
const { generateLessonsExcel, generateStudentsLessonsExcel, generateTutorMonthlyReport } = require('../server_utilities/excel');
const { logAdminLoginAttempt } = require('../server_utilities/adminLogger');
const { authenticateTutorWithJavaAPI, authenticateAdminWithJavaAPI } = require('../server_utilities/authService');
const { isAuthenticated, isAdmin, isStaff } = require('../server_utilities/authMiddleware');
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
const { 
    JAVA_API_URL, 
    JAVA_API_KEY, 
    PORT, 
    TUTOR_SESSION_SECRET, 
    ADMIN_SESSION_SECRET,
    TUTOR_SESSION_DURATION,
    ADMIN_SESSION_DURATION
} = require('../server_utilities/config');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Tutor session configuration
const tutorSession = session({
    name: 'tutorly.tutor.sid', // Cookie name for tutor session
    secret: TUTOR_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: TUTOR_SESSION_DURATION,
        httpOnly: true,
        secure: false // Set to true in production with HTTPS
    }
});

// Admin session configuration
const adminSession = session({
    name: 'tutorly.admin.sid', // Cookie name for admin session
    secret: ADMIN_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: ADMIN_SESSION_DURATION,
        httpOnly: true,
        secure: false // Set to true in production with HTTPS
    }
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

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

// ===== API ROUTES =====

// Endpoint to generate Excel report for lessons in a specific month
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

    } catch (error) {
        console.error('Error generating Excel report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// Endpoint to generate Excel report for lessons by student in a specific month
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

    } catch (error) {
        console.error('Error generating students Excel report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// New endpoint: Tutors monthly report with statistics
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

    } catch (error) {
        console.error('Error generating tutors monthly stats report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

app.get('/logout', tutorSession, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/login');
    });
});

app.post('/logout', tutorSession, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login');
    });
});

// API endpoint to check authentication status
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

// API endpoint to create a new lesson
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
        
        console.log('Creating lesson:', lessonData);
        
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
                    console.log('Lesson created successfully:', data);
                    try {
                        const lesson = JSON.parse(data);
                        res.json(lesson);
                    } catch (e) {
                        res.json({ success: true, message: 'Lesson created' });
                    }
                } else {
                    console.error('Error creating lesson, status:', httpsRes.statusCode);
                    console.error('Response:', data);
                    res.status(httpsRes.statusCode).json({ error: data || 'Failed to create lesson' });
                }
            });
        });
        
        httpsReq.on('error', (error) => {
            console.error('Error calling Java API:', error);
            res.status(500).json({ error: 'Failed to create lesson' });
        });
        
        httpsReq.write(postData);
        httpsReq.end();
        
    } catch (error) {
        console.error('Error creating lesson:', error.message);
        res.status(500).json({ error: 'Failed to create lesson' });
    }
});

// API endpoint to create a new prenotation
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
        
        console.log('Creating prenotation:', prenotationData);
        
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
                    console.log('Prenotation created successfully:', data);
                    try {
                        const prenotation = JSON.parse(data);
                        res.json(prenotation);
                    } catch (e) {
                        res.json({ success: true, message: 'Prenotation created' });
                    }
                } else {
                    console.error('Error creating prenotation, status:', httpsRes.statusCode);
                    console.error('Response:', data);
                    res.status(httpsRes.statusCode).json({ error: data || 'Failed to create prenotation' });
                }
            });
        });
        
        httpsReq.on('error', (error) => {
            console.error('Error calling Java API:', error);
            res.status(500).json({ error: 'Failed to create prenotation' });
        });
        
        httpsReq.write(postData);
        httpsReq.end();
        
    } catch (error) {
        console.error('Error creating prenotation:', error.message);
        res.status(500).json({ error: 'Failed to create prenotation' });
    }
});

// API endpoint to update a prenotation
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
        
        console.log('Updating prenotation:', id, prenotationData);
        
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
                    console.log('Prenotation updated successfully:', data);
                    try {
                        const prenotation = JSON.parse(data);
                        res.json(prenotation);
                    } catch (e) {
                        res.json({ success: true, message: 'Prenotation updated' });
                    }
                } else {
                    console.error('Error updating prenotation, status:', httpsRes.statusCode);
                    console.error('Response:', data);
                    res.status(httpsRes.statusCode).json({ error: data || 'Failed to update prenotation' });
                }
            });
        });
        
        httpsReq.on('error', (error) => {
            console.error('Error calling Java API:', error);
            res.status(500).json({ error: 'Failed to update prenotation' });
        });
        
        httpsReq.write(postData);
        httpsReq.end();
        
    } catch (error) {
        console.error('Error updating prenotation:', error.message);
        res.status(500).json({ error: 'Failed to update prenotation' });
    }
});

// API endpoint to delete a prenotation
app.delete('/api/prenotations/:id', tutorSession, isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('Deleting prenotation:', id);
        
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
                    console.log('Prenotation deleted successfully');
                    res.json({ success: true, message: 'Prenotation deleted' });
                } else {
                    console.error('Error deleting prenotation, status:', httpsRes.statusCode);
                    console.error('Response:', data);
                    res.status(httpsRes.statusCode).json({ error: data || 'Failed to delete prenotation' });
                }
            });
        });
        
        httpsReq.on('error', (error) => {
            console.error('Error calling Java API:', error);
            res.status(500).json({ error: 'Failed to delete prenotation' });
        });
        
        httpsReq.end();
        
    } catch (error) {
        console.error('Error deleting prenotation:', error.message);
        res.status(500).json({ error: 'Failed to delete prenotation' });
    }
});

// API endpoint to create a new calendar note
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
        
        console.log('Creating calendar note:', calendarNoteData);
        
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
                    console.log('Calendar note created successfully:', data);
                    try {
                        const note = JSON.parse(data);
                        res.json(note);
                    } catch (e) {
                        res.json({ success: true, message: 'Calendar note created' });
                    }
                } else {
                    console.error('Error creating calendar note, status:', httpsRes.statusCode);
                    console.error('Response:', data);
                    res.status(httpsRes.statusCode).json({ error: data || 'Failed to create calendar note' });
                }
            });
        });
        
        httpsReq.on('error', (error) => {
            console.error('Error calling Java API:', error);
            res.status(500).json({ error: 'Failed to create calendar note' });
        });
        
        httpsReq.write(postData);
        httpsReq.end();
        
    } catch (error) {
        console.error('Error creating calendar note:', error.message);
        res.status(500).json({ error: 'Failed to create calendar note' });
    }
});

// API endpoint to get a single calendar note by ID
app.get('/api/calendar-notes/:id', tutorSession, isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const note = await fetchFromJavaAPI(`/api/calendar-notes/${id}`);
        
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }
        
        res.json(note);
    } catch (error) {
        console.error('Error fetching calendar note:', error);
        res.status(500).json({ error: 'Failed to fetch calendar note' });
    }
});

// API endpoint to update a calendar note
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
        
        console.log('Updating calendar note:', id, calendarNoteData);
        
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
                    console.log('Calendar note updated successfully:', data);
                    try {
                        const note = JSON.parse(data);
                        res.json(note);
                    } catch (e) {
                        res.json({ success: true, message: 'Calendar note updated' });
                    }
                } else {
                    console.error('Error updating calendar note, status:', httpsRes.statusCode);
                    console.error('Response:', data);
                    res.status(httpsRes.statusCode).json({ error: data || 'Failed to update calendar note' });
                }
            });
        });
        
        httpsReq.on('error', (error) => {
            console.error('Error calling Java API:', error);
            res.status(500).json({ error: 'Failed to update calendar note' });
        });
        
        httpsReq.write(postData);
        httpsReq.end();
        
    } catch (error) {
        console.error('Error updating calendar note:', error.message);
        res.status(500).json({ error: 'Failed to update calendar note' });
    }
});

// API endpoint to delete a calendar note
app.delete('/api/calendar-notes/:id', tutorSession, isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.session.userId;
        
        // Fetch the note to verify creator
        const existingNote = await fetchFromJavaAPI(`/api/calendar-notes/${id}`);
        if (existingNote && existingNote.creator && existingNote.creator.id !== currentUserId) {
            return res.status(403).json({ error: 'Only the creator can delete this note' });
        }
        
        console.log('Deleting calendar note:', id);
        
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
                    console.log('Calendar note deleted successfully');
                    res.json({ success: true, message: 'Calendar note deleted' });
                } else {
                    console.error('Error deleting calendar note, status:', httpsRes.statusCode);
                    console.error('Response:', data);
                    res.status(httpsRes.statusCode).json({ error: data || 'Failed to delete calendar note' });
                }
            });
        });
        
        httpsReq.on('error', (error) => {
            console.error('Error calling Java API:', error);
            res.status(500).json({ error: 'Failed to delete calendar note' });
        });
        
        httpsReq.end();
        
    } catch (error) {
        console.error('Error deleting calendar note:', error.message);
        res.status(500).json({ error: 'Failed to delete calendar note' });
    }
});

// API endpoint to create a new student
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
        
        console.log('Creating student:', studentData);
        
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
                    console.log('Student created successfully:', data);
                    try {
                        const student = JSON.parse(data);
                        res.json(student);
                    } catch (e) {
                        res.json({ success: true, message: 'Student created' });
                    }
                } else {
                    console.error('Error creating student, status:', httpsRes.statusCode);
                    console.error('Response:', data);
                    res.status(httpsRes.statusCode).json({ error: data || 'Failed to create student' });
                }
            });
        });
        
        httpsReq.on('error', (error) => {
            console.error('Error calling Java API:', error);
            res.status(500).json({ error: 'Failed to create student' });
        });
        
        httpsReq.write(postData);
        httpsReq.end();
        
    } catch (error) {
        console.error('Error creating student:', error.message);
        res.status(500).json({ error: 'Failed to create student' });
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
