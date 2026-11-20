/**
 *
 * Dashboard Note Expiration Cleanup
 *
 *
 * One scheduled job: every day at midnight (TIMEZONE), checks every dashboard
 * note and clears its see_dashboard_note rows (DashboardNoteService.clearRecipients)
 * if today's date, at 00:00, is past its expiration - so a note nobody got
 * around to "sign as viewed" still gets cleaned up once it's no longer
 * relevant, instead of leaving stale rows behind forever.
 *
 * Self-initializing at require-time, same pattern as reminderScheduler.js - a
 * single `require('../server_utilities/dashboardNoteScheduler')` in index.js
 * wires it up.
 *
 * @module dashboardNoteScheduler
 *
 */

const cron = require('node-cron');
const { TIMEZONE } = require('./config');
const { fetchAllDashboardNotes, clearDashboardNoteRecipients } = require('./javaApiService');

cron.schedule('0 0 * * *', () => {
    purgeExpiredDashboardNoteRecipients().catch((error) => {
        console.error('[dashboardNoteScheduler] Expiration cleanup job failed:', error.message);
    });
}, { timezone: TIMEZONE });

console.log(`[dashboardNoteScheduler] Expired dashboard note cleanup scheduled for midnight (${TIMEZONE})`);

// hourCycle 'h23' so midnight renders as "00", not "24" - same pattern as
// reminderScheduler.js's own date formatter.
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hourCycle: 'h23'
});

/**
 * Today's calendar date in TIMEZONE, at 00:00:00 - the cutoff a note's
 * expiration is compared against.
 * @returns {Date}
 */
function todayMidnight() {
    const parts = Object.fromEntries(dateFormatter.formatToParts(new Date()).map(({ type, value }) => [type, value]));
    return new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00`);
}

/**
 * Check every dashboard note and clear see_dashboard_note for any whose
 * expiration is before today's midnight cutoff in TIMEZONE. Exported for
 * manual/on-demand triggering, same as reminderScheduler.js's jobs.
 *
 * @returns {Promise<void>}
 */
async function purgeExpiredDashboardNoteRecipients() {
    const cutoff = todayMidnight();
    const notes = await fetchAllDashboardNotes();
    const expired = notes.filter(note => cutoff > new Date(note.expiration));

    await Promise.all(expired.map(note => clearDashboardNoteRecipients(note.id)));
}

module.exports = { purgeExpiredDashboardNoteRecipients };
