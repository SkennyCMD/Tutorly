/**
 * Migration script to hash existing plain-text passwords in the database
 * 
 * ⚠️ WARNING: This script should be run ONLY ONCE to migrate existing passwords
 * After running this script, all passwords will be hashed with bcrypt
 * 
 * Usage: node migrations/hashExistingPasswords.js
 */

const { hashPassword } = require('../server_utilities/passwordService');
const { fetchFromJavaAPI } = require('../server_utilities/javaApiService');

async function hashExistingPasswords() {
    console.log('\x1b[33m========================================\x1b[0m');
    console.log('\x1b[33m  Password Migration Script\x1b[0m');
    console.log('\x1b[33m========================================\x1b[0m\n');

    try {
        // Fetch all tutors
        console.log('\x1b[36mFetching all tutors...\x1b[0m');
        const tutors = await fetchFromJavaAPI('/api/tutors', 'GET');
        
        if (!tutors || tutors.length === 0) {
            console.log('\x1b[33mNo tutors found in database.\x1b[0m');
            return;
        }

        console.log(`\x1b[36mFound ${tutors.length} tutors\x1b[0m\n`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const tutor of tutors) {
            // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
            if (tutor.password && tutor.password.startsWith('$2')) {
                console.log(`\x1b[90m[SKIP]\x1b[0m ${tutor.username} - Already hashed`);
                skippedCount++;
                continue;
            }

            // Hash the password
            console.log(`\x1b[38;5;214m[HASH]\x1b[0m ${tutor.username}...`);
            const hashedPassword = await hashPassword(tutor.password);

            // Update tutor with hashed password
            const updatedTutor = {
                ...tutor,
                password: hashedPassword
            };

            await fetchFromJavaAPI(`/api/tutors/${tutor.id}`, 'PUT', updatedTutor);
            console.log(`\x1b[32m[SUCCESS]\x1b[0m ${tutor.username} - Password hashed and updated`);
            updatedCount++;
        }

        // Fetch all admins
        console.log('\n\x1b[36mFetching all admins...\x1b[0m');
        const admins = await fetchFromJavaAPI('/api/admins', 'GET');
        
        if (!admins || admins.length === 0) {
            console.log('\x1b[33mNo admins found in database.\x1b[0m');
        } else {
            console.log(`\x1b[36mFound ${admins.length} admins\x1b[0m\n`);

            for (const admin of admins) {
                // Check if password is already hashed
                if (admin.password && admin.password.startsWith('$2')) {
                    console.log(`\x1b[90m[SKIP]\x1b[0m Admin ${admin.username} - Already hashed`);
                    skippedCount++;
                    continue;
                }

                // Hash the password
                console.log(`\x1b[38;5;214m[HASH]\x1b[0m Admin ${admin.username}...`);
                const hashedPassword = await hashPassword(admin.password);

                // Update admin with hashed password
                const updatedAdmin = {
                    ...admin,
                    password: hashedPassword
                };

                await fetchFromJavaAPI(`/api/admins/${admin.id}`, 'PUT', updatedAdmin);
                console.log(`\x1b[32m[SUCCESS]\x1b[0m Admin ${admin.username} - Password hashed and updated`);
                updatedCount++;
            }
        }

        console.log('\n\x1b[33m========================================\x1b[0m');
        console.log('\x1b[32m  Migration Complete!\x1b[0m');
        console.log(`\x1b[32m  Updated: ${updatedCount}\x1b[0m`);
        console.log(`\x1b[90m  Skipped: ${skippedCount}\x1b[0m`);
        console.log('\x1b[33m========================================\x1b[0m\n');

    } catch (error) {
        console.error('\x1b[31m[ERROR]\x1b[0m Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run migration
hashExistingPasswords()
    .then(() => {
        console.log('\x1b[32mMigration script completed successfully\x1b[0m');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\x1b[31mMigration script failed:\x1b[0m', error);
        process.exit(1);
    });
