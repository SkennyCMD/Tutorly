/**
 *
 * Calendar Data Service
 *
 *
 * Shared range-bounded fetch/enrich logic for the Calendar page - used both
 * by the initial GET /calendar page load and by GET /api/calendar/data
 * (fetched on demand as a tutor navigates to a week that hasn't been loaded
 * yet). Factored out so both call sites stay in sync instead of duplicating
 * the same role filtering and student/tutor enrichment logic.
 *
 * Replaces the old approach of fetching every prenotation/note ever created
 * (GET /api/prenotations, GET /api/calendar-notes/{tutor,creator}/:id with no
 * date bound) with the existing date-range Java endpoints, which push the
 * date filtering down to the database instead of fetching everything and
 * filtering in memory.
 *
 * @module calendarDataService
 *
 */

const {
    fetchPrenotationsByDateRange,
    fetchCalendarNotesByDateRange,
    fetchStudentData,
    fetchTutorData,
    fetchStudentsByGuest
} = require('./javaApiService');

/**
 * Wrap a single-argument async fetch function with a promise-memoizing cache,
 * so repeated lookups for the same id (e.g. the same student referenced by
 * several prenotations in the same week) share one in-flight request instead
 * of firing a fresh HTTP call each time. Caching the *promise* rather than
 * the resolved value is what makes concurrent lookups under Promise.all
 * dedupe correctly - the same pattern already used for tutor lookups on the
 * Student Profile page (see the `tutorCache` in src/index.js).
 *
 * @param {(id: number) => Promise<any>} fetchFn
 * @returns {(id: number|null) => Promise<any|null>}
 */
function makeLookupCache(fetchFn) {
    const cache = new Map();
    return (id) => {
        if (id == null) return Promise.resolve(null);
        if (!cache.has(id)) {
            cache.set(id, fetchFn(id));
        }
        return cache.get(id);
    };
}

/**
 * Fetch and enrich this tutor's calendar data (prenotations + notes) for a
 * bounded date range, applying the same role-based visibility rules the
 * Calendar page has always used:
 * - STAFF or GUEST: every tutor's prenotations in range (GUEST further
 *   filtered below to their assigned student(s)).
 * - GENERIC: only this tutor's own prenotations.
 * - Calendar notes: always scoped to notes assigned to OR created by this
 *   tutor, regardless of role (unrelated to the STAFF/GENERIC/GUEST split
 *   above - notes were never role-gated the way prenotations are).
 *
 * @param {object} params
 * @param {number} params.tutorId - Session user id (also the GUEST's id, if isGuest)
 * @param {boolean} params.isStaff
 * @param {boolean} params.isGuest
 * @param {string} params.startTime - ISO datetime string (inclusive), e.g. "2026-09-21T00:00:00"
 * @param {string} params.endTime - ISO datetime string (inclusive)
 * @returns {Promise<{prenotations: Array, calendarNotes: Array}>}
 */
async function getCalendarDataForRange({ tutorId, isStaff, isGuest, startTime, endTime }) {
    const [rawPrenotations, rawNotes, assignedStudents] = await Promise.all([
        fetchPrenotationsByDateRange(startTime, endTime),
        fetchCalendarNotesByDateRange(startTime, endTime),
        isGuest ? fetchStudentsByGuest(tutorId) : Promise.resolve(null)
    ]);

    // Role-based prenotation visibility - mirrors the logic the Calendar
    // page has always applied, just against an already date-bounded list
    // instead of the entire history.
    let prenotations = rawPrenotations || [];
    if (!isStaff && !isGuest) {
        prenotations = prenotations.filter(p => p.tutorId === tutorId);
    }
    if (isGuest) {
        const assignedStudentIds = new Set((assignedStudents || []).map(s => s.id));
        prenotations = prenotations.filter(p => assignedStudentIds.has(p.studentId));
    }

    // Calendar notes: STAFF sees every note in range (same "see everything"
    // rule prenotations already get above), everyone else only notes
    // assigned to or created by them. There's no combined tutor+date-range
    // Java endpoint, so this filter runs in Node instead of issuing two
    // separate by-tutor/by-creator calls and merging (as the old unbounded
    // code did).
    const calendarNotes = isStaff
        ? (rawNotes || [])
        : (rawNotes || []).filter(note =>
            (note.tutors || []).some(t => t.id === tutorId) || note.creator?.id === tutorId
        );

    const getStudent = makeLookupCache(fetchStudentData);
    const getTutor = makeLookupCache(fetchTutorData);

    const enrichedPrenotations = await Promise.all(prenotations.map(async prenotation => {
        const studentId = prenotation.studentId;
        const prenotationTutorId = prenotation.tutorId;
        const student = studentId ? await getStudent(studentId) : null;
        const tutor = prenotationTutorId ? await getTutor(prenotationTutorId) : null;

        return {
            id: prenotation.id,
            startTime: prenotation.startTime,
            endTime: prenotation.endTime,
            createdAt: prenotation.createdAt,
            flag: prenotation.flag,
            studentId: studentId,
            student: student,
            studentName: student?.name || 'Unknown',
            studentSurname: student?.surname || '',
            studentClass: student?.studentClass || '',
            tutorId: prenotationTutorId,
            tutor: tutor,
            tutorUsername: tutor?.username || 'Unknown'
        };
    }));

    return { prenotations: enrichedPrenotations, calendarNotes };
}

module.exports = {
    getCalendarDataForRange
};
