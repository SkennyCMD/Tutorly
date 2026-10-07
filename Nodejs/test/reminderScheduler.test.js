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
const { sendUpcomingLessonReminders } = require('../server_utilities/reminderScheduler');

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
        const windowStartMs = new Date(`${match[1]}Z`).getTime();
        const windowEndMs = new Date(`${match[2]}Z`).getTime();

        expect(windowEndMs - windowStartMs).toBe(60000);
        // windowStart should be ~30 minutes after "now" at call time, whichever
        // instant within [before, after] that turned out to be - +/- 1s slack for
        // the naive datetime string's truncation to whole seconds.
        expect(windowStartMs).toBeGreaterThanOrEqual(before + 30 * 60000 - 1000);
        expect(windowStartMs).toBeLessThanOrEqual(after + 30 * 60000);
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
