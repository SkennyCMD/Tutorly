# Database Migrations

This file explain how to migrate the database.

---

**Document**: 06_Database_Migrations.md  
**Last Updated**: February 25, 2026  
**Version**: 1.0.0  
**Author**: Tutorly Development Team  

---

## Available Migrations

### `hashExistingPasswords.js` 
Migrates plain-text passwords to bcrypt-hashed passwords in the database.

**⚠️ IMPORTANT:** This script should be run **ONLY ONCE** after implementing bcrypt authentication.

#### When to run:
- After updating to the bcrypt authentication system
- If you have existing users with plain-text passwords in the database
- Before deploying to production

#### Before running:
1. **Make a backup of your database**
2. Ensure the Java API server is running (`localhost:8443`)
3. Ensure you have the correct API key in `server_utilities/config.js`

#### How to run:
```bash
cd Nodejs
node migrations/hashExistingPasswords.js
```

#### What it does:
1. Fetches all tutors from the database
2. Checks if each password is already hashed (bcrypt hashes start with `$2`)
3. Skips already-hashed passwords
4. Hashes plain-text passwords using bcrypt
5. Updates each user with the hashed password
6. Repeats the process for admin users
7. Provides a colored summary of the migration

#### Output example:
```
========================================
  Password Migration Script
========================================

Fetching all tutors...
Found 5 tutors

[HASH] john_doe...
[SUCCESS] john_doe - Password hashed and updated
[SKIP] jane_smith - Already hashed
[HASH] bob_tutor...
[SUCCESS] bob_tutor - Password hashed and updated

Fetching all admins...
Found 2 admins

[HASH] Admin admin1...
[SUCCESS] Admin admin1 - Password hashed and updated

========================================
  Migration Complete!
  Updated: 3
  Skipped: 2
========================================
```

#### Troubleshooting:
- **Error: Cannot connect to Java API**: Ensure the Java backend is running on port 8443
- **Error: API key invalid**: Check the `JAVA_API_KEY` in `server_utilities/config.js`
- **Error: User not found**: The Java API may have changed its endpoints

#### Safety features:
- Auto-detects already hashed passwords and skips them
- Can be run multiple times safely (won't double-hash)
- Provides detailed logging of all operations
- Exits with error code if migration fails

---

## Creating New Migrations

When creating a new migration script:

1. Create a new file in this folder with a descriptive name (e.g., `addNewField.js`)
2. Add a detailed comment block explaining what it does
3. Include safety checks and rollback instructions
4. Document it in this README
5. Test on a development database first
6. Always recommend backing up before running

### Migration template:
```javascript
/**
 * Migration: [Description]
 * 
 * ⚠️ WARNING: [Important warnings]
 * 
 * Usage: node migrations/[filename].js
 */

async function migrate() {
    try {
        // Migration logic here
        console.log('Migration complete');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
```
---

**Navigation**  
⬅️ **Previous**: [05_Service_Modules.md](05_Service_Modules.md) | **Next**: [07_Database_Configuration.md](07_Database_Configuration.md) ➡️  
🏠 **Home**: [Documentation Index](README.md)

---

**Last Updated**: February 25, 2026  