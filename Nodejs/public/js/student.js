// Student profile data loaded from the server (window.studentData, see student.ejs)
const rawStudent = window.studentData || {};
const student = {
    firstName: rawStudent.name || '',
    lastName: rawStudent.surname || '',
    classType: rawStudent.studentClass || 'M', // M = Middle School, S = Senior High, U = University
};

const classNames = { M: t('lessons.middleSchool'), S: t('lessons.seniorHigh'), U: t('lessons.university') };
const classColors = {
    M: { text: '#60a5fa', bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.4)' },
    S: { text: '#4ade80', bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.4)' },
    U: { text: '#c084fc', bg: 'rgba(192,132,252,0.15)', border: 'rgba(192,132,252,0.4)' },
};

// Test marks loaded from the server (window.initialEvaluations, see student.ejs).
// testId isn't a real backend field - it's synthesized from the real DB id for display purposes.
let evaluations = (window.initialEvaluations || []).map(ev => ({
    id: ev.id,
    mark: ev.mark,
    date: ev.day,
    subject: ev.subject || '',
    description: ev.description || '',
    tutorId: ev.tutorId,
    tutorName: ev.tutorName || t('student.unknownTutor'),
    testId: `TST-${String(ev.id).padStart(3, '0')}`
}));

// Fixed color palette used to tell apart the subject+tutor lines on the marks chart.
// Cycles if a student has more subject/tutor combinations than colors.
const lineColorPalette = ['#14b8a6', '#60a5fa', '#f97316', '#c084fc', '#f43f5e', '#eab308', '#38bdf8', '#a3e635', '#fb7185', '#94a3b8'];

// Groups evaluations by subject+tutor (a line on the chart represents one subject
// taught/tested by one specific tutor), assigning each group a stable color.
function groupEvaluationsBySubjectAndTutor(evs) {
    const groups = new Map();
    evs.forEach(ev => {
        const key = `${ev.subject}||${ev.tutorId}`;
        if (!groups.has(key)) {
            groups.set(key, { key, subject: ev.subject || t('reports.noSubject'), tutorName: ev.tutorName, evaluations: [] });
        }
        groups.get(key).evaluations.push(ev);
    });

    const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
        const ga = groups.get(a), gb = groups.get(b);
        return (ga.subject + ga.tutorName).localeCompare(gb.subject + gb.tutorName);
    });

    return sortedKeys.map((key, i) => ({
        ...groups.get(key),
        color: lineColorPalette[i % lineColorPalette.length]
    }));
}

// Subject+tutor group keys toggled off via clicking their legend card, hiding
// their line/dots from the marks chart while staying visible (dimmed) in the legend
const hiddenChartGroupKeys = new Set();

function toggleChartGroup(encodedKey) {
    const key = decodeURIComponent(encodedKey);
    if (hiddenChartGroupKeys.has(key)) {
        hiddenChartGroupKeys.delete(key);
    } else {
        hiddenChartGroupKeys.add(key);
    }
    renderMarksChart();
}

// Lessons loaded from the server (window.initialLessons, see student.ejs), used to
// compute hours completed per month and highlight lesson days on the mini calendar.
const initialLessons = window.initialLessons || [];

// Prenotations (upcoming/pending bookings) loaded from the server, across every
// tutor - see window.initialPrenotations in student.ejs.
const prenotations = (window.initialPrenotations || []).map(p => ({
    id: p.id,
    startTime: p.startTime,
    endTime: p.endTime,
    confirmed: !!p.flag,
    tutorId: p.tutorId,
    tutorName: p.tutorName || t('student.unknownTutor')
}));

// Active lesson packages (no closure date) loaded from the server - see
// window.initialPacks in student.ejs. The server already filters to active-only.
const packs = (window.initialPacks || []).map(p => ({
    id: p.id,
    hours: p.hours,
    usedHours: p.usedHours || 0,
    unassignedHours: p.unassignedHours || 0,
    firstUnassignedLessonStart: p.firstUnassignedLessonStart || null
}));

// Aggregates a list of lessons into hours completed per month (key: YYYY-MM)
function computeHoursByMonth(lessons) {
    const result = {};
    lessons.forEach(lesson => {
    if (!lesson.startTime || !lesson.endTime) return;
    const dateKey = lesson.startTime.split('T')[0];
    const hours = (new Date(lesson.endTime) - new Date(lesson.startTime)) / (1000 * 60 * 60);
    const monthKey = dateKey.slice(0, 7);
    result[monthKey] = (result[monthKey] || 0) + hours;
    });
    return result;
}

// Lifetime hours per month (unfiltered), keyed by "YYYY-MM" - used to look up just the
// current calendar month's hours for the "Month's Hours" profile stat
const hoursByMonth = computeHoursByMonth(initialLessons);

// Days that have a lesson (for calendar highlight), key: YYYY-MM-DD - unfiltered,
// the mini calendar always shows the student's full lesson history
const lessonDays = new Set(
    initialLessons.filter(l => l.startTime).map(l => l.startTime.split('T')[0])
);

const monthNames = t('common.monthsShort');
const monthFull = t('common.months');

function markColor(mark) {
    if (mark >= 8) return '#14b8a6';
    if (mark >= 6) return '#eab308';
    return '#ef4444';
}

// Reads a theme CSS variable (see public/css/theme.css) so chart grid lines/labels/dot
// outlines - unlike markColor's fixed accent colors - follow the active light/dark theme
// instead of staying tuned for a single hardcoded dark palette.
function themeColor(varName) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return value ? `rgb(${value})` : '#a1a1aa';
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

// Formats fractional hours as exact hours and minutes, e.g. "2h 30m", "45m", "3h"
function formatHours(hours) {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

function formatDateForInput(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatTimeForInput(date) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

// Parses an ISO datetime string (no timezone offset, as sent by the backend) directly
// into a local Date object, avoiding UTC conversion shifting the displayed time.
function parseAsLocalDate(dateString) {
    const cleanDate = dateString.replace(/\.\d{3}Z?$/, '').replace(/[+-]\d{2}:\d{2}$/, '');
    const [datePart, timePart] = cleanDate.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second = 0] = (timePart || '00:00:00').split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * Get the most recent September 1st that has already occurred (start of
 * the current school year), based on today's date.
 */
function getLastSeptemberFirst() {
    const now = new Date();
    const septemberYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    return new Date(septemberYear, 8, 1);
}

/**
 * Evaluations within the From/To date range (see #fromDate/#toDate), used by the
 * marks chart, its legend/average, the "All Tests" list, and the profile header's
 * "Avg mark"/"Tests" stats (see updateAvgMarkStat/updateTotalTestsStat). Defaults to
 * the current school year (last Sept 1) through today. Only "Month's Hours" stays
 * unaffected by this filter - it always reflects the real current calendar month.
 */
function getFilteredEvaluations() {
    const from = document.getElementById('fromDate').value;
    const to = document.getElementById('toDate').value;
    return evaluations.filter(ev => (!from || ev.date >= from) && (!to || ev.date <= to));
}

/**
 * Lessons within the same From/To date range, used to filter the Hours per Month list.
 */
function getFilteredLessons() {
    const from = document.getElementById('fromDate').value;
    const to = document.getElementById('toDate').value;
    return initialLessons.filter(lesson => {
    if (!lesson.startTime) return false;
    const dateKey = lesson.startTime.split('T')[0];
    return (!from || dateKey >= from) && (!to || dateKey <= to);
    });
}

// Calendar starts on the most recent month that has a lesson, or the current month otherwise
const sortedLessonDays = Array.from(lessonDays).sort();
let calendarDate;
if (sortedLessonDays.length > 0) {
    const [y, m] = sortedLessonDays[sortedLessonDays.length - 1].split('-').map(Number);
    calendarDate = new Date(y, m - 1, 1);
} else {
    const now = new Date();
    calendarDate = new Date(now.getFullYear(), now.getMonth(), 1);
}
const today = new Date();

document.addEventListener('DOMContentLoaded', () => {
    // Default date range: start of the current school year (last Sept 1) through today
    document.getElementById('fromDate').value = formatDateForInput(getLastSeptemberFirst());
    document.getElementById('toDate').value = formatDateForInput(new Date());

    renderProfile();
    renderMarksChart();
    renderMarksList();
    renderHours();
    renderCalendar();
    renderPrenotations();
    renderPacks();
    setupEventListeners();
});

function renderProfile() {
    const initials = ((student.firstName.charAt(0) || '?') + (student.lastName.charAt(0) || '?')).toUpperCase();
    document.getElementById('studentInitials').textContent = initials;
    document.getElementById('studentName').textContent = `${student.firstName} ${student.lastName}`.trim();
    document.getElementById('studentSurnameLabel').textContent = t('student.surnameLabel', { surname: student.lastName });
    document.getElementById('studentClassLabel').textContent = t('student.classLabel', { classType: student.classType, className: classNames[student.classType] || student.classType });

    const c = classColors[student.classType] || classColors.M;
    const badge = document.getElementById('studentClassBadge');
    badge.textContent = t('student.classBadge', { classType: student.classType });
    badge.style.color = c.text;
    badge.style.background = c.bg;
    badge.style.border = `1px solid ${c.border}`;

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('totalHours').textContent = formatHours(hoursByMonth[currentMonthKey] || 0);

    updateAvgMarkStat();
    updateTotalTestsStat();
}

// "Avg mark" profile stat follows the same From/To filter as the marks chart/list
function updateAvgMarkStat() {
    const filtered = getFilteredEvaluations();
    const avg = filtered.length ? filtered.reduce((s, e) => s + e.mark, 0) / filtered.length : 0;
    document.getElementById('avgMark').textContent = avg.toFixed(1);
    document.getElementById('avgMark').style.color = markColor(avg);
}

// "Tests" profile stat follows the same From/To filter as the marks chart/list
function updateTotalTestsStat() {
    document.getElementById('totalTests').textContent = getFilteredEvaluations().length;
}

function renderMarksChart() {
    const filtered = getFilteredEvaluations();
    const evs = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
    const groups = groupEvaluationsBySubjectAndTutor(evs);
    document.getElementById('marksChart').innerHTML = renderChart(evs, groups);
    renderChartLegend(groups);

    const chartAvg = evs.length ? evs.reduce((s, e) => s + e.mark, 0) / evs.length : 0;
    document.getElementById('chartAvg').textContent = chartAvg.toFixed(2);
    document.getElementById('chartAvg').style.color = markColor(chartAvg);
}

function renderChart(evs, groups) {
    const W = 640, H = 240;
    const padL = 36, padR = 20, padT = 20, padB = 36;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const n = evs.length;
    const maxMark = 10, minMark = 0;

    const xFor = (i) => padL + (n <= 1 ? plotW / 2 : (plotW * i) / (n - 1));
    const yFor = (m) => padT + plotH - ((m - minMark) / (maxMark - minMark)) * plotH;

    // Position of each evaluation within the shared, chronologically-sorted x axis
    const indexOf = new Map(evs.map((e, i) => [e.id, i]));

    const gridStroke = themeColor('--color-border');
    const labelFill = themeColor('--color-muted-foreground');
    const dotStroke = themeColor('--color-card');

    let grid = '';
    for (let m = 0; m <= 10; m += 2) {
    const y = yFor(m);
    grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="${gridStroke}" stroke-width="1"/>`;
    grid += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" fill="${labelFill}" font-size="11">${m}</text>`;
    }

    let lines = '';
    let dots = '';
    groups.filter(group => !hiddenChartGroupKeys.has(group.key)).forEach(group => {
    const groupEvs = [...group.evaluations].sort((a, b) => new Date(a.date) - new Date(b.date));
    const points = groupEvs.map(e => `${xFor(indexOf.get(e.id))},${yFor(e.mark)}`).join(' ');
    lines += `<polyline points="${points}" fill="none" stroke="${group.color}" stroke-width="2.5"/>`;

    groupEvs.forEach(e => {
        const x = xFor(indexOf.get(e.id)), y = yFor(e.mark);
        const label = `${e.testId} - ${group.subject} (${group.tutorName}): ${e.mark}`;
        dots += `<circle class="chart-dot" cx="${x}" cy="${y}" r="5" fill="${group.color}" stroke="${dotStroke}" stroke-width="2" onclick="showTestInfo(${e.id})"><title>${label}</title></circle>`;
    });
    });

    // Thin out date labels so they don't overlap when there are many points: only
    // show as many as comfortably fit in the plot width, evenly spaced by index,
    // always including the last one so the range doesn't look cut off.
    const minLabelSpacing = 40; // px needed per label at font-size 10 (e.g. "31 Dec")
    const maxLabels = Math.max(1, Math.floor(plotW / minLabelSpacing));
    const labelStep = Math.max(1, Math.ceil(n / maxLabels));

    let xLabels = '';
    evs.forEach((e, i) => {
    if (i % labelStep !== 0 && i !== n - 1) return;
    const x = xFor(i);
    const d = new Date(e.date + 'T00:00:00');
    xLabels += `<text x="${x}" y="${H - padB + 20}" text-anchor="middle" fill="${labelFill}" font-size="10">${d.getDate()} ${monthNames[d.getMonth()]}</text>`;
    });

    return `
    <div class="overflow-x-auto -mx-1">
        <svg viewBox="0 0 ${W} ${H}" class="w-full min-w-[420px]" preserveAspectRatio="xMidYMid meet">
        ${grid}
        ${lines}
        ${dots}
        ${xLabels}
        </svg>
    </div>
    `;
}

function renderChartLegend(groups) {
    const container = document.getElementById('chartLegend');
    if (!container) return;

    if (groups.length === 0) {
    container.innerHTML = `<p class="text-sm text-muted-foreground col-span-full">${t('student.noEvaluationsYet')}</p>`;
    return;
    }

    container.innerHTML = groups.map(group => {
    const avg = group.evaluations.reduce((s, e) => s + e.mark, 0) / group.evaluations.length;
    const isHidden = hiddenChartGroupKeys.has(group.key);
    const cardClass = 'flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border cursor-pointer transition-opacity hover:border-primary/50'
        + (isHidden ? ' opacity-40' : '');
    return `
        <div class="${cardClass}" onclick="toggleChartGroup('${encodeURIComponent(group.key)}')"
        title="${isHidden ? t('student.clickToShowLine') : t('student.clickToHideLine')}">
        <div class="flex items-center gap-2 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:${group.color}"></span>
            <div class="min-w-0">
            <p class="text-xs font-medium text-foreground truncate">${group.subject}</p>
            <p class="text-[11px] text-muted-foreground truncate">${group.tutorName}</p>
            </div>
        </div>
        <span class="text-sm font-bold flex-shrink-0" style="color:${group.color}">${avg.toFixed(1)}</span>
        </div>
    `;
    }).join('');
}

function renderMarksList() {
    const container = document.getElementById('marksList');
    const sorted = [...getFilteredEvaluations()].sort((a, b) => new Date(b.date) - new Date(a.date));
    document.getElementById('marksCount').textContent = sorted.length === 1
        ? t('student.testCount', { count: sorted.length })
        : t('student.testCountPlural', { count: sorted.length });

    if (sorted.length === 0) {
    container.innerHTML = `<p class="text-sm text-muted-foreground">${t('student.noTestsInRange')}</p>`;
    return;
    }

    container.innerHTML = sorted.map(ev => `
    <button onclick="showTestInfo(${ev.id})" class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border" style="border-color:${markColor(ev.mark)}30;background:${markColor(ev.mark)}15">
        <span class="text-sm font-bold" style="color:${markColor(ev.mark)}">${ev.mark}</span>
        </div>
        <div class="min-w-0 flex-1">
        <p class="font-medium text-foreground truncate">${ev.testId}${ev.subject ? ' &middot; ' + ev.subject : ''}</p>
        <p class="text-xs text-muted-foreground truncate">${formatDate(ev.date)} &middot; ${ev.tutorName}</p>
        </div>
        <svg class="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
    </button>
    `).join('');
}

function renderHours() {
    const container = document.getElementById('hoursChart');
    const filteredHours = computeHoursByMonth(getFilteredLessons());
    // Only the most recent 6 months (fewer if less history is available)
    const keys = Object.keys(filteredHours).sort().slice(-6);

    if (keys.length === 0) {
    container.innerHTML = `<p class="text-sm text-muted-foreground">${t('student.noLessonsInRange')}</p>`;
    return;
    }

    const maxHours = Math.max(...Object.values(filteredHours), 1);

    container.innerHTML = keys.map(key => {
    const [year, m] = key.split('-');
    const label = `${monthNames[parseInt(m, 10) - 1]} '${year.slice(2)}`;
    const hours = filteredHours[key];
    const pct = (hours / maxHours) * 100;
    return `
        <div>
        <div class="flex items-center justify-between mb-1">
            <span class="text-sm text-muted-foreground">${label}</span>
            <span class="text-sm font-semibold text-foreground">${formatHours(hours)}</span>
        </div>
        <div class="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
            <div class="h-full bg-primary rounded-full transition-all" style="width:${pct}%"></div>
        </div>
        </div>
    `;
    }).join('');
}

function renderCalendar() {
    document.getElementById('calendarMonth').textContent = `${monthFull[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`;

    const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
    const lastDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
    const startDay = (firstDay.getDay() + 6) % 7;

    let html = '';
    for (let i = 0; i < startDay; i++) {
    html += '<span class="py-1.5"></span>';
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateKey = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasLesson = lessonDays.has(dateKey);
    const isToday = day === today.getDate() &&
                    calendarDate.getMonth() === today.getMonth() &&
                    calendarDate.getFullYear() === today.getFullYear();

    let cls = 'py-1.5 rounded-lg transition-colors ';
    if (isToday) {
        cls += 'bg-primary text-primary-foreground font-medium';
    } else if (hasLesson) {
        cls += 'bg-primary/30 border border-primary text-foreground font-medium cursor-pointer';
    } else {
        cls += 'hover:bg-secondary text-foreground';
    }
    html += `<span class="${cls}">${day}</span>`;
    }

    document.getElementById('calendarDays').innerHTML = html;
}

function formatDateTime(isoString) {
    const d = new Date(isoString);
    const dateLabel = `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    const timeLabel = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    return { dateLabel, timeLabel };
}

function renderPrenotations() {
    const container = document.getElementById('prenotationsList');
    const emptyState = document.getElementById('emptyPrenotations');
    const countEl = document.getElementById('prenotationsCount');

    const sorted = [...prenotations].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    countEl.textContent = sorted.length;

    if (sorted.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
    }
    emptyState.classList.add('hidden');

    const todayKey = formatDateForInput(today);
    const canEdit = window.userRole === 'STAFF';

    container.innerHTML = sorted.map(p => {
    const start = formatDateTime(p.startTime);
    const end = formatDateTime(p.endTime);
    const isPast = p.startTime.split('T')[0] < todayKey;
    const statusBadge = p.confirmed
        ? `<span class="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary ml-2">${t('lessons.confirmed')}</span>`
        : isPast
            ? `<span class="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 ml-2">${t('student.expired')}</span>`
            : `<span class="text-xs px-2 py-0.5 rounded bg-muted/20 text-muted-foreground ml-2">${t('lessons.pending')}</span>`;
    const cardClass = (isPast
        ? 'p-3 border border-red-500/50 bg-red-500/10 rounded-lg'
        : 'p-3 border border-border rounded-lg') + (canEdit ? ' cursor-pointer hover:border-primary/50 transition-colors' : '');
    const dateClass = isPast ? 'text-red-400' : '';
    const onClick = canEdit ? ` onclick="openEditPrenotationModal(${p.id})"` : '';

    return `
        <div class="${cardClass}"${onClick}>
        <div class="flex items-center justify-between mb-1">
            <span class="font-medium text-foreground text-sm">${p.tutorName}</span>
            ${statusBadge}
        </div>
        <div class="flex items-center justify-between text-xs ${dateClass || 'text-muted-foreground'}">
            <span>${start.dateLabel}</span>
            <span>${start.timeLabel} - ${end.timeLabel}</span>
        </div>
        </div>
    `;
    }).join('');
}

function renderPacks() {
    const container = document.getElementById('packsList');
    const emptyState = document.getElementById('emptyPacks');

    if (packs.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
    }
    emptyState.classList.add('hidden');

    const isStaff = window.userRole === 'STAFF';

    container.innerHTML = packs.map(p => {
    const pct = p.hours > 0 ? Math.min(100, (p.usedHours / p.hours) * 100) : 0;
    const isComplete = pct >= 100;
    const cardClasses = isComplete
        ? 'p-3 border border-destructive bg-destructive/10 rounded-lg space-y-2'
        : 'p-3 border border-border rounded-lg space-y-2';
    const barColor = isComplete ? 'bg-destructive' : 'bg-primary';
    return `
        <div class="${cardClasses}">
        <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-foreground">${p.usedHours}h / ${p.hours}h</span>
            <span class="text-xs text-muted-foreground">#${p.id}</span>
        </div>
        <div class="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div class="h-full ${barColor} rounded-full" style="width: ${pct}%"></div>
        </div>
        ${isComplete ? `
        ${p.unassignedHours > 0 ? `
        <p class="text-xs text-destructive">${t('student.unassignedHoursMessage', { hours: p.unassignedHours })}</p>
        ${isStaff ? `
        <button type="button" data-new-pack-start="${p.firstUnassignedLessonStart || ''}"
            class="new-pack-from-unassigned-btn w-full text-xs border border-destructive text-destructive px-3 py-1.5 rounded-lg font-medium hover:bg-destructive/10 transition-colors">
            ${t('student.newPackage')}
        </button>
        ` : ''}
        ` : ''}
        ${isStaff ? `
        <button type="button" data-close-pack-id="${p.id}"
            class="close-pack-btn w-full text-xs bg-destructive text-white px-3 py-1.5 rounded-lg font-medium hover:bg-destructive/90 transition-colors">
            ${t('student.closePackage')}
        </button>
        ` : ''}
        ` : ''}
        </div>
    `;
    }).join('');
}

// STAFF-only: open the "New Package" modal
function openNewPackModal(defaultStart) {
    if (window.userRole !== 'STAFF') return;
    const start = defaultStart || new Date();
    document.getElementById('newPackHours').value = 10;
    document.getElementById('newPackStartDate').value = formatDateForInput(start);
    document.getElementById('newPackStartTime').value = formatTimeForInput(start);
    document.getElementById('newPackModal').classList.add('open');
}

function closeNewPackModal() {
    document.getElementById('newPackModal').classList.remove('open');
    document.getElementById('newPackForm').reset();
}

// STAFF-only: click a prenotation card to edit its date/time and reassign its tutor
function openEditPrenotationModal(id) {
    if (window.userRole !== 'STAFF') return;

    const prenotation = prenotations.find(p => p.id === id);
    if (!prenotation) return;

    document.getElementById('editPrenotationId').value = prenotation.id;

    const startDate = parseAsLocalDate(prenotation.startTime);
    const endDate = parseAsLocalDate(prenotation.endTime);
    document.getElementById('editPrenotationDate').value = formatDateForInput(startDate);
    document.getElementById('editPrenotationStartTime').value = formatTimeForInput(startDate);
    document.getElementById('editPrenotationEndTime').value = formatTimeForInput(endDate);

    const container = document.getElementById('editPrenotationTutorsContainer');
    const allTutors = window.allTutors || [];
    container.innerHTML = allTutors.map(tutor => {
    const isAssigned = prenotation.tutorId === tutor.id;
    const tutorName = tutor.username || t('student.tutorFallback', { id: tutor.id });
    return `
        <div class="flex items-center">
        <input type="radio" id="editTutor${tutor.id}" name="editAssignToTutor"
            value="${tutor.id}" ${isAssigned ? 'checked' : ''}
            class="w-4 h-4 text-primary bg-secondary border-border focus:ring-ring">
        <label for="editTutor${tutor.id}" class="ml-2 text-sm font-medium text-foreground">${tutorName}</label>
        </div>
    `;
    }).join('');

    document.getElementById('editPrenotationModal').classList.add('open');
}

function closeEditPrenotationModal() {
    document.getElementById('editPrenotationModal').classList.remove('open');
    document.getElementById('editPrenotationForm').reset();
}

async function deletePrenotation() {
    if (!confirm(t('calendar.confirm.deletePrenotation'))) return;

    const prenotationId = document.getElementById('editPrenotationId').value;

    try {
        const response = await fetch(`/api/prenotations/${prenotationId}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });

        if (response.ok) {
            closeEditPrenotationModal();
            window.location.reload();
        } else {
            const error = await response.json();
            alert(t('calendar.errors.deletePrenotationFailed', { error: error.error || t('calendar.errors.unknownError') }));
        }
    } catch (error) {
        console.error('Error deleting prenotation:', error);
        alert(t('calendar.errors.deletePrenotationRetry'));
    }
}

function showTestInfo(id) {
    const ev = evaluations.find(e => e.id === id);
    if (!ev) return;

    const color = markColor(ev.mark);
    const circle = document.getElementById('infoMarkCircle');
    circle.style.borderColor = color;
    circle.style.background = color + '15';
    const markEl = document.getElementById('infoMark');
    markEl.textContent = ev.mark;
    markEl.style.color = color;

    document.getElementById('infoTestId').textContent = ev.testId;
    document.getElementById('infoDate').textContent = formatDate(ev.date);
    document.getElementById('infoSubject').textContent = ev.subject || t('reports.noSubject');
    document.getElementById('infoTutor').textContent = ev.tutorName;
    document.getElementById('infoDescription').textContent = ev.description || t('reports.noDescriptionProvided');

    document.getElementById('testInfoModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeTestInfo() {
    document.getElementById('testInfoModal').classList.remove('open');
    document.body.style.overflow = '';
}

function setupEventListeners() {
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

    document.getElementById('prevMonth').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
    });
    document.getElementById('nextMonth').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
    });

    document.getElementById('applyFilter').addEventListener('click', () => {
    renderMarksChart();
    renderMarksList();
    renderHours();
    updateAvgMarkStat();
    updateTotalTestsStat();
    });

    document.getElementById('editPrenotationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const prenotationId = document.getElementById('editPrenotationId').value;
    const date = document.getElementById('editPrenotationDate').value;
    const startTime = document.getElementById('editPrenotationStartTime').value;
    const endTime = document.getElementById('editPrenotationEndTime').value;

    if (!date || !startTime || !endTime) {
        alert(t('student.errors.selectDateAndTimes'));
        return;
    }

    const selectedTutor = document.querySelector('input[name="editAssignToTutor"]:checked');
    const tutorId = selectedTutor ? parseInt(selectedTutor.value) : null;

    try {
        const response = await fetch(`/api/prenotations/${prenotationId}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            studentId: rawStudent.id,
            startTime: `${date}T${startTime}:00`,
            endTime: `${date}T${endTime}:00`,
            tutorId
        })
        });

        if (response.ok) {
        closeEditPrenotationModal();
        window.location.reload();
        } else {
        const error = await response.json();
        alert(t('calendar.errors.updatePrenotationFailed', { error: error.error || t('calendar.errors.unknownError') }));
        }
    } catch (error) {
        console.error('Error updating prenotation:', error);
        alert(t('calendar.errors.updatePrenotationRetry'));
    }
    });

    // Absent for GUEST accounts, which can't create/modify packs
    const newPackBtn = document.getElementById('newPackBtn');
    if (newPackBtn) newPackBtn.addEventListener('click', () => openNewPackModal());

    document.getElementById('newPackForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const hours = document.getElementById('newPackHours').value;
    const startDate = document.getElementById('newPackStartDate').value;
    const startTime = document.getElementById('newPackStartTime').value;
    if (!hours || parseFloat(hours) <= 0) {
        alert(t('student.errors.invalidHours'));
        return;
    }
    if (!startDate || !startTime) {
        alert(t('student.errors.invalidStartDateTime'));
        return;
    }

    try {
        const response = await fetch('/api/packs', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            studentId: rawStudent.id,
            hours: parseFloat(hours),
            startDate,
            startTime
        })
        });

        if (response.ok) {
        closeNewPackModal();
        window.location.reload();
        } else {
        const error = await response.json();
        alert(t('student.errors.createPackageFailed', { error: error.error || t('calendar.errors.unknownError') }));
        }
    } catch (error) {
        console.error('Error creating package:', error);
        alert(t('student.errors.createPackageRetry'));
    }
    });

    document.getElementById('packsList').addEventListener('click', async (e) => {
    const newPackFromUnassignedBtn = e.target.closest('.new-pack-from-unassigned-btn');
    if (newPackFromUnassignedBtn) {
        const startTimeStr = newPackFromUnassignedBtn.getAttribute('data-new-pack-start');
        openNewPackModal(startTimeStr ? parseAsLocalDate(startTimeStr) : null);
        return;
    }

    const btn = e.target.closest('.close-pack-btn');
    if (!btn) return;

    const packId = btn.getAttribute('data-close-pack-id');
    if (!confirm(t('student.confirm.closePackage'))) return;

    try {
        const response = await fetch(`/api/packs/${packId}/close`, {
        method: 'PUT',
        credentials: 'same-origin'
        });

        if (response.ok) {
        window.location.reload();
        } else {
        const error = await response.json();
        alert(t('student.errors.closePackageFailed', { error: error.error || t('calendar.errors.unknownError') }));
        }
    } catch (error) {
        console.error('Error closing package:', error);
        alert(t('student.errors.closePackageRetry'));
    }
    });
}
