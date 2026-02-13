const https = require('https');
const { JAVA_API_URL, JAVA_API_KEY } = require('./config');

/**
 * Generic function to fetch data from Java backend API
 * @param {string} path - API path (e.g., '/api/prenotations')
 * @param {string} method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param {object} data - Request body for POST/PUT/PATCH requests (optional)
 * @returns {Promise<any|null>} Parsed JSON data if successful, null otherwise
 */
function fetchFromJavaAPI(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const postData = data ? JSON.stringify(data) : null;
        
        const options = {
            hostname: 'localhost',
            port: 8443,
            path: path,
            method: method,
            headers: {
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };

        if (postData) {
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        if (responseData) {
                            resolve(JSON.parse(responseData));
                        } else {
                            resolve(null);
                        }
                    } else {
                        console.error(`Error ${method} ${path}: ${res.statusCode}`);
                        const error = new Error(`HTTP ${res.statusCode}`);
                        error.statusCode = res.statusCode;
                        reject(error);
                    }
                } catch (error) {
                    console.error(`Error parsing data from ${path}:`, error);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error(`Error ${method} ${path}:`, error);
            reject(error);
        });

        if (postData) {
            req.write(postData);
        }
        
        req.end();
    });
}

/**
 * Fetch tutor data from Java backend API
 * @param {number} tutorId - Tutor ID
 * @returns {Promise<object|null>} Tutor data if found, null otherwise
 */
function fetchTutorData(tutorId) {
    return fetchFromJavaAPI(`/api/tutors/${tutorId}`, 'GET');
}

/**
 * Fetch calendar notes by tutor ID
 * @param {number} tutorId - Tutor ID
 * @returns {Promise<Array>} Calendar notes array
 */
function fetchCalendarNotesByTutor(tutorId) {
    return fetchFromJavaAPI(`/api/calendar-notes/tutor/${tutorId}`, 'GET')
        .then(data => data || [])
        .catch(error => {
            console.error('Error fetching calendar notes:', error);
            return [];
        });
}

/**
 * Fetch calendar notes by date range from Java backend API
 * @param {string} startTime - Start time in ISO format
 * @param {string} endTime - End time in ISO format
 * @returns {Promise<Array>} Calendar notes array
 */
function fetchCalendarNotesByDateRange(startTime, endTime) {
    return fetchFromJavaAPI(`/api/calendar-notes/date-range?startTime=${startTime}&endTime=${endTime}`, 'GET')
        .then(data => data || [])
        .catch(error => {
            console.error('Error fetching calendar notes:', error);
            return [];
        });
}

/**
 * Fetch lessons by tutor ID
 * @param {number} tutorId - Tutor ID
 * @returns {Promise<Array>} Lessons array
 */
function fetchLessonsByTutor(tutorId) {
    return fetchFromJavaAPI(`/api/lessons/tutor/${tutorId}`, 'GET')
        .then(data => data || [])
        .catch(error => {
            console.error('Error fetching lessons:', error);
            return [];
        });
}

/**
 * Fetch all lessons from Java backend API
 * @returns {Promise<Array>} All lessons array
 */
function fetchAllLessons() {
    return fetchFromJavaAPI('/api/lessons', 'GET')
        .then(data => data || [])
        .catch(error => {
            console.error('Error fetching lessons:', error);
            return [];
        });
}

/**
 * Fetch all prenotations from Java backend API
 * @returns {Promise<Array>} All prenotations array
 */
function fetchAllPrenotations() {
    return fetchFromJavaAPI('/api/prenotations', 'GET')
        .then(data => data || [])
        .catch(error => {
            console.error('Error fetching prenotations:', error);
            return [];
        });
}

/**
 * Fetch prenotations by tutor ID from Java backend API
 * @param {number} tutorId - Tutor ID
 * @returns {Promise<Array>} Prenotations array
 */
function fetchPrenotationsByTutor(tutorId) {
    return fetchFromJavaAPI(`/api/prenotations/tutor/${tutorId}`, 'GET')
        .then(data => data || [])
        .catch(error => {
            console.error('Error fetching prenotations:', error);
            return [];
        });
}

/**
 * Fetch student data from Java backend API
 * @param {number} studentId - Student ID
 * @returns {Promise<object|null>} Student data if found, null otherwise
 */
function fetchStudentData(studentId) {
    return fetchFromJavaAPI(`/api/students/${studentId}`, 'GET');
}

/**
 * Fetch all students from Java backend API
 * @returns {Promise<Array>} All students array
 */
function fetchAllStudents() {
    return fetchFromJavaAPI('/api/students', 'GET')
        .then(data => data || [])
        .catch(error => {
            console.error('Error fetching students:', error);
            return [];
        });
}

module.exports = {
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
};
