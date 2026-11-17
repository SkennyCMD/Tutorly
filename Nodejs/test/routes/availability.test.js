const request = require('supertest');
const app = require('../helpers/testApp');
const { javaApi } = require('../helpers/javaApi');
const { loginAsTutor, tutorFixture } = require('../helpers/auth');

async function tutorAgent(overrides = {}) {
    const agent = request.agent(app);
    await loginAsTutor(agent, tutorFixture(overrides));
    return agent;
}

describe('POST /api/availability', () => {
    test('a GUEST account is blocked with 403', async () => {
        const agent = await tutorAgent({ id: 1, role: 'GUEST' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GUEST' }));

        const res = await agent.post('/api/availability').send({ tutorId: 4, weekDay: 1, startTime: '09:00', endTime: '12:00' });
        expect(res.status).toBe(403);
    });

    test('a GENERIC tutor is blocked with 403', async () => {
        const agent = await tutorAgent({ id: 1, role: 'GENERIC' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GENERIC' }));

        const res = await agent.post('/api/availability').send({ tutorId: 4, weekDay: 1, startTime: '09:00', endTime: '12:00' });
        expect(res.status).toBe(403);
    });

    test('rejects missing fields with 400', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));

        const res = await agent.post('/api/availability').send({ tutorId: 4 });
        expect(res.status).toBe(400);
    });

    test('STAFF can create a slot for any tutor', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        let forwardedBody;
        javaApi().post('/api/availability', body => { forwardedBody = body; return true; }).reply(201, (uri, body) => ({ id: 10, ...body }));

        const res = await agent.post('/api/availability').send({ tutorId: 4, weekDay: 1, startTime: '09:00', endTime: '12:00' });

        expect(res.status).toBe(201);
        expect(forwardedBody).toEqual({ tutorId: 4, weekDay: 1, startTime: '09:00', endTime: '12:00' });
    });

    test('propagates a Java API error', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().post('/api/availability').reply(400, 'endTime must be after startTime');

        const res = await agent.post('/api/availability').send({ tutorId: 4, weekDay: 1, startTime: '12:00', endTime: '09:00' });
        expect(res.status).toBe(400);
    });
});

describe('POST /api/exception-days', () => {
    test('a GUEST account is blocked with 403', async () => {
        const agent = await tutorAgent({ role: 'GUEST' });
        const res = await agent.post('/api/exception-days').send({ type: 'absent', day: '2026-12-24' });
        expect(res.status).toBe(403);
    });

    test('rejects missing fields with 400', async () => {
        const agent = await tutorAgent();
        const res = await agent.post('/api/exception-days').send({ type: 'absent' });
        expect(res.status).toBe(400);
    });

    test("rejects a 'present' exception with no times with 400", async () => {
        const agent = await tutorAgent();
        const res = await agent.post('/api/exception-days').send({ type: 'present', day: '2026-12-24' });
        expect(res.status).toBe(400);
    });

    test('a GENERIC tutor can submit an absent exception for themselves', async () => {
        const agent = await tutorAgent({ id: 1, role: 'GENERIC' });
        let forwardedBody;
        javaApi().post('/api/exception-days', body => { forwardedBody = body; return true; })
            .reply(201, (uri, body) => ({ id: 20, status: 'pending', ...body }));

        const res = await agent.post('/api/exception-days').send({ type: 'absent', day: '2026-12-24' });

        expect(res.status).toBe(201);
        // tutorId always comes from the session, never the request body
        expect(forwardedBody).toEqual({ tutorId: 1, type: 'absent', day: '2026-12-24', startTime: null, endTime: null });
    });

    test('a STAFF tutor can submit a present exception for themselves', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        let forwardedBody;
        javaApi().post('/api/exception-days', body => { forwardedBody = body; return true; })
            .reply(201, (uri, body) => ({ id: 21, status: 'pending', ...body }));

        const res = await agent.post('/api/exception-days').send({ type: 'present', day: '2026-12-24', startTime: '14:00', endTime: '16:00' });

        expect(res.status).toBe(201);
        expect(forwardedBody).toEqual({ tutorId: 1, type: 'present', day: '2026-12-24', startTime: '14:00', endTime: '16:00' });
    });

    test('propagates a Java API error', async () => {
        const agent = await tutorAgent();
        javaApi().post('/api/exception-days').reply(400, "type must be 'present' or 'absent'");

        const res = await agent.post('/api/exception-days').send({ type: 'absent', day: '2026-12-24' });
        expect(res.status).toBe(400);
    });
});

describe('PUT /api/exception-days/:id/approve', () => {
    test('a GUEST account is blocked with 403', async () => {
        const agent = await tutorAgent({ id: 1, role: 'GUEST' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GUEST' }));

        const res = await agent.put('/api/exception-days/10/approve');
        expect(res.status).toBe(403);
    });

    test('a GENERIC tutor is blocked with 403', async () => {
        const agent = await tutorAgent({ id: 1, role: 'GENERIC' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GENERIC' }));

        const res = await agent.put('/api/exception-days/10/approve');
        expect(res.status).toBe(403);
    });

    test('STAFF can approve, with staffId forced from the session', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        let forwardedBody;
        javaApi().put('/api/exception-days/10/approve', body => { forwardedBody = body; return true; })
            .reply(200, (uri, body) => ({ id: 10, status: 'approved', ...body }));

        const res = await agent.put('/api/exception-days/10/approve');

        expect(res.status).toBe(200);
        expect(forwardedBody).toEqual({ staffId: 1 });
    });

    test('propagates a Java API error', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().put('/api/exception-days/99/approve').reply(404, 'Exception day not found');

        const res = await agent.put('/api/exception-days/99/approve');
        expect(res.status).toBe(404);
    });
});

describe('PUT /api/exception-days/:id/refuse', () => {
    test('a GENERIC tutor is blocked with 403', async () => {
        const agent = await tutorAgent({ id: 1, role: 'GENERIC' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GENERIC' }));

        const res = await agent.put('/api/exception-days/10/refuse');
        expect(res.status).toBe(403);
    });

    test('STAFF can refuse, with staffId forced from the session', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        let forwardedBody;
        javaApi().put('/api/exception-days/10/refuse', body => { forwardedBody = body; return true; })
            .reply(200, (uri, body) => ({ id: 10, status: 'refused', ...body }));

        const res = await agent.put('/api/exception-days/10/refuse');

        expect(res.status).toBe(200);
        expect(forwardedBody).toEqual({ staffId: 1 });
    });

    test('propagates a Java API error', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().put('/api/exception-days/99/refuse').reply(404, 'Exception day not found');

        const res = await agent.put('/api/exception-days/99/refuse');
        expect(res.status).toBe(404);
    });
});
