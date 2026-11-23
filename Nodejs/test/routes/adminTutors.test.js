const request = require('supertest');
const app = require('../helpers/testApp');
const { javaApi } = require('../helpers/javaApi');
const { loginAsAdmin, tutorFixture } = require('../helpers/auth');

async function adminAgent() {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    return agent;
}

describe('GET /api/admin/tutors', () => {
    test('redirects to /adminLogin when not authenticated', async () => {
        const res = await request(app).get('/api/admin/tutors');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/adminLogin');
    });

    test('returns every non-GUEST user', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users').reply(200, [
            tutorFixture({ id: 1, role: 'GENERIC' }),
            tutorFixture({ id: 2, role: 'STAFF' }),
            tutorFixture({ id: 3, role: 'GUEST' })
        ]);

        const res = await agent.get('/api/admin/tutors');
        expect(res.status).toBe(200);
        expect(res.body.map(t => t.id)).toEqual([1, 2]);
    });

    test('never includes password hashes in the response', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users').reply(200, [
            tutorFixture({ id: 1, role: 'GENERIC', password: '$2b$10$SECRETHASHVALUE' })
        ]);

        const res = await agent.get('/api/admin/tutors');
        expect(res.status).toBe(200);
        expect(res.body[0].password).toBeUndefined();
        expect(res.text).not.toContain('SECRETHASHVALUE');
    });

    test('returns 500 when the Java API call fails', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users').reply(500);

        const res = await agent.get('/api/admin/tutors');
        expect(res.status).toBe(500);
    });
});

describe('POST /api/admin/tutors', () => {
    test('rejects a missing username/password with 400', async () => {
        const agent = await adminAgent();
        const res = await agent.post('/api/admin/tutors').send({ role: 'GENERIC' });
        expect(res.status).toBe(400);
    });

    test('rejects an invalid role with 400', async () => {
        const agent = await adminAgent();
        const res = await agent.post('/api/admin/tutors').send({ username: 'new.tutor', password: 'longenough1', role: 'ADMIN' });
        expect(res.status).toBe(400);
    });

    test('rejects a password shorter than 8 characters with 400', async () => {
        const agent = await adminAgent();
        const res = await agent.post('/api/admin/tutors').send({ username: 'new.tutor', password: 'short', role: 'GENERIC' });
        expect(res.status).toBe(400);
    });

    test('creates the tutor and hashes the password before forwarding', async () => {
        const agent = await adminAgent();
        let forwardedBody;
        javaApi().post('/api/users', body => { forwardedBody = body; return true; }).reply(201, (uri, body) => ({ id: 7, ...body }));

        const res = await agent.post('/api/admin/tutors').send({ username: 'new.tutor', password: 'longenough1', role: 'GENERIC' });

        expect(res.status).toBe(201);
        expect(forwardedBody.password).not.toBe('longenough1');
        expect(forwardedBody.password).toMatch(/^\$2[aby]\$/);
        expect(forwardedBody.role).toBe('GENERIC');
    });

    test('maps a duplicate username (409 from Java) to a friendly error', async () => {
        const agent = await adminAgent();
        javaApi().post('/api/users').reply(409);

        const res = await agent.post('/api/admin/tutors').send({ username: 'dupe', password: 'longenough1', role: 'GENERIC' });
        expect(res.status).toBe(409);
    });
});

describe('PATCH /api/admin/tutors/:id/role', () => {
    test('rejects an invalid role with 400', async () => {
        const agent = await adminAgent();
        const res = await agent.patch('/api/admin/tutors/1/role').send({ role: 'ADMIN' });
        expect(res.status).toBe(400);
    });

    test('blocks role changes on an erased account with 409', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, anonymizedAt: '2026-01-01T00:00:00' }));

        const res = await agent.patch('/api/admin/tutors/1/role').send({ role: 'STAFF' });
        expect(res.status).toBe(409);
    });

    test('returns 404 when the tutor does not exist', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users/999').reply(404);

        const res = await agent.patch('/api/admin/tutors/999/role').send({ role: 'STAFF' });
        expect(res.status).toBe(404);
    });

    test('updates the role on a non-erased account', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));
        javaApi().patch('/api/users/1/role', { role: 'STAFF' }).reply(200, tutorFixture({ id: 1, role: 'STAFF' }));

        const res = await agent.patch('/api/admin/tutors/1/role').send({ role: 'STAFF' });
        expect(res.status).toBe(200);
        expect(res.body.role).toBe('STAFF');
    });
});

describe('PATCH /api/admin/tutors/:id/status', () => {
    test('blocks status changes on an erased account with 409', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, anonymizedAt: '2026-01-01T00:00:00' }));

        const res = await agent.patch('/api/admin/tutors/1/status').send({ status: 'BLOCKED' });
        expect(res.status).toBe(409);
    });

    test('updates status on a non-erased account', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));
        javaApi().patch('/api/users/1/status', { status: 'BLOCKED' }).reply(200, tutorFixture({ id: 1, status: 'BLOCKED' }));

        const res = await agent.patch('/api/admin/tutors/1/status').send({ status: 'BLOCKED' });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('BLOCKED');
    });
});

describe('DELETE /api/admin/tutors/:id/erasure', () => {
    test('rejects erasing a GUEST account through the tutor endpoint with 400', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users/3').reply(200, tutorFixture({ id: 3, role: 'GUEST' }));

        const res = await agent.delete('/api/admin/tutors/3/erasure');
        expect(res.status).toBe(400);
    });

    test('erases a GENERIC/STAFF tutor', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1 }));
        javaApi().delete('/api/users/1').reply(200, tutorFixture({ id: 1, status: 'DISCONTINUED', anonymizedAt: '2026-09-11T00:00:00' }));

        const res = await agent.delete('/api/admin/tutors/1/erasure');
        expect(res.status).toBe(200);
        expect(res.body.anonymizedAt).toBeTruthy();
        expect(res.body.password).toBeUndefined();
    });

    test('returns 404 for a nonexistent tutor', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users/999').reply(404);

        const res = await agent.delete('/api/admin/tutors/999/erasure');
        expect(res.status).toBe(404);
    });

    test('is idempotent - erasing an already-erased tutor returns 409', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, anonymizedAt: '2026-09-01T00:00:00' }));
        javaApi().delete('/api/users/1').reply(409);

        const res = await agent.delete('/api/admin/tutors/1/erasure');
        expect(res.status).toBe(409);
    });
});
