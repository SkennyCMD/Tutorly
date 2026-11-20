// Direct unit tests for dashboardNoteScheduler.js, not a route test - requires
// the real module (route tests instead apply the manual mock in
// server_utilities/__mocks__/dashboardNoteScheduler.js, since index.js just
// needs its require() side effect neutralized). node-cron itself is mocked
// here too, so requiring the real module doesn't register a live timer for
// the test process.
jest.mock('node-cron', () => ({ schedule: jest.fn() }));

const { javaApi } = require('./helpers/javaApi');
const { TIMEZONE } = require('../server_utilities/config');
const { purgeExpiredDashboardNoteRecipients } = require('../server_utilities/dashboardNoteScheduler');

describe('purgeExpiredDashboardNoteRecipients', () => {
    test("clears recipients only for notes that expired before today's midnight in TIMEZONE", async () => {
        expect(TIMEZONE).toBe('Europe/Rome');

        const todayInTimezone = new Date().toLocaleString('sv-SE', { timeZone: TIMEZONE }).slice(0, 10);
        const [y, m, d] = todayInTimezone.split('-').map(Number);
        // Pure local calendar arithmetic (getFullYear/getMonth/getDate), not
        // toISOString - that's UTC and would shift the date depending on the
        // test machine's own OS timezone vs TIMEZONE.
        const yesterday = new Date(y, m - 1, d - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        javaApi().get('/api/dashboard-notes').reply(200, [
            { id: 1, content: 'Expired yesterday', expiration: `${yesterdayStr}T23:59:59` },
            { id: 2, content: 'Still active today', expiration: `${todayInTimezone}T23:59:59` },
            { id: 3, content: 'Still active, far future', expiration: '2027-01-01T23:59:59' }
        ]);
        const clearScope = javaApi().delete('/api/dashboard-notes/1/recipients').reply(204);

        await purgeExpiredDashboardNoteRecipients();

        expect(clearScope.isDone()).toBe(true);
    });

    test('does nothing when no note has expired', async () => {
        javaApi().get('/api/dashboard-notes').reply(200, [
            { id: 1, content: 'Still active', expiration: '2027-01-01T23:59:59' }
        ]);

        await expect(purgeExpiredDashboardNoteRecipients()).resolves.toBeUndefined();
    });
});
