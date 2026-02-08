// ========================
// Load tutors from server data
// ========================
const tutors = (window.allTutors || []).map(tutor => ({
    id: tutor.id,
    name: tutor.username,
    subject: tutor.role || 'Tutor'
}));

let selectedTutor = null;

// ========================
// Defaults
// ========================
const now = new Date();
const currentMonth = now.toISOString().slice(0, 7);
document.getElementById('tutorAllMonth').value = currentMonth;
document.getElementById('studentAllMonth').value = currentMonth;

// ========================
// Mobile sidebar
// ========================
const menuToggle = document.getElementById('menuToggle');
const closeMenuBtn = document.getElementById('closeMenu');
const menuOverlay = document.getElementById('menuOverlay');
const mobileMenu = document.getElementById('mobileMenu');

function openMenu() {
    mobileMenu.classList.add('open');
    menuOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeMenu() {
    mobileMenu.classList.remove('open');
    menuOverlay.classList.add('hidden');
    document.body.style.overflow = '';
}

menuToggle.addEventListener('click', openMenu);
closeMenuBtn.addEventListener('click', closeMenu);
menuOverlay.addEventListener('click', closeMenu);

// ========================
// Toast
// ========================
function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========================
// Recent downloads
// ========================
let recentDownloads = [];

function addRecentDownload(filename, category) {
    recentDownloads.unshift({ filename, category, timestamp: new Date().toLocaleString() });
    if (recentDownloads.length > 5) recentDownloads.pop();
    renderRecentDownloads();
}

function renderRecentDownloads() {
    const container = document.getElementById('recentDownloads');
    if (recentDownloads.length === 0) {
    container.innerHTML = '<p class="text-sm text-muted-foreground text-center py-4">No recent downloads</p>';
    return;
    }
    container.innerHTML = recentDownloads.map(dl => {
    const colors = {
        tutor: { bg: 'bg-primary/20', text: 'text-primary' },
        student: { bg: 'bg-amber-500/20', text: 'text-amber-500' },
        single: { bg: 'bg-sky-500/20', text: 'text-sky-500' }
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

// ========================
// Tutor search dropdown
// ========================
const tutorInput = document.getElementById('tutorSearchInput');
const tutorDropdown = document.getElementById('tutorDropdown');
const clearTutorBtn = document.getElementById('clearTutorBtn');
const selectedTutorLabel = document.getElementById('selectedTutorLabel');
const selectedTutorNameEl = document.getElementById('selectedTutorName');

tutorInput.addEventListener('input', function () {
    const query = this.value.trim().toLowerCase();
    if (query.length === 0) {
    closeDropdown();
    return;
    }
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

tutorInput.addEventListener('focus', function () {
    if (this.value.trim().length > 0) {
    this.dispatchEvent(new Event('input'));
    }
});

function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text;
    return text.substring(0, idx) + '<span class="text-sky-400 font-semibold">' + text.substring(idx, idx + query.length) + '</span>' + text.substring(idx + query.length);
}

function selectTutor(id) {
    const tutor = tutors.find(t => t.id === id);
    if (!tutor) return;
    selectedTutor = tutor;
    tutorInput.value = tutor.name;
    selectedTutorNameEl.textContent = `${tutor.name} (${tutor.subject})`;
    selectedTutorLabel.classList.remove('hidden');
    clearTutorBtn.classList.remove('hidden');
    closeDropdown();
}

function clearTutorSelection() {
    selectedTutor = null;
    tutorInput.value = '';
    selectedTutorLabel.classList.add('hidden');
    clearTutorBtn.classList.add('hidden');
    closeDropdown();
    tutorInput.focus();
}

function closeDropdown() {
    tutorDropdown.classList.remove('open');
}

document.addEventListener('click', function (e) {
    if (!document.getElementById('tutorSearchWrapper').contains(e.target)) {
    closeDropdown();
    }
});

// ========================
// Data generators
// ========================
function monthLabel(monthStr) {
    const [y, m] = monthStr.split('-');
    const date = new Date(y, m - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

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

// ========================
// Download helpers
// ========================
function downloadXLSX(data, filename) {
    const ws = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0]).map(key => ({
    wch: Math.max(key.length, ...data.map(row => String(row[key]).length)) + 2
    }));
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, filename);
}

// ========================
// Download actions
// ========================
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
        
        // Get the filename from Content-Disposition header
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

function downloadAllStudentsHours() {
    const month = document.getElementById('studentAllMonth').value;
    if (!month) { showToast('Please select a month'); return; }
    const data = generateAllStudentsData(month);
    const label = monthLabel(month).replace(' ', '_');
    const filename = `Tutorly_All_Students_Hours_${label}.xlsx`;
    downloadXLSX(data, filename);
    addRecentDownload(filename, 'student');
    showToast(`Downloaded: ${filename}`);
}

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