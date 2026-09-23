// Page-render routes are tested as smoke tests: auth/role gating (redirect
// behavior) plus a happy-path 200 with minimal valid Java API fixtures - not
// deep assertions on rendered HTML content, which would just re-encode the
// EJS templates' internals into the test suite.
const request = require('supertest');
const app = require('../helpers/testApp');
const { javaApi } = require('../helpers/javaApi');
const { loginAsTutor, loginAsAdmin, tutorFixture } = require('../helpers/auth');
const { studentFixture, calendarNoteFixture } = require('../helpers/fixtures');

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

        const res = await agent.get('/home');
        expect(res.status).toBe(200);
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
        // GET /calendar now fetches a bounded ±7-day window via the date-range
        // endpoints instead of everything - see calendarDataService.js.
        const prenotationsScope = javaApi().get(/^\/api\/prenotations\/date-range/).reply(200, []);
        const notesScope = javaApi().get(/^\/api\/calendar-notes\/date-range/).reply(200, []);
        javaApi().get('/api/students').reply(200, []);
        javaApi().get('/api/users').reply(200, []);

        const res = await agent.get('/calendar');
        expect(res.status).toBe(200);
        // Confirms the real success path was taken, not the catch-fallback
        // (which would also render 200 with empty data).
        expect(prenotationsScope.isDone()).toBe(true);
        expect(notesScope.isDone()).toBe(true);
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
});
