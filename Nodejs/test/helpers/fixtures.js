// Shared entity fixtures for route tests. Kept intentionally plain (no
// builder pattern) - these mirror the JSON shapes the Java backend actually
// returns, as seen in server_utilities/*.js and the manual erasure testing
// done on this branch.

function studentFixture(overrides = {}) {
    return {
        id: 10,
        name: 'Mario',
        surname: 'Rossi',
        studentClass: 'M',
        description: '',
        status: 'ACTIVE',
        anonymizedAt: null,
        userId: null,
        ...overrides
    };
}

function lessonFixture(overrides = {}) {
    return {
        id: 100,
        studentId: 10,
        tutorId: 1,
        startTime: '2026-09-11T10:00:00',
        endTime: '2026-09-11T11:00:00',
        description: '',
        ...overrides
    };
}

function prenotationFixture(overrides = {}) {
    return {
        id: 200,
        studentId: 10,
        tutorId: 1,
        creatorId: 1,
        startTime: '2026-09-11T10:00:00',
        endTime: '2026-09-11T11:00:00',
        createdAt: '2026-09-01T10:00:00',
        flag: false,
        ...overrides
    };
}

function testFixture(overrides = {}) {
    return {
        id: 300,
        studentId: 10,
        tutorId: 1,
        day: '2026-09-11',
        mark: 7.5,
        subject: 'Math',
        description: '',
        ...overrides
    };
}

function packFixture(overrides = {}) {
    return {
        id: 400,
        studentId: 10,
        hours: 10,
        usedHours: 0,
        unassignedHours: 0,
        closure: null,
        checked: 'open',
        ...overrides
    };
}

function calendarNoteFixture(overrides = {}) {
    return {
        id: 500,
        description: 'Follow up call',
        startTime: '2026-09-11T09:00:00',
        endTime: '2026-09-11T09:30:00',
        creator: { id: 1 },
        tutors: [{ id: 1 }],
        ...overrides
    };
}

module.exports = {
    studentFixture,
    lessonFixture,
    prenotationFixture,
    testFixture,
    packFixture,
    calendarNoteFixture
};
