const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const https = require('https');
const { generateLessonsExcel, generateStudentsLessonsExcel, generateTutorMonthlyReport } = require('../server_utilities/excel');

const app = express();
const PORT = process.env.PORT || 3000;

// Java Backend API configuration
const JAVA_API_URL = 'https://localhost:8443';
const JAVA_API_KEY = 'MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu';

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

// Routes
app.get('/', (req, res) => {
    if (req.session && req.session.userId) {
        res.redirect('/home');
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/home');
    }
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
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

/**
 * Authenticate tutor with Java backend API
 * @param {string} username - Tutor username
 * @param {string} password - Tutor password
 * @returns {Promise<number|null>} Tutor ID if authenticated, null otherwise
 */
function authenticateTutorWithJavaAPI(username, password) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            username: username,
            password: password
        });

        console.log('Java API Call:', {
            url: `https://localhost:8443/api/tutors/login`,
            data: { username, password: '***' }
        });

        const options = {
            hostname: 'localhost',
            port: 8443,
            path: '/api/tutors/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false // Accept self-signed certificate
        };

        const req = https.request(options, (res) => {
            let data = '';

            console.log('Status Code API Java:', res.statusCode);

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('Java API Full Response:', data);
                
                try {
                    if (res.statusCode === 200) {
                        const tutorId = data ? parseInt(data) : null;
                        console.log('Parsed Tutor ID:', tutorId);
                        resolve(tutorId);
                    } else {
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
 * Fetch tutor data from Java backend API
 * @param {number} tutorId - Tutor ID
 * @returns {Promise<object|null>} Tutor data if found, null otherwise
 */
function fetchTutorData(tutorId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: `/api/tutors/${tutorId}`,
            method: 'GET',
            headers: {
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    console.error('Error parsing tutor data:', error);
                    resolve(null);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error fetching tutor data:', error);
            reject(error);
        });

        req.end();
    });
}

/**
 * Generic function to fetch data from Java backend API
 * @param {string} path - API path (e.g., '/api/prenotations')
 * @returns {Promise<any|null>} Parsed JSON data if successful, null otherwise
 */
function fetchFromJavaAPI(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: path,
            method: 'GET',
            headers: {
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        console.error(`Error fetching ${path}: ${res.statusCode}`);
                        resolve(null);
                    }
                } catch (error) {
                    console.error(`Error parsing data from ${path}:`, error);
                    resolve(null);
                }
            });
        });

        req.on('error', (error) => {
            console.error(`Error fetching from ${path}:`, error);
            reject(error);
        });

        req.end();
    });
}

app.get('/home', isAuthenticated, async (req, res) => {
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

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', {
        username: req.session.username,
        role: req.session.role
    });
});

app.get('/calendar', isAuthenticated, async (req, res) => {
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
                studentName: student?.name || 'Unknown',
                studentSurname: student?.surname || '',
                studentClass: student?.studentClass || '',
                tutorId: prenotationTutorId,
                tutorUsername: tutor?.username || 'Unknown'
            };
        }));
        
        res.render('calendar', {
            userId: req.session.userId,
            user: { username: req.session.username, role: tutorData ? tutorData.role : userRole },
            prenotations: enrichedPrenotations,
            calendarNotes: calendarNotes || [],
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

app.get('/lessons', isAuthenticated, async (req, res) => {
    try {
        const tutorId = req.session.userId;
        const userRole = req.session.role; 
        
        // Fetch all required data in parallel
        const [tutorData, students, allLessonsData, allPrenotations] = await Promise.all([
            fetchTutorData(tutorId),
            fetchAllStudents(),
            callJavaAPI(`/api/lessons/tutor/${tutorId}/paginated`, 'GET'),
            fetchAllPrenotations()
        ]);
        
        const allLessons = allLessonsData.lessons || [];
        const totalCount = allLessonsData.total || 0;
        
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
            totalLessons: totalCount,
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

app.get('/staffPanel', isAuthenticated, async (req, res) => {
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

// Endpoint to generate Excel report for lessons in a specific month
app.get('/api/reports/lessons-by-month', isAuthenticated, isStaff, async (req, res) => {
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
app.get('/api/reports/lessons-by-student', isAuthenticated, isStaff, async (req, res) => {
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
app.get('/api/reports/tutors-monthly-stats', isAuthenticated, isStaff, async (req, res) => {
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

// API endpoint to get all tutors
// Endpoint removed - tutors are now rendered server-side in /calendar route

// Endpoint removed - students are now rendered server-side in /home and /calendar routes

// API endpoint to create a new lesson
app.post('/api/lessons', isAuthenticated, async (req, res) => {
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
app.post('/api/prenotations', isAuthenticated, async (req, res) => {
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

// API endpoint to create a new calendar note
app.post('/api/calendar-notes', isAuthenticated, async (req, res) => {
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

// API endpoint to get today's tasks (calendar notes) for the logged-in tutor
// Endpoint removed - tasks are now rendered server-side in /home route

// API endpoint to create a new student
app.post('/api/students', isAuthenticated, async (req, res) => {
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

// API endpoint to get all lessons for the logged-in tutor
// Endpoint removed - lessons are now rendered server-side in /lessons route

// Endpoint removed - prenotations are now rendered server-side in /calendar and /lessons routes

// API endpoint to get today's lessons (lessons + prenotations) for the logged-in tutor
// Endpoint removed - lessons are now rendered server-side in /home route

/**
 * Fetch calendar notes by tutor ID from Java backend API
 * @param {number} tutorId - Tutor ID
 * @returns {Promise<Array>} Calendar notes array
 */
function fetchCalendarNotesByTutor(tutorId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: `/api/calendar-notes/tutor/${tutorId}`,
            method: 'GET',
            headers: {
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        resolve([]);
                    }
                } catch (error) {
                    console.error('Error parsing calendar notes:', error);
                    resolve([]);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error fetching calendar notes:', error);
            reject(error);
        });

        req.end();
    });
}

/**
 * Fetch calendar notes by date range from Java backend API
 * @param {string} startTime - Start time in ISO format
 * @param {string} endTime - End time in ISO format
 * @returns {Promise<Array>} Calendar notes array
 */
function fetchCalendarNotesByDateRange(startTime, endTime) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: `/api/calendar-notes/date-range?start=${encodeURIComponent(startTime)}&end=${encodeURIComponent(endTime)}`,
            method: 'GET',
            headers: {
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        resolve([]);
                    }
                } catch (error) {
                    console.error('Error parsing calendar notes:', error);
                    resolve([]);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error fetching calendar notes by date range:', error);
            reject(error);
        });

        req.end();
    });
}

/**
 * Fetch lessons by tutor ID from Java backend API
 * @param {number} tutorId - Tutor ID
 * @returns {Promise<Array>} Lessons array
 */
function fetchLessonsByTutor(tutorId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: `/api/lessons/tutor/${tutorId}`,
            method: 'GET',
            headers: {
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        resolve([]);
                    }
                } catch (error) {
                    console.error('Error parsing lessons:', error);
                    resolve([]);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error fetching lessons:', error);
            reject(error);
        });

        req.end();
    });
}

/**
 * Generic function to call Java backend API
 * @param {string} path - API path (e.g., '/api/lessons/tutor/1/paginated?limit=20')
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object} body - Request body for POST/PUT requests (optional)
 * @returns {Promise<any>} JSON response from Java API
 */
function callJavaAPI(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: path,
            method: method,
            headers: {
                'X-API-Key': JAVA_API_KEY,
                'Content-Type': 'application/json'
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(data));
                    } else {
                        console.error(`Java API error (${res.statusCode}):`, data);
                        resolve(method === 'GET' ? [] : null);
                    }
                } catch (error) {
                    console.error('Error parsing Java API response:', error);
                    resolve(method === 'GET' ? [] : null);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error calling Java API:', error);
            reject(error);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

/**
 * Fetch all lessons from Java backend API
 * @returns {Promise<Array>} All lessons array
 */
function fetchAllLessons() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: '/api/lessons',
            method: 'GET',
            headers: {
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        resolve([]);
                    }
                } catch (error) {
                    console.error('Error parsing lessons:', error);
                    resolve([]);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error fetching lessons:', error);
            reject(error);
        });

        req.end();
    });
}

/**
 * Fetch all prenotations from Java backend API
 * @returns {Promise<Array>} All prenotations array
 */
function fetchAllPrenotations() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: '/api/prenotations',
            method: 'GET',
            headers: {
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        resolve([]);
                    }
                } catch (error) {
                    console.error('Error parsing prenotations:', error);
                    resolve([]);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error fetching prenotations:', error);
            reject(error);
        });

        req.end();
    });
}

/**
 * Fetch prenotations by tutor ID from Java backend API
 * @param {number} tutorId - Tutor ID
 * @returns {Promise<Array>} Prenotations array
 */
function fetchPrenotationsByTutor(tutorId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: `/api/prenotations/tutor/${tutorId}`,
            method: 'GET',
            headers: {
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        resolve([]);
                    }
                } catch (error) {
                    console.error('Error parsing prenotations:', error);
                    resolve([]);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error fetching prenotations:', error);
            reject(error);
        });

        req.end();
    });
}

/**
 * Fetch student data from Java backend API
 * @param {number} studentId - Student ID
 * @returns {Promise<object|null>} Student data if found, null otherwise
 */
function fetchStudentData(studentId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: `/api/students/${studentId}`,
            method: 'GET',
            headers: {
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    console.error('Error parsing student data:', error);
                    resolve(null);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error fetching student data:', error);
            reject(error);
        });

        req.end();
    });
}

/**
 * Fetch all students from Java backend API
 * @returns {Promise<Array>} All students array
 */
function fetchAllStudents() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: '/api/students',
            method: 'GET',
            headers: {
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        resolve([]);
                    }
                } catch (error) {
                    console.error('Error parsing students:', error);
                    resolve([]);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error fetching students:', error);
            reject(error);
        });

        req.end();
    });
}

// 404 page handler
app.use((req,res) => {
    res.status(404).render('404', {
        user: req.session.userId ? {
            userId: req.session.userId,
            username: req.session.username,
            role: req.session.role
        } : null,
        isAuthenticated: !!req.session.userId
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Tutorly server running at http://localhost:${PORT}`);
});

module.exports = app;
