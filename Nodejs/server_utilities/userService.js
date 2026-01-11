const bcrypt = require('bcrypt');

/**
 * Utility per generare l'hash di una password
 */
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * Utility per verificare una password
 */
async function verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

/**
 * Mock database degli utenti
 * In produzione, sostituire con un vero database (PostgreSQL, MongoDB, ecc.)
 */
const users = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@tutorly.com',
        password: '$2b$10$8kZqhQxVXYvR5EJ5YhZN3.RJBY7qXy2GZXzqwM6IqYGjXLqRIqK6G', // admin123
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User'
    },
    {
        id: 2,
        username: 'student',
        email: 'student@tutorly.com',
        password: '$2b$10$8kZqhQxVXYvR5EJ5YhZN3.RJBY7qXy2GZXzqwM6IqYGjXLqRIqK6G', // admin123
        role: 'student',
        firstName: 'Mario',
        lastName: 'Rossi'
    },
    {
        id: 3,
        username: 'tutor',
        email: 'tutor@tutorly.com',
        password: '$2b$10$8kZqhQxVXYvR5EJ5YhZN3.RJBY7qXy2GZXzqwM6IqYGjXLqRIqK6G', // admin123
        role: 'tutor',
        firstName: 'Giulia',
        lastName: 'Bianchi'
    }
];

/**
 * Trova un utente per username o email
 */
function findUserByUsername(username) {
    return users.find(u => u.username === username || u.email === username);
}

/**
 * Trova un utente per ID
 */
function findUserById(id) {
    return users.find(u => u.id === id);
}

/**
 * Trova tutti gli utenti (senza password)
 */
function getAllUsers() {
    return users.map(({ password, ...user }) => user);
}

module.exports = {
    hashPassword,
    verifyPassword,
    findUserByUsername,
    findUserById,
    getAllUsers,
    users
};
