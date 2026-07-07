const fs = require('fs');
const path = require('path');
const session = require('express-session');

class FileSessionStore extends session.Store {
    constructor(filePath) {
        super();
        this.filePath = filePath;
        this.sessions = this.loadSessions();
        this.cleanupExpiredSessions();
        this.saveSessions();
    }

    loadSessions() {
        try {
            if (!fs.existsSync(this.filePath)) {
                return {};
            }

            const raw = fs.readFileSync(this.filePath, 'utf8');
            return raw ? JSON.parse(raw) : {};
        } catch (error) {
            console.warn('Could not load session store, starting fresh:', error.message);
            return {};
        }
    }

    saveSessions() {
        try {
            fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
            const tempPath = `${this.filePath}.tmp`;
            fs.writeFileSync(tempPath, JSON.stringify(this.sessions, null, 2));
            fs.renameSync(tempPath, this.filePath);
        } catch (error) {
            console.warn('Could not save session store:', error.message);
        }
    }

    isExpired(sessionData) {
        const expiresAt = sessionData?.cookie?.expires;
        if (!expiresAt) {
            return false;
        }

        return new Date(expiresAt).getTime() <= Date.now();
    }

    cleanupExpiredSessions() {
        let changed = false;

        for (const [sid, sessionData] of Object.entries(this.sessions)) {
            if (this.isExpired(sessionData)) {
                delete this.sessions[sid];
                changed = true;
            }
        }

        if (changed) {
            this.saveSessions();
        }
    }

    get(sid, callback) {
        try {
            const sessionData = this.sessions[sid];

            if (!sessionData) {
                return callback(null, null);
            }

            if (this.isExpired(sessionData)) {
                delete this.sessions[sid];
                this.saveSessions();
                return callback(null, null);
            }

            return callback(null, sessionData);
        } catch (error) {
            return callback(error);
        }
    }

    set(sid, sessionData, callback) {
        try {
            this.sessions[sid] = sessionData;
            this.saveSessions();
            return callback && callback(null);
        } catch (error) {
            return callback && callback(error);
        }
    }

    destroy(sid, callback) {
        try {
            delete this.sessions[sid];
            this.saveSessions();
            return callback && callback(null);
        } catch (error) {
            return callback && callback(error);
        }
    }

    touch(sid, sessionData, callback) {
        try {
            if (this.sessions[sid]) {
                this.sessions[sid].cookie = sessionData.cookie;
                this.saveSessions();
            }
            return callback && callback(null);
        } catch (error) {
            return callback && callback(error);
        }
    }

    clear(callback) {
        try {
            this.sessions = {};
            this.saveSessions();
            return callback && callback(null);
        } catch (error) {
            return callback && callback(error);
        }
    }
}

module.exports = FileSessionStore;