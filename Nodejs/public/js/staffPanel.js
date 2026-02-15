/**
 *
 * Staff Panel Script
 *
 * 
 * Manages the staff panel interface for generating and downloading reports.
 * 
 * Features:
 * - All tutors monthly hours report (by month)
 * - All students monthly hours report (by month)
 * - Single tutor detailed hours report (all history)
 * - Tutors monthly statistics report (by year)
 * - Tutor search with real-time filtering
 * - Recent downloads tracking (last 5)
 * - Toast notifications for user feedback
 * - Mobile responsive sidebar
 * 
 * Report Categories:
 * - Tutor reports: Aggregated hours by tutor for a specific month
 * - Student reports: Aggregated hours by student for a specific month
 * - Single reports: Detailed lesson history for individual tutor
 * - Stats reports: Monthly breakdown for all tutors by year
 * 
 * Data Sources:
 * - window.allTutors: Array of tutor objects from server
 * 
 * Dependencies:
 * - XLSX library (SheetJS) for Excel file generation
 * - Backend API endpoints:
 *   - GET /api/reports/lessons-by-month
 *   - GET /api/reports/lessons-by-student
 *   - GET /api/reports/tutors-monthly-stats
 * 
 * Used By:
 * - staffPanel.ejs (staff management page)
 */




// Global State


// Transform server-rendered tutor data into simplified format
// Maps username and role to name and subject for display
const tutors = (window.allTutors || []).map(tutor => ({
    id: tutor.id,
    name: tutor.username,
    subject: tutor.role || 'Tutor'
}));

// Currently selected tutor for single tutor report
let selectedTutor = null;



// Default Values


// Set month selectors to current month (YYYY-MM format)
const now = new Date();
const currentMonth = now.toISOString().slice(0, 7);
document.getElementById('tutorAllMonth').value = currentMonth;
document.getElementById('studentAllMonth').value = currentMonth;



// Mobile Sidebar

const menuToggle = document.getElementById('menuToggle');
const closeMenuBtn = document.getElementById('closeMenu');
const menuOverlay = document.getElementById('menuOverlay');
const mobileMenu = document.getElementById('mobileMenu');

/**
 * Open mobile sidebar menu.
 * 
 * Displays the sidebar, shows overlay, and prevents body scrolling.
 */
function openMenu() {
    mobileMenu.classList.add('open');
    menuOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Lock body scroll
}

/**
 * Close mobile sidebar menu.
 * 
 * Hides the sidebar, removes overlay, and restores body scrolling.
 */
function closeMenu() {
    mobileMenu.classList.remove('open');
    menuOverlay.classList.add('hidden');
    document.body.style.overflow = ''; // Restore body scroll
}

// Event listeners for mobile menu
menuToggle.addEventListener('click', openMenu);
closeMenuBtn.addEventListener('click', closeMenu);
menuOverlay.addEventListener('click', closeMenu);



// Toast Notifications


/**
 * Display a toast notification message.
 * 
 * Toast automatically disappears after 3 seconds.
 * 
 * @param {string} message - Message to display in the toast
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}


// Recent Downloads Tracking


// Array to store recent download information (max 5 items)
let recentDownloads = [];

/**
 * Add a download to recent downloads list.
 * 
 * Maintains a maximum of 5 items, removing oldest when limit exceeded.
 * Automatically updates the UI after adding.
 * 
 * @param {string} filename - Name of the downloaded file
 * @param {string} category - Category of report ('tutor', 'student', 'single')
 */
function addRecentDownload(filename, category) {
    recentDownloads.unshift({ filename, category, timestamp: new Date().toLocaleString() });
    if (recentDownloads.length > 5) recentDownloads.pop(); // Keep only last 5
    renderRecentDownloads();
}

/**
 * Render recent downloads list in the UI.
 * 
 * Displays up to 5 most recent downloads with:
 * - File icon with category-specific color
 * - Filename and timestamp
 * - Category badge (tutor/student/single)
 * 
 * Shows "No recent downloads" message when list is empty.
 */
function renderRecentDownloads() {
    const container = document.getElementById('recentDownloads');
    if (recentDownloads.length === 0) {
    container.innerHTML = '<p class="text-sm text-muted-foreground text-center py-4">No recent downloads</p>';
    return;
    }
    
    // Map category to color scheme for visual distinction
    container.innerHTML = recentDownloads.map(dl => {
    const colors = {
        tutor: { bg: 'bg-primary/20', text: 'text-primary' },       // Teal for tutor reports
        student: { bg: 'bg-amber-500/20', text: 'text-amber-500' }, // Amber for student reports
        single: { bg: 'bg-sky-500/20', text: 'text-sky-500' }       // Sky blue for single tutor reports
    };
    const c = colors[dl.category] || colors.tutor;
    return `
        <div class="flex items-center justify-between p-3 bg-secondary rounded-lg mb-2">
        <div class="flex items-center gap-3">
            <div class="w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 ${c.text}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            </div>
            <div>
            <p class="text-sm font-medium text-foreground">${dl.filename}</p>
            <p class="text-xs text-muted-foreground">${dl.timestamp}</p>
            </div>
        </div>
        <span class="text-xs px-2 py-1 rounded-full ${c.bg} ${c.text} capitalize">${dl.category}</span>
        </div>`;
    }).join('');
}



// Tutor Search Dropdown

const tutorInput = document.getElementById('tutorSearchInput');
const tutorDropdown = document.getElementById('tutorDropdown');
const clearTutorBtn = document.getElementById('clearTutorBtn');
const selectedTutorLabel = document.getElementById('selectedTutorLabel');
const selectedTutorNameEl = document.getElementById('selectedTutorName');

// Real-time search filtering as user types
tutorInput.addEventListener('input', function () {
    const query = this.value.trim().toLowerCase();
    if (query.length === 0) {
    closeDropdown();
    return;
    }
    // Filter tutors by name (case-insensitive partial match)
    const results = tutors.filter(t => t.name.toLowerCase().includes(query));
    if (results.length === 0) {
    tutorDropdown.innerHTML = '<div class="px-4 py-3 text-muted-foreground text-sm">No tutors found</div>';
    } else {
    tutorDropdown.innerHTML = results.map(t => `
        <div class="flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg hover:bg-muted transition-colors" onclick="selectTutor(${t.id})">
        <div class="w-8 h-8 bg-sky-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-3.5 h-3.5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
        </div>
        <div>
            <p class="text-sm font-medium text-foreground">${highlightMatch(t.name, query)}</p>
            <p class="text-xs text-muted-foreground">${t.subject}</p>
        </div>
        </div>`).join('');
    }
    tutorDropdown.classList.add('open');
});

// Re-open dropdown on focus if there's a search query
tutorInput.addEventListener('focus', function () {
    if (this.value.trim().length > 0) {
    this.dispatchEvent(new Event('input')); // Re-trigger search
    }
});

/**
 * Highlight matching text in search results.
 * 
 * Wraps the matched portion of text in a styled span for visual emphasis.
 * 
 * @param {string} text - Original text to search within
 * @param {string} query - Search query to highlight
 * @returns {string} HTML string with highlighted match
 */
function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text;
    return text.substring(0, idx) + '<span class="text-sky-400 font-semibold">' + text.substring(idx, idx + query.length) + '</span>' + text.substring(idx + query.length);
}

/**
 * Select a tutor from the dropdown.
 * 
 * Updates the global selectedTutor state and UI to show the selection.
 * Called when user clicks on a tutor in the search results.
 * 
 * @param {number} id - ID of the selected tutor
 */
function selectTutor(id) {
    const tutor = tutors.find(t => t.id === id);
    if (!tutor) return;
    selectedTutor = tutor; // Store in global state
    tutorInput.value = tutor.name;
    selectedTutorNameEl.textContent = `${tutor.name} (${tutor.subject})`;
    selectedTutorLabel.classList.remove('hidden'); // Show selection badge
    clearTutorBtn.classList.remove('hidden');      // Show clear button
    closeDropdown();
}

/**
 * Clear the current tutor selection.
 * 
 * Resets global state and UI, then refocuses the search input.
 */
function clearTutorSelection() {
    selectedTutor = null; // Clear global state
    tutorInput.value = '';
    selectedTutorLabel.classList.add('hidden'); // Hide selection badge
    clearTutorBtn.classList.add('hidden');      // Hide clear button
    closeDropdown();
    tutorInput.focus();
}

/**
 * Close the tutor search dropdown.
 */
function closeDropdown() {
    tutorDropdown.classList.remove('open');
}

// Close dropdown when clicking outside the search wrapper
document.addEventListener('click', function (e) {
    if (!document.getElementById('tutorSearchWrapper').contains(e.target)) {
    closeDropdown();
    }
});



// Mock Data Generators (For Testing/Demo)

// Note: These functions generate mock data and are not currently used
// in production. Real data comes from backend API endpoints.

/**
 * Convert month string to readable label.
 * 
 * @param {string} monthStr - Month in YYYY-MM format
 * @returns {string} Formatted month and year (e.g., "January 2026")
 */
function monthLabel(monthStr) {
    const [y, m] = monthStr.split('-');
    const date = new Date(y, m - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

/**
 * Generate mock data for all tutors report.
 * 
 * @param {string} month - Month in YYYY-MM format
 * @returns {Array<Object>} Array of tutor data with random hours
 */
function generateAllTutorsData(month) {
    return tutors.map(t => {
    const mHours = Math.floor(Math.random() * 20) + 5;
    const sHours = Math.floor(Math.random() * 15) + 3;
    const uHours = Math.floor(Math.random() * 10) + 1;
    return {
        'Tutor Name': t.name,
        'Subject': t.subject,
        'Class M (hours)': mHours,
        'Class S (hours)': sHours,
        'Class U (hours)': uHours,
        'Total Hours': mHours + sHours + uHours,
        'Month': monthLabel(month)
    };
    });
}

/**
 * Generate mock data for all students report.
 * 
 * @param {string} month - Month in YYYY-MM format
 * @returns {Array<Object>} Array of student data with random hours
 */
function generateAllStudentsData(month) {
    const students = [
    'Mario Rossi', 'Giulia Bianchi', 'Luca Verdi', 'Anna Neri',
    'Marco Gialli', 'Sara Greco', 'Davide Mazza', 'Francesca Fontana',
    'Alessandro Barbieri', 'Valentina Costa', 'Simone Leone', 'Martina Moretti'
    ];
    return students.map(s => {
    const mHours = Math.floor(Math.random() * 12) + 1;
    const sHours = Math.floor(Math.random() * 10) + 1;
    const uHours = Math.floor(Math.random() * 6);
    return {
        'Student Name': s,
        'Class M (hours)': mHours,
        'Class S (hours)': sHours,
        'Class U (hours)': uHours,
        'Total Hours': mHours + sHours + uHours,
        'Month': monthLabel(month)
    };
    });
}

/**
 * Generate mock detailed data for a single tutor.
 * 
 * Creates 6 months of lesson history with random lessons per month.
 * 
 * @param {Object} tutor - Tutor object with id, name, and subject
 * @returns {Array<Object>} Array of lesson records sorted by date (newest first)
 */
function generateSingleTutorData(tutor) {
    const students = ['Mario Rossi', 'Giulia Bianchi', 'Luca Verdi', 'Anna Neri', 'Sara Greco'];
    const classes = ['M', 'S', 'U'];
    const rows = [];
    for (let m = 0; m < 6; m++) {
    const date = new Date();
    date.setMonth(date.getMonth() - m);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    const count = Math.floor(Math.random() * 10) + 8;
    for (let i = 0; i < count; i++) {
        const day = Math.floor(Math.random() * daysInMonth) + 1;
        const startHour = Math.floor(Math.random() * 8) + 9;
        const duration = Math.random() > 0.5 ? 1 : 1.5;
        rows.push({
        'Tutor': tutor.name,
        'Subject': tutor.subject,
        'Date': `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`,
        'Student': students[Math.floor(Math.random() * students.length)],
        'Class Type': classes[Math.floor(Math.random() * classes.length)],
        'Start Time': `${startHour.toString().padStart(2, '0')}:00`,
        'End Time': `${Math.floor(startHour + duration).toString().padStart(2, '0')}:${duration % 1 ? '30' : '00'}`,
        'Duration (hours)': duration
        });
    }
    }
    return rows.sort((a, b) => {
    const [dA, mA, yA] = a.Date.split('/');
    const [dB, mB, yB] = b.Date.split('/');
    return new Date(yB, mB - 1, dB) - new Date(yA, mA - 1, dA);
    });
}



// Download Helpers


/**
 * Download data as Excel file.
 * 
 * Uses XLSX library to convert JSON data to Excel format with auto-sized columns.
 * 
 * @param {Array<Object>} data - Array of objects to export
 * @param {string} filename - Name for the downloaded file
 */
function downloadXLSX(data, filename) {
    const ws = XLSX.utils.json_to_sheet(data);
    // Auto-size columns based on content and header length
    const colWidths = Object.keys(data[0]).map(key => ({
    wch: Math.max(key.length, ...data.map(row => String(row[key]).length)) + 2
    }));
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, filename);
}



// Download Actions (Report Generation)


/**
 * Download all tutors monthly hours report.
 * 
 * Fetches Excel file from backend with aggregated hours for all tutors
 * in the selected month, broken down by class type (M/S/U).
 * 
 * Backend Endpoint: GET /api/reports/lessons-by-month?month=YYYY-MM
 * 
 * @async
 */
async function downloadAllTutorsHours() {
    const month = document.getElementById('tutorAllMonth').value;
    if (!month) { 
        showToast('Please select a month'); 
        return; 
    }
    
    try {
        showToast('Generating report...');
        
        // Call the server endpoint to generate Excel
        const response = await fetch(`/api/reports/lessons-by-month?month=${month}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate report');
        }
        
        // Extract filename from Content-Disposition header if present
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'lessons_report.xlsx';
        if (contentDisposition) {
            const matches = /filename="([^"]+)"/.exec(contentDisposition);
            if (matches && matches[1]) {
                filename = matches[1];
            }
        }
        
        // Convert response to blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        addRecentDownload(filename, 'tutor');
        showToast(`Downloaded: ${filename}`);
    } catch (error) {
        console.error('Error downloading report:', error);
        showToast('Error: ' + error.message);
    }
}

/**
 * Download all students monthly hours report.
 * 
 * Fetches Excel file from backend with aggregated hours for all students
 * in the selected month, broken down by class type (M/S/U).
 * 
 * Backend Endpoint: GET /api/reports/lessons-by-student?month=YYYY-MM
 * 
 * @async
 */
async function downloadAllStudentsHours() {
    const month = document.getElementById('studentAllMonth').value;
    if (!month) { 
        showToast('Please select a month'); 
        return; 
    }
    
    try {
        showToast('Generating report...');
        
        // Call the server endpoint to generate Excel
        const response = await fetch(`/api/reports/lessons-by-student?month=${month}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate report');
        }
        
        // Get the filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'students_report.xlsx';
        if (contentDisposition) {
            const matches = /filename="([^"]+)"/.exec(contentDisposition);
            if (matches && matches[1]) {
                filename = matches[1];
            }
        }
        
        // Convert response to blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        addRecentDownload(filename, 'student');
        showToast(`Downloaded: ${filename}`);
    } catch (error) {
        console.error('Error downloading report:', error);
        showToast('Error: ' + error.message);
    }
}

/**
 * Download tutors monthly statistics report.
 * 
 * Fetches Excel file from backend with month-by-month breakdown for all tutors
 * across the selected year. Each tutor gets their own sheet with monthly totals.
 * 
 * Backend Endpoint: GET /api/reports/tutors-monthly-stats?year=YYYY
 * 
 * @async
 */
async function downloadTutorMonthlyStats() {
    const year = document.getElementById('tutorStatsYear').value;
    if (!year) { 
        showToast('Please select a year'); 
        return; 
    }
    
    try {
        showToast('Generating statistics report...');
        
        // Call the server endpoint to generate Excel
        const response = await fetch(`/api/reports/tutors-monthly-stats?year=${year}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate report');
        }
        
        // Get the filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `Tutors_Monthly_Report_${year}.xlsx`;
        if (contentDisposition) {
            const matches = /filename="([^"]+)"/.exec(contentDisposition);
            if (matches && matches[1]) {
                filename = matches[1];
            }
        }
        
        // Convert response to blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        addRecentDownload(filename, 'tutor');
        showToast(`Downloaded: ${filename}`);
    } catch (error) {
        console.error('Error downloading stats report:', error);
        showToast('Error: ' + error.message);
    }
}

/**
 * Download single tutor detailed hours report.
 * 
 * Generates mock detailed lesson history for the selected tutor.
 * Note: Currently uses mock data generator. Should integrate with backend API.
 * 
 * @todo Replace mock data with real API call
 */
function downloadSingleTutorHours() {
    if (!selectedTutor) {
    showToast('Please select a tutor first');
    return;
    }
    const data = generateSingleTutorData(selectedTutor);
    const safeName = selectedTutor.name.replace(/\s+/g, '_');
    const filename = `Tutorly_${safeName}_All_Hours.xlsx`;
    downloadXLSX(data, filename);
    addRecentDownload(filename, 'single');
    showToast(`Downloaded: ${filename}`);
}