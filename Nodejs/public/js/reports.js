// Evaluations loaded from the server (window.initialEvaluations, see reports.ejs),
// transformed into the shape the rendering functions below expect. testId isn't a
// real backend field - it's synthesized from the real DB id for display purposes.
let evaluations = (window.initialEvaluations || []).map(ev => ({
    id: ev.id,
    studentId: ev.studentId,
    student: `${ev.firstName} ${ev.lastName}`.trim(),
    mark: ev.mark,
    date: ev.day,
    subject: ev.subject || '',
    description: ev.description || '',
    testId: `TST-${String(ev.id).padStart(3, '0')}`
}));

// All students available for the "Add Evaluation" student dropdown
const allStudents = window.allStudents || [];

// Students currently shown in the "Add Evaluation" student dropdown,
// narrowed down by the student search field (see filterEvalStudents)
let filteredEvalStudents = allStudents;

// Fixed reference list of subjects for the "Add Evaluation" subject dropdown
// (window.allSubjects, see Nodejs/config/subjects.json) - blank entries filtered out
const allSubjects = (window.allSubjects || []).filter(Boolean);

// Search term for filtering evaluations by student name (desktop/mobile search bars)
let searchTerm = '';

function markColor(mark) {
    if (mark >= 8) return '#14b8a6';
    if (mark >= 6) return '#eab308';
    return '#ef4444';
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const monthNames = t('common.monthsShort');
    return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateForInput(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Get the most recent September 1st that has already occurred (start of
 * the current school year), based on today's date.
 */
function getLastSeptemberFirst() {
    const today = new Date();
    const septemberYear = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
    return new Date(septemberYear, 8, 1);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Default date range: start of the current school year (last Sept 1) through today
    document.getElementById('fromDate').value = formatDateForInput(getLastSeptemberFirst());
    document.getElementById('toDate').value = formatDateForInput(new Date());

    populateStudentDropdown();
    populateSubjectDropdown();
    renderRecent();
    renderReports();
    setupEventListeners();
});

/**
 * Populate the "Add Evaluation" student dropdown from the currently
 * filtered student list (see filterEvalStudents).
 */
function populateStudentDropdown() {
    const select = document.getElementById('evalStudent');
    if (!select) return;

    select.innerHTML = `<option value="">${t('common.selectAStudentOption')}</option>` +
        filteredEvalStudents.map(s => `<option value="${s.id}">${s.name} ${s.surname}</option>`).join('');
}

/**
 * Filter the "Add Evaluation" student dropdown by name as the user types
 * in the student search field, auto-expanding it to show multiple matches
 * (same UX as the student search on the Lessons/Calendar/Home pages).
 *
 * @param {string} searchTerm - Search query to filter students by name
 */
function filterEvalStudents(searchTerm) {
    const term = searchTerm.toLowerCase();
    const select = document.getElementById('evalStudent');

    filteredEvalStudents = allStudents.filter(s => `${s.name} ${s.surname}`.toLowerCase().includes(term));
    populateStudentDropdown();

    if (select && term.length > 0 && filteredEvalStudents.length > 0) {
        select.size = Math.min(filteredEvalStudents.length + 1, 8); // Show up to 8 options
    } else if (select) {
        select.size = 1; // Reset to default dropdown
    }
}

/**
 * Populate the "Add Evaluation" subject dropdown from the fixed subjects list.
 */
function populateSubjectDropdown() {
    const select = document.getElementById('evalSubject');
    if (!select) return;

    select.innerHTML = `<option value="">${t('reports.selectSubjectOption')}</option>` +
        allSubjects.map(s => `<option value="${s}">${s}</option>`).join('');
}

function renderRecent() {
    const container = document.getElementById('recentList');
    const countEl = document.getElementById('recentCount');

    // Filter by student name (search bar), then sort by date descending (most recent first)
    const sorted = evaluations
    .filter(ev => !searchTerm || ev.student.toLowerCase().includes(searchTerm))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
    countEl.textContent = t('reports.total', { count: sorted.length });

    if (sorted.length === 0) {
    container.innerHTML = `<p class="text-sm text-muted-foreground py-2">${t('reports.noEvaluationsYet')}</p>`;
    return;
    }

    container.innerHTML = sorted.map(ev => `
    <button onclick="showTestInfo(${ev.id})" class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border" style="border-color:${markColor(ev.mark)}30;background:${markColor(ev.mark)}15">
        <span class="text-sm font-bold" style="color:${markColor(ev.mark)}">${ev.mark}</span>
        </div>
        <div class="min-w-0 flex-1">
        <p class="font-medium text-foreground truncate">${ev.student}</p>
        <p class="text-xs text-muted-foreground truncate">${ev.testId}${ev.subject ? ' &middot; ' + ev.subject : ''} &middot; ${formatDate(ev.date)}</p>
        </div>
    </button>
    `).join('');
}

function renderReports() {
    const container = document.getElementById('reportsContainer');
    const emptyState = document.getElementById('emptyReports');

    const from = document.getElementById('fromDate').value;
    const to = document.getElementById('toDate').value;

    // Filter evaluations within date range and by student name (search bar)
    let filtered = evaluations.filter(ev => {
    const matchesDate = (!from || ev.date >= from) && (!to || ev.date <= to);
    const matchesSearch = !searchTerm || ev.student.toLowerCase().includes(searchTerm);
    return matchesDate && matchesSearch;
    });

    if (filtered.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
    }
    emptyState.classList.add('hidden');

    // Group by student, then by subject within each student - one card per
    // student+subject pair, so a student's progress in different subjects
    // is tracked (and averaged) separately instead of blended together.
    const byStudent = {};
    filtered.forEach(ev => {
    if (!byStudent[ev.student]) byStudent[ev.student] = {};
    const subjectKey = ev.subject || '';
    if (!byStudent[ev.student][subjectKey]) byStudent[ev.student][subjectKey] = [];
    byStudent[ev.student][subjectKey].push(ev);
    });

    container.innerHTML = Object.keys(byStudent).map(student => {
    const bySubject = byStudent[student];
    const initials = student.split(' ').map(n => n[0]).join('');

    return Object.keys(bySubject).map(subjectKey => {
        const evs = bySubject[subjectKey].sort((a, b) => new Date(a.date) - new Date(b.date));
        const avg = (evs.reduce((s, e) => s + e.mark, 0) / evs.length);
        const subjectLabel = subjectKey || t('reports.noSubject');

        return `
        <div class="bg-card border border-border rounded-xl p-5">
        <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-foreground">${initials}</span>
            </div>
            <div>
                <div class="flex items-center gap-2 flex-wrap">
                <p class="font-semibold text-foreground">${student}</p>
                <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary">${subjectLabel}</span>
                </div>
                <p class="text-xs text-muted-foreground">${evs.length === 1 ? t('reports.evaluationCount', { count: evs.length }) : t('reports.evaluationCountPlural', { count: evs.length })}</p>
            </div>
            </div>
            <div class="text-right">
            <p class="text-xs text-muted-foreground">${t('reports.average')}</p>
            <p class="text-2xl font-bold" style="color:${markColor(avg)}">${avg.toFixed(2)}</p>
            </div>
        </div>
        ${renderChart(evs)}
        <div class="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div class="flex items-center gap-1.5">
            <span class="w-3 h-0.5 bg-primary inline-block rounded"></span> ${t('reports.marksLegend')}
            </div>
            <div class="flex items-center gap-1.5">
            <span class="w-3 h-0.5 inline-block rounded" style="background:#a1a1aa;border-top:2px dashed #a1a1aa"></span> ${t('reports.runningAverageLegend')}
            </div>
            <span class="ml-auto">${t('reports.clickPointForDetails')}</span>
        </div>
        </div>
    `;
    }).join('');
    }).join('');
}

function renderChart(evs) {
    const W = 640, H = 240;
    const padL = 36, padR = 20, padT = 20, padB = 36;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const n = evs.length;
    const maxMark = 10, minMark = 0;

    const xFor = (i) => padL + (n === 1 ? plotW / 2 : (plotW * i) / (n - 1));
    const yFor = (m) => padT + plotH - ((m - minMark) / (maxMark - minMark)) * plotH;

    // Running average points
    let runSum = 0;
    const avgPoints = evs.map((e, i) => {
    runSum += e.mark;
    return { x: xFor(i), y: yFor(runSum / (i + 1)) };
    });

    // Gridlines + Y labels (0,2,4,6,8,10)
    let grid = '';
    for (let m = 0; m <= 10; m += 2) {
    const y = yFor(m);
    grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#2e2e2e" stroke-width="1"/>`;
    grid += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" fill="#a1a1aa" font-size="11">${m}</text>`;
    }

    // Marks polyline
    const markPath = evs.map((e, i) => `${xFor(i)},${yFor(e.mark)}`).join(' ');
    const avgPath = avgPoints.map(p => `${p.x},${p.y}`).join(' ');

    // Mark dots (clickable) + x labels
    const monthNames = t('common.monthsShort');
    let dots = '';
    let xLabels = '';
    evs.forEach((e, i) => {
    const x = xFor(i), y = yFor(e.mark);
    dots += `<circle class="chart-dot" cx="${x}" cy="${y}" r="5" fill="${markColor(e.mark)}" stroke="#141414" stroke-width="2" onclick="showTestInfo(${e.id})"><title>${e.testId}${e.subject ? ' - ' + e.subject : ''}: ${e.mark}</title></circle>`;
    const d = new Date(e.date + 'T00:00:00');
    xLabels += `<text x="${x}" y="${H - padB + 20}" text-anchor="middle" fill="#a1a1aa" font-size="10">${d.getDate()} ${monthNames[d.getMonth()]}</text>`;
    });

    // Average dots (small)
    let avgDots = avgPoints.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="#a1a1aa"/>`).join('');

    return `
    <div class="overflow-x-auto -mx-1">
        <svg viewBox="0 0 ${W} ${H}" class="w-full min-w-[420px]" preserveAspectRatio="xMidYMid meet">
        ${grid}
        <polyline points="${avgPath}" fill="none" stroke="#a1a1aa" stroke-width="2" stroke-dasharray="5 4"/>
        <polyline points="${markPath}" fill="none" stroke="#14b8a6" stroke-width="2.5"/>
        ${avgDots}
        ${dots}
        ${xLabels}
        </svg>
    </div>
    `;
}

// ID of the evaluation currently shown in the Test Info modal (used by deleteEvaluation)
let currentTestInfoId = null;

function showTestInfo(id) {
    const ev = evaluations.find(e => e.id === id);
    if (!ev) return;

    currentTestInfoId = id;

    const color = markColor(ev.mark);
    const circle = document.getElementById('infoMarkCircle');
    circle.style.borderColor = color;
    circle.style.background = color + '15';
    const markEl = document.getElementById('infoMark');
    markEl.textContent = ev.mark;
    markEl.style.color = color;

    document.getElementById('infoTestId').textContent = ev.testId;
    document.getElementById('infoDate').textContent = formatDate(ev.date);
    document.getElementById('infoStudent').textContent = ev.student;
    document.getElementById('infoSubject').textContent = ev.subject || '—';
    document.getElementById('infoDescription').textContent = ev.description || t('reports.noDescriptionProvided');

    document.getElementById('testInfoModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

/**
 * Delete the evaluation currently shown in the Test Info modal.
 */
async function deleteEvaluation() {
    if (!currentTestInfoId) return;
    if (!confirm(t('reports.confirmDeleteEvaluation'))) return;

    try {
        const response = await fetch(`/api/tests/${currentTestInfoId}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });

        if (response.ok) {
            window.location.reload();
        } else {
            const error = await response.json();
            alert(t('reports.errors.deleteEvaluationFailed', { error: error.error || t('home.errors.unknownError') }));
        }
    } catch (error) {
        console.error('Error deleting evaluation:', error);
        alert(t('reports.errors.deleteEvaluationRetry'));
    }
}

function closeTestInfo() {
    document.getElementById('testInfoModal').classList.remove('open');
    document.body.style.overflow = '';
}

function openEvalModal() {
    // Reset student search so a stale filter from a previous open doesn't carry over
    const searchInput = document.getElementById('evalStudentSearch');
    if (searchInput) searchInput.value = '';
    filterEvalStudents('');

    document.getElementById('addEvalModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeEvalModal() {
    document.getElementById('addEvalModal').classList.remove('open');
    document.body.style.overflow = '';
}

function setupEventListeners() {
    // Mobile menu
    const menuToggle = document.getElementById('menuToggle');
    const closeMenu = document.getElementById('closeMenu');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuOverlay = document.getElementById('menuOverlay');

    menuToggle.addEventListener('click', () => {
    mobileMenu.classList.add('open');
    menuOverlay.classList.remove('hidden');
    });

    const closeMenuFn = () => {
    mobileMenu.classList.remove('open');
    menuOverlay.classList.add('hidden');
    };

    closeMenu.addEventListener('click', closeMenuFn);
    menuOverlay.addEventListener('click', closeMenuFn);

    // Filter
    document.getElementById('applyFilter').addEventListener('click', renderReports);

    // Search input (filters by student name)
    document.getElementById('searchInput').addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase();
    renderRecent();
    renderReports();
    });

    // Add evaluation modal
    document.getElementById('addEvalBtn').addEventListener('click', openEvalModal);

    // Student search inside the Add Evaluation modal (filters evalStudent dropdown)
    document.getElementById('evalStudentSearch').addEventListener('input', (e) => {
    filterEvalStudents(e.target.value);
    });

    // Form submission
    document.getElementById('evalForm').addEventListener('submit', handleAddEvaluationSubmit);
}

/**
 * Handle "Add Evaluation" form submission.
 *
 * Persists the new evaluation via POST /api/tests, then reloads the page
 * so the new record (and its enriched student name) comes from the server
 * like every other page in the app.
 */
async function handleAddEvaluationSubmit(e) {
    e.preventDefault();

    const studentId = document.getElementById('evalStudent').value;
    const subject = document.getElementById('evalSubject').value;
    const mark = document.getElementById('evalMark').value;
    const date = document.getElementById('evalDate').value;
    const description = document.getElementById('evalDescription').value.trim();

    if (!studentId) {
        alert(t('common.validation.selectStudent'));
        return;
    }

    if (!subject) {
        alert(t('common.validation.selectSubject'));
        return;
    }

    try {
        const response = await fetch('/api/tests', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ studentId, subject, mark, date, description })
        });

        if (response.ok) {
            window.location.reload();
        } else {
            const error = await response.json();
            alert(t('reports.errors.addEvaluationFailed', { error: error.error || t('home.errors.unknownError') }));
        }
    } catch (error) {
        console.error('Error adding evaluation:', error);
        alert(t('reports.errors.addEvaluationRetry'));
    }
}