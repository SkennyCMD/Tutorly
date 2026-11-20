const request = require('supertest');
const app = require('../helpers/testApp');
const { javaApi } = require('../helpers/javaApi');
const { loginAsAdmin, tutorFixture } = require('../helpers/auth');
const { studentFixture } = require('../helpers/fixtures');

async function adminAgent() {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    return agent;
}

describe('GET /api/admin/students', () => {
    test('redirects to /adminLogin when not authenticated', async () => {
        const res = await request(app).get('/api/admin/students');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/adminLogin');
    });

    test('returns every student', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/students').reply(200, [studentFixture()]);

        const res = await agent.get('/api/admin/students');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
    });
});

describe('GET /api/admin/students/unassigned', () => {
    test('returns students with no linked guest', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/students/unassigned').reply(200, [studentFixture({ userId: null })]);

        const res = await agent.get('/api/admin/students/unassigned');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
    });
});

describe('PATCH /api/admin/students/:id/class', () => {
    test('rejects an invalid class with 400', async () => {
        const agent = await adminAgent();
        const res = await agent.patch('/api/admin/students/10/class').send({ studentClass: 'X' });
        expect(res.status).toBe(400);
    });

    // The route's own `if (!student) return 404` branch is unreachable in
    // practice: fetchFromJavaAPI rejects (rather than resolving null) on a
    // 404 from Java, and this route's catch block doesn't special-case
    // error.statusCode 404 the way the erasure routes do - so a nonexistent
    // student currently surfaces as a 500, not a 404.
    test('returns 500 when the student does not exist', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/students/999').reply(404);

        const res = await agent.patch('/api/admin/students/999/class').send({ studentClass: 'U' });
        expect(res.status).toBe(500);
    });

    // Regression coverage for the erasure-bypass gap found in PR #16: this
    // route originally had no anonymizedAt guard at all, so an erased
    // student's class could still be changed after the fact.
    test('blocks class changes on an erased student with 409', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/students/10').reply(200, studentFixture({ anonymizedAt: '2026-01-01T00:00:00' }));

        const res = await agent.patch('/api/admin/students/10/class').send({ studentClass: 'U' });
        expect(res.status).toBe(409);
    });

    test('updates the class on a non-erased student', async () => {
        const agent = await adminAgent();
        const student = studentFixture();
        javaApi().get('/api/students/10').reply(200, student);
        javaApi().put('/api/students/10', { ...student, studentClass: 'U' }).reply(200, { ...student, studentClass: 'U' });

        const res = await agent.patch('/api/admin/students/10/class').send({ studentClass: 'U' });
        expect(res.status).toBe(200);
        expect(res.body.studentClass).toBe('U');
    });
});

describe('PATCH /api/admin/students/:id/name', () => {
    test('rejects a blank name with 400', async () => {
        const agent = await adminAgent();
        const res = await agent.patch('/api/admin/students/10/name').send({ name: '   ', surname: 'Rossi' });
        expect(res.status).toBe(400);
    });

    test('rejects a blank surname with 400', async () => {
        const agent = await adminAgent();
        const res = await agent.patch('/api/admin/students/10/name').send({ name: 'Mario', surname: '' });
        expect(res.status).toBe(400);
    });

    test('blocks renaming an erased student with 409', async () => {
        const agent = await adminAgent();
        javaApi().patch('/api/students/10/name', { name: 'Luigi', surname: 'Verdi' }).reply(409);

        const res = await agent.patch('/api/admin/students/10/name').send({ name: 'Luigi', surname: 'Verdi' });
        expect(res.status).toBe(409);
    });

    test('returns 404 when the student does not exist', async () => {
        const agent = await adminAgent();
        javaApi().patch('/api/students/999/name', { name: 'Luigi', surname: 'Verdi' }).reply(404);

        const res = await agent.patch('/api/admin/students/999/name').send({ name: 'Luigi', surname: 'Verdi' });
        expect(res.status).toBe(404);
    });

    // Forwards straight to Java's dedicated PATCH .../name endpoint, trimming
    // whitespace first - NOT a fetch-then-PUT-the-whole-object round trip,
    // which would silently clear the student's linked GUEST account (see
    // StudentController#updateStudentName's Javadoc on the Java side).
    test('renames a non-erased student, trimming whitespace', async () => {
        const agent = await adminAgent();
        const student = studentFixture();
        javaApi().patch('/api/students/10/name', { name: 'Luigi', surname: 'Verdi' })
            .reply(200, { ...student, name: 'Luigi', surname: 'Verdi' });

        const res = await agent.patch('/api/admin/students/10/name').send({ name: '  Luigi  ', surname: '  Verdi  ' });
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Luigi');
        expect(res.body.surname).toBe('Verdi');
    });
});

describe('PATCH /api/admin/students/:id/guest', () => {
    test('blocks assignment on an erased student with 409', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/students/10').reply(200, studentFixture({ anonymizedAt: '2026-01-01T00:00:00' }));

        const res = await agent.patch('/api/admin/students/10/guest').send({ userId: 21 });
        expect(res.status).toBe(409);
    });

    test('blocks assigning an erased guest with 409, even to a non-erased student', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/students/10').reply(200, studentFixture());
        javaApi().get('/api/users/21').reply(200, tutorFixture({ id: 21, role: 'GUEST', anonymizedAt: '2026-01-01T00:00:00' }));

        const res = await agent.patch('/api/admin/students/10/guest').send({ userId: 21 });
        expect(res.status).toBe(409);
    });

    test('does not check the guest side when unassigning (userId null)', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/students/10').reply(200, studentFixture({ userId: 21 }));
        javaApi().patch('/api/students/10/guest', { userId: null }).reply(200, studentFixture({ userId: null }));

        const res = await agent.patch('/api/admin/students/10/guest').send({ userId: null });
        expect(res.status).toBe(200);
        expect(res.body.userId).toBeNull();
    });

    test('assigns a non-erased guest to a non-erased student', async () => {
        const agent = await adminAgent();
        javaApi().get('/api/students/10').reply(200, studentFixture());
        javaApi().get('/api/users/21').reply(200, tutorFixture({ id: 21, role: 'GUEST' }));
        javaApi().patch('/api/students/10/guest', { userId: 21 }).reply(200, studentFixture({ userId: 21 }));

        const res = await agent.patch('/api/admin/students/10/guest').send({ userId: 21 });
        expect(res.status).toBe(200);
        expect(res.body.userId).toBe(21);
    });
});

describe('DELETE /api/admin/students/:id/erasure', () => {
    test('erases a student', async () => {
        const agent = await adminAgent();
        javaApi().delete('/api/students/10').reply(200, studentFixture({ name: 'Erased', status: 'BLOCKED', anonymizedAt: '2026-09-11T00:00:00' }));

        const res = await agent.delete('/api/admin/students/10/erasure');
        expect(res.status).toBe(200);
        expect(res.body.anonymizedAt).toBeTruthy();
    });

    test('is idempotent - erasing an already-erased student returns 409', async () => {
        const agent = await adminAgent();
        javaApi().delete('/api/students/10').reply(409);

        const res = await agent.delete('/api/admin/students/10/erasure');
        expect(res.status).toBe(409);
    });

    test('returns 404 for a nonexistent student', async () => {
        const agent = await adminAgent();
        javaApi().delete('/api/students/999').reply(404);

        const res = await agent.delete('/api/admin/students/999/erasure');
        expect(res.status).toBe(404);
    });
});
