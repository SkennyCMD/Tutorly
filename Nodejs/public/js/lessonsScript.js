// Data
let lessons = [];
let prenotations = [];
let statsDate = new Date();
let searchTerm = '';
let totalLessonsCount = 0;
let loadedLessonsCount = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateStatsMonth();
    loadLessons();
    loadPrenotations();
    setupEventListeners();
    
    // Initialize modal with page reload callback
    initializeModal(() => {
        window.location.reload();
    });
});

// Reload both lessons and prenotations
async function loadLessonsAndPrenotations() {
    await loadLessons();
    await loadPrenotations();
}

// Load lessons from server-rendered data
async function loadLessons() {
    try {
        // Get lessons from window.initialLessons
        const lessonsData = window.initialLessons || [];
        totalLessonsCount = window.totalLessonsCount || 0;
        
        // Transform data to match display format
        lessons = lessonsData.map(lesson => ({
            id: lesson.id,
            firstName: lesson.firstName || 'Unknown',
            lastName: lesson.lastName || '',
            classType: lesson.classType || 'M',
            date: lesson.startTime.split('T')[0],
            startTime: new Date(lesson.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            endTime: new Date(lesson.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            status: determineStatus(lesson.startTime, lesson.endTime)
        }));
        
        loadedLessonsCount = lessons.length;
        
        // Use same data for statistics
        allLessonsForStats = [...lessons];
        
        renderStatistics();
        renderLessons();
        renderBookedLessons();
    } catch (error) {
        console.error('Error loading lessons:', error);
    }
}

// All lessons data for statistics (same as lessons now)
let allLessonsForStats = [];

// Load prenotations from server-rendered data
async function loadPrenotations() {
    try {
        // Get prenotations from window.initialPrenotations
        const data = window.initialPrenotations || [];
        
        // Transform data to match display format
        prenotations = data.map(prenotation => ({
            id: prenotation.id,
            firstName: prenotation.firstName || 'Unknown',
            lastName: prenotation.lastName || '',
            classType: prenotation.classType || 'M',
            date: prenotation.startTime.split('T')[0],
            startTime: new Date(prenotation.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            endTime: new Date(prenotation.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            confirmed: prenotation.confirmed || false,
            status: 'booked'
        }));
        renderBookedLessons();
    } catch (error) {
        console.error('Error loading prenotations:', error);
    }
}

// Determine lesson status based on time
function determineStatus(startTime, endTime) {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (end < now) {
        return 'completed';
    } else if (start > now) {
        return 'booked';
    } else {
        return 'in-progress';
    }
}

function setupEventListeners() {
    // Mobile menu
    document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.add('open');
    document.getElementById('menuOverlay').classList.remove('hidden');
    });

    document.getElementById('closeMenu').addEventListener('click', closeMobileMenu);
    document.getElementById('menuOverlay').addEventListener('click', closeMobileMenu);

    // Stats month navigation
    document.getElementById('prevStatsMonth').addEventListener('click', () => {
    statsDate.setMonth(statsDate.getMonth() - 1);
    updateStatsMonth();
    renderStatistics();
    });

    document.getElementById('nextStatsMonth').addEventListener('click', () => {
    statsDate.setMonth(statsDate.getMonth() + 1);
    updateStatsMonth();
    renderStatistics();
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase();
    renderStatistics();
    renderLessons();
    });

    document.getElementById('searchInputMobile').addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase();
    document.getElementById('searchInput').value = e.target.value;
    renderStatistics();
    renderLessons();
    });
}

function closeMobileMenu() {
    document.getElementById('mobileMenu').classList.remove('open');
    document.getElementById('menuOverlay').classList.add('hidden');
}

function updateStatsMonth() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('statsMonth').textContent = `${monthNames[statsDate.getMonth()]} ${statsDate.getFullYear()}`;
}

function renderStatistics() {
    const month = statsDate.getMonth();
    const year = statsDate.getFullYear();

    // Filter lessons by month/year and search term (use all lessons for accurate stats)
    const monthLessons = allLessonsForStats.filter(l => {
    const lessonDate = new Date(l.date);
    const matchesDate = lessonDate.getMonth() === month && lessonDate.getFullYear() === year && l.status === 'completed';
    
    // If search term exists, filter by student name
    if (searchTerm) {
        const fullName = `${l.firstName} ${l.lastName}`.toLowerCase();
        return matchesDate && fullName.includes(searchTerm);
    }
    
    return matchesDate;
    });

    let totalMinutes = 0;
    let minutesM = 0;
    let minutesS = 0;
    let minutesU = 0;

    monthLessons.forEach(lesson => {
    const start = lesson.startTime.split(':').map(Number);
    const end = lesson.endTime.split(':').map(Number);
    const duration = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
    
    totalMinutes += duration;
    
    if (lesson.classType === 'M') minutesM += duration;
    else if (lesson.classType === 'S') minutesS += duration;
    else if (lesson.classType === 'U') minutesU += duration;
    });

    document.getElementById('totalHours').textContent = formatHours(totalMinutes);
    document.getElementById('hoursM').textContent = formatHours(minutesM);
    document.getElementById('hoursS').textContent = formatHours(minutesS);
    document.getElementById('hoursU').textContent = formatHours(minutesU);
}

function formatHours(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
}

function renderLessons() {
    const container = document.getElementById('lessonsList');
    const emptyState = document.getElementById('emptyLessons');
    const countEl = document.getElementById('lessonsCount');

    // Filter lessons (already sorted by server, completed only for history)
    let filteredLessons = lessons
    .filter(l => l.status === 'completed')
    .filter(l => {
        if (!searchTerm) return true;
        const fullName = `${l.firstName} ${l.lastName}`.toLowerCase();
        return fullName.includes(searchTerm);
    });

    // Calculate total from allLessonsForStats for accurate count
    const totalCompletedWithSearch = allLessonsForStats
        .filter(l => l.status === 'completed')
        .filter(l => {
            if (!searchTerm) return true;
            const fullName = `${l.firstName} ${l.lastName}`.toLowerCase();
            return fullName.includes(searchTerm);
        }).length;

    countEl.textContent = `${totalCompletedWithSearch} lesson${totalCompletedWithSearch !== 1 ? 's' : ''}`;

    if (filteredLessons.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
    }

    emptyState.classList.add('hidden');

    const lessonsHTML = filteredLessons.map(lesson => {
    const classColors = {
        'M': 'bg-blue-500/20 text-blue-400',
        'S': 'bg-green-500/20 text-green-400',
        'U': 'bg-purple-500/20 text-purple-400'
    };

    const date = new Date(lesson.date);
    const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return `
        <div class="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
        <div class="flex items-center gap-4">
            <div class="w-10 h-10 ${classColors[lesson.classType].split(' ')[0]} rounded-lg flex items-center justify-center">
            <span class="text-sm font-bold ${classColors[lesson.classType].split(' ')[1]}">${lesson.classType}</span>
            </div>
            <div>
            <p class="font-medium text-foreground">${lesson.firstName} ${lesson.lastName}</p>
            <p class="text-sm text-muted-foreground">${formattedDate}</p>
            </div>
        </div>
        <div class="text-right">
            <p class="font-medium text-foreground">${formatTime(lesson.startTime)} - ${formatTime(lesson.endTime)}</p>
            <p class="text-sm text-muted-foreground">${calculateDuration(lesson.startTime, lesson.endTime)}</p>
        </div>
        </div>
    `;
    }).join('');

    // Add load more button if there are more lessons to load from server
    const completedLoaded = lessons.filter(l => l.status === 'completed').length;
    const completedTotal = allLessonsForStats.filter(l => l.status === 'completed').length;
    
    if (loadedLessonsCount < totalLessonsCount) {
        lessonsHTML += `
            <div class="text-center py-4">
                <button onclick="loadMoreLessons()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
                    Load More (${completedTotal - completedLoaded} more available)
                </button>
            </div>
        `;
    }

    container.innerHTML = lessonsHTML;
}

async function loadMoreLessons() {
    // No longer needed - all lessons are loaded initially from server-rendered data
    console.log('All lessons already loaded');
}

function renderBookedLessons() {
    const container = document.getElementById('bookedList');
    const emptyState = document.getElementById('emptyBooked');
    const countEl = document.getElementById('bookedCount');

    // Get today's date (YYYY-MM-DD format)
    const today = new Date().toISOString().split('T')[0];
    
    // Filter only today's prenotations and sort by time (earliest first)
    const todayPrenotations = prenotations
        .filter(prenotation => prenotation.date === today)
        .sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.startTime}`);
            const dateB = new Date(`${b.date}T${b.startTime}`);
            return dateA - dateB;
        });

    countEl.textContent = todayPrenotations.length;

    if (todayPrenotations.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
    }

    emptyState.classList.add('hidden');

    container.innerHTML = todayPrenotations.map(prenotation => {
    const classColors = {
        'M': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'S': 'bg-green-500/20 text-green-400 border-green-500/30',
        'U': 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };

    const date = new Date(prenotation.date);
    const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    // Add status badge
    const statusBadge = prenotation.confirmed 
        ? '<span class="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary ml-2">Confirmed</span>'
        : '<span class="text-xs px-2 py-0.5 rounded bg-muted/20 text-muted-foreground ml-2">Pending</span>';

    return `
        <div class="p-3 border border-border rounded-lg hover:border-primary/50 transition-colors">
        <div class="flex items-center justify-between mb-2">
            <div class="flex items-center">
            <span class="font-medium text-foreground text-sm">${prenotation.firstName} ${prenotation.lastName}</span>
            ${statusBadge}
            </div>
            <span class="text-xs px-2 py-0.5 rounded ${classColors[prenotation.classType]}">${prenotation.classType}</span>
        </div>
        <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>${formattedDate}</span>
            <span>${formatTime(prenotation.startTime)} - ${formatTime(prenotation.endTime)}</span>
        </div>
        </div>
    `;
    }).join('');
}

function formatTime(time) {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
}

function calculateDuration(start, end) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const duration = (eh * 60 + em) - (sh * 60 + sm);
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
}