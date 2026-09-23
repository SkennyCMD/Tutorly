const request = require('supertest');
const app = require('../helpers/testApp');
const { javaApi } = require('../helpers/javaApi');
const { loginAsTutor, tutorFixture } = require('../helpers/auth');
const { lessonFixture, studentFixture } = require('../helpers/fixtures');

async function tutorAgent(overrides = {}) {
    const agent = request.agent(app);
    await loginAsTutor(agent, tutorFixture(overrides));
    return agent;
}

// Excel-generating routes share the same isStaff gate and month/no-data
// validation - exercised once per route below, then a happy-path smoke test
// that just checks the file actually came back (not its exact binary content).
describe.each([
    ['/api/reports/lessons-by-month', 'month', '2026-09'],
    ['/api/reports/lessons-by-student', 'month', '2026-09'],
    ['/api/reports/tutor-monthly-hours', 'month', '2026-09']
])('GET %s', (path, param, value) => {
    test('redirects to /login when not authenticated', async () => {
        const res = await request(app).get(path).query({ [param]: value });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/login');
    });

    test('rejects a non-STAFF tutor with 403', async () => {
        const agent = await tutorAgent({ role: 'GENERIC' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GENERIC' }));

        const res = await agent.get(path).query({ [param]: value });
        expect(res.status).toBe(403);
    });

    test(`rejects an invalid ${param} format with 400`, async () => {
        const agent = await tutorAgent({ role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));

        const res = await agent.get(path).query({ [param]: 'not-a-month' });
        expect(res.status).toBe(400);
    });
});

describe('GET /api/reports/lessons-by-month', () => {
    test('returns 404 when there are no lessons that month', async () => {
        const agent = await tutorAgent({ role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().get(/\/api\/lessons\/date-range/).reply(200, []);

        const res = await agent.get('/api/reports/lessons-by-month').query({ month: '2026-09' });
        expect(res.status).toBe(404);
    });

    test('returns an Excel file when lessons exist', async () => {
        const agent = await tutorAgent({ role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().get(/\/api\/lessons\/date-range/).reply(200, [lessonFixture()]);
        javaApi().get('/api/students/10').reply(200, studentFixture());
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));

        const res = await agent.get('/api/reports/lessons-by-month').query({ month: '2026-09' });
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('spreadsheetml');
        expect(res.headers['content-disposition']).toContain('attachment');
    });
});

describe('GET /api/reports/lessons-by-student', () => {
    test('returns an Excel file when lessons exist', async () => {
        const agent = await tutorAgent({ role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().get(/\/api\/lessons\/date-range/).reply(200, [lessonFixture()]);
        javaApi().get('/api/students/10').reply(200, studentFixture());
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));

        const res = await agent.get('/api/reports/lessons-by-student').query({ month: '2026-09' });
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('spreadsheetml');
        expect(res.headers['content-disposition']).toContain('attachment');
    });
});

describe('GET /api/reports/tutors-monthly-stats', () => {
    test('rejects an invalid year format with 400', async () => {
        const agent = await tutorAgent({ role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));

        const res = await agent.get('/api/reports/tutors-monthly-stats').query({ year: '26' });
        expect(res.status).toBe(400);
    });

    test('returns 404 when there are no lessons that year', async () => {
        const agent = await tutorAgent({ role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().get(/\/api\/lessons\/date-range/).reply(200, []);

        const res = await agent.get('/api/reports/tutors-monthly-stats').query({ year: '2026' });
        expect(res.status).toBe(404);
    });

    test('returns an Excel file when both lessons and tutors exist', async () => {
        const agent = await tutorAgent({ role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().get(/\/api\/lessons\/date-range/).reply(200, [lessonFixture()]);
        javaApi().get('/api/users').reply(200, [tutorFixture({ id: 1 })]);
        javaApi().get('/api/students/10').reply(200, studentFixture());

        const res = await agent.get('/api/reports/tutors-monthly-stats').query({ year: '2026' });
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('spreadsheetml');
    });
});

describe('GET /api/reports/tutor-monthly-hours', () => {
    test('returns tutors and lessonsByTutor as JSON', async () => {
        const agent = await tutorAgent({ role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().get(/\/api\/lessons\/date-range/).reply(200, [lessonFixture()]);
        javaApi().get('/api/users').reply(200, [tutorFixture({ id: 1, role: 'STAFF' })]);
        javaApi().get('/api/students/10').reply(200, studentFixture());

        const res = await agent.get('/api/reports/tutor-monthly-hours').query({ month: '2026-09' });
        expect(res.status).toBe(200);
        expect(res.body.tutors).toEqual([{ id: 1, username: 'test.tutor' }]);
        expect(res.body.lessonsByTutor['1']).toHaveLength(1);
    });

    test('excludes an erased tutor from the table', async () => {
        const agent = await tutorAgent({ role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().get(/\/api\/lessons\/date-range/).reply(200, [lessonFixture({ tutorId: 2 })]);
        javaApi().get('/api/users').reply(200, [
            tutorFixture({ id: 1, role: 'STAFF' }),
            tutorFixture({ id: 2, role: 'GENERIC', anonymizedAt: '2026-01-01T00:00:00' })
        ]);
        javaApi().get('/api/students/10').reply(200, studentFixture());

        const res = await agent.get('/api/reports/tutor-monthly-hours').query({ month: '2026-09' });
        expect(res.status).toBe(200);
        expect(res.body.tutors).toEqual([{ id: 1, username: 'test.tutor' }]);
    });
});
