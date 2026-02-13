

module.exports = {
    // Java Backend API configuration
    JAVA_API_URL: 'https://localhost:8443',
    JAVA_API_KEY: 'MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu',
    
    // Server configuration
    PORT: process.env.PORT || 3000,
    
    // Session configuration
    TUTOR_SESSION_SECRET: 'tutorly-tutor-secret-key-change-in-production',
    ADMIN_SESSION_SECRET: 'tutorly-admin-secret-key-change-in-production',
    
    // Session durations (in milliseconds)
    TUTOR_SESSION_DURATION: 1000 * 60 * 60 * 24 * 30, // 30 days
    ADMIN_SESSION_DURATION: 1000 * 60 * 60 * 1 // 1 hour
};
