const request = require('supertest');
const app = require('../helpers/testApp');
const { javaApi } = require('../helpers/javaApi');
const { loginAsTutor, tutorFixture } = require('../helpers/auth');

async function tutorAgent(overrides = {}) {
    const agent = request.agent(app);
    await loginAsTutor(agent, tutorFixture(overrides));
    return agent;
}

describe('POST /api/students', () => {
    test('redirects to /login when not authenticated', async () => {
        const res = await request(app).post('/api/students').send({ name: 'Mario', surname: 'Rossi', studentClass: 'M' });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/login');
    });

    test('rejects missing fields with 400', async () => {
        const agent = await tutorAgent();
        const res = await agent.post('/api/students').send({ name: 'Mario' });
        expect(res.status).toBe(400);
    });

    test('rejects an invalid class with 400', async () => {
        const agent = await tutorAgent();
        const res = await agent.post('/api/students').send({ name: 'Mario', surname: 'Rossi', studentClass: 'X' });
        expect(res.status).toBe(400);
    });

    test('creates the student as ACTIVE', async () => {
        const agent = await tutorAgent();
        let forwardedBody;
        javaApi().post('/api/students', body => { forwardedBody = body; return true; })
            .reply(201, (uri, body) => ({ id: 10, ...body }));

        const res = await agent.post('/api/students').send({ name: 'Mario', surname: 'Rossi', studentClass: 'M' });

        expect(res.status).toBe(200);
        expect(forwardedBody.status).toBe('ACTIVE');
        expect(res.body.id).toBe(10);
    });

    test('propagates a Java API error', async () => {
        const agent = await tutorAgent();
        javaApi().post('/api/students').reply(500, 'DB error');

        const res = await agent.post('/api/students').send({ name: 'Mario', surname: 'Rossi', studentClass: 'M' });
        expect(res.status).toBe(500);
    });

    test('a GUEST account is blocked with 403', async () => {
        const agent = await tutorAgent({ role: 'GUEST' });
        const res = await agent.post('/api/students').send({ name: 'Mario', surname: 'Rossi', studentClass: 'M' });
        expect(res.status).toBe(403);
    });
});
