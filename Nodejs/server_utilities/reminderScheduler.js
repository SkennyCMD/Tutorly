/**
 *
 * Reminder Notifications
 *
 *
 * Two independent scheduled jobs:
 *
 * 1. Daily reminders - every day at a configurable local time (REMINDER_TIME, in
 *    the TIMEZONE - see config.js), sends a push for every prenotation and
 *    calendar note whose startTime falls on that same day, to whoever it concerns:
 *    - Prenotations: the assigned tutor, and the student's linked GUEST (if any).
 *    - Calendar notes: every tutor assigned to it (no exclusions - unlike the
 *      creation-time notification, this is a same-day reminder for everyone
 *      concerned, including whoever created it if they're also assigned).
 *
 * 2. Upcoming-lesson reminders - checked every minute, sends a push to a
 *    prenotation's tutor and student exactly UPCOMING_LESSON_REMINDER_MINUTES
 *    before it starts (default 30). Unlike the daily job, the same prenotation
 *    must NOT be notified twice, so sent ids are tracked in memory (see
 *    `notifiedUpcomingIds` below) - this is intentionally not persisted to the
 *    database: it only needs to survive a few minutes per prenotation, and a
 *    Node restart in that narrow window is rare enough that, at worst, missing
 *    one "upcoming" push isn't worth a schema change for.
 *
 * This is the first scheduled/recurring job in the app - self-initializing at
 * require-time (like pushService.js configures VAPID at load), so a single
 * `require('../server_utilities/reminderScheduler')` in index.js wires up both.
 *
 * @module reminderScheduler
 *
 */

const cron = require('node-cron');
const { REMINDER_TIME, TIMEZONE, UPCOMING_LESSON_REMINDER_MINUTES } = require('./config');
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

cron.schedule('* * * * *', () => {
    sendUpcomingLessonReminders().catch((error) => {
        console.error('[reminderScheduler] Upcoming-lesson reminder job failed:', error.message);
    });
}, { timezone: TIMEZONE });

console.log(`[reminderScheduler] Upcoming-lesson reminders scheduled, ${UPCOMING_LESSON_REMINDER_MINUTES} minutes ahead, checked every minute (${TIMEZONE})`);

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
    // Today's calendar date in TIMEZONE (not the server's own OS timezone,
    // and not UTC) - same reasoning as toNaiveDateTimeString below: prenotation
    // startTime/endTime are naive local timestamps, so "today" has to be
    // today in Rome, built directly as a string rather than round-tripped
    // through a UTC-converting Date method.
    const todayParts = Object.fromEntries(
        naiveDateTimeFormatter.formatToParts(new Date()).map(({ type, value }) => [type, value])
    );
    const today = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;
    const startTime = `${today}T00:00:00`;
    const endTime = `${today}T23:59:59`;

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

// Prenotation id -> the Date this entry was added, so pruneNotifiedUpcomingIds()
// can drop it once the lesson is well in the past. Not persisted - see the
// module header for why an in-memory cache is an acceptable trade-off here.
const notifiedUpcomingIds = new Map();

// Entries only need to survive from "30 minutes before start" to "start time",
// so anything older than this is guaranteed to be done with and safe to drop -
// keeps the map from growing for the lifetime of the process.
const NOTIFIED_IDS_MAX_AGE_MS = 2 * 60 * 60 * 1000;

function pruneNotifiedUpcomingIds() {
    const cutoff = Date.now() - NOTIFIED_IDS_MAX_AGE_MS;
    for (const [id, addedAt] of notifiedUpcomingIds) {
        if (addedAt < cutoff) {
            notifiedUpcomingIds.delete(id);
        }
    }
}

// hourCycle 'h23' so midnight renders as "00", not "24"
const naiveDateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
});

/**
 * Format a Date as a "YYYY-MM-DDTHH:MM:SS" wall-clock string in TIMEZONE, with
 * no offset - matching how prenotation startTime/endTime are stored (naive
 * local time, see POST /api/prenotations). Deliberately not toISOString(),
 * which is always UTC and would shift the window by the TIMEZONE's offset
 * (1-2 hours for Europe/Rome), regardless of the server's own OS timezone.
 * @param {Date} date
 * @returns {string}
 */
function toNaiveDateTimeString(date) {
    const parts = Object.fromEntries(
        naiveDateTimeFormatter.formatToParts(date).map(({ type, value }) => [type, value])
    );
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

/**
 * Check for prenotations starting in exactly UPCOMING_LESSON_REMINDER_MINUTES
 * from now and push a reminder to their tutor and student, unless that
 * prenotation was already notified (see `notifiedUpcomingIds` above).
 *
 * Runs every minute, each run covering the one-minute-wide window that minute
 * represents - consecutive runs partition time into adjacent, non-overlapping
 * slices, so every prenotation's reminder window is covered exactly once as
 * long as the schedule keeps ticking.
 *
 * Exported for manual/on-demand triggering, same as sendDailyReminders.
 *
 * @returns {Promise<void>}
 */
async function sendUpcomingLessonReminders() {
    pruneNotifiedUpcomingIds();

    const now = new Date();
    const windowStart = new Date(now.getTime() + UPCOMING_LESSON_REMINDER_MINUTES * 60000);
    const windowEnd = new Date(windowStart.getTime() + 60000);
    const startTime = toNaiveDateTimeString(windowStart);
    const endTime = toNaiveDateTimeString(windowEnd);

    const allPrenotations = await fetchPrenotationsByDateRange(startTime, endTime);
    const prenotations = allPrenotations.filter((p) => !notifiedUpcomingIds.has(p.id));
    if (prenotations.length === 0) return;

    const uniqueStudentIds = [...new Set(prenotations.map(p => p.studentId).filter(Boolean))];
    const studentEntries = await Promise.all(uniqueStudentIds.map(async id => [id, await fetchStudentData(id)]));
    const studentById = new Map(studentEntries);

    prenotations.forEach((prenotation) => {
        notifiedUpcomingIds.set(prenotation.id, Date.now());

        const student = prenotation.studentId ? studentById.get(prenotation.studentId) : null;
        const studentName = student ? `${student.name} ${student.surname}` : 'Unknown';
        const payload = {
            title: 'Upcoming Prenotation',
            body: `For: ${studentName}\nAt: ${formatReminderTime(prenotation.startTime)}`,
            url: '/calendar',
            tag: `upcoming-prenotation-${prenotation.id}`
        };
        sendPushToUser(prenotation.tutorId, payload);
        if (student && student.userId) {
            sendPushToUser(student.userId, payload);
        }
    });
}

module.exports = { sendDailyReminders, sendUpcomingLessonReminders };
