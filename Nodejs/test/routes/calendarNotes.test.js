const request = require('supertest');
const app = require('../helpers/testApp');
const { javaApi } = require('../helpers/javaApi');
const { loginAsTutor, tutorFixture } = require('../helpers/auth');
const { calendarNoteFixture } = require('../helpers/fixtures');

async function tutorAgent(overrides = {}) {
    const agent = request.agent(app);
    await loginAsTutor(agent, tutorFixture(overrides));
    return agent;
}

describe('POST /api/calendar-notes', () => {
    test('a GUEST account is blocked with 403', async () => {
        const agent = await tutorAgent({ role: 'GUEST' });
        const res = await agent.post('/api/calendar-notes').send({ description: 'x', startTime: '2026-09-11T09:00:00', endTime: '2026-09-11T09:30:00' });
        expect(res.status).toBe(403);
    });

    test('rejects missing fields with 400', async () => {
        const agent = await tutorAgent();
        const res = await agent.post('/api/calendar-notes').send({ description: 'x' });
        expect(res.status).toBe(400);
    });

    test('creates the note, always using the session user as creator', async () => {
        const agent = await tutorAgent();
        let forwardedBody;
        javaApi().post('/api/calendar-notes', body => { forwardedBody = body; return true; })
            .reply(201, (uri, body) => ({ id: 500, ...body }));

        const res = await agent.post('/api/calendar-notes').send({
            description: 'Follow up',
            startTime: '2026-09-11T09:00:00',
            endTime: '2026-09-11T09:30:00',
            tutorIds: [2, 3]
        });

        expect(res.status).toBe(200);
        expect(forwardedBody.creatorId).toBe(1);
        expect(forwardedBody.tutorIds).toEqual([2, 3]);
    });
});

describe('GET /api/calendar-notes/:id', () => {
    test('returns 404 when the note does not exist', async () => {
        const agent = await tutorAgent();
        javaApi().get('/api/calendar-notes/999').reply(200, null);

        const res = await agent.get('/api/calendar-notes/999');
        expect(res.status).toBe(404);
    });

    test('returns the note to its creator', async () => {
        const agent = await tutorAgent();
        javaApi().get('/api/calendar-notes/500').reply(200, calendarNoteFixture());

        const res = await agent.get('/api/calendar-notes/500');
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(500);
    });

    test('returns the note to an assigned (non-creator) tutor', async () => {
        const agent = await tutorAgent({ id: 2 });
        javaApi().get('/api/calendar-notes/500').reply(200, calendarNoteFixture({ creator: { id: 1 }, tutors: [{ id: 1 }, { id: 2 }] }));

        const res = await agent.get('/api/calendar-notes/500');
        expect(res.status).toBe(200);
    });

    test('a GENERIC tutor with no involvement in the note is blocked with 403', async () => {
        const agent = await tutorAgent({ id: 2, role: 'GENERIC' });
        javaApi().get('/api/calendar-notes/500').reply(200, calendarNoteFixture({ creator: { id: 1 }, tutors: [{ id: 1 }] }));

        const res = await agent.get('/api/calendar-notes/500');
        expect(res.status).toBe(403);
    });

    test('a GUEST account is blocked with 403', async () => {
        const agent = await tutorAgent({ role: 'GUEST' });
        const res = await agent.get('/api/calendar-notes/500');
        expect(res.status).toBe(403);
    });
});

describe('PUT /api/calendar-notes/:id', () => {
    test('rejects missing fields with 400', async () => {
        const agent = await tutorAgent();
        const res = await agent.put('/api/calendar-notes/500').send({ description: 'x' });
        expect(res.status).toBe(400);
    });

    test('blocks a non-creator tutor with 403', async () => {
        const agent = await tutorAgent({ id: 2 });
        javaApi().get('/api/calendar-notes/500').reply(200, calendarNoteFixture({ creator: { id: 1 } }));

        const res = await agent.put('/api/calendar-notes/500').send({ description: 'x', startTime: '2026-09-11T09:00:00', endTime: '2026-09-11T09:30:00' });
        expect(res.status).toBe(403);
    });

    test('lets the creator edit the note', async () => {
        const agent = await tutorAgent({ id: 1 });
        javaApi().get('/api/calendar-notes/500').reply(200, calendarNoteFixture({ creator: { id: 1 } }));
        javaApi().put('/api/calendar-notes/500').reply(200, calendarNoteFixture({ description: 'Updated' }));

        const res = await agent.put('/api/calendar-notes/500').send({ description: 'Updated', startTime: '2026-09-11T09:00:00', endTime: '2026-09-11T09:30:00' });
        expect(res.status).toBe(200);
        expect(res.body.description).toBe('Updated');
    });
});

describe('DELETE /api/calendar-notes/:id', () => {
    test('blocks a non-creator tutor with 403', async () => {
        const agent = await tutorAgent({ id: 2 });
        javaApi().get('/api/calendar-notes/500').reply(200, calendarNoteFixture({ creator: { id: 1 } }));

        const res = await agent.delete('/api/calendar-notes/500');
        expect(res.status).toBe(403);
    });

    test('lets the creator delete the note', async () => {
        const agent = await tutorAgent({ id: 1 });
        javaApi().get('/api/calendar-notes/500').reply(200, calendarNoteFixture({ creator: { id: 1 } }));
        javaApi().delete('/api/calendar-notes/500').query({ userId: '1' }).reply(200);

        const res = await agent.delete('/api/calendar-notes/500');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('a GUEST account is blocked with 403', async () => {
        const agent = await tutorAgent({ role: 'GUEST' });
        const res = await agent.delete('/api/calendar-notes/500');
        expect(res.status).toBe(403);
    });
});
