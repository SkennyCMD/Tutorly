// Unit tests for server_utilities/excel.js - specifically the worksheet
// naming logic, which crashed report generation in production twice:
// once on two students sharing a full name ("duplicate sheet name" -
// ExcelJS requires every sheet name in a workbook to be unique), and once
// on a name ending in an apostrophe (Excel forbids a sheet
// name starting or ending with a single quote). Neither a student's full
// name nor a tutor's username is restricted in what characters/punctuation
// it can contain at the source.
const { generateStudentsLessonsExcel, generateTutorMonthlyReport, sanitizeSheetName } = require('../server_utilities/excel');

describe('sanitizeSheetName', () => {
    test('strips characters Excel forbids in a sheet name', () => {
        expect(sanitizeSheetName('A/B?C*D[E]F:G\\H')).toBe('A-B-C-D-E-F-G-H');
    });

    test('strips a trailing single quote - the shape of the real production case', () => {
        expect(sanitizeSheetName("Jane Test'")).toBe('Jane Test');
    });

    test('strips a leading single quote', () => {
        expect(sanitizeSheetName("'Jane")).toBe('Jane');
    });

    test('strips repeated leading/trailing quotes', () => {
        expect(sanitizeSheetName("''Jane''")).toBe('Jane');
    });

    test('truncates to 31 characters and re-strips a quote the truncation exposes', () => {
        // 32 characters, with a quote landing exactly on the 31st after truncation
        const name = "A".repeat(30) + "'" + "B";
        expect(sanitizeSheetName(name).length).toBeLessThanOrEqual(31);
        expect(sanitizeSheetName(name)).not.toMatch(/^'|'$/);
    });

    test('falls back to the default when sanitizing empties the string', () => {
        expect(sanitizeSheetName("'")).toBe('Unknown');
        expect(sanitizeSheetName('')).toBe('Unknown');
        expect(sanitizeSheetName(null)).toBe('Unknown');
    });

    test('accepts a custom fallback', () => {
        expect(sanitizeSheetName('', 'Untitled')).toBe('Untitled');
    });
});

function lessonFixture(overrides = {}) {
    return {
        id: 1,
        studentId: 10,
        tutorId: 1,
        startTime: '2026-09-05T10:00:00',
        endTime: '2026-09-05T11:00:00',
        description: '',
        ...overrides
    };
}

describe('generateStudentsLessonsExcel', () => {
    test('two different students sharing the same full name get distinct worksheet names', async () => {
        const students = {
            10: { id: 10, name: 'Mario', surname: 'Rossi', studentClass: 'M' },
            20: { id: 20, name: 'Mario', surname: 'Rossi', studentClass: 'S' }
        };
        const fetchStudentData = async (id) => students[id];
        const fetchTutorData = async () => ({ username: 'tutor1' });

        const lessons = [
            lessonFixture({ id: 1, studentId: 10 }),
            lessonFixture({ id: 2, studentId: 20 })
        ];

        const { workbook } = await generateStudentsLessonsExcel(lessons, fetchStudentData, fetchTutorData, 9, 2026);

        const sheetNames = workbook.worksheets.map(ws => ws.name);
        expect(sheetNames).toHaveLength(2);
        expect(new Set(sheetNames).size).toBe(2);
        expect(sheetNames.every(name => name.startsWith('Mario Rossi'))).toBe(true);
    });

    test('a student surname ending in an apostrophe does not crash report generation (production regression)', async () => {
        const fetchStudentData = async () => ({ id: 10, name: 'Jane', surname: "Test'", studentClass: 'M' });
        const fetchTutorData = async () => ({ username: 'tutor1' });

        const { workbook } = await generateStudentsLessonsExcel([lessonFixture()], fetchStudentData, fetchTutorData, 9, 2026);

        expect(workbook.worksheets).toHaveLength(1);
        expect(workbook.worksheets[0].name).toBe("Jane Test");
    });

    test('a student name containing Excel-forbidden characters is sanitized', async () => {
        const fetchStudentData = async () => ({ id: 10, name: 'A/B', surname: 'C:D', studentClass: 'M' });
        const fetchTutorData = async () => ({ username: 'tutor1' });

        const { workbook } = await generateStudentsLessonsExcel([lessonFixture()], fetchStudentData, fetchTutorData, 9, 2026);

        expect(workbook.worksheets).toHaveLength(1);
        expect(workbook.worksheets[0].name).not.toMatch(/[\\/?*[\]:]/);
    });
});

describe('generateTutorMonthlyReport', () => {
    test('a tutor username containing Excel-forbidden characters is sanitized', async () => {
        const tutors = [{ id: 1, username: 'tutor/weird:name' }];
        const lessons = [lessonFixture({ tutorId: 1, startTime: '2026-03-05T10:00:00', endTime: '2026-03-05T11:00:00' })];
        const fetchStudentData = async () => ({ id: 10, name: 'Mario', surname: 'Rossi', studentClass: 'M' });

        const { workbook } = await generateTutorMonthlyReport(lessons, tutors, fetchStudentData, 2026);

        expect(workbook.worksheets).toHaveLength(1);
        expect(workbook.worksheets[0].name).not.toMatch(/[\\/?*[\]:]/);
    });
});
