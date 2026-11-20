const request = require('supertest');
const app = require('../helpers/testApp');
const { javaApi } = require('../helpers/javaApi');
const { loginAsAdmin, loginAsTutor, adminFixture, tutorFixture } = require('../helpers/auth');

async function adminAgent(overrides = {}) {
    const agent = request.agent(app);
    await loginAsAdmin(agent, adminFixture(overrides));
    return agent;
}

async function tutorAgent(overrides = {}) {
    const agent = request.agent(app);
    await loginAsTutor(agent, tutorFixture(overrides));
    return agent;
}

describe('POST /api/dashboard-notes', () => {
    test('redirects to /adminLogin when not authenticated', async () => {
        const res = await request(app).post('/api/dashboard-notes').send({ content: 'Reminder', expiresAt: '2026-12-01' });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/adminLogin');
    });

    test('redirects to /adminLogin for a tutor session (not an admin one)', async () => {
        const agent = await tutorAgent();
        const res = await agent.post('/api/dashboard-notes').send({ content: 'Reminder', expiresAt: '2026-12-01' });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/adminLogin');
    });

    test('rejects blank content with 400', async () => {
        const agent = await adminAgent();
        const res = await agent.post('/api/dashboard-notes').send({ content: '   ', expiresAt: '2026-12-01' });
        expect(res.status).toBe(400);
    });

    test('rejects a missing expiration date with 400', async () => {
        const agent = await adminAgent();
        const res = await agent.post('/api/dashboard-notes').send({ content: 'Reminder' });
        expect(res.status).toBe(400);
    });

    test('an admin can publish a note, adminId forced from the session and expiresAt forwarded as end-of-day', async () => {
        const agent = await adminAgent({ id: 1 });
        let forwardedBody;
        javaApi().post('/api/dashboard-notes', body => { forwardedBody = body; return true; })
            .reply(201, (uri, body) => ({ id: 10, creation: '2026-11-19T09:00:00', ...body }));

        const res = await agent.post('/api/dashboard-notes').send({ content: 'Reminder', expiresAt: '2026-12-01', adminId: 999 });

        expect(res.status).toBe(201);
        expect(forwardedBody).toEqual({ content: 'Reminder', expiration: '2026-12-01T23:59:59', adminId: 1 });
    });

    test('propagates a Java API error (e.g. expiration already past)', async () => {
        const agent = await adminAgent();
        javaApi().post('/api/dashboard-notes').reply(400, 'expiration must be today or in the future');

        const res = await agent.post('/api/dashboard-notes').send({ content: 'Reminder', expiresAt: '2026-01-01' });
        expect(res.status).toBe(400);
    });
});

describe('POST /api/dashboard-notes/:noteId/viewed', () => {
    test('redirects to /login when not authenticated', async () => {
        const res = await request(app).post('/api/dashboard-notes/5/viewed');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/login');
    });

    test('rejects a GUEST session with 403', async () => {
        const agent = await tutorAgent({ id: 21, role: 'GUEST' });
        const res = await agent.post('/api/dashboard-notes/5/viewed');
        expect(res.status).toBe(403);
    });

    test('rejects a non-numeric note ID with 400', async () => {
        const agent = await tutorAgent();
        const res = await agent.post('/api/dashboard-notes/not-a-number/viewed');
        expect(res.status).toBe(400);
    });

    test('clears this user\'s own row, userId forced from the session', async () => {
        const agent = await tutorAgent({ id: 1 });
        const deleteScope = javaApi().delete('/api/dashboard-notes/5/user/1').reply(204);

        const res = await agent.post('/api/dashboard-notes/5/viewed');

        expect(res.status).toBe(200);
        expect(deleteScope.isDone()).toBe(true);
    });

    test('propagates a Java API failure as 500', async () => {
        const agent = await tutorAgent({ id: 1 });
        javaApi().delete('/api/dashboard-notes/99/user/1').reply(404);

        const res = await agent.post('/api/dashboard-notes/99/viewed');
        expect(res.status).toBe(500);
    });
});
