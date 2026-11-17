/**
 *
 * Availability Data Service
 *
 * Pure data-shaping logic for the Availability page (GET /availability in
 * src/index.js): takes the raw lists already fetched from the Java API
 * (users, availability, exception_day) and turns them into the per-tutor
 * `{ id, name, initials, days, exceptions }` shape the client-side script
 * (public/js/availability.js) renders. No fetching here - kept pure and
 * synchronous so it's unit-testable without mocking HTTP calls.
 *
 * @module availabilityDataService
 *
 */

/**
 * Derives a 2-letter avatar initial from a tutor's username - app_user has
 * no first/last name to draw from, unlike Student. "firstname.lastname"/
 * "firstname_lastname" style usernames yield one initial per part (e.g.
 * "Aldo_Baglio" -> "AB"); anything else falls back to the username's first
 * two characters (e.g. "tutor1" -> "TU").
 *
 * @param {string} username
 * @returns {string}
 */
function usernameInitials(username) {
    if (!username) return '?';
    const parts = username.split(/[._\s]+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.slice(0, 2).toUpperCase();
}

/**
 * Builds the per-tutor availability structure the Availability page renders.
 *
 * Only active, non-erased GENERIC/STAFF users are included - GUEST isn't a
 * tutor, and BLOCKED/erased accounts can't teach. `availability.weekDay` is
 * ISO-8601 (1=Monday...7=Sunday); the result keys `days` by JS
 * `Date.getDay()` (0=Sunday...6=Saturday) instead, since that's what the
 * client-side week view indexes by. Only `exception_day` rows with
 * `status === 'approved'` are included - pending/refused ones haven't taken
 * effect and shouldn't override the regular weekly schedule.
 *
 * `restrictToTutorId`, when given, limits the result to just that one tutor -
 * used so a GENERIC viewer only ever sees their own schedule, never other
 * tutors'. STAFF pass `null`/omit it, since they manage everyone's.
 *
 * @param {Object} params
 * @param {Array} params.users - Raw user objects from GET /api/users
 * @param {Array} params.availability - Raw rows from GET /api/availability
 * @param {Array} params.exceptionDays - Raw rows from GET /api/exception-days
 * @param {?number} [params.restrictToTutorId] - If set, only this tutor is included
 * @returns {Array<{id: number, name: string, initials: string, days: Object<number, Array<[string,string]>>, exceptions: Object<string, {type: string, startTime: ?string, endTime: ?string}>}>}
 */
function buildTutorAvailability({ users, availability, exceptionDays, restrictToTutorId }) {
    const tutorsById = new Map();

    (users || [])
        .filter(u => u.role !== 'GUEST' && u.status === 'ACTIVE' && !u.anonymizedAt)
        .filter(u => restrictToTutorId == null || u.id === restrictToTutorId)
        .forEach(u => {
            tutorsById.set(u.id, {
                id: u.id,
                name: u.username,
                initials: usernameInitials(u.username),
                days: {},
                exceptions: {}
            });
        });

    (availability || []).forEach(slot => {
        const tutor = tutorsById.get(slot.tutorId);
        if (!tutor) return;
        const jsDay = slot.weekDay % 7;
        if (!tutor.days[jsDay]) tutor.days[jsDay] = [];
        tutor.days[jsDay].push([(slot.startTime || '').slice(0, 5), (slot.endTime || '').slice(0, 5)]);
    });

    (exceptionDays || [])
        .filter(exception => exception.status === 'approved')
        .forEach(exception => {
            const tutor = tutorsById.get(exception.tutorId);
            if (!tutor) return;
            tutor.exceptions[exception.day] = {
                type: exception.type,
                startTime: exception.startTime ? exception.startTime.slice(0, 5) : null,
                endTime: exception.endTime ? exception.endTime.slice(0, 5) : null
            };
        });

    return Array.from(tutorsById.values());
}

/**
 * Builds the list of pending exception-day requests for the "Pending
 * Requests" toggle on the Availability page - each one enriched with the
 * requesting tutor's username, since the raw exception row only has
 * `tutorId`. STAFF can approve/refuse any of them (see public/js/availability.js);
 * a GENERIC viewer only sees (read-only) their own, via `restrictToTutorId`.
 *
 * @param {Object} params
 * @param {Array} params.users - Raw user objects from GET /api/users
 * @param {Array} params.exceptionDays - Raw rows from GET /api/exception-days
 * @param {?number} [params.restrictToTutorId] - If set, only this tutor's requests are included
 * @returns {Array<{id: number, tutorId: number, tutorName: string, day: string, type: string, startTime: ?string, endTime: ?string}>}
 */
function getPendingExceptions({ users, exceptionDays, restrictToTutorId }) {
    const usersById = new Map((users || []).map(u => [u.id, u]));

    return (exceptionDays || [])
        .filter(exception => exception.status === 'pending')
        .filter(exception => restrictToTutorId == null || exception.tutorId === restrictToTutorId)
        .map(exception => {
            const tutor = usersById.get(exception.tutorId);
            return {
                id: exception.id,
                tutorId: exception.tutorId,
                tutorName: tutor ? tutor.username : `Tutor #${exception.tutorId}`,
                day: exception.day,
                type: exception.type,
                startTime: exception.startTime ? exception.startTime.slice(0, 5) : null,
                endTime: exception.endTime ? exception.endTime.slice(0, 5) : null
            };
        })
        .sort((a, b) => a.day.localeCompare(b.day));
}

module.exports = { usernameInitials, buildTutorAvailability, getPendingExceptions };
