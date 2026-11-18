const request = require('supertest');
const app = require('../helpers/testApp');
const { javaApi } = require('../helpers/javaApi');
const { loginAsAdmin, adminFixture, tutorFixture } = require('../helpers/auth');

async function adminAgent(overrides = {}) {
    const agent = request.agent(app);
    await loginAsAdmin(agent, adminFixture(overrides));
    return agent;
}

describe('PUT /api/tickets/:id/manage', () => {
    test('redirects to /adminLogin when not authenticated', async () => {
        const res = await request(app).put('/api/tickets/10/manage');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/adminLogin');
    });

    test('an admin can start managing an open ticket, with adminId forced from the session', async () => {
        const agent = await adminAgent({ id: 1 });
        let forwardedBody;
        javaApi().put('/api/tickets/10/manage', body => { forwardedBody = body; return true; })
            .reply(200, { id: 10, status: 'managing', content: 'Help', creation: '2026-11-10T09:00:00', userId: 4, adminId: 1 });

        const res = await agent.put('/api/tickets/10/manage');

        expect(res.status).toBe(200);
        expect(forwardedBody).toEqual({ adminId: 1 });
        expect(res.body.ticket).toMatchObject({ id: 10, status: 'managing' });
    });

    test('the response ticket is re-enriched with requester/resolver usernames', async () => {
        const agent = await adminAgent({ id: 1, username: 'me.admin' });
        javaApi().put('/api/tickets/10/manage')
            .reply(200, { id: 10, status: 'managing', content: 'Help', creation: '2026-11-10T09:00:00', userId: 4, adminId: 1 });
        javaApi().get('/api/users/4').reply(200, tutorFixture({ id: 4, username: 'needs.help' }));
        javaApi().get('/api/admins/1').reply(200, adminFixture({ id: 1, username: 'me.admin' }));

        const res = await agent.put('/api/tickets/10/manage');

        expect(res.status).toBe(200);
        expect(res.body.ticket).toMatchObject({ requesterUsername: 'needs.help', resolverUsername: 'me.admin' });
    });

    test('propagates a Java API error (e.g. ticket not open)', async () => {
        const agent = await adminAgent();
        javaApi().put('/api/tickets/10/manage').reply(400, 'Only an open ticket can be put into management');

        const res = await agent.put('/api/tickets/10/manage');
        expect(res.status).toBe(400);
    });

    test('propagates a Java API 404 for a ticket that does not exist', async () => {
        const agent = await adminAgent();
        javaApi().put('/api/tickets/404/manage').reply(404);

        const res = await agent.put('/api/tickets/404/manage');
        expect(res.status).toBe(404);
    });
});

describe('PUT /api/tickets/:id/close', () => {
    test('redirects to /adminLogin when not authenticated', async () => {
        const res = await request(app).put('/api/tickets/10/close');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/adminLogin');
    });

    test('an admin can close a managed ticket with a comment, adminId forced from the session', async () => {
        const agent = await adminAgent({ id: 1 });
        let forwardedBody;
        javaApi().put('/api/tickets/10/close', body => { forwardedBody = body; return true; })
            .reply(200, { id: 10, status: 'closed', content: 'Help', creation: '2026-11-10T09:00:00', closure: '2026-11-11T09:00:00', comment: 'Resolved via email.', userId: 4, adminId: 1 });

        const res = await agent.put('/api/tickets/10/close').send({ comment: 'Resolved via email.' });

        expect(res.status).toBe(200);
        expect(forwardedBody).toEqual({ adminId: 1, comment: 'Resolved via email.' });
        expect(res.body.ticket).toMatchObject({ id: 10, status: 'closed', comment: 'Resolved via email.' });
    });

    test('the response ticket is re-enriched with requester/resolver usernames', async () => {
        const agent = await adminAgent({ id: 1, username: 'me.admin' });
        javaApi().put('/api/tickets/10/close')
            .reply(200, { id: 10, status: 'closed', content: 'Help', creation: '2026-11-10T09:00:00', closure: '2026-11-11T09:00:00', comment: 'Resolved.', userId: 4, adminId: 1 });
        javaApi().get('/api/users/4').reply(200, tutorFixture({ id: 4, username: 'needs.help' }));
        javaApi().get('/api/admins/1').reply(200, adminFixture({ id: 1, username: 'me.admin' }));

        const res = await agent.put('/api/tickets/10/close').send({ comment: 'Resolved.' });

        expect(res.status).toBe(200);
        expect(res.body.ticket).toMatchObject({ requesterUsername: 'needs.help', resolverUsername: 'me.admin' });
    });

    test('closing with no comment forwards null, not an empty string', async () => {
        const agent = await adminAgent({ id: 1 });
        let forwardedBody;
        javaApi().put('/api/tickets/10/close', body => { forwardedBody = body; return true; })
            .reply(200, { id: 10, status: 'closed' });

        const res = await agent.put('/api/tickets/10/close').send({});

        expect(res.status).toBe(200);
        expect(forwardedBody).toEqual({ adminId: 1, comment: null });
    });

    test('propagates a Java API error (e.g. ticket not being managed)', async () => {
        const agent = await adminAgent();
        javaApi().put('/api/tickets/10/close').reply(400, 'Only a ticket being managed can be closed');

        const res = await agent.put('/api/tickets/10/close').send({});
        expect(res.status).toBe(400);
    });

    test('propagates a Java API 404 for a ticket that does not exist', async () => {
        const agent = await adminAgent();
        javaApi().put('/api/tickets/404/close').reply(404);

        const res = await agent.put('/api/tickets/404/close').send({});
        expect(res.status).toBe(404);
    });
});
