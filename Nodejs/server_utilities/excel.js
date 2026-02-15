/**
 *
 * Excel Report Generation Service
 *
 * 
 * Generates Excel reports for tutoring lessons and statistics.
 * 
 * Features:
 * - Monthly lessons report with all lesson details
 * - Student-specific reports (one sheet per student)
 * - Tutor monthly reports with statistics and overlap detection
 * - Automatic calculation of lesson durations and overlaps
 * - Class-based statistics (U, M, S classes)
 * 
 * Report Types:
 * 1. Lessons Excel: All lessons in a month with tutor/student details
 * 2. Students Excel: Separate sheet for each student's lessons
 * 3. Tutor Monthly: Yearly report per tutor with monthly statistics
 * 
 * Dependencies:
 * - ExcelJS: Excel file generation and manipulation
 * 
 * Styling:
 * - Header rows: Teal background (#14B8A6) with white bold text
 * - Total rows: Gray background (#E5E7EB) with bold text
 * - Month sections: Light purple background (#DBEAFE)
 * 
 * @module excel
 *
 */

const ExcelJS = require('exceljs');


// Constants


/**
 * Month names mapping for filename generation
 * Maps month numbers (1-12) to lowercase month names
 */
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


// Monthly Lessons Report


/**
 * Generate Excel report for all lessons in a specific month.
 * 
 * Creates a comprehensive report with columns for ID, day, tutor, student,
 * class, start/end times, duration, and description. All lessons are enriched
 * with student and tutor data fetched from the API.
 * 
 * @param {Array} lessons - Array of lesson objects from database
 * @param {Function} fetchStudentData - Async function to fetch student data by ID
 * @param {Function} fetchTutorData - Async function to fetch tutor data by ID
 * @param {number} monthNum - Month number (1-12)
 * @param {number} year - Year (e.g., 2024)
 * @returns {Promise<{workbook: ExcelJS.Workbook, fileName: string}>} 
 *          Workbook object and filename for download
 * 
 * @example
 * const result = await generateLessonsExcel(
 *   lessonsArray, 
 *   fetchStudentData, 
 *   fetchTutorData, 
 *   9, 
 *   2024
 * );
 * await result.workbook.xlsx.writeFile(result.fileName);
 */
async function generateLessonsExcel(lessons, fetchStudentData, fetchTutorData, monthNum, year) {
    // Enrich lessons with student and tutor data from API
    const enrichedLessons = await Promise.all(lessons.map(async (lesson) => {
        // Fetch student and tutor data in parallel for performance
        const [student, tutor] = await Promise.all([
            lesson.studentId ? fetchStudentData(lesson.studentId) : null,
            lesson.tutorId ? fetchTutorData(lesson.tutorId) : null
        ]);

        // Parse ISO date strings to Date objects for formatting
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

    // Create new Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lessons');

    // Define column structure with headers, keys, and widths
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

    // Style header row with teal background and bold text
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF14B8A6' }  // Teal color matching theme
    };

    // Populate worksheet with enriched lesson data
    enrichedLessons.forEach(lesson => {
        worksheet.addRow(lesson);
    });

    // Generate descriptive filename with month name and year
    const monthName = monthNames[monthNum];
    const fileName = `${monthName}_${year}.xlsx`;

    return {
        workbook,
        fileName
    };
}


// Student-Based Report


/**
 * Generate Excel report with one separate sheet per student.
 * 
 * Each student gets their own worksheet containing only their lessons.
 * Useful for distributing individual reports to students or parents.
 * Sheets are named after students and sorted alphabetically.
 * 
 * @param {Array} lessons - Array of lesson objects from database
 * @param {Function} fetchStudentData - Async function to fetch student data by ID
 * @param {Function} fetchTutorData - Async function to fetch tutor data by ID
 * @param {number} monthNum - Month number (1-12)
 * @param {number} year - Year (e.g., 2024)
 * @returns {Promise<{workbook: ExcelJS.Workbook, fileName: string}>} 
 *          Workbook with multiple sheets and filename
 * 
 * @example
 * const result = await generateStudentsLessonsExcel(
 *   lessonsArray, 
 *   fetchStudentData, 
 *   fetchTutorData, 
 *   9, 
 *   2024
 * );
 * // Workbook will have one sheet per student
 */
async function generateStudentsLessonsExcel(lessons, fetchStudentData, fetchTutorData, monthNum, year) {
    // Group lessons by student ID using Map for efficient lookup
    const studentLessonsMap = new Map();
    
    // Process each lesson and group by student
    for (const lesson of lessons) {
        // Fetch student and tutor data in parallel
        const [student, tutor] = await Promise.all([
            lesson.studentId ? fetchStudentData(lesson.studentId) : null,
            lesson.tutorId ? fetchTutorData(lesson.tutorId) : null
        ]);

        const studentKey = lesson.studentId || 'unknown';
        const studentName = student ? `${student.name} ${student.surname}` : 'Unknown';
        
        // Initialize student entry if not exists
        if (!studentLessonsMap.has(studentKey)) {
            studentLessonsMap.set(studentKey, {
                name: studentName,
                lessons: []
            });
        }

        // Parse ISO date strings to Date objects
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

    // Create new Excel workbook
    const workbook = new ExcelJS.Workbook();

    // Sort students alphabetically by name for organized sheets
    const sortedStudents = Array.from(studentLessonsMap.entries()).sort((a, b) => {
        return a[1].name.localeCompare(b[1].name);
    });

    // Create a separate worksheet for each student
    for (const [studentId, studentData] of sortedStudents) {
        // Create worksheet named after student (Excel limit: 31 characters)
        const sheetName = studentData.name.substring(0, 31);
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

        // Style header row with teal background
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF14B8A6' }
        };

        // Add data rows sorted chronologically by day
        studentData.lessons.sort((a, b) => a.day - b.day);
        studentData.lessons.forEach(lesson => {
            worksheet.addRow(lesson);
        });
    }

    // Generate descriptive filename with student prefix
    const monthName = monthNames[monthNum];
    const fileName = `students_${monthName}_${year}.xlsx`;

    return {
        workbook,
        fileName
    };
}


// Overlap Detection Helpers


/**
 * Check if two lessons overlap in time.
 * 
 * Uses interval overlap logic: two intervals overlap if the start of one
 * is before the end of the other, and vice versa.
 * 
 * @param {Object} lesson1 - First lesson object with startTime and endTime
 * @param {Object} lesson2 - Second lesson object with startTime and endTime
 * @returns {boolean} True if lessons overlap, false otherwise
 * 
 * @example
 * const overlap = lessonsOverlap(
 *   { startTime: '2024-09-01T10:00:00', endTime: '2024-09-01T11:00:00' },
 *   { startTime: '2024-09-01T10:30:00', endTime: '2024-09-01T11:30:00' }
 * );
 * // Returns: true (30 minutes overlap)
 */
function lessonsOverlap(lesson1, lesson2) {
    const start1 = new Date(lesson1.startTime);
    const end1 = new Date(lesson1.endTime);
    const start2 = new Date(lesson2.startTime);
    const end2 = new Date(lesson2.endTime);
    
    // Two intervals overlap if: start1 < end2 AND start2 < end1
    return start1 < end2 && start2 < end1;
}

/**
 * Calculate actual hours worked, treating overlapping lessons as one.
 * 
 * When a tutor teaches multiple students simultaneously (overlapping lessons),
 * this function merges overlapping intervals to calculate actual time worked.
 * Important for accurate payroll and statistics.
 * 
 * @param {Array} lessons - Array of lesson objects with startTime and endTime
 * @returns {number} Total hours worked (overlapping lessons counted once)
 * 
 * @example
 * // Two overlapping 1-hour lessons = 1.5 hours actual work
 * const hours = calculateActualHours([
 *   { startTime: '2024-09-01T10:00:00', endTime: '2024-09-01T11:00:00' },
 *   { startTime: '2024-09-01T10:30:00', endTime: '2024-09-01T11:30:00' }
 * ]);
 * // Returns: 1.5
 */
function calculateActualHours(lessons) {
    if (lessons.length === 0) return 0;
    
    // Sort lessons chronologically by start time
    const sortedLessons = lessons.sort((a, b) => 
        new Date(a.startTime) - new Date(b.startTime)
    );
    
    // Merge overlapping time intervals using interval merging algorithm
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
            // Lessons overlap - extend current interval to include this lesson
            currentInterval.end = new Date(Math.max(currentInterval.end, lessonEnd));
        } else {
            // No overlap - save current interval and start new one
            mergedIntervals.push(currentInterval);
            currentInterval = { start: lessonStart, end: lessonEnd };
        }
    }
    // Add the last interval
    mergedIntervals.push(currentInterval);
    
    // Sum up all merged intervals to get total actual time
    const totalMs = mergedIntervals.reduce((sum, interval) => 
        sum + (interval.end - interval.start), 0
    );
    
    // Convert milliseconds to hours (1000ms * 60s * 60m = 1 hour)
    return totalMs / (1000 * 60 * 60);
}

/**
 * Count lessons that overlap with at least one other lesson.
 * 
 * Useful for identifying how many lessons were taught simultaneously.
 * Each lesson is counted only once even if it overlaps with multiple lessons.
 * 
 * @param {Array} lessons - Array of lesson objects
 * @returns {number} Count of lessons that have at least one overlap
 * 
 * @example
 * // 3 simultaneous lessons = count of 3
 * const count = countOverlappingLessons(lessonsArray);
 */
function countOverlappingLessons(lessons) {
    let count = 0;
    // Check each lesson against all subsequent lessons
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
 * Calculate total hours of overlap between lessons.
 * 
 * Sums up all overlapping time periods. If lesson A overlaps with B for 30 minutes
 * and with C for 15 minutes, total overlap is 45 minutes (0.75 hours).
 * Used to understand how much simultaneous teaching occurred.
 * 
 * @param {Array} lessons - Array of lesson objects
 * @returns {number} Total hours of overlap across all lesson pairs
 * 
 * @example
 * const overlapHours = calculateOverlappingHours(lessonsArray);
 * // Returns: 2.5 (2 hours and 30 minutes of overlapping teaching)
 */
function calculateOverlappingHours(lessons) {
    if (lessons.length === 0) return 0;
    
    let totalOverlapHours = 0;
    
    // Compare each pair of lessons
    for (let i = 0; i < lessons.length; i++) {
        for (let j = i + 1; j < lessons.length; j++) {
            if (lessonsOverlap(lessons[i], lessons[j])) {
                const start1 = new Date(lessons[i].startTime);
                const end1 = new Date(lessons[i].endTime);
                const start2 = new Date(lessons[j].startTime);
                const end2 = new Date(lessons[j].endTime);
                
                // Calculate overlap duration: latest start to earliest end
                const overlapStart = new Date(Math.max(start1, start2));
                const overlapEnd = new Date(Math.min(end1, end2));
                const overlapMs = overlapEnd - overlapStart;
                
                // Convert to hours and accumulate
                totalOverlapHours += overlapMs / (1000 * 60 * 60);
            }
        }
    }
    
    return totalOverlapHours;
}

// ============================================================================
// Tutor Monthly Statistics Report
// ============================================================================

/**
 * Generate comprehensive Excel report with one sheet per tutor.
 * 
 * Each tutor gets a detailed yearly report with:
 * - Monthly summary table (total hours, hours by class U/M/S, overlaps)
 * - Yearly totals row
 * - Detailed lesson lists grouped by month
 * 
 * This is the most comprehensive report type, useful for payroll and
 * performance analysis.
 * 
 * @param {Array} allLessons - Array of all lesson objects for the year
 * @param {Array} tutors - Array of all tutor objects
 * @param {Function} fetchStudentData - Async function to fetch student data by ID
 * @param {number} year - Year for filtering and reporting (e.g., 2024)
 * @returns {Promise<{workbook: ExcelJS.Workbook, filename: string}>} 
 *          Workbook with one sheet per tutor and filename
 * 
 * @example
 * const result = await generateTutorMonthlyReport(
 *   allLessons, 
 *   tutorsArray, 
 *   fetchStudentData, 
 *   2024
 * );
 * // Each tutor gets their own sheet with monthly statistics
 */
async function generateTutorMonthlyReport(allLessons, tutors, fetchStudentData, year) {
    const workbook = new ExcelJS.Workbook();
    
    // Create a separate worksheet for each tutor
    for (const tutor of tutors) {
        // Get only this tutor's lessons
        const tutorLessons = allLessons.filter(l => l.tutorId === tutor.id);
        
        // Skip tutors who didn't teach any lessons this year
        if (tutorLessons.length === 0) continue;
        
        // Organize lessons into 12 monthly buckets
        const lessonsByMonth = {};
        for (let month = 1; month <= 12; month++) {
            lessonsByMonth[month] = tutorLessons.filter(lesson => {
                const lessonDate = new Date(lesson.startTime);
                // getMonth() returns 0-11, so add 1 for 1-12
                return lessonDate.getMonth() + 1 === month && lessonDate.getFullYear() === year;
            });
        }
        
        // Create worksheet named after tutor's username
        const worksheet = workbook.addWorksheet(tutor.username);
        
        // Define column structure for monthly statistics table
        worksheet.columns = [
            { key: 'month', width: 15 },
            { key: 'totalHours', width: 15 },
            { key: 'hoursU', width: 12 },
            { key: 'hoursM', width: 12 },
            { key: 'hoursS', width: 12 },
            { key: 'overlapping', width: 18 }
        ];
        
        // Add header row for monthly statistics table
        const headerRow = worksheet.addRow({
            month: 'Month',
            totalHours: 'Total Hours',
            hoursU: 'Hours U',        // University level
            hoursM: 'Hours M',        // Middle school level
            hoursS: 'Hours S',        // High school level
            overlapping: 'Overlapping Hours'
        });
        
        // Style header with teal background and white text
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF14B8A6' }
            };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        
        // Initialize yearly totals accumulators
        let yearTotalHours = 0;
        let yearHoursU = 0;
        let yearHoursM = 0;
        let yearHoursS = 0;
        let yearOverlapping = 0;
        
        // Process each month to calculate statistics
        for (let month = 1; month <= 12; month++) {
            const monthLessons = lessonsByMonth[month];
            
            // Add zero row for months with no lessons
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
            
            // Fetch student data to determine class levels
            const enrichedLessons = await Promise.all(monthLessons.map(async (lesson) => {
                const student = lesson.studentId ? await fetchStudentData(lesson.studentId) : null;
                return { ...lesson, studentClass: student?.studentClass || 'N/A' };
            }));
            
            // Calculate actual hours worked (merge overlapping lessons)
            const actualHours = calculateActualHours(monthLessons);
            
            // Separate lessons by student class level
            const lessonsByClass = {
                U: enrichedLessons.filter(l => l.studentClass === 'U'),  // University
                M: enrichedLessons.filter(l => l.studentClass === 'M'),  // Middle school
                S: enrichedLessons.filter(l => l.studentClass === 'S')   // High school
            };
            
            // Calculate hours for each class level
            const hoursU = calculateActualHours(lessonsByClass.U);
            const hoursM = calculateActualHours(lessonsByClass.M);
            const hoursS = calculateActualHours(lessonsByClass.S);
            
            // Calculate how much time was spent teaching multiple students simultaneously
            const overlappingHours = calculateOverlappingHours(monthLessons);
            
            // Add month row to statistics table
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
        
        // Add yearly totals row at bottom of statistics table
        const totalRow = worksheet.addRow({
            month: 'TOTAL',
            totalHours: yearTotalHours.toFixed(2),
            hoursU: yearHoursU.toFixed(2),
            hoursM: yearHoursM.toFixed(2),
            hoursS: yearHoursS.toFixed(2),
            overlapping: yearOverlapping.toFixed(2)
        });
        
        // Style total row with gray background and bold text
        totalRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE5E7EB' }
            };
        });
        
        // Add blank rows for visual separation
        worksheet.addRow({});
        worksheet.addRow({});
        
        // Add detailed lesson lists below statistics table
        for (let month = 1; month <= 12; month++) {
            const monthLessons = lessonsByMonth[month];
            
            // Skip empty months
            if (monthLessons.length === 0) continue;
            
            // Add section header for this month's lessons
            const monthHeaderRow = worksheet.addRow({
                month: monthNames[month].toUpperCase(),
                totalHours: '',
                hoursU: '',
                hoursM: '',
                hoursS: '',
                overlapping: ''
            });
            // Style month header with purple background
            monthHeaderRow.eachCell((cell) => {
                cell.font = { bold: true, size: 12 };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFDBEAFE' }
                };
            });
            
            // Add spacing before lesson details
            worksheet.addRow({});
            
            // Reconfigure columns for detailed lesson table
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
            
            // Add header for lesson details table
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
            
            // Style lesson header with teal background
            lessonHeaderRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF14B8A6' }
                };
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
            
            // Fetch student data and format lesson details
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
            
            // Sort lessons chronologically by day of month
            enrichedMonthLessons.sort((a, b) => a.day - b.day);
            
            // Populate lesson detail rows
            enrichedMonthLessons.forEach(lesson => {
                worksheet.addRow(lesson);
            });
            
            // Add spacing between months
            worksheet.addRow({});
        }
        
        // Reset column configuration for next tutor's sheet
        worksheet.columns = [
            { key: 'month', width: 15 },
            { key: 'totalHours', width: 15 },
            { key: 'hoursU', width: 12 },
            { key: 'hoursM', width: 12 },
            { key: 'hoursS', width: 12 },
            { key: 'overlapping', width: 18 }
        ];
    }
    
    // Generate filename with year
    const filename = `Tutors_Monthly_Report_${year}.xlsx`;
    return { workbook, filename };
}


// Module Exports


/**
 * Export Excel generation functions
 * 
 * Report Types:
 * - generateLessonsExcel: Simple monthly report with all lessons
 * - generateStudentsLessonsExcel: Multi-sheet report, one sheet per student
 * - generateTutorMonthlyReport: Comprehensive yearly report per tutor with statistics
 * 
 * All functions return {workbook, fileName/filename} objects that can be
 * written to disk or sent to client for download.
 */
module.exports = {
    generateLessonsExcel,
    generateStudentsLessonsExcel,
    generateTutorMonthlyReport
};
