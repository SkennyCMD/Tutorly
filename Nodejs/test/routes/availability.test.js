// Mocked so tests can assert exactly who gets notified, without a real VAPID
// setup or push_subscription lookups - see server_utilities/pushService.js.
jest.mock('../../server_utilities/pushService', () => ({ sendPushToUser: jest.fn() }));

const request = require('supertest');
const app = require('../helpers/testApp');
const { javaApi } = require('../helpers/javaApi');
const { loginAsTutor, tutorFixture } = require('../helpers/auth');
const { sendPushToUser } = require('../../server_utilities/pushService');

// POST /api/exception-days notifies STAFF fire-and-forget, after the HTTP
// response is already sent - give its promise chain a tick to run.
function flushMicrotasks() {
    return new Promise(resolve => setTimeout(resolve, 20));
}

async function tutorAgent(overrides = {}) {
    const agent = request.agent(app);
    await loginAsTutor(agent, tutorFixture(overrides));
    return agent;
}

beforeEach(() => sendPushToUser.mockClear());

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

describe('PUT /api/availability/:id', () => {
    test('a GUEST account is blocked with 403', async () => {
        const agent = await tutorAgent({ id: 1, role: 'GUEST' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GUEST' }));

        const res = await agent.put('/api/availability/7').send({ weekDay: 2, startTime: '09:00', endTime: '12:00' });
        expect(res.status).toBe(403);
    });

    test('a GENERIC tutor is blocked with 403', async () => {
        const agent = await tutorAgent({ id: 1, role: 'GENERIC' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GENERIC' }));

        const res = await agent.put('/api/availability/7').send({ weekDay: 2, startTime: '09:00', endTime: '12:00' });
        expect(res.status).toBe(403);
    });

    test('rejects missing fields with 400', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));

        const res = await agent.put('/api/availability/7').send({ weekDay: 2 });
        expect(res.status).toBe(400);
    });

    test('STAFF can update a slot\'s day/time', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        let forwardedBody;
        javaApi().put('/api/availability/7', body => { forwardedBody = body; return true; }).reply(200, (uri, body) => ({ id: 7, tutorId: 4, ...body }));

        const res = await agent.put('/api/availability/7').send({ weekDay: 3, startTime: '14:00', endTime: '16:00' });

        expect(res.status).toBe(200);
        expect(forwardedBody).toEqual({ weekDay: 3, startTime: '14:00', endTime: '16:00' });
    });

    test('propagates a Java API 404 for a slot that does not exist', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().put('/api/availability/404').reply(404);

        const res = await agent.put('/api/availability/404').send({ weekDay: 1, startTime: '09:00', endTime: '12:00' });
        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/availability/:id', () => {
    test('a GUEST account is blocked with 403', async () => {
        const agent = await tutorAgent({ id: 1, role: 'GUEST' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GUEST' }));

        const res = await agent.delete('/api/availability/7');
        expect(res.status).toBe(403);
    });

    test('a GENERIC tutor is blocked with 403', async () => {
        const agent = await tutorAgent({ id: 1, role: 'GENERIC' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GENERIC' }));

        const res = await agent.delete('/api/availability/7');
        expect(res.status).toBe(403);
    });

    test('STAFF can delete a slot', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        const deleteScope = javaApi().delete('/api/availability/7').reply(204);

        const res = await agent.delete('/api/availability/7');

        expect(res.status).toBe(200);
        expect(deleteScope.isDone()).toBe(true);
    });

    test('propagates a Java API 404 for a slot that does not exist', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().delete('/api/availability/404').reply(404);

        const res = await agent.delete('/api/availability/404');
        expect(res.status).toBe(404);
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

    test('notifies every active STAFF member, but not GUEST/BLOCKED/erased accounts', async () => {
        const agent = await tutorAgent({ id: 1, role: 'GENERIC' });
        javaApi().post('/api/exception-days').reply(201, { id: 30, status: 'pending' });
        javaApi().get('/api/users').reply(200, [
            tutorFixture({ id: 1, username: 'me.generic', role: 'GENERIC' }),
            tutorFixture({ id: 2, username: 'staff.one', role: 'STAFF', status: 'ACTIVE' }),
            tutorFixture({ id: 3, username: 'staff.blocked', role: 'STAFF', status: 'BLOCKED' }),
            tutorFixture({ id: 4, username: 'staff.erased', role: 'STAFF', status: 'DISCONTINUED', anonymizedAt: '2026-01-01T00:00:00' }),
            tutorFixture({ id: 5, username: 'guest.one', role: 'GUEST', status: 'ACTIVE' })
        ]);

        const res = await agent.post('/api/exception-days').send({ type: 'absent', day: '2026-12-24' });
        expect(res.status).toBe(201);

        await flushMicrotasks();

        expect(sendPushToUser).toHaveBeenCalledTimes(1);
        expect(sendPushToUser).toHaveBeenCalledWith(2, expect.objectContaining({
            title: 'New Availability Request',
            url: '/availability',
            tag: 'exception-day-30'
        }));
    });

    test('does not notify the submitter even if they are STAFF themselves', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().post('/api/exception-days').reply(201, { id: 31, status: 'pending' });
        javaApi().get('/api/users').reply(200, [
            tutorFixture({ id: 1, username: 'me.staff', role: 'STAFF', status: 'ACTIVE' })
        ]);

        const res = await agent.post('/api/exception-days').send({ type: 'absent', day: '2026-12-24' });
        expect(res.status).toBe(201);

        await flushMicrotasks();

        expect(sendPushToUser).not.toHaveBeenCalled();
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
        // the updated exception is forwarded back so the client can patch its
        // local state instead of reloading the page
        expect(res.body.exception).toMatchObject({ id: 10, status: 'approved' });
    });

    test('propagates a Java API error', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().put('/api/exception-days/99/approve').reply(404, 'Exception day not found');

        const res = await agent.put('/api/exception-days/99/approve');
        expect(res.status).toBe(404);
    });

    test('notifies the requester that their request was approved', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().put('/api/exception-days/10/approve').reply(200, {
            id: 10, status: 'approved', tutorId: 7, type: 'absent', day: '2026-12-24'
        });

        const res = await agent.put('/api/exception-days/10/approve');
        expect(res.status).toBe(200);

        await flushMicrotasks();

        expect(sendPushToUser).toHaveBeenCalledWith(7, expect.objectContaining({
            title: 'Request Approved',
            url: '/availability',
            tag: 'exception-day-10'
        }));
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
        expect(res.body.exception).toMatchObject({ id: 10, status: 'refused' });
    });

    test('propagates a Java API error', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().put('/api/exception-days/99/refuse').reply(404, 'Exception day not found');

        const res = await agent.put('/api/exception-days/99/refuse');
        expect(res.status).toBe(404);
    });

    test('notifies the requester that their request was refused', async () => {
        const agent = await tutorAgent({ id: 1, role: 'STAFF' });
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'STAFF' }));
        javaApi().put('/api/exception-days/10/refuse').reply(200, {
            id: 10, status: 'refused', tutorId: 7, type: 'present', day: '2026-12-24'
        });

        const res = await agent.put('/api/exception-days/10/refuse');
        expect(res.status).toBe(200);

        await flushMicrotasks();

        expect(sendPushToUser).toHaveBeenCalledWith(7, expect.objectContaining({
            title: 'Request Refused',
            url: '/availability',
            tag: 'exception-day-10'
        }));
    });
});
