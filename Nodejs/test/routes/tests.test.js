const request = require('supertest');
const app = require('../helpers/testApp');
const { javaApi } = require('../helpers/javaApi');
const { loginAsTutor } = require('../helpers/auth');
const { testFixture } = require('../helpers/fixtures');
const { tutorFixture } = require('../helpers/auth');

async function tutorAgent(overrides = {}) {
    const agent = request.agent(app);
    await loginAsTutor(agent, tutorFixture(overrides));
    return agent;
}

describe('POST /api/tests', () => {
    test('redirects to /login when not authenticated', async () => {
        const res = await request(app).post('/api/tests').send({ studentId: 10, date: '2026-09-11' });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/login');
    });

    test('rejects a missing studentId or date with 400', async () => {
        const agent = await tutorAgent();
        const res = await agent.post('/api/tests').send({ mark: 7 });
        expect(res.status).toBe(400);
    });

    test('creates the test, always using the session tutor as tutorId', async () => {
        const agent = await tutorAgent();
        let forwardedBody;
        javaApi().post('/api/tests', body => { forwardedBody = body; return true; })
            .reply(201, (uri, body) => ({ id: 300, ...body }));

        const res = await agent.post('/api/tests').send({ studentId: 10, date: '2026-09-11', mark: '7.5', subject: 'Math' });

        expect(res.status).toBe(201);
        expect(forwardedBody.tutorId).toBe(1);
        expect(forwardedBody.mark).toBe(7.5);
        expect(forwardedBody.day).toBe('2026-09-11');
    });

    test('sends a null mark when none is provided', async () => {
        const agent = await tutorAgent();
        let forwardedBody;
        javaApi().post('/api/tests', body => { forwardedBody = body; return true; }).reply(201, () => ({ id: 300 }));

        const res = await agent.post('/api/tests').send({ studentId: 10, date: '2026-09-11' });
        expect(res.status).toBe(201);
        expect(forwardedBody.mark).toBeNull();
    });

    test('propagates a Java API error', async () => {
        const agent = await tutorAgent();
        javaApi().post('/api/tests').reply(500, 'DB error');

        const res = await agent.post('/api/tests').send({ studentId: 10, date: '2026-09-11' });
        expect(res.status).toBe(500);
    });

    test('a GUEST account is blocked with 403', async () => {
        const agent = await tutorAgent({ role: 'GUEST' });
        const res = await agent.post('/api/tests').send({ studentId: 10, date: '2026-09-11' });
        expect(res.status).toBe(403);
    });
});

describe('DELETE /api/tests/:id', () => {
    test('deletes the test', async () => {
        const agent = await tutorAgent();
        javaApi().delete('/api/tests/300').reply(200);

        const res = await agent.delete('/api/tests/300');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('propagates a Java API error', async () => {
        const agent = await tutorAgent();
        javaApi().delete('/api/tests/999').reply(404, 'Test not found');

        const res = await agent.delete('/api/tests/999');
        expect(res.status).toBe(404);
    });

    test('a GUEST account is blocked with 403', async () => {
        const agent = await tutorAgent({ role: 'GUEST' });
        const res = await agent.delete('/api/tests/300');
        expect(res.status).toBe(403);
    });
});
