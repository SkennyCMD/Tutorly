// Unit tests for server_utilities/excel.js - specifically the worksheet
// naming logic, which crashed report generation in production: ExcelJS
// requires every sheet name in a workbook to be unique and forbids
// \ / ? * [ ] : in a sheet name, but student full names have no DB
// uniqueness constraint and aren't restricted in what characters they can
// contain.
const { generateStudentsLessonsExcel, generateTutorMonthlyReport } = require('../server_utilities/excel');

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
