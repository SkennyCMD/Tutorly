const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const https = require('https');

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

app.get('/home', isAuthenticated, async (req, res) => {
    try {
        // Fetch tutor data to get the role
        const tutorData = await fetchTutorData(req.session.userId);
        
        res.render('home', {
            username: req.session.username,
            userId: req.session.userId,
            role: tutorData ? tutorData.role : 'GENERIC'
        });
    } catch (error) {
        console.error('Error fetching tutor data:', error);
        res.render('home', {
            username: req.session.username,
            userId: req.session.userId,
            role: 'GENERIC'
        });
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

// API endpoint to get all students
app.get('/api/students', isAuthenticated, async (req, res) => {
    try {
        const students = await fetchAllStudents();
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// API endpoint to create a new lesson
app.post('/api/lessons', isAuthenticated, async (req, res) => {
    try {
        const { studentId, description, startTime, endTime } = req.body;
        const tutorId = req.session.userId;
        
        // Format datetime properly (assuming time inputs are HH:MM format)
        const today = new Date();
        const [startHour, startMinute] = startTime.split(':');
        const [endHour, endMinute] = endTime.split(':');
        
        const startDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(startHour), parseInt(startMinute), 0);
        const endDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(endHour), parseInt(endMinute), 0);
        
        const lessonData = {
            description: description || '',
            startTime: startDateTime.toISOString().slice(0, 19),
            endTime: endDateTime.toISOString().slice(0, 19),
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

// API endpoint to get today's tasks (calendar notes) for the logged-in tutor
app.get('/api/tasks/today', isAuthenticated, async (req, res) => {
    try {
        const tutorId = req.session.userId;
        
        // Fetch tutor data to check role
        const tutorData = await fetchTutorData(tutorId);
        const isStaff = tutorData && tutorData.role === 'STAFF';
        
        // Get today's date range (start and end of day)
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        
        // Format dates as ISO strings
        const startTime = startOfDay.toISOString().slice(0, 19);
        const endTime = endOfDay.toISOString().slice(0, 19);
        
        let calendarNotes = [];
        
        if (isStaff) {
            // If STAFF, get all calendar notes for today
            calendarNotes = await fetchCalendarNotesByDateRange(startTime, endTime);
        } else {
            // Otherwise, get only calendar notes for this tutor
            const allNotes = await fetchCalendarNotesByTutor(tutorId);
            // Filter to only today's notes
            calendarNotes = allNotes.filter(note => {
                const noteStart = new Date(note.startTime);
                return noteStart >= startOfDay && noteStart <= endOfDay;
            });
        }
        
        // Convert calendar notes to tasks format
        const tasks = calendarNotes.map(note => ({
            id: note.id,
            text: note.description || 'No description',
            completed: false, // You can add logic for completed status if needed
            startTime: note.startTime,
            endTime: note.endTime
        }));
        
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// API endpoint to get today's lessons (lessons + prenotations) for the logged-in tutor
app.get('/api/lessons/today', isAuthenticated, async (req, res) => {
    try {
        const tutorId = req.session.userId;
        
        // Get today's date range (start and end of day)
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        
        // Fetch lessons and prenotations for this tutor
        const allLessons = await fetchAllLessons();
        const allPrenotations = await fetchAllPrenotations();
        
        // Filter by tutor ID
        const lessons = allLessons.filter(lesson => lesson.tutorId === tutorId);
        const prenotations = allPrenotations.filter(prenotation => prenotation.tutorId === tutorId);
        
        console.log('Lessons fetched for tutor', tutorId, ':', lessons.length);
        if (lessons.length > 0) {
            console.log('Sample lesson:', JSON.stringify(lessons[0], null, 2));
        }
        
        console.log('Prenotations fetched:', prenotations.length);
        if (prenotations.length > 0) {
            console.log('Sample prenotation:', JSON.stringify(prenotations[0], null, 2));
        }
        
        // Filter to only today's lessons and fetch student data
        const todayLessonsPromises = lessons.filter(lesson => {
            const lessonStart = new Date(lesson.startTime);
            return lessonStart >= startOfDay && lessonStart <= endOfDay;
        }).map(async lesson => {
            console.log('Processing lesson:', lesson);
            
            // Use the new studentId field from the Java entity
            const studentId = lesson.studentId;
            
            console.log('Extracted student ID:', studentId);
            
            const student = studentId ? await fetchStudentData(studentId) : null;
            console.log('Fetched student data:', student);
            
            return {
                id: `lesson-${lesson.id}`,
                firstName: student?.name || 'Unknown',
                lastName: student?.surname || '',
                classType: student?.studentClass || 'N/A',
                startTime: new Date(lesson.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                endTime: new Date(lesson.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                type: 'lesson',
                status: 'Done'
            };
        });
        
        // Filter to only today's prenotations and fetch student data
        const todayPrenotationsPromises = prenotations.filter(prenotation => {
            const prenotationStart = new Date(prenotation.startTime);
            return prenotationStart >= startOfDay && prenotationStart <= endOfDay;
        }).map(async prenotation => {
            console.log('Processing prenotation:', prenotation);
            
            // Use the new studentId field from the Java entity
            const studentId = prenotation.studentId;
            
            console.log('Extracted student ID:', studentId);
            
            const student = studentId ? await fetchStudentData(studentId) : null;
            console.log('Fetched student data:', student);
            
            return {
                id: `prenotation-${prenotation.id}`,
                firstName: student?.name || 'Unknown',
                lastName: student?.surname || '',
                classType: student?.studentClass || 'N/A',
                startTime: new Date(prenotation.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                endTime: new Date(prenotation.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                type: 'prenotation',
                confirmed: prenotation.flag,
                status: prenotation.flag ? 'Confirmed' : 'Pending'
            };
        });
        
        // Wait for all student data to be fetched
        const todayLessons = await Promise.all(todayLessonsPromises);
        const todayPrenotations = await Promise.all(todayPrenotationsPromises);
        
        // Combine and sort by start time
        const combinedLessons = [...todayLessons, ...todayPrenotations].sort((a, b) => {
            return a.startTime.localeCompare(b.startTime);
        });
        
        res.json(combinedLessons);
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({ error: 'Failed to fetch lessons' });
    }
});

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

// Start server
app.listen(PORT, () => {
    console.log(`Tutorly server running at http://localhost:${PORT}`);
});

module.exports = app;
