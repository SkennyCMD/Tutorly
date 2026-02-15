/**
 *
 * Java Backend API Service
 *
 * 
 * Client service for communicating with the Java Spring Boot backend API.
 * Provides a collection of functions to fetch and manipulate data from the
 * backend database through REST API endpoints.
 * 
 * Features:
 * - Generic HTTPS request wrapper for all API calls
 * - Automatic JSON parsing and error handling
 * - Self-signed SSL certificate support
 * - API key authentication for all requests
 * - Specialized functions for tutors, students, lessons, prenotations, notes
 * 
 * Architecture:
 * - Node.js Express server (this code) <--> Java Spring Boot API (port 8443)
 * - All requests use HTTPS with X-API-Key header authentication
 * - Backend database: PostgreSQL
 * 
 * Configuration:
 * - JAVA_API_URL: Base URL of Java backend (https://localhost:8443)
 * - JAVA_API_KEY: API key for authentication
 * 
 * Error Handling:
 * - Network errors: Logged and rejected
 * - HTTP errors (non-2xx): Logged with status code and rejected
 * - Parse errors: Logged and rejected
 * - Empty responses: Resolved as empty arrays or null
 * 
 * @module javaApiService
 *
 */

const https = require('https');
const { JAVA_API_URL, JAVA_API_KEY } = require('./config');


// Core API Communication


/**
 * Generic function to fetch data from Java backend API.
 * 
 * This is the core utility function used by all other API functions.
 * Handles HTTPS requests with proper headers, error handling, and JSON parsing.
 * 
 * @param {string} path - API endpoint path (e.g., '/api/prenotations', '/api/tutors/123')
 * @param {string} method - HTTP method: GET, POST, PUT, PATCH, or DELETE (default: 'GET')
 * @param {object} data - Request body data for POST/PUT/PATCH requests (optional, auto-stringified)
 * @returns {Promise<any|null>} Parsed JSON response data if successful, null for empty responses
 * @throws {Error} Rejects with error on network failure, HTTP error, or parse failure
 * 
 * @example
 * // GET request
 * const tutors = await fetchFromJavaAPI('/api/tutors', 'GET');
 * 
 * @example
 * // POST request with data
 * const newLesson = await fetchFromJavaAPI('/api/lessons', 'POST', {
 *   tutorId: 5,
 *   studentId: 10,
 *   startTime: '2024-09-01T10:00:00',
 *   endTime: '2024-09-01T11:00:00'
 * });
 */
function fetchFromJavaAPI(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        // Stringify request body if data is provided
        const postData = data ? JSON.stringify(data) : null;
        
        // Configure HTTPS request options
        const options = {
            hostname: 'localhost',
            port: 8443,                          // Java backend port
            path: path,
            method: method,
            headers: {
                'X-API-Key': JAVA_API_KEY         // API key authentication
            },
            rejectUnauthorized: false            // Accept self-signed SSL certificate
        };

        // Add Content-Type and Content-Length headers for requests with body
        if (postData) {
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        // Create and send HTTPS request
        const req = https.request(options, (res) => {
            let responseData = '';

            // Accumulate response data chunks
            res.on('data', (chunk) => {
                responseData += chunk;
            });

            // Process complete response
            res.on('end', () => {
                try {
                    // Check for successful HTTP status (2xx)
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        // Parse JSON response if present, otherwise return null
                        if (responseData) {
                            resolve(JSON.parse(responseData));
                        } else {
                            resolve(null);
                        }
                    } else {
                        // HTTP error - log and reject with status code
                        console.error(`Error ${method} ${path}: ${res.statusCode}`);
                        const error = new Error(`HTTP ${res.statusCode}`);
                        error.statusCode = res.statusCode;
                        reject(error);
                    }
                } catch (error) {
                    // JSON parsing error - log and reject
                    console.error(`Error parsing data from ${path}:`, error);
                    reject(error);
                }
            });
        });

        // Handle network errors (connection refused, timeout, etc.)
        req.on('error', (error) => {
            console.error(`Error ${method} ${path}:`, error);
            reject(error);
        });

        // Write request body if present
        if (postData) {
            req.write(postData);
        }
        
        // Send the request
        req.end();
    });
}


// Tutor Data Operations


/**
 * Fetch a single tutor's data by ID from Java backend API.
 * 
 * @param {number} tutorId - Unique tutor ID from database
 * @returns {Promise<object|null>} Tutor object if found, null if not found or error
 * 
 * @example
 * const tutor = await fetchTutorData(5);
 * // Returns: { id: 5, username: 'mario.rossi', email: '...', ... }
 */
function fetchTutorData(tutorId) {
    return fetchFromJavaAPI(`/api/tutors/${tutorId}`, 'GET');
}


// Calendar Notes Operations


/**
 * Fetch all calendar notes for a specific tutor.
 * 
 * Calendar notes are personal notes attached to specific dates on the calendar.
 * Returns empty array if no notes found or on error.
 * 
 * @param {number} tutorId - Unique tutor ID
 * @returns {Promise<Array>} Array of calendar note objects, empty array on error
 * 
 * @example
 * const notes = await fetchCalendarNotesByTutor(5);
 * // Returns: [{ id: 1, tutorId: 5, date: '2024-09-01', note: 'Meeting', ... }]
 */
function fetchCalendarNotesByTutor(tutorId) {
    return fetchFromJavaAPI(`/api/calendar-notes/tutor/${tutorId}`, 'GET')
        .then(data => data || [])   // Convert null to empty array
        .catch(error => {
            console.error('Error fetching calendar notes:', error);
            return [];               // Return empty array on error
        });
}

/**
 * Fetch calendar notes within a specific date range.
 * 
 * Useful for fetching notes for a week or month view on the calendar.
 * Returns empty array if no notes found or on error.
 * 
 * @param {string} startTime - Start time in ISO 8601 format (e.g., '2024-09-01T00:00:00')
 * @param {string} endTime - End time in ISO 8601 format (e.g., '2024-09-30T23:59:59')
 * @returns {Promise<Array>} Array of calendar note objects within the range
 * 
 * @example
 * const notes = await fetchCalendarNotesByDateRange(
 *   '2024-09-01T00:00:00',
 *   '2024-09-30T23:59:59'
 * );
 * // Returns notes for September 2024
 */
function fetchCalendarNotesByDateRange(startTime, endTime) {
    return fetchFromJavaAPI(`/api/calendar-notes/date-range?startTime=${startTime}&endTime=${endTime}`, 'GET')
        .then(data => data || [])
        .catch(error => {
            console.error('Error fetching calendar notes:', error);
            return [];
        });
}


// Lessons Operations


/**
 * Fetch all lessons for a specific tutor.
 * 
 * Lessons are completed/historical tutoring sessions.
 * Returns empty array if no lessons found or on error.
 * 
 * @param {number} tutorId - Unique tutor ID
 * @returns {Promise<Array>} Array of lesson objects for this tutor
 * 
 * @example
 * const lessons = await fetchLessonsByTutor(5);
 * // Returns: [{ id: 1, tutorId: 5, studentId: 10, startTime: '...', ... }]
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
 * Fetch all lessons from the entire database.
 * 
 * Used for generating comprehensive reports, statistics,
 * or admin views that need to see all tutoring activity.
 * Returns empty array if no lessons found or on error.
 * 
 * @returns {Promise<Array>} Array of all lesson objects in the database
 * 
 * @example
 * const allLessons = await fetchAllLessons();
 * // Returns: [{ id: 1, tutorId: 5, studentId: 10, ... }, { id: 2, ... }]
 */
function fetchAllLessons() {
    return fetchFromJavaAPI('/api/lessons', 'GET')
        .then(data => data || [])
        .catch(error => {
            console.error('Error fetching lessons:', error);
            return [];
        });
}


// Prenotations Operations


/**
 * Fetch all prenotations (bookings) from the database.
 * 
 * Prenotations are scheduled/future tutoring sessions that haven't occurred yet.
 * Different from lessons which are completed sessions.
 * Returns empty array if no prenotations found or on error.
 * 
 * @returns {Promise<Array>} Array of all prenotation objects
 * 
 * @example
 * const bookings = await fetchAllPrenotations();
 * // Returns: [{ id: 1, tutorId: 5, studentId: 10, startTime: '...', ... }]
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
 * Fetch all prenotations (bookings) for a specific tutor.
 * 
 * Returns empty array if no prenotations found or on error.
 * 
 * @param {number} tutorId - Unique tutor ID
 * @returns {Promise<Array>} Array of prenotation objects for this tutor
 * 
 * @example
 * const myBookings = await fetchPrenotationsByTutor(5);
 * // Returns tutor 5's upcoming scheduled sessions
 */
function fetchPrenotationsByTutor(tutorId) {
    return fetchFromJavaAPI(`/api/prenotations/tutor/${tutorId}`, 'GET')
        .then(data => data || [])
        .catch(error => {
            console.error('Error fetching prenotations:', error);
            return [];
        });
}


// Student Data Operations


/**
 * Fetch a single student's data by ID from Java backend API.
 * 
 * @param {number} studentId - Unique student ID from database
 * @returns {Promise<object|null>} Student object if found, null if not found or error
 * 
 * @example
 * const student = await fetchStudentData(10);
 * // Returns: { id: 10, name: 'Giovanni', surname: 'Bianchi', studentClass: 'M', ... }
 */
function fetchStudentData(studentId) {
    return fetchFromJavaAPI(`/api/students/${studentId}`, 'GET');
}

/**
 * Fetch all students from the entire database.
 * 
 * Used for student search functionality, admin panels,
 * or generating comprehensive reports.
 * Returns empty array if no students found or on error.
 * 
 * @returns {Promise<Array>} Array of all student objects in the database
 * 
 * @example
 * const allStudents = await fetchAllStudents();
 * // Returns: [{ id: 10, name: 'Giovanni', surname: 'Bianchi', ... }, { id: 11, ... }]
 */
function fetchAllStudents() {
    return fetchFromJavaAPI('/api/students', 'GET')
        .then(data => data || [])
        .catch(error => {
            console.error('Error fetching students:', error);
            return [];
        });
}


// Module Exports


/**
 * Export Java API service functions.
 * 
 * Core Function:
 * - fetchFromJavaAPI: Generic API request handler
 * 
 * Entity-Specific Functions:
 * - Tutors: fetchTutorData
 * - Students: fetchStudentData, fetchAllStudents
 * - Lessons: fetchLessonsByTutor, fetchAllLessons
 * - Prenotations: fetchAllPrenotations, fetchPrenotationsByTutor
 * - Calendar Notes: fetchCalendarNotesByTutor, fetchCalendarNotesByDateRange
 * 
 * Usage Pattern:
 * All functions return Promises that resolve to data or reject with errors.
 * List functions return empty arrays on error for safe iteration.
 * Single-item functions return null on not found.
 */
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
