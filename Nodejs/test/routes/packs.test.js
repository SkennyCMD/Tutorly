const request = require('supertest');
const app = require('../helpers/testApp');
const { javaApi } = require('../helpers/javaApi');
const { loginAsTutor, tutorFixture } = require('../helpers/auth');
const { packFixture } = require('../helpers/fixtures');

async function tutorAgent(overrides = {}) {
    const agent = request.agent(app);
    await loginAsTutor(agent, tutorFixture(overrides));
    return agent;
}

describe('POST /api/packs', () => {
    test('a GUEST account is blocked with 403', async () => {
        const agent = await tutorAgent({ role: 'GUEST' });
        const res = await agent.post('/api/packs').send({ studentId: 10, hours: 10, startDate: '2026-09-11', startTime: '10:00' });
        expect(res.status).toBe(403);
    });

    test('rejects missing fields with 400', async () => {
        const agent = await tutorAgent();
        const res = await agent.post('/api/packs').send({ studentId: 10 });
        expect(res.status).toBe(400);
    });

    test('creates the pack', async () => {
        const agent = await tutorAgent();
        let forwardedBody;
        javaApi().post('/api/packs', body => { forwardedBody = body; return true; })
            .reply(201, (uri, body) => ({ id: 400, ...body }));

        const res = await agent.post('/api/packs').send({ studentId: 10, hours: '10', startDate: '2026-09-11', startTime: '10:00' });

        expect(res.status).toBe(201);
        expect(forwardedBody.startTime).toBe('2026-09-11T10:00:00');
        expect(forwardedBody.hours).toBe(10);
    });

    test('propagates a Java API error', async () => {
        const agent = await tutorAgent();
        javaApi().post('/api/packs').reply(500, 'DB error');

        const res = await agent.post('/api/packs').send({ studentId: 10, hours: 10, startDate: '2026-09-11', startTime: '10:00' });
        expect(res.status).toBe(500);
    });
});

describe('PUT /api/packs/:id/close', () => {
    test('a GUEST account is blocked with 403', async () => {
        const agent = await tutorAgent({ role: 'GUEST' });
        const res = await agent.put('/api/packs/400/close');
        expect(res.status).toBe(403);
    });

    test('closes the pack', async () => {
        const agent = await tutorAgent();
        javaApi().put('/api/packs/400/close').reply(200, packFixture({ closure: '2026-09-11' }));

        const res = await agent.put('/api/packs/400/close');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('propagates a Java API error', async () => {
        const agent = await tutorAgent();
        javaApi().put('/api/packs/999/close').reply(404, 'Pack not found');

        const res = await agent.put('/api/packs/999/close');
        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/packs/:id', () => {
    test('a GUEST account is blocked with 403', async () => {
        const agent = await tutorAgent({ id: 1, role: 'GUEST' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GUEST' }));

        const res = await agent.delete('/api/packs/400');
        expect(res.status).toBe(403);
    });

    test('a GENERIC tutor is blocked with 403', async () => {
        const agent = await tutorAgent({ id: 1, role: 'GENERIC' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GENERIC' }));

        const res = await agent.delete('/api/packs/400');
        expect(res.status).toBe(403);
    });

    test('STAFF can delete the pack', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().delete('/api/packs/400').reply(204);

        const res = await agent.delete('/api/packs/400');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('propagates a Java API error', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().delete('/api/packs/999').reply(404, 'Pack not found');

        const res = await agent.delete('/api/packs/999');
        expect(res.status).toBe(404);
    });
});
