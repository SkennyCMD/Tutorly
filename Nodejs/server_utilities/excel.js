const ExcelJS = require('exceljs');

// Month names in Italian
const monthNames = {
    1: 'january',
    2: 'february',
    3: 'march',
    4: 'april',
    5: 'may',
    6: 'june',
    7: 'july',
    8: 'august',
    9: 'september',
    10: 'october',
    11: 'november',
    12: 'december'
};

/**
 * Generate Excel report for lessons in a specific month
 * @param {Array} lessons - Array of lesson objects
 * @param {Function} fetchStudentData - Function to fetch student data by ID
 * @param {Function} fetchTutorData - Function to fetch tutor data by ID
 * @param {number} monthNum - Month number (1-12)
 * @param {number} year - Year
 * @returns {Object} Excel workbook and filename
 */
async function generateLessonsExcel(lessons, fetchStudentData, fetchTutorData, monthNum, year) {
    // Enrich lessons with student and tutor data
    const enrichedLessons = await Promise.all(lessons.map(async (lesson) => {
        const [student, tutor] = await Promise.all([
            lesson.studentId ? fetchStudentData(lesson.studentId) : null,
            lesson.tutorId ? fetchTutorData(lesson.tutorId) : null
        ]);

        // Parse dates for day and time extraction
        const startDate = new Date(lesson.startTime);
        const endDate = new Date(lesson.endTime);
        
        return {
            id: lesson.id,
            day: startDate.getDate(),
            tutorName: tutor?.username || 'Unknown',
            studentName: student ? `${student.name} ${student.surname}` : 'Unknown',
            studentClass: student?.studentClass || 'N/A',
            startHour: lesson.startTime ? startDate.toTimeString().slice(0, 5) : 'N/A',
            endHour: lesson.endTime ? endDate.toTimeString().slice(0, 5) : 'N/A',
            description: lesson.description || '',
            // Calculate duration in hours
            duration: lesson.startTime && lesson.endTime 
                ? ((endDate - startDate) / (1000 * 60 * 60)).toFixed(2)
                : '0'
        };
    }));

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lessons');

    // Define columns
    worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Day', key: 'day', width: 8 },
        { header: 'Tutor', key: 'tutorName', width: 20 },
        { header: 'Student', key: 'studentName', width: 25 },
        { header: 'Class', key: 'studentClass', width: 10 },
        { header: 'Start Hour', key: 'startHour', width: 12 },
        { header: 'End Hour', key: 'endHour', width: 12 },
        { header: 'Duration (hours)', key: 'duration', width: 15 },
        { header: 'Description', key: 'description', width: 30 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF14B8A6' }
    };

    // Add data rows
    enrichedLessons.forEach(lesson => {
        worksheet.addRow(lesson);
    });

    // Generate filename with month name
    const monthName = monthNames[monthNum];
    const fileName = `${monthName}_${year}.xlsx`;

    return {
        workbook,
        fileName
    };
}

/**
 * Generate Excel report with one sheet per student for lessons in a specific month
 * @param {Array} lessons - Array of lesson objects
 * @param {Function} fetchStudentData - Function to fetch student data by ID
 * @param {Function} fetchTutorData - Function to fetch tutor data by ID
 * @param {number} monthNum - Month number (1-12)
 * @param {number} year - Year
 * @returns {Object} Excel workbook and filename
 */
async function generateStudentsLessonsExcel(lessons, fetchStudentData, fetchTutorData, monthNum, year) {
    // Group lessons by student and enrich data
    const studentLessonsMap = new Map();
    
    for (const lesson of lessons) {
        const [student, tutor] = await Promise.all([
            lesson.studentId ? fetchStudentData(lesson.studentId) : null,
            lesson.tutorId ? fetchTutorData(lesson.tutorId) : null
        ]);

        const studentKey = lesson.studentId || 'unknown';
        const studentName = student ? `${student.name} ${student.surname}` : 'Unknown';
        
        if (!studentLessonsMap.has(studentKey)) {
            studentLessonsMap.set(studentKey, {
                name: studentName,
                lessons: []
            });
        }

        // Parse dates for day and time extraction
        const startDate = new Date(lesson.startTime);
        const endDate = new Date(lesson.endTime);
        
        const enrichedLesson = {
            id: lesson.id,
            day: startDate.getDate(),
            tutorName: tutor?.username || 'Unknown',
            studentName: studentName,
            studentClass: student?.studentClass || 'N/A',
            startHour: lesson.startTime ? startDate.toTimeString().slice(0, 5) : 'N/A',
            endHour: lesson.endTime ? endDate.toTimeString().slice(0, 5) : 'N/A',
            description: lesson.description || '',
            duration: lesson.startTime && lesson.endTime 
                ? ((endDate - startDate) / (1000 * 60 * 60)).toFixed(2)
                : '0'
        };

        studentLessonsMap.get(studentKey).lessons.push(enrichedLesson);
    }

    // Create Excel workbook with one sheet per student
    const workbook = new ExcelJS.Workbook();

    // Sort students by name
    const sortedStudents = Array.from(studentLessonsMap.entries()).sort((a, b) => {
        return a[1].name.localeCompare(b[1].name);
    });

    for (const [studentId, studentData] of sortedStudents) {
        // Create worksheet with student name (sanitize for Excel sheet name)
        const sheetName = studentData.name.substring(0, 31); // Excel sheet names max 31 chars
        const worksheet = workbook.addWorksheet(sheetName);

        // Define columns
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Day', key: 'day', width: 8 },
            { header: 'Tutor', key: 'tutorName', width: 20 },
            { header: 'Student', key: 'studentName', width: 25 },
            { header: 'Class', key: 'studentClass', width: 10 },
            { header: 'Start Hour', key: 'startHour', width: 12 },
            { header: 'End Hour', key: 'endHour', width: 12 },
            { header: 'Duration (hours)', key: 'duration', width: 15 },
            { header: 'Description', key: 'description', width: 30 }
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF14B8A6' }
        };

        // Add data rows sorted by day
        studentData.lessons.sort((a, b) => a.day - b.day);
        studentData.lessons.forEach(lesson => {
            worksheet.addRow(lesson);
        });
    }

    // Generate filename with month name
    const monthName = monthNames[monthNum];
    const fileName = `students_${monthName}_${year}.xlsx`;

    return {
        workbook,
        fileName
    };
}

module.exports = {
    generateLessonsExcel,
    generateStudentsLessonsExcel
};
