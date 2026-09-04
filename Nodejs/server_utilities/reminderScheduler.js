/**
 *
 * Daily Reminder Notifications
 *
 *
 * Every day at a configurable local time (REMINDER_TIME, in the TIMEZONE - see
 * config.js), sends a push notification for every prenotation and calendar note
 * whose startTime falls on that same day, to whoever it concerns:
 * - Prenotations: the assigned tutor, and the student's linked GUEST (if any).
 * - Calendar notes: every tutor assigned to it (no exclusions - unlike the
 *   creation-time notification, this is a same-day reminder for everyone
 *   concerned, including whoever created it if they're also assigned).
 *
 * This is the first scheduled/recurring job in the app - self-initializing at
 * require-time (like pushService.js configures VAPID at load), so a single
 * `require('../server_utilities/reminderScheduler')` in index.js wires it up.
 *
 * @module reminderScheduler
 *
 */

const cron = require('node-cron');
const { REMINDER_TIME, TIMEZONE } = require('./config');
const { sendPushToUser } = require('./pushService');
const {
    fetchPrenotationsByDateRange,
    fetchCalendarNotesByDateRange,
    fetchStudentData
} = require('./javaApiService');

// REMINDER_TIME is "HH:MM" (24h) - built into a cron expression at load time, so both
// the time and the timezone the job runs in come from config.js/.env, never hardcoded.
const [reminderHour, reminderMinute] = REMINDER_TIME.split(':').map(Number);

cron.schedule(`${reminderMinute} ${reminderHour} * * *`, () => {
    sendDailyReminders().catch((error) => {
        console.error('[reminderScheduler] Daily reminder job failed:', error.message);
    });
}, { timezone: TIMEZONE });

console.log(`[reminderScheduler] Daily reminders scheduled for ${REMINDER_TIME} (${TIMEZONE})`);

/**
 * Extract "HH:MM" from a "YYYY-MM-DDTHH:MM:SS" datetime string, for the
 * reminder body (the date itself is redundant - the reminder already implies today).
 * @param {string} dateTimeStr
 * @returns {string}
 */
function formatReminderTime(dateTimeStr) {
    return dateTimeStr.split('T')[1].slice(0, 5);
}

/**
 * Fetch today's prenotations and calendar notes and push a reminder for each
 * to whoever it concerns. Exported for manual/on-demand triggering (e.g. from
 * a Node REPL) without waiting for the schedule.
 *
 * @returns {Promise<void>}
 */
async function sendDailyReminders() {
    // Today's local start/end, same formula the /home route already uses for
    // "today's lessons/prenotations/notes" (server-local calendar day).
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const startTime = startOfDay.toISOString().slice(0, 19);
    const endTime = endOfDay.toISOString().slice(0, 19);

    const [prenotations, notes] = await Promise.all([
        fetchPrenotationsByDateRange(startTime, endTime),
        fetchCalendarNotesByDateRange(startTime, endTime)
    ]);

    // Fetch each unique student referenced today only once, not once per prenotation
    const uniqueStudentIds = [...new Set(prenotations.map(p => p.studentId).filter(Boolean))];
    const studentEntries = await Promise.all(uniqueStudentIds.map(async id => [id, await fetchStudentData(id)]));
    const studentById = new Map(studentEntries);

    prenotations.forEach((prenotation) => {
        const student = prenotation.studentId ? studentById.get(prenotation.studentId) : null;
        const studentName = student ? `${student.name} ${student.surname}` : 'Unknown';
        const payload = {
            title: 'Reminder: Prenotation Today',
            body: `For: ${studentName}\nAt: ${formatReminderTime(prenotation.startTime)}`,
            url: '/calendar',
            tag: `reminder-prenotation-${prenotation.id}`
        };
        sendPushToUser(prenotation.tutorId, payload);
        if (student && student.userId) {
            sendPushToUser(student.userId, payload);
        }
    });

    notes.forEach((note) => {
        const payload = {
            title: 'Reminder: Note Today',
            body: note.description,
            url: '/calendar',
            tag: `reminder-note-${note.id}`
        };
        (note.tutors || []).forEach((tutor) => sendPushToUser(tutor.id, payload));
    });
}

module.exports = { sendDailyReminders };
