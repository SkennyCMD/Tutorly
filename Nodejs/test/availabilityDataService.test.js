const { usernameInitials, buildTutorAvailability } = require('../server_utilities/availabilityDataService');

describe('usernameInitials', () => {
    test('splits on underscore into one initial per part', () => {
        expect(usernameInitials('Aldo_Baglio')).toBe('AB');
    });

    test('splits on dot into one initial per part', () => {
        expect(usernameInitials('mario.rossi')).toBe('MR');
    });

    test('falls back to the first two characters with no separator', () => {
        expect(usernameInitials('tutor1')).toBe('TU');
    });

    test('returns "?" for a missing username', () => {
        expect(usernameInitials(null)).toBe('?');
        expect(usernameInitials('')).toBe('?');
    });
});

describe('buildTutorAvailability', () => {
    const activeTutor = { id: 1, username: 'tutor.one', role: 'GENERIC', status: 'ACTIVE', anonymizedAt: null };
    const staffTutor = { id: 2, username: 'staff.one', role: 'STAFF', status: 'ACTIVE', anonymizedAt: null };
    const guest = { id: 3, username: 'guest.one', role: 'GUEST', status: 'ACTIVE', anonymizedAt: null };
    const blocked = { id: 4, username: 'blocked.one', role: 'GENERIC', status: 'BLOCKED', anonymizedAt: null };
    const erased = { id: 5, username: 'erased-user-5', role: 'GENERIC', status: 'DISCONTINUED', anonymizedAt: '2026-01-01T00:00:00' };

    test('excludes GUEST, BLOCKED, and erased accounts', () => {
        const result = buildTutorAvailability({
            users: [activeTutor, staffTutor, guest, blocked, erased],
            availability: [],
            exceptionDays: []
        });

        expect(result.map(t => t.id)).toEqual([1, 2]);
    });

    test('derives name/initials and starts with empty days/exceptions', () => {
        const result = buildTutorAvailability({ users: [activeTutor], availability: [], exceptionDays: [] });

        expect(result[0]).toMatchObject({ id: 1, name: 'tutor.one', initials: 'TO', days: {}, exceptions: {} });
    });

    test('converts ISO week_day (1=Monday) to JS getDay (1=Monday still, 7=Sunday becomes 0)', () => {
        const result = buildTutorAvailability({
            users: [activeTutor],
            availability: [
                { tutorId: 1, weekDay: 1, startTime: '09:00:00', endTime: '12:00:00' },
                { tutorId: 1, weekDay: 7, startTime: '10:00:00', endTime: '11:00:00' }
            ],
            exceptionDays: []
        });

        expect(result[0].days[1]).toEqual([['09:00', '12:00']]);
        expect(result[0].days[0]).toEqual([['10:00', '11:00']]);
    });

    test('groups multiple slots on the same day', () => {
        const result = buildTutorAvailability({
            users: [activeTutor],
            availability: [
                { tutorId: 1, weekDay: 1, startTime: '09:00:00', endTime: '12:00:00' },
                { tutorId: 1, weekDay: 1, startTime: '14:00:00', endTime: '17:00:00' }
            ],
            exceptionDays: []
        });

        expect(result[0].days[1]).toEqual([['09:00', '12:00'], ['14:00', '17:00']]);
    });

    test('ignores availability rows for a tutor not in the active list', () => {
        const result = buildTutorAvailability({
            users: [activeTutor],
            availability: [{ tutorId: 999, weekDay: 1, startTime: '09:00:00', endTime: '12:00:00' }],
            exceptionDays: []
        });

        expect(result[0].days).toEqual({});
    });

    test('includes only approved exception days, keyed by date', () => {
        const result = buildTutorAvailability({
            users: [activeTutor],
            availability: [],
            exceptionDays: [
                { tutorId: 1, day: '2026-12-24', type: 'absent', startTime: null, endTime: null, status: 'approved' },
                { tutorId: 1, day: '2026-12-25', type: 'absent', startTime: null, endTime: null, status: 'pending' },
                { tutorId: 1, day: '2026-12-26', type: 'present', startTime: '14:00:00', endTime: '16:00:00', status: 'refused' }
            ]
        });

        expect(result[0].exceptions).toEqual({
            '2026-12-24': { type: 'absent', startTime: null, endTime: null }
        });
    });

    test('handles missing/empty input arrays', () => {
        expect(buildTutorAvailability({})).toEqual([]);
    });
});
