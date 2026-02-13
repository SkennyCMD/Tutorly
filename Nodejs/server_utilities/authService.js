const https = require('https');
const { JAVA_API_KEY } = require('./config');

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
 * Authenticate admin with Java backend API
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 * @returns {Promise<number|null>} Admin ID if authenticated, null otherwise
 */
function authenticateAdminWithJavaAPI(username, password) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            username: username,
            password: password
        });

        console.log('Java API Call (Admin):', {
            url: `https://localhost:8443/api/admins/login`,
            data: { username, password: '***' }
        });

        const options = {
            hostname: 'localhost',
            port: 8443,
            path: '/api/admins/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'X-API-Key': JAVA_API_KEY
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let data = '';

            console.log('Status Code API Java (Admin):', res.statusCode);

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('Java API Full Response (Admin):', data);
                
                try {
                    if (res.statusCode === 200) {
                        const adminId = data ? parseInt(data) : null;
                        console.log('Parsed Admin ID:', adminId);
                        resolve(adminId);
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
            console.error('Error calling Java API (Admin):', error);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

module.exports = {
    authenticateTutorWithJavaAPI,
    authenticateAdminWithJavaAPI
};
