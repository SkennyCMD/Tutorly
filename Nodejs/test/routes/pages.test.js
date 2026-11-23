// Page-render routes are tested as smoke tests: auth/role gating (redirect
// behavior) plus a happy-path 200 with minimal valid Java API fixtures - not
// deep assertions on rendered HTML content, which would just re-encode the
// EJS templates' internals into the test suite.
const request = require('supertest');
const app = require('../helpers/testApp');
const { javaApi } = require('../helpers/javaApi');
const { loginAsTutor, loginAsAdmin, tutorFixture, adminFixture } = require('../helpers/auth');
const { studentFixture, calendarNoteFixture, lessonFixture, prenotationFixture, testFixture } = require('../helpers/fixtures');

async function tutorAgent(overrides = {}) {
    const agent = request.agent(app);
    await loginAsTutor(agent, tutorFixture(overrides));
    return agent;
}

describe('GET /', () => {
    test('redirects to /login when not authenticated', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/login');
    });

    test('redirects to /home when authenticated', async () => {
        const agent = await tutorAgent();
        const res = await agent.get('/');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/home');
    });
});

describe('public pages', () => {
    test('GET /privacy renders without auth', async () => {
        const res = await request(app).get('/privacy');
        expect(res.status).toBe(200);
    });

    test('GET /cookies renders without auth', async () => {
        const res = await request(app).get('/cookies');
        expect(res.status).toBe(200);
    });
});

describe('GET /admin', () => {
    test('redirects to /adminLogin when not authenticated', async () => {
        const res = await request(app).get('/admin');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/adminLogin');
    });

    test('renders the admin panel when authenticated', async () => {
        const agent = request.agent(app);
        await loginAsAdmin(agent);

        const res = await agent.get('/admin');
        expect(res.status).toBe(200);
    });
});

describe('GET /dashboardNotes', () => {
    test('redirects to /adminLogin when not authenticated', async () => {
        const res = await request(app).get('/dashboardNotes');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/adminLogin');
    });

    test('redirects to /adminLogin for a tutor session (not an admin one)', async () => {
        const agent = await tutorAgent();
        const res = await agent.get('/dashboardNotes');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/adminLogin');
    });

    test('renders the dashboard notes manager with real data when authenticated as admin', async () => {
        const agent = request.agent(app);
        await loginAsAdmin(agent);
        javaApi().get('/api/dashboard-notes').reply(200, [
            { id: 1, content: 'Reminder', creation: '2026-11-19T09:00:00', expiration: '2026-12-01T23:59:59', adminId: 1 }
        ]);

        const res = await agent.get('/dashboardNotes');
        expect(res.status).toBe(200);
    });

    test('falls back to an empty note list when the Java API call fails', async () => {
        const agent = request.agent(app);
        await loginAsAdmin(agent);
        javaApi().get('/api/dashboard-notes').replyWithError('connection refused');

        const res = await agent.get('/dashboardNotes');
        expect(res.status).toBe(200);
    });
});

describe('GET /ticketing', () => {
    test('redirects to /login when neither an admin nor a tutor session exists', async () => {
        const res = await request(app).get('/ticketing');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/login');
    });

    test('a GUEST tutor is redirected to /home', async () => {
        const agent = await tutorAgent({ role: 'GUEST' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GUEST' }));

        const res = await agent.get('/ticketing');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/home');
    });

    test('renders the support ticket board when authenticated, with real ticket data', async () => {
        const agent = request.agent(app);
        await loginAsAdmin(agent);
        javaApi().get('/api/tickets').reply(200, [
            { id: 1, content: 'I cannot access my materials', creation: '2026-11-10T09:00:00', status: 'open', userId: 4, adminId: null }
        ]);
        javaApi().get('/api/users/4').reply(200, tutorFixture({ id: 4, username: 'needs.help' }));

        const res = await agent.get('/ticketing');
        expect(res.status).toBe(200);
        expect(res.text).toContain('I cannot access my materials');
        expect(res.text).toContain('needs.help');
    });

    test('still renders (with no tickets) if the Java API call fails', async () => {
        const agent = request.agent(app);
        await loginAsAdmin(agent);
        javaApi().get('/api/tickets').reply(500, 'DB error');

        const res = await agent.get('/ticketing');
        expect(res.status).toBe(200);
        expect(res.text).toContain('window.initialTickets = []');
    });

    test('only shows this admin\'s own managing/closed tickets - another admin\'s never reach the page', async () => {
        const agent = request.agent(app);
        await loginAsAdmin(agent, adminFixture({ id: 1, username: 'me.admin' }));
        javaApi().get('/api/tickets').reply(200, [
            { id: 1, content: 'Open for anyone', creation: '2026-11-16T09:00:00', status: 'open', userId: 4, adminId: null },
            { id: 2, content: 'I am handling this one', creation: '2026-11-15T09:00:00', status: 'managing', userId: 4, adminId: 1 },
            { id: 3, content: 'Someone else is handling this one', creation: '2026-11-14T09:00:00', status: 'managing', userId: 4, adminId: 2 },
            { id: 4, content: 'I resolved this one', creation: '2026-11-10T09:00:00', status: 'closed', closure: '2026-11-11T09:00:00', comment: 'Done', userId: 4, adminId: 1 },
            { id: 5, content: 'Someone else resolved this one', creation: '2026-11-09T09:00:00', status: 'closed', closure: '2026-11-10T09:00:00', comment: 'Done', userId: 4, adminId: 2 }
        ]);
        // Lookups are promise-memoized per id within the request, so each
        // distinct user/admin id is only actually fetched once even though
        // several surviving tickets share the same one.
        javaApi().get('/api/users/4').reply(200, tutorFixture({ id: 4, username: 'needs.help' }));
        javaApi().get('/api/admins/1').reply(200, adminFixture({ id: 1, username: 'me.admin' }));

        const res = await agent.get('/ticketing');
        expect(res.status).toBe(200);
        expect(res.text).toContain('Open for anyone');
        expect(res.text).toContain('I am handling this one');
        expect(res.text).toContain('I resolved this one');
        expect(res.text).not.toContain('Someone else is handling this one');
        expect(res.text).not.toContain('Someone else resolved this one');
        expect(res.text).toContain('me.admin');
    });

    test.each(['STAFF', 'GENERIC'])('a %s tutor can view the page, read-only, seeing only their own tickets', async (role) => {
        const agent = await tutorAgent({ id: 4, role, username: 'needs.help' });
        // Hit twice: once for the route's own role check, once more for the
        // ticket-enrichment step's requester-username lookup.
        javaApi().get('/api/users/4').reply(200, tutorFixture({ id: 4, role, username: 'needs.help' }));
        javaApi().get('/api/users/4').reply(200, tutorFixture({ id: 4, role, username: 'needs.help' }));
        javaApi().get('/api/tickets').reply(200, [
            { id: 1, content: 'My own open ticket', creation: '2026-11-16T09:00:00', status: 'open', userId: 4, adminId: null },
            { id: 2, content: 'My own closed ticket', creation: '2026-11-10T09:00:00', status: 'closed', closure: '2026-11-11T09:00:00', comment: 'Done', userId: 4, adminId: 1 },
            { id: 3, content: 'Someone else\'s ticket', creation: '2026-11-09T09:00:00', status: 'open', userId: 9, adminId: null }
        ]);
        javaApi().get('/api/admins/1').reply(200, adminFixture({ id: 1, username: 'some.admin' }));

        const res = await agent.get('/ticketing');

        expect(res.status).toBe(200);
        expect(res.text).toContain('My own open ticket');
        expect(res.text).toContain('My own closed ticket');
        expect(res.text).not.toContain('Someone else\'s ticket');
        expect(res.text).toContain('window.canManageTickets = false');
    });
});

describe('GET /home', () => {
    test('redirects to /login when not authenticated', async () => {
        const res = await request(app).get('/home');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/login');
    });

    test('renders for an authenticated tutor', async () => {
        const agent = await tutorAgent();
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));
        javaApi().get('/api/calendar-notes/tutor/1').reply(200, []);
        javaApi().get('/api/lessons').reply(200, []);
        javaApi().get('/api/prenotations').reply(200, []);
        javaApi().get('/api/students').reply(200, []);
        javaApi().get('/api/dashboard-notes/user/1').reply(200, []);

        const res = await agent.get('/home');
        expect(res.status).toBe(200);
    });

    test('embeds only this user\'s own active dashboard notes, soonest-expiring first', async () => {
        const agent = await tutorAgent();
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));
        javaApi().get('/api/calendar-notes/tutor/1').reply(200, []);
        javaApi().get('/api/lessons').reply(200, []);
        javaApi().get('/api/prenotations').reply(200, []);
        javaApi().get('/api/students').reply(200, []);
        javaApi().get('/api/dashboard-notes/user/1').reply(200, [
            { id: 1, content: 'Already expired', creation: '2026-01-01T09:00:00', expiration: '2026-01-02T23:59:59', adminId: 1 },
            { id: 2, content: 'Still active, later', creation: '2026-11-19T09:00:00', expiration: '2027-02-01T23:59:59', adminId: 1 },
            { id: 3, content: 'Still active, sooner', creation: '2026-11-19T09:00:00', expiration: '2026-12-01T23:59:59', adminId: 1 }
        ]);

        const res = await agent.get('/home');
        expect(res.status).toBe(200);
        expect(res.text).not.toContain('Already expired');
        const soonerIndex = res.text.indexOf('Still active, sooner');
        const laterIndex = res.text.indexOf('Still active, later');
        expect(soonerIndex).toBeGreaterThan(-1);
        expect(laterIndex).toBeGreaterThan(soonerIndex);
    });

    test('never embeds dashboard notes for a GUEST session', async () => {
        const agent = await tutorAgent({ id: 21, role: 'GUEST' });
        javaApi().get('/api/users/21').reply(200, tutorFixture({ id: 21, role: 'GUEST' }));
        javaApi().get('/api/calendar-notes/tutor/21').reply(200, []);
        javaApi().get('/api/lessons').reply(200, []);
        javaApi().get('/api/prenotations').reply(200, []);
        javaApi().get('/api/students').reply(200, []);
        javaApi().get('/api/students/guest/21').reply(200, []);

        const res = await agent.get('/home');
        expect(res.status).toBe(200);
        expect(res.text).not.toContain('dashboardNotesList');
    });

    test('a GUEST session only ever sees their own assigned student, never the full roster', async () => {
        const agent = await tutorAgent({ id: 21, role: 'GUEST' });
        javaApi().get('/api/users/21').reply(200, tutorFixture({ id: 21, role: 'GUEST' }));
        javaApi().get('/api/calendar-notes/tutor/21').reply(200, []);
        javaApi().get('/api/lessons').reply(200, []);
        javaApi().get('/api/prenotations').reply(200, []);
        javaApi().get('/api/students').reply(200, [
            studentFixture({ id: 10, name: 'Mario', surname: 'NotMine' }),
            studentFixture({ id: 11, name: 'Luigi', surname: 'Assigned' })
        ]);
        javaApi().get('/api/students/guest/21').reply(200, [studentFixture({ id: 11, name: 'Luigi', surname: 'Assigned' })]);
        javaApi().get('/api/tests/student/11').reply(200, []);

        const res = await agent.get('/home');
        expect(res.status).toBe(200);
        expect(res.text).toContain('Assigned');
        expect(res.text).not.toContain('NotMine');
    });
});

describe('GET /calendar', () => {
    test('redirects to /login when not authenticated', async () => {
        const res = await request(app).get('/calendar');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/login');
    });

    test('renders for an authenticated GENERIC tutor', async () => {
        const agent = await tutorAgent();
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));
        // GET /calendar now fetches a bounded +/- 7-day window via the date-range
        // endpoints instead of everything - see calendarDataService.js.
        const prenotationsScope = javaApi().get(/^\/api\/prenotations\/date-range/).reply(200, []);
        const notesScope = javaApi().get(/^\/api\/calendar-notes\/date-range/).reply(200, []);
        javaApi().get('/api/students').reply(200, []);
        javaApi().get('/api/users').reply(200, []);
        const exceptionDaysScope = javaApi().get('/api/exception-days').reply(200, [
            { id: 10, day: '2026-09-03', type: 'absent', status: 'approved', tutorId: 1 }
        ]);

        const res = await agent.get('/calendar');
        expect(res.status).toBe(200);
        // Confirms the real success path was taken, not the catch-fallback
        // (which would also render 200 with empty data).
        expect(prenotationsScope.isDone()).toBe(true);
        expect(notesScope.isDone()).toBe(true);
        // A GENERIC tutor isn't STAFF - exception days shouldn't be fetched
        // on initial page load either, not just on the on-demand range endpoint.
        expect(exceptionDaysScope.isDone()).toBe(false);
        expect(res.text).toContain('exceptionDays: []');
    });

    test('a GUEST session only ever sees their own assigned student, never the full roster', async () => {
        const agent = await tutorAgent({ id: 21, role: 'GUEST' });
        javaApi().get('/api/users/21').reply(200, tutorFixture({ id: 21, role: 'GUEST' }));
        javaApi().get(/^\/api\/prenotations\/date-range/).reply(200, []);
        javaApi().get(/^\/api\/calendar-notes\/date-range/).reply(200, []);
        javaApi().get('/api/students').reply(200, [
            studentFixture({ id: 10, name: 'Mario', surname: 'NotMine' }),
            studentFixture({ id: 11, name: 'Luigi', surname: 'Assigned' })
        ]);
        javaApi().get('/api/users').reply(200, []);
        javaApi().get('/api/students/guest/21').reply(200, [studentFixture({ id: 11, name: 'Luigi', surname: 'Assigned' })]);

        const res = await agent.get('/calendar');
        expect(res.status).toBe(200);
        expect(res.text).toContain('Assigned');
        expect(res.text).not.toContain('NotMine');
    });

    test('renders for an authenticated STAFF tutor, with exception days embedded for the client', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        // Fetched twice: once for the role check above, once more inside
        // getCalendarDataForRange's getTutor cache to enrich the exception
        // day below with its requester's username.
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().get(/^\/api\/prenotations\/date-range/).reply(200, []);
        javaApi().get(/^\/api\/calendar-notes\/date-range/).reply(200, []);
        javaApi().get('/api/students').reply(200, []);
        javaApi().get('/api/users').reply(200, []);
        // The initial page load's range is "today" +/- 7 days (see GET /calendar
        // in index.js) - use today's own date so this exception always lands
        // inside it, whenever the suite happens to run.
        const today = new Date().toISOString().slice(0, 10);
        const exceptionDaysScope = javaApi().get('/api/exception-days').reply(200, [
            { id: 10, day: today, type: 'absent', status: 'approved', tutorId: 1 }
        ]);

        const res = await agent.get('/calendar');
        expect(res.status).toBe(200);
        expect(exceptionDaysScope.isDone()).toBe(true);
        expect(res.text).toContain('"id":10');
    });

    test('never leaks other tutors\' password hashes to the browser', async () => {
        const agent = await tutorAgent();
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));
        javaApi().get(/^\/api\/prenotations\/date-range/).reply(200, []);
        javaApi().get(/^\/api\/calendar-notes\/date-range/).reply(200, []);
        javaApi().get('/api/students').reply(200, []);
        javaApi().get('/api/users').reply(200, [tutorFixture({ id: 2, username: 'other.tutor', password: '$2b$10$SECRETHASHVALUE' })]);

        const res = await agent.get('/calendar');
        expect(res.status).toBe(200);
        expect(res.text).toContain('other.tutor');
        expect(res.text).not.toContain('SECRETHASHVALUE');
    });
});

describe('GET /api/calendar/data', () => {
    test('redirects to /login when not authenticated', async () => {
        const res = await request(app).get('/api/calendar/data').query({ start: '2026-09-01T00:00:00', end: '2026-09-07T23:59:59' });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/login');
    });

    test('rejects a missing or malformed start/end with 400', async () => {
        const agent = await tutorAgent();
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));

        const res = await agent.get('/api/calendar/data').query({ start: 'not-a-date', end: '2026-09-07T23:59:59' });
        expect(res.status).toBe(400);
    });

    test('returns prenotations and calendar notes for a GENERIC tutor, scoped to their own', async () => {
        const agent = await tutorAgent();
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));
        javaApi().get(/^\/api\/prenotations\/date-range/).reply(200, [
            { id: 1, studentId: 10, tutorId: 1, startTime: '2026-09-01T10:00:00', endTime: '2026-09-01T11:00:00', flag: false },
            { id: 2, studentId: 10, tutorId: 2, startTime: '2026-09-01T12:00:00', endTime: '2026-09-01T13:00:00', flag: false }
        ]);
        javaApi().get(/^\/api\/calendar-notes\/date-range/).reply(200, []);
        javaApi().get('/api/students/10').reply(200, studentFixture());
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));

        const res = await agent.get('/api/calendar/data').query({ start: '2026-09-01T00:00:00', end: '2026-09-07T23:59:59' });
        expect(res.status).toBe(200);
        expect(res.body.prenotations).toHaveLength(1);
        expect(res.body.prenotations[0].tutorId).toBe(1);
    });

    test('a GENERIC tutor cannot modify a prenotation STAFF created on their behalf', async () => {
        const agent = await tutorAgent({ id: 1 });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));
        javaApi().get(/^\/api\/prenotations\/date-range/).reply(200, [
            { id: 1, studentId: 10, tutorId: 1, creatorId: 99, startTime: '2026-09-01T10:00:00', endTime: '2026-09-01T11:00:00', flag: false }
        ]);
        javaApi().get(/^\/api\/calendar-notes\/date-range/).reply(200, []);
        javaApi().get('/api/students/10').reply(200, studentFixture());
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));
        javaApi().get('/api/users/99').reply(200, tutorFixture({ id: 99, role: 'STAFF', username: 'staff.member' }));

        const res = await agent.get('/api/calendar/data').query({ start: '2026-09-01T00:00:00', end: '2026-09-07T23:59:59' });
        expect(res.status).toBe(200);
        expect(res.body.prenotations[0].canModify).toBe(false);
        expect(res.body.prenotations[0].creatorUsername).toBe('staff.member');
    });

    test('a GENERIC tutor can modify a prenotation they created themselves', async () => {
        const agent = await tutorAgent({ id: 1 });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));
        javaApi().get(/^\/api\/prenotations\/date-range/).reply(200, [
            { id: 1, studentId: 10, tutorId: 1, creatorId: 1, startTime: '2026-09-01T10:00:00', endTime: '2026-09-01T11:00:00', flag: false }
        ]);
        javaApi().get(/^\/api\/calendar-notes\/date-range/).reply(200, []);
        javaApi().get('/api/students/10').reply(200, studentFixture());
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));

        const res = await agent.get('/api/calendar/data').query({ start: '2026-09-01T00:00:00', end: '2026-09-07T23:59:59' });
        expect(res.status).toBe(200);
        expect(res.body.prenotations[0].canModify).toBe(true);
    });

    test('a STAFF tutor sees every tutor\'s prenotations in range', async () => {
        const agent = await tutorAgent({ role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().get(/^\/api\/prenotations\/date-range/).reply(200, [
            { id: 1, studentId: 10, tutorId: 1, startTime: '2026-09-01T10:00:00', endTime: '2026-09-01T11:00:00', flag: false },
            { id: 2, studentId: 10, tutorId: 2, startTime: '2026-09-01T12:00:00', endTime: '2026-09-01T13:00:00', flag: false }
        ]);
        javaApi().get(/^\/api\/calendar-notes\/date-range/).reply(200, []);
        javaApi().get('/api/students/10').reply(200, studentFixture());
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));
        javaApi().get('/api/users/2').reply(200, tutorFixture({ id: 2, username: 'other.tutor' }));

        const res = await agent.get('/api/calendar/data').query({ start: '2026-09-01T00:00:00', end: '2026-09-07T23:59:59' });
        expect(res.status).toBe(200);
        expect(res.body.prenotations).toHaveLength(2);
        // STAFF can modify any prenotation regardless of who created it.
        expect(res.body.prenotations.every(p => p.canModify)).toBe(true);
    });

    test('a STAFF tutor sees every note in range, including ones neither assigned to nor created by them', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().get(/^\/api\/prenotations\/date-range/).reply(200, []);
        javaApi().get(/^\/api\/calendar-notes\/date-range/).reply(200, [
            calendarNoteFixture({ id: 500, creator: { id: 2, username: 'other.tutor' }, tutors: [{ id: 2 }] })
        ]);

        const res = await agent.get('/api/calendar/data').query({ start: '2026-09-01T00:00:00', end: '2026-09-07T23:59:59' });
        expect(res.status).toBe(200);
        expect(res.body.calendarNotes).toHaveLength(1);
        expect(res.body.calendarNotes[0].creator.username).toBe('other.tutor');
    });

    test('a GENERIC tutor only sees notes assigned to or created by them', async () => {
        const agent = await tutorAgent({ id: 1, role: 'GENERIC' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GENERIC' }));
        javaApi().get(/^\/api\/prenotations\/date-range/).reply(200, []);
        javaApi().get(/^\/api\/calendar-notes\/date-range/).reply(200, [
            calendarNoteFixture({ id: 500, creator: { id: 2, username: 'other.tutor' }, tutors: [{ id: 2 }] })
        ]);

        const res = await agent.get('/api/calendar/data').query({ start: '2026-09-01T00:00:00', end: '2026-09-07T23:59:59' });
        expect(res.status).toBe(200);
        expect(res.body.calendarNotes).toHaveLength(0);
    });

    test('a GUEST sees only prenotations for their assigned student(s)', async () => {
        const agent = await tutorAgent({ id: 21, role: 'GUEST' });
        javaApi().get('/api/users/21').reply(200, tutorFixture({ id: 21, role: 'GUEST' }));
        javaApi().get(/^\/api\/prenotations\/date-range/).reply(200, [
            { id: 1, studentId: 10, tutorId: 1, startTime: '2026-09-01T10:00:00', endTime: '2026-09-01T11:00:00', flag: false },
            { id: 2, studentId: 99, tutorId: 1, startTime: '2026-09-01T12:00:00', endTime: '2026-09-01T13:00:00', flag: false }
        ]);
        javaApi().get(/^\/api\/calendar-notes\/date-range/).reply(200, []);
        javaApi().get('/api/students/guest/21').reply(200, [{ id: 10 }]);
        javaApi().get('/api/students/10').reply(200, studentFixture());
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));

        const res = await agent.get('/api/calendar/data').query({ start: '2026-09-01T00:00:00', end: '2026-09-07T23:59:59' });
        expect(res.status).toBe(200);
        expect(res.body.prenotations).toHaveLength(1);
        expect(res.body.prenotations[0].studentId).toBe(10);
    });

    test('a STAFF tutor sees approved and pending exception days in range, enriched with the tutor\'s username', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().get(/^\/api\/prenotations\/date-range/).reply(200, []);
        javaApi().get(/^\/api\/calendar-notes\/date-range/).reply(200, []);
        javaApi().get('/api/exception-days').reply(200, [
            { id: 10, day: '2026-09-03', type: 'absent', status: 'approved', tutorId: 2, startTime: null, endTime: null },
            { id: 11, day: '2026-09-05', type: 'present', status: 'pending', tutorId: 2, startTime: '09:00:00', endTime: '12:00:00' },
            // Out of the requested range - must be excluded.
            { id: 12, day: '2026-09-10', type: 'absent', status: 'approved', tutorId: 2, startTime: null, endTime: null },
            // Refused - carries no useful information once dismissed, must be excluded.
            { id: 13, day: '2026-09-04', type: 'absent', status: 'refused', tutorId: 2, startTime: null, endTime: null }
        ]);
        javaApi().get('/api/users/2').reply(200, tutorFixture({ id: 2, username: 'other.tutor' }));

        const res = await agent.get('/api/calendar/data').query({ start: '2026-09-01T00:00:00', end: '2026-09-07T23:59:59' });
        expect(res.status).toBe(200);
        expect(res.body.exceptionDays.map(e => e.id).sort()).toEqual([10, 11]);
        expect(res.body.exceptionDays.find(e => e.id === 11).tutorUsername).toBe('other.tutor');
    });

    test('a GENERIC tutor never sees exception days on the calendar, even if some exist', async () => {
        const agent = await tutorAgent({ id: 1, role: 'GENERIC' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GENERIC' }));
        javaApi().get(/^\/api\/prenotations\/date-range/).reply(200, []);
        javaApi().get(/^\/api\/calendar-notes\/date-range/).reply(200, []);
        const exceptionDaysScope = javaApi().get('/api/exception-days').reply(200, [
            { id: 10, day: '2026-09-03', type: 'absent', status: 'approved', tutorId: 1 }
        ]);

        const res = await agent.get('/api/calendar/data').query({ start: '2026-09-01T00:00:00', end: '2026-09-07T23:59:59' });
        expect(res.status).toBe(200);
        expect(res.body.exceptionDays).toEqual([]);
        // Not STAFF - exception days shouldn't even be fetched, not just filtered out client-side.
        expect(exceptionDaysScope.isDone()).toBe(false);
    });

    test('a GUEST never sees exception days on the calendar either', async () => {
        const agent = await tutorAgent({ id: 21, role: 'GUEST' });
        javaApi().get('/api/users/21').reply(200, tutorFixture({ id: 21, role: 'GUEST' }));
        javaApi().get(/^\/api\/prenotations\/date-range/).reply(200, []);
        javaApi().get(/^\/api\/calendar-notes\/date-range/).reply(200, []);
        javaApi().get('/api/students/guest/21').reply(200, []);
        const exceptionDaysScope = javaApi().get('/api/exception-days').reply(200, [
            { id: 10, day: '2026-09-03', type: 'absent', status: 'approved', tutorId: 21 }
        ]);

        const res = await agent.get('/api/calendar/data').query({ start: '2026-09-01T00:00:00', end: '2026-09-07T23:59:59' });
        expect(res.status).toBe(200);
        expect(res.body.exceptionDays).toEqual([]);
        expect(exceptionDaysScope.isDone()).toBe(false);
    });
});

describe('GET /lessons', () => {
    test('redirects to /login when not authenticated', async () => {
        const res = await request(app).get('/lessons');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/login');
    });

    test('a GUEST account is redirected to /home', async () => {
        const agent = await tutorAgent({ role: 'GUEST' });
        const res = await agent.get('/lessons');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/home');
    });

    test('renders for an authenticated tutor', async () => {
        const agent = await tutorAgent();
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));
        javaApi().get('/api/students').reply(200, []);
        javaApi().get('/api/lessons/tutor/1').reply(200, []);
        javaApi().get('/api/prenotations').reply(200, []);

        const res = await agent.get('/lessons');
        expect(res.status).toBe(200);
    });
});

describe('GET /availability', () => {
    test('redirects to /login when not authenticated', async () => {
        const res = await request(app).get('/availability');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/login');
    });

    test('a GUEST account is redirected to /home', async () => {
        const agent = await tutorAgent({ role: 'GUEST' });
        const res = await agent.get('/availability');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/home');
    });

    test('renders for a GENERIC tutor, with real availability data', async () => {
        const agent = await tutorAgent({ role: 'GENERIC' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GENERIC' }));
        javaApi().get('/api/users').reply(200, [tutorFixture({ id: 1, role: 'GENERIC' })]);
        javaApi().get('/api/availability').reply(200, [
            { id: 1, weekDay: 1, startTime: '09:00:00', endTime: '12:00:00', tutorId: 1 }
        ]);
        javaApi().get('/api/exception-days').reply(200, []);

        const res = await agent.get('/availability');
        expect(res.status).toBe(200);
        expect(res.text).toContain('09:00');
    });

    test('renders for a STAFF tutor', async () => {
        const agent = await tutorAgent({ role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().get('/api/users').reply(200, [tutorFixture({ id: 1, role: 'STAFF' })]);
        javaApi().get('/api/availability').reply(200, []);
        javaApi().get('/api/exception-days').reply(200, []);

        const res = await agent.get('/availability');
        expect(res.status).toBe(200);
    });

    test('a GENERIC tutor only sees their own schedule, not other tutors\'', async () => {
        const agent = await tutorAgent({ id: 1, role: 'GENERIC' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GENERIC' }));
        javaApi().get('/api/users').reply(200, [
            tutorFixture({ id: 1, username: 'me.generic', role: 'GENERIC' }),
            tutorFixture({ id: 2, username: 'other.tutor', role: 'GENERIC' })
        ]);
        javaApi().get('/api/availability').reply(200, []);
        javaApi().get('/api/exception-days').reply(200, []);

        const res = await agent.get('/availability');

        expect(res.text).toContain('me.generic');
        expect(res.text).not.toContain('other.tutor');
    });

    test('a STAFF tutor sees every tutor\'s schedule', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().get('/api/users').reply(200, [
            tutorFixture({ id: 1, username: 'me.staff', role: 'STAFF' }),
            tutorFixture({ id: 2, username: 'other.tutor', role: 'GENERIC' })
        ]);
        javaApi().get('/api/availability').reply(200, []);
        javaApi().get('/api/exception-days').reply(200, []);

        const res = await agent.get('/availability');

        expect(res.text).toContain('me.staff');
        expect(res.text).toContain('other.tutor');
    });

    test('still renders (with no tutors) if the Java API call fails', async () => {
        const agent = await tutorAgent({ role: 'GENERIC' });
        javaApi().get('/api/users/1').reply(500, 'DB error');

        const res = await agent.get('/availability');
        expect(res.status).toBe(200);
    });
});

describe('GET /staffPanel', () => {
    test('a non-STAFF tutor is redirected to /home', async () => {
        const agent = await tutorAgent({ role: 'GENERIC' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GENERIC' }));

        const res = await agent.get('/staffPanel');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/home');
    });

    test('renders for a STAFF tutor', async () => {
        const agent = await tutorAgent({ role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().get('/api/users').reply(200, [tutorFixture({ id: 1, role: 'STAFF' })]);
        javaApi().get('/api/students').reply(200, []);
        javaApi().get('/api/tests').reply(200, []);

        const res = await agent.get('/staffPanel');
        expect(res.status).toBe(200);
    });

    test('never leaks tutors\' password hashes to the browser', async () => {
        const agent = await tutorAgent({ role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().get('/api/users').reply(200, [tutorFixture({ id: 1, role: 'STAFF', password: '$2b$10$SECRETHASHVALUE' })]);
        javaApi().get('/api/students').reply(200, []);
        javaApi().get('/api/tests').reply(200, []);

        const res = await agent.get('/staffPanel');
        expect(res.status).toBe(200);
        expect(res.text).not.toContain('SECRETHASHVALUE');
    });
});

describe('GET /reports', () => {
    test('a GUEST account is redirected to /home', async () => {
        const agent = await tutorAgent({ role: 'GUEST' });
        const res = await agent.get('/reports');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/home');
    });

    test('renders for an authenticated tutor', async () => {
        const agent = await tutorAgent();
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));
        javaApi().get('/api/students').reply(200, []);
        javaApi().get('/api/tests/tutor/1').reply(200, []);

        const res = await agent.get('/reports');
        expect(res.status).toBe(200);
    });
});

describe('GET /student/:id', () => {
    test('redirects to /login when not authenticated', async () => {
        const res = await request(app).get('/student/10');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/login');
    });

    test('a non-staff, non-assigned GENERIC tutor is redirected to /home', async () => {
        const agent = await tutorAgent({ role: 'GENERIC' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GENERIC' }));
        javaApi().get('/api/students/10').reply(200, studentFixture());

        const res = await agent.get('/student/10');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/home');
    });

    test('renders for a STAFF tutor', async () => {
        const agent = await tutorAgent({ role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().get('/api/students/10').reply(200, studentFixture());
        javaApi().get('/api/tests/student/10').reply(200, []);
        javaApi().get('/api/lessons/student/10').reply(200, []);
        javaApi().get('/api/prenotations/student/10').reply(200, []);
        javaApi().get('/api/users').reply(200, []);
        javaApi().get('/api/packs/student/10').reply(200, []);

        const res = await agent.get('/student/10');
        expect(res.status).toBe(200);
    });

    test('a GUEST assigned to the student can view it', async () => {
        const agent = await tutorAgent({ id: 21, role: 'GUEST' });
        javaApi().get('/api/users/21').reply(200, tutorFixture({ id: 21, role: 'GUEST' }));
        javaApi().get('/api/students/10').reply(200, studentFixture());
        javaApi().get('/api/students/guest/21').reply(200, [{ id: 10 }]);
        javaApi().get('/api/tests/student/10').reply(200, []);
        javaApi().get('/api/lessons/student/10').reply(200, []);
        javaApi().get('/api/prenotations/student/10').reply(200, []);
        javaApi().get('/api/users').reply(200, []);
        javaApi().get('/api/packs/student/10').reply(200, []);

        const res = await agent.get('/student/10');
        expect(res.status).toBe(200);
    });

    test('a GUEST not assigned to the student is redirected to /home', async () => {
        const agent = await tutorAgent({ id: 21, role: 'GUEST' });
        javaApi().get('/api/users/21').reply(200, tutorFixture({ id: 21, role: 'GUEST' }));
        javaApi().get('/api/students/10').reply(200, studentFixture());
        javaApi().get('/api/students/guest/21').reply(200, []);

        const res = await agent.get('/student/10');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/home');
    });

    test('a STAFF viewer sees which tutor taught each lesson', async () => {
        const agent = await tutorAgent({ role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().get('/api/students/10').reply(200, studentFixture());
        javaApi().get('/api/tests/student/10').reply(200, []);
        javaApi().get('/api/lessons/student/10').reply(200, [lessonFixture({ tutorId: 5 })]);
        javaApi().get('/api/prenotations/student/10').reply(200, []);
        javaApi().get('/api/users').reply(200, []);
        javaApi().get('/api/packs/student/10').reply(200, []);
        javaApi().get('/api/users/5').reply(200, tutorFixture({ id: 5, username: 'lesson.tutor' }));

        const res = await agent.get('/student/10');
        expect(res.status).toBe(200);
        expect(res.text).toContain('lesson.tutor');
        expect(res.text).toContain('"tutorName":"lesson.tutor"');
    });

    test('a GUEST viewer does not see who taught each lesson', async () => {
        const agent = await tutorAgent({ id: 21, role: 'GUEST' });
        javaApi().get('/api/users/21').reply(200, tutorFixture({ id: 21, role: 'GUEST' }));
        javaApi().get('/api/students/10').reply(200, studentFixture());
        javaApi().get('/api/students/guest/21').reply(200, [{ id: 10 }]);
        javaApi().get('/api/tests/student/10').reply(200, []);
        javaApi().get('/api/lessons/student/10').reply(200, [lessonFixture({ tutorId: 5 })]);
        javaApi().get('/api/prenotations/student/10').reply(200, []);
        javaApi().get('/api/users').reply(200, []);
        javaApi().get('/api/packs/student/10').reply(200, []);

        const res = await agent.get('/student/10');
        expect(res.status).toBe(200);
        expect(res.text).not.toContain('lesson.tutor');
        expect(res.text).not.toContain('"tutorName":');
    });

    test('never leaks other tutors\' password hashes to the browser', async () => {
        const agent = await tutorAgent({ role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().get('/api/students/10').reply(200, studentFixture());
        javaApi().get('/api/tests/student/10').reply(200, []);
        javaApi().get('/api/lessons/student/10').reply(200, []);
        javaApi().get('/api/prenotations/student/10').reply(200, []);
        javaApi().get('/api/users').reply(200, [tutorFixture({ id: 2, username: 'other.tutor', password: '$2b$10$SECRETHASHVALUE' })]);
        javaApi().get('/api/packs/student/10').reply(200, []);

        const res = await agent.get('/student/10');
        expect(res.status).toBe(200);
        expect(res.text).toContain('other.tutor');
        expect(res.text).not.toContain('SECRETHASHVALUE');
    });

    test('a STAFF viewer sees who tested and who booked each session', async () => {
        const agent = await tutorAgent({ role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().get('/api/students/10').reply(200, studentFixture());
        javaApi().get('/api/tests/student/10').reply(200, [testFixture({ tutorId: 5 })]);
        javaApi().get('/api/lessons/student/10').reply(200, []);
        javaApi().get('/api/prenotations/student/10').reply(200, [prenotationFixture({ tutorId: 5 })]);
        javaApi().get('/api/users').reply(200, []);
        javaApi().get('/api/packs/student/10').reply(200, []);
        javaApi().get('/api/users/5').reply(200, tutorFixture({ id: 5, username: 'session.tutor' }));

        const res = await agent.get('/student/10');
        expect(res.status).toBe(200);
        expect(res.text).toContain('session.tutor');
    });

    test('a GUEST viewer does not see who tested or who booked each session', async () => {
        const agent = await tutorAgent({ id: 21, role: 'GUEST' });
        javaApi().get('/api/users/21').reply(200, tutorFixture({ id: 21, role: 'GUEST' }));
        javaApi().get('/api/students/10').reply(200, studentFixture());
        javaApi().get('/api/students/guest/21').reply(200, [{ id: 10 }]);
        javaApi().get('/api/tests/student/10').reply(200, [testFixture({ tutorId: 5 })]);
        javaApi().get('/api/lessons/student/10').reply(200, []);
        javaApi().get('/api/prenotations/student/10').reply(200, [prenotationFixture({ tutorId: 5 })]);
        javaApi().get('/api/users').reply(200, []);
        javaApi().get('/api/packs/student/10').reply(200, []);

        const res = await agent.get('/student/10');
        expect(res.status).toBe(200);
        expect(res.text).not.toContain('session.tutor');
        expect(res.text).not.toContain('"tutorName":');
        expect(res.text).not.toContain('"tutorId":');
    });
});
