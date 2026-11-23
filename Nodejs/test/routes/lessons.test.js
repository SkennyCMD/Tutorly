const request = require('supertest');
const app = require('../helpers/testApp');
const { javaApi } = require('../helpers/javaApi');
const { loginAsTutor, tutorFixture } = require('../helpers/auth');
const { lessonFixture } = require('../helpers/fixtures');

async function tutorAgent(overrides = {}) {
    const agent = request.agent(app);
    await loginAsTutor(agent, tutorFixture(overrides));
    return agent;
}

describe('POST /api/lessons', () => {
    test('redirects to /login when not authenticated', async () => {
        const res = await request(app).post('/api/lessons').send({ studentId: 10, startTime: '10:00', endTime: '11:00' });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/login');
    });

    test('a GUEST account is blocked with 403', async () => {
        const agent = await tutorAgent({ role: 'GUEST' });
        const res = await agent.post('/api/lessons').send({ studentId: 10, startTime: '10:00', endTime: '11:00' });
        expect(res.status).toBe(403);
    });

    test('builds a full datetime from lessonDate + HH:MM start/end and creates the lesson', async () => {
        const agent = await tutorAgent();
        let forwardedBody;
        javaApi().post('/api/lessons', body => { forwardedBody = body; return true; })
            .reply(201, (uri, body) => ({ id: 100, ...body }));

        const res = await agent.post('/api/lessons').send({
            studentId: 10,
            description: 'Algebra',
            lessonDate: '2026-09-11',
            startTime: '10:00',
            endTime: '11:00'
        });

        expect(res.status).toBe(200);
        expect(forwardedBody.startTime).toBe('2026-09-11T10:00:00');
        expect(forwardedBody.endTime).toBe('2026-09-11T11:00:00');
        expect(forwardedBody.tutorId).toBe(1);
        expect(forwardedBody.studentId).toBe(10);
    });

    test('accepts an already-full ISO datetime for startTime/endTime', async () => {
        const agent = await tutorAgent();
        let forwardedBody;
        javaApi().post('/api/lessons', body => { forwardedBody = body; return true; }).reply(201, () => ({ id: 100 }));

        const res = await agent.post('/api/lessons').send({
            studentId: 10,
            startTime: '2026-09-11T10:00:00',
            endTime: '2026-09-11T11:00:00'
        });

        expect(res.status).toBe(200);
        expect(forwardedBody.startTime).toBe('2026-09-11T10:00:00');
    });

    test('propagates a Java API error status and message', async () => {
        const agent = await tutorAgent();
        javaApi().post('/api/lessons').reply(400, 'Overlapping lesson');

        const res = await agent.post('/api/lessons').send({ studentId: 10, startTime: '2026-09-11T10:00:00', endTime: '2026-09-11T11:00:00' });
        expect(res.status).toBe(400);
    });
});

describe('PUT /api/lessons/:id', () => {
    test('a GUEST account is blocked with 403', async () => {
        const agent = await tutorAgent({ role: 'GUEST' });
        const res = await agent.put('/api/lessons/100').send({ studentId: 10, startTime: '2026-09-11T10:00:00', endTime: '2026-09-11T11:00:00' });
        expect(res.status).toBe(403);
    });

    test('updates the lesson', async () => {
        const agent = await tutorAgent();
        javaApi().put('/api/lessons/100').reply(200, lessonFixture({ description: 'Updated' }));

        const res = await agent.put('/api/lessons/100').send({
            studentId: 10,
            description: 'Updated',
            startTime: '2026-09-11T10:00:00',
            endTime: '2026-09-11T11:00:00'
        });
        expect(res.status).toBe(200);
        expect(res.body.description).toBe('Updated');
    });
});

describe('DELETE /api/lessons/:id', () => {
    test('redirects to /login when not authenticated', async () => {
        const res = await request(app).delete('/api/lessons/100');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/login');
    });

    test('a GUEST account is blocked with 403', async () => {
        const agent = await tutorAgent({ role: 'GUEST' });

        const res = await agent.delete('/api/lessons/100');
        expect(res.status).toBe(403);
    });

    test('propagates a Java API error', async () => {
        const agent = await tutorAgent();
        javaApi().delete('/api/lessons/999').reply(404, 'Lesson not found');

        const res = await agent.delete('/api/lessons/999');
        expect(res.status).toBe(404);
    });
});
