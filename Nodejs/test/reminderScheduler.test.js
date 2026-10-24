// Direct unit tests for reminderScheduler.js's upcoming-lesson job, not a route
// test - requires the real module (route tests instead apply the manual mock in
// server_utilities/__mocks__/reminderScheduler.js, since index.js just needs its
// require() side effect neutralized). node-cron itself is mocked here too, so
// requiring the real module doesn't register a live timer for the test process.
jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../server_utilities/pushService', () => ({ sendPushToUser: jest.fn() }));

const { javaApi } = require('./helpers/javaApi');
const { studentFixture, prenotationFixture } = require('./helpers/fixtures');
const { sendPushToUser } = require('../server_utilities/pushService');
const { TIMEZONE } = require('../server_utilities/config');
const { sendDailyReminders, sendUpcomingLessonReminders } = require('../server_utilities/reminderScheduler');

beforeEach(() => {
    sendPushToUser.mockClear();
});

describe('sendUpcomingLessonReminders', () => {
    // Jest's fake timers also stub the internals Node's http/https client relies
    // on, which hangs a real nock-intercepted request indefinitely - so "now" is
    // captured for real, right around the call, and the window is checked with a
    // tolerance instead of faking the clock.
    test('checks a window exactly UPCOMING_LESSON_REMINDER_MINUTES (default 30) ahead of now', async () => {
        let capturedUri;
        javaApi().get(uri => {
            if (uri.startsWith('/api/prenotations/date-range')) {
                capturedUri = uri;
                return true;
            }
            return false;
        }).reply(200, []);

        const before = Date.now();
        await sendUpcomingLessonReminders();
        const after = Date.now();

        const match = capturedUri.match(/start=([^&]+)&end=([^&]+)/);
        expect(match).not.toBeNull();
        const [, windowStart, windowEnd] = match;

        // Naive strings parsed with the same (arbitrary) offset only to measure
        // their distance - the width is a wall-clock minute either way.
        expect(new Date(`${windowEnd}Z`) - new Date(`${windowStart}Z`)).toBe(60000);
        // windowStart should be ~30 minutes after "now" at call time, as a
        // TIMEZONE wall-clock string (how prenotation startTime is stored) - NOT
        // UTC. Same-format strings compare chronologically; -1s slack for the
        // truncation to whole seconds.
        const toWallClock = (ms) => new Date(ms)
            .toLocaleString('sv-SE', { timeZone: TIMEZONE, hourCycle: 'h23' })
            .replace(' ', 'T');
        expect(windowStart >= toWallClock(before + 30 * 60000 - 1000)).toBe(true);
        expect(windowStart <= toWallClock(after + 30 * 60000)).toBe(true);
    });

    test('formats the window in TIMEZONE wall-clock time, not UTC', async () => {
        let capturedUri;
        javaApi().get(uri => {
            if (uri.startsWith('/api/prenotations/date-range')) {
                capturedUri = uri;
                return true;
            }
            return false;
        }).reply(200, []);

        await sendUpcomingLessonReminders();

        const windowStart = capturedUri.match(/start=([^&]+)&/)[1];
        const utcNowPlus30 = new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16);
        // Europe/Rome (the default TIMEZONE) is never UTC+0, so a UTC-formatted
        // window - the old bug, which fired reminders 1-2 hours late - can't match.
        expect(TIMEZONE).toBe('Europe/Rome');
        expect(windowStart.slice(0, 16)).not.toBe(utcNowPlus30);
    });

    test('sends a push to both the tutor and the student linked user account', async () => {
        javaApi().get(/^\/api\/prenotations\/date-range/).reply(200, [
            prenotationFixture({ id: 101, tutorId: 5, studentId: 10, startTime: '2026-09-11T09:30:00' })
        ]);
        javaApi().get('/api/students/10').reply(200, studentFixture({ id: 10, userId: 20 }));

        await sendUpcomingLessonReminders();

        expect(sendPushToUser).toHaveBeenCalledTimes(2);
        expect(sendPushToUser).toHaveBeenCalledWith(5, expect.objectContaining({ tag: 'upcoming-prenotation-101' }));
        expect(sendPushToUser).toHaveBeenCalledWith(20, expect.objectContaining({ tag: 'upcoming-prenotation-101' }));
    });

    test('does not push to the student when they have no linked user account', async () => {
        javaApi().get(/^\/api\/prenotations\/date-range/).reply(200, [
            prenotationFixture({ id: 102, tutorId: 5, studentId: 11, startTime: '2026-09-11T09:30:00' })
        ]);
        javaApi().get('/api/students/11').reply(200, studentFixture({ id: 11, userId: null }));

        await sendUpcomingLessonReminders();

        expect(sendPushToUser).toHaveBeenCalledTimes(1);
        expect(sendPushToUser).toHaveBeenCalledWith(5, expect.anything());
    });

    test('does not notify the same prenotation twice across separate runs', async () => {
        javaApi().get(/^\/api\/prenotations\/date-range/).reply(200, [
            prenotationFixture({ id: 103, tutorId: 5, studentId: 10, startTime: '2026-09-11T09:30:00' })
        ]);
        javaApi().get('/api/students/10').reply(200, studentFixture({ id: 10, userId: 20 }));
        await sendUpcomingLessonReminders();
        expect(sendPushToUser).toHaveBeenCalledTimes(2);

        sendPushToUser.mockClear();

        // Same prenotation still in the date-range result on a later tick (e.g. the
        // window overlapped slightly, or the job re-ran) - must not push again.
        javaApi().get(/^\/api\/prenotations\/date-range/).reply(200, [
            prenotationFixture({ id: 103, tutorId: 5, studentId: 10, startTime: '2026-09-11T09:30:00' })
        ]);
        await sendUpcomingLessonReminders();

        expect(sendPushToUser).not.toHaveBeenCalled();
    });
});

describe('sendDailyReminders', () => {
    test("queries today's date range in TIMEZONE wall-clock time, not UTC", async () => {
        let capturedUri;
        javaApi().get(uri => {
            if (uri.startsWith('/api/prenotations/date-range')) {
                capturedUri = uri;
                return true;
            }
            return false;
        }).reply(200, []);
        javaApi().get(/^\/api\/calendar-notes\/date-range/).reply(200, []);

        await sendDailyReminders();

        const [, windowStart, windowEnd] = capturedUri.match(/start=([^&]+)&end=([^&]+)/);
        expect(windowStart.slice(11)).toBe('00:00:00');
        expect(windowEnd.slice(11)).toBe('23:59:59');
        // Same date on both ends, and matching today's TIMEZONE calendar date -
        // not a UTC one, which near midnight could land on the wrong day entirely.
        const todayInTimezone = new Date().toLocaleString('sv-SE', { timeZone: TIMEZONE }).slice(0, 10);
        expect(windowStart.slice(0, 10)).toBe(todayInTimezone);
        expect(windowEnd.slice(0, 10)).toBe(todayInTimezone);
    });
});
