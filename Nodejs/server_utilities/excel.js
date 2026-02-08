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

/**
 * Check if two lessons overlap in time
 * @param {Object} lesson1 
 * @param {Object} lesson2 
 * @returns {boolean}
 */
function lessonsOverlap(lesson1, lesson2) {
    const start1 = new Date(lesson1.startTime);
    const end1 = new Date(lesson1.endTime);
    const start2 = new Date(lesson2.startTime);
    const end2 = new Date(lesson2.endTime);
    
    // Two lessons overlap if: start1 < end2 AND start2 < end1
    return start1 < end2 && start2 < end1;
}

/**
 * Calculate actual hours worked, treating overlapping lessons as one
 * @param {Array} lessons - Array of lessons
 * @returns {number} Total hours worked (overlapping lessons counted once)
 */
function calculateActualHours(lessons) {
    if (lessons.length === 0) return 0;
    
    // Sort lessons by start time
    const sortedLessons = lessons.sort((a, b) => 
        new Date(a.startTime) - new Date(b.startTime)
    );
    
    const mergedIntervals = [];
    let currentInterval = {
        start: new Date(sortedLessons[0].startTime),
        end: new Date(sortedLessons[0].endTime)
    };
    
    for (let i = 1; i < sortedLessons.length; i++) {
        const lesson = sortedLessons[i];
        const lessonStart = new Date(lesson.startTime);
        const lessonEnd = new Date(lesson.endTime);
        
        if (lessonStart <= currentInterval.end) {
            // Overlapping - extend current interval
            currentInterval.end = new Date(Math.max(currentInterval.end, lessonEnd));
        } else {
            // No overlap - save current and start new
            mergedIntervals.push(currentInterval);
            currentInterval = { start: lessonStart, end: lessonEnd };
        }
    }
    mergedIntervals.push(currentInterval);
    
    // Calculate total hours from merged intervals
    const totalMs = mergedIntervals.reduce((sum, interval) => 
        sum + (interval.end - interval.start), 0
    );
    
    return totalMs / (1000 * 60 * 60); // Convert milliseconds to hours
}

/**
 * Count lessons that overlap with at least one other lesson
 * @param {Array} lessons - Array of lessons
 * @returns {number} Count of lessons with overlaps
 */
function countOverlappingLessons(lessons) {
    let count = 0;
    for (let i = 0; i < lessons.length; i++) {
        for (let j = i + 1; j < lessons.length; j++) {
            if (lessonsOverlap(lessons[i], lessons[j])) {
                count++;
                break; // Only count each lesson once
            }
        }
    }
    return count;
}

/**
 * Calculate total hours of overlap between lessons
 * @param {Array} lessons - Array of lessons
 * @returns {number} Total hours of overlap
 */
function calculateOverlappingHours(lessons) {
    if (lessons.length === 0) return 0;
    
    let totalOverlapHours = 0;
    
    // Check each pair of lessons
    for (let i = 0; i < lessons.length; i++) {
        for (let j = i + 1; j < lessons.length; j++) {
            if (lessonsOverlap(lessons[i], lessons[j])) {
                const start1 = new Date(lessons[i].startTime);
                const end1 = new Date(lessons[i].endTime);
                const start2 = new Date(lessons[j].startTime);
                const end2 = new Date(lessons[j].endTime);
                
                // Calculate overlap duration
                const overlapStart = new Date(Math.max(start1, start2));
                const overlapEnd = new Date(Math.min(end1, end2));
                const overlapMs = overlapEnd - overlapStart;
                
                totalOverlapHours += overlapMs / (1000 * 60 * 60);
            }
        }
    }
    
    return totalOverlapHours;
}

/**
 * Generate Excel report with one sheet per tutor showing monthly statistics
 * @param {Array} allLessons - Array of all lesson objects
 * @param {Array} tutors - Array of all tutors
 * @param {Function} fetchStudentData - Function to fetch student data by ID
 * @param {number} year - Year for filtering
 * @returns {Object} Excel workbook and filename
 */
async function generateTutorMonthlyReport(allLessons, tutors, fetchStudentData, year) {
    const workbook = new ExcelJS.Workbook();
    
    for (const tutor of tutors) {
        // Filter lessons for this tutor
        const tutorLessons = allLessons.filter(l => l.tutorId === tutor.id);
        
        if (tutorLessons.length === 0) continue; // Skip tutors with no lessons
        
        // Group lessons by month
        const lessonsByMonth = {};
        for (let month = 1; month <= 12; month++) {
            lessonsByMonth[month] = tutorLessons.filter(lesson => {
                const lessonDate = new Date(lesson.startTime);
                return lessonDate.getMonth() + 1 === month && lessonDate.getFullYear() === year;
            });
        }
        
        // Create worksheet for this tutor
        const worksheet = workbook.addWorksheet(tutor.username);
        
        // Set column widths
        worksheet.columns = [
            { key: 'month', width: 15 },
            { key: 'totalHours', width: 15 },
            { key: 'hoursU', width: 12 },
            { key: 'hoursM', width: 12 },
            { key: 'hoursS', width: 12 },
            { key: 'overlapping', width: 18 }
        ];
        
        // Add header row
        const headerRow = worksheet.addRow({
            month: 'Month',
            totalHours: 'Total Hours',
            hoursU: 'Hours U',
            hoursM: 'Hours M',
            hoursS: 'Hours S',
            overlapping: 'Overlapping Hours'
        });
        
        // Style header
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF14B8A6' }
            };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        
        // Totals for the year
        let yearTotalHours = 0;
        let yearHoursU = 0;
        let yearHoursM = 0;
        let yearHoursS = 0;
        let yearOverlapping = 0;
        
        // Add data for each month
        for (let month = 1; month <= 12; month++) {
            const monthLessons = lessonsByMonth[month];
            
            if (monthLessons.length === 0) {
                worksheet.addRow({
                    month: monthNames[month],
                    totalHours: 0,
                    hoursU: 0,
                    hoursM: 0,
                    hoursS: 0,
                    overlapping: 0
                });
                continue;
            }
            
            // Enrich lessons with student data
            const enrichedLessons = await Promise.all(monthLessons.map(async (lesson) => {
                const student = lesson.studentId ? await fetchStudentData(lesson.studentId) : null;
                return { ...lesson, studentClass: student?.studentClass || 'N/A' };
            }));
            
            // Calculate actual hours (overlapping counted as one)
            const actualHours = calculateActualHours(monthLessons);
            
            // Calculate hours by class
            const lessonsByClass = {
                U: enrichedLessons.filter(l => l.studentClass === 'U'),
                M: enrichedLessons.filter(l => l.studentClass === 'M'),
                S: enrichedLessons.filter(l => l.studentClass === 'S')
            };
            
            const hoursU = calculateActualHours(lessonsByClass.U);
            const hoursM = calculateActualHours(lessonsByClass.M);
            const hoursS = calculateActualHours(lessonsByClass.S);
            
            // Calculate overlapping hours
            const overlappingHours = calculateOverlappingHours(monthLessons);
            
            // Add row
            worksheet.addRow({
                month: monthNames[month],
                totalHours: actualHours.toFixed(2),
                hoursU: hoursU.toFixed(2),
                hoursM: hoursM.toFixed(2),
                hoursS: hoursS.toFixed(2),
                overlapping: overlappingHours.toFixed(2)
            });
            
            // Accumulate yearly totals
            yearTotalHours += actualHours;
            yearHoursU += hoursU;
            yearHoursM += hoursM;
            yearHoursS += hoursS;
            yearOverlapping += overlappingHours;
        }
        
        // Add total row
        const totalRow = worksheet.addRow({
            month: 'TOTAL',
            totalHours: yearTotalHours.toFixed(2),
            hoursU: yearHoursU.toFixed(2),
            hoursM: yearHoursM.toFixed(2),
            hoursS: yearHoursS.toFixed(2),
            overlapping: yearOverlapping.toFixed(2)
        });
        
        // Style total row
        totalRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE5E7EB' }
            };
        });
        
        // Add spacing
        worksheet.addRow({});
        worksheet.addRow({});
        
        // Now add detailed lessons grouped by month
        for (let month = 1; month <= 12; month++) {
            const monthLessons = lessonsByMonth[month];
            
            if (monthLessons.length === 0) continue; // Skip months with no lessons
            
            // Add month header
            const monthHeaderRow = worksheet.addRow({
                month: monthNames[month].toUpperCase(),
                totalHours: '',
                hoursU: '',
                hoursM: '',
                hoursS: '',
                overlapping: ''
            });
            monthHeaderRow.eachCell((cell) => {
                cell.font = { bold: true, size: 12 };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFDBEAFE' }
                };
            });
            
            // Add lesson details header
            worksheet.addRow({});
            
            // Reconfigure columns for lesson details
            worksheet.columns = [
                { key: 'id', width: 8 },
                { key: 'day', width: 10 },
                { key: 'student', width: 20 },
                { key: 'class', width: 10 },
                { key: 'startHour', width: 12 },
                { key: 'endHour', width: 12 },
                { key: 'duration', width: 10 },
                { key: 'description', width: 30 }
            ];
            
            const lessonHeaderRow = worksheet.addRow({
                id: 'ID',
                day: 'Day',
                student: 'Student',
                class: 'Class',
                startHour: 'Start Hour',
                endHour: 'End Hour',
                duration: 'Duration (h)',
                description: 'Description'
            });
            
            lessonHeaderRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF14B8A6' }
                };
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
            
            // Enrich and add lesson rows
            const enrichedMonthLessons = await Promise.all(monthLessons.map(async (lesson) => {
                const student = lesson.studentId ? await fetchStudentData(lesson.studentId) : null;
                const startDate = new Date(lesson.startTime);
                const endDate = new Date(lesson.endTime);
                
                return {
                    id: lesson.id,
                    day: startDate.getDate(),
                    student: student ? `${student.name} ${student.surname}` : 'Unknown',
                    class: student?.studentClass || 'N/A',
                    startHour: lesson.startTime ? startDate.toTimeString().slice(0, 5) : 'N/A',
                    endHour: lesson.endTime ? endDate.toTimeString().slice(0, 5) : 'N/A',
                    duration: lesson.startTime && lesson.endTime 
                        ? ((endDate - startDate) / (1000 * 60 * 60)).toFixed(2)
                        : 0,
                    description: lesson.description || ''
                };
            }));
            
            // Sort by day
            enrichedMonthLessons.sort((a, b) => a.day - b.day);
            
            // Add lesson rows
            enrichedMonthLessons.forEach(lesson => {
                worksheet.addRow(lesson);
            });
            
            // Add spacing after month
            worksheet.addRow({});
        }
        
        // Reset columns for next tutor
        worksheet.columns = [
            { key: 'month', width: 15 },
            { key: 'totalHours', width: 15 },
            { key: 'hoursU', width: 12 },
            { key: 'hoursM', width: 12 },
            { key: 'hoursS', width: 12 },
            { key: 'overlapping', width: 18 }
        ];
    }
    
    const filename = `Tutors_Monthly_Report_${year}.xlsx`;
    return { workbook, filename };
}

module.exports = {
    generateLessonsExcel,
    generateStudentsLessonsExcel,
    generateTutorMonthlyReport
};
