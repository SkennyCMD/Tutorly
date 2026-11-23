const request = require('supertest');
const app = require('../helpers/testApp');
const { javaApi } = require('../helpers/javaApi');
const { loginAsAdmin, tutorFixture } = require('../helpers/auth');

function guestFixture(overrides = {}) {
    return tutorFixture({ id: 21, username: 'test.guest', role: 'GUEST', mail: 'guest@example.com', ...overrides });
}

async function adminAgent() {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    return agent;
}

describe('GET /api/admin/guests', () => {
    test('redirects to /adminLogin when not authenticated', async () => {
        const res = await request(app).get('/api/admin/guests');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/adminLogin');
    });

    test('returns the GUEST-role users', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users/role/GUEST').reply(200, [guestFixture()]);

        const res = await agent.get('/api/admin/guests');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].role).toBe('GUEST');
    });

    test('never includes password hashes in the response', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users/role/GUEST').reply(200, [guestFixture({ password: '$2b$10$SECRETHASHVALUE' })]);

        const res = await agent.get('/api/admin/guests');
        expect(res.status).toBe(200);
        expect(res.body[0].password).toBeUndefined();
        expect(res.text).not.toContain('SECRETHASHVALUE');
    });
});

describe('POST /api/admin/guests', () => {
    test('rejects missing fields with 400', async () => {
        const agent = await adminAgent();
        const res = await agent.post('/api/admin/guests').send({ username: 'g' });
        expect(res.status).toBe(400);
    });

    test('rejects an invalid email with 400', async () => {
        const agent = await adminAgent();
        const res = await agent.post('/api/admin/guests').send({ username: 'g', mail: 'not-an-email', password: 'longenough1' });
        expect(res.status).toBe(400);
    });

    test('rejects a short password with 400', async () => {
        const agent = await adminAgent();
        const res = await agent.post('/api/admin/guests').send({ username: 'g', mail: 'g@example.com', password: 'short' });
        expect(res.status).toBe(400);
    });

    test('creates the guest with role GUEST and a hashed password', async () => {
        const agent = await adminAgent();
        let forwardedBody;
        javaApi().post('/api/users', body => { forwardedBody = body; return true; }).reply(201, (uri, body) => ({ id: 21, ...body }));

        const res = await agent.post('/api/admin/guests').send({ username: 'g', mail: 'g@example.com', password: 'longenough1' });

        expect(res.status).toBe(201);
        expect(forwardedBody.role).toBe('GUEST');
        expect(forwardedBody.password).toMatch(/^\$2[aby]\$/);
    });

    test('maps a duplicate username to 409', async () => {
        const agent = await adminAgent();
        javaApi().post('/api/users').reply(409);

        const res = await agent.post('/api/admin/guests').send({ username: 'dupe', mail: 'g@example.com', password: 'longenough1' });
        expect(res.status).toBe(409);
    });
});

describe('PATCH /api/admin/guests/:id', () => {
    test('rejects an invalid email with 400', async () => {
        const agent = await adminAgent();
        const res = await agent.patch('/api/admin/guests/21').send({ username: 'g', mail: 'not-an-email' });
        expect(res.status).toBe(400);
    });

    test('blocks profile changes on an erased guest with 409', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users/21').reply(200, guestFixture({ anonymizedAt: '2026-01-01T00:00:00' }));

        const res = await agent.patch('/api/admin/guests/21').send({ username: 'newname', mail: 'new@example.com' });
        expect(res.status).toBe(409);
    });

    test('updates the profile on a non-erased guest', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users/21').reply(200, guestFixture());
        javaApi().patch('/api/users/21/profile', { username: 'newname', mail: 'new@example.com' })
            .reply(200, guestFixture({ username: 'newname', mail: 'new@example.com' }));

        const res = await agent.patch('/api/admin/guests/21').send({ username: 'newname', mail: 'new@example.com' });
        expect(res.status).toBe(200);
        expect(res.body.username).toBe('newname');
    });

    test('hashes a new password when provided', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users/21').reply(200, guestFixture());
        let forwardedBody;
        javaApi().patch('/api/users/21/profile', body => { forwardedBody = body; return true; }).reply(200, guestFixture());

        const res = await agent.patch('/api/admin/guests/21').send({ username: 'g', mail: 'g@example.com', password: 'longenough1' });
        expect(res.status).toBe(200);
        expect(forwardedBody.password).toMatch(/^\$2[aby]\$/);
    });

    test('rejects a new password shorter than 8 characters with 400', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users/21').reply(200, guestFixture());

        const res = await agent.patch('/api/admin/guests/21').send({ username: 'g', mail: 'g@example.com', password: 'short' });
        expect(res.status).toBe(400);
    });
});

describe('GET /api/admin/guests/:id/students', () => {
    test('returns the students linked to a guest', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/students/guest/21').reply(200, [{ id: 10, name: 'Mario' }]);

        const res = await agent.get('/api/admin/guests/21/students');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
    });
});

describe('DELETE /api/admin/guests/:id/erasure', () => {
    test('rejects erasing a non-guest account through the guest endpoint with 400', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users/1').reply(200, tutorFixture({ id: 1, role: 'GENERIC' }));

        const res = await agent.delete('/api/admin/guests/1/erasure');
        expect(res.status).toBe(400);
    });

    test('erases a guest account', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users/21').reply(200, guestFixture());
        javaApi().delete('/api/users/21').reply(200, guestFixture({ status: 'DISCONTINUED', anonymizedAt: '2026-09-11T00:00:00' }));

        const res = await agent.delete('/api/admin/guests/21/erasure');
        expect(res.status).toBe(200);
        expect(res.body.anonymizedAt).toBeTruthy();
        expect(res.body.password).toBeUndefined();
    });

    test('is idempotent - erasing an already-erased guest returns 409', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users/21').reply(200, guestFixture({ anonymizedAt: '2026-09-01T00:00:00' }));
        javaApi().delete('/api/users/21').reply(409);

        const res = await agent.delete('/api/admin/guests/21/erasure');
        expect(res.status).toBe(409);
    });

    test('returns 404 for a nonexistent guest', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/users/999').reply(404);

        const res = await agent.delete('/api/admin/guests/999/erasure');
        expect(res.status).toBe(404);
    });
});
