// Student data
const student = {
    firstName: 'Emma',
    lastName: 'Wilson',
    classType: 'S', // M = Middle School, S = Senior High, U = University
};

const classNames = { M: 'Middle School', S: 'Senior High', U: 'University' };
const classColors = {
    M: { text: '#60a5fa', bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.4)' },
    S: { text: '#4ade80', bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.4)' },
    U: { text: '#c084fc', bg: 'rgba(192,132,252,0.15)', border: 'rgba(192,132,252,0.4)' },
};

// Test marks
let evaluations = [
    { id: 1, mark: 6.5, date: '2026-02-10', description: 'Algebra basics test covering linear equations.', testId: 'TST-101' },
    { id: 2, mark: 7,   date: '2026-03-04', description: 'Quadratic functions and factoring assessment.', testId: 'TST-118' },
    { id: 3, mark: 6,   date: '2026-04-12', description: 'Geometry - triangles and circle theorems.', testId: 'TST-133' },
    { id: 4, mark: 8,   date: '2026-05-09', description: 'Trigonometry mid-term evaluation.', testId: 'TST-141' },
    { id: 5, mark: 7.5, date: '2026-06-20', description: 'Functions and limits assessment.', testId: 'TST-150' },
    { id: 6, mark: 9,   date: '2026-07-15', description: 'Final calculus evaluation.', testId: 'TST-162' },
];

// Hours completed per month (key: YYYY-MM)
const hoursByMonth = {
    '2026-02': 6,
    '2026-03': 8,
    '2026-04': 5,
    '2026-05': 9,
    '2026-06': 7,
    '2026-07': 4,
};

// Days that have a lesson (for calendar highlight), key: YYYY-MM-DD
const lessonDays = new Set([
    '2026-07-02', '2026-07-07', '2026-07-09', '2026-07-15', '2026-07-21', '2026-07-28',
]);

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function markColor(mark) {
    if (mark >= 8) return '#14b8a6';
    if (mark >= 6) return '#eab308';
    return '#ef4444';
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

// Calendar starts on the most recent month that has lessons
let calendarDate = new Date('2026-07-01T00:00:00');
const today = new Date();

document.addEventListener('DOMContentLoaded', () => {
    renderProfile();
    renderMarksChart();
    renderMarksList();
    renderHours();
    renderCalendar();
    setupEventListeners();
});

function renderProfile() {
    const initials = (student.firstName[0] + student.lastName[0]).toUpperCase();
    document.getElementById('studentInitials').textContent = initials;
    document.getElementById('studentName').textContent = `${student.firstName} ${student.lastName}`;
    document.getElementById('studentSurnameLabel').textContent = `Surname: ${student.lastName}`;
    document.getElementById('studentClassLabel').textContent = `Class ${student.classType} - ${classNames[student.classType]}`;

    const c = classColors[student.classType];
    const badge = document.getElementById('studentClassBadge');
    badge.textContent = `Class ${student.classType}`;
    badge.style.color = c.text;
    badge.style.background = c.bg;
    badge.style.border = `1px solid ${c.border}`;

    const avg = evaluations.reduce((s, e) => s + e.mark, 0) / evaluations.length;
    const totalHours = Object.values(hoursByMonth).reduce((s, h) => s + h, 0);
    document.getElementById('avgMark').textContent = avg.toFixed(1);
    document.getElementById('avgMark').style.color = markColor(avg);
    document.getElementById('totalTests').textContent = evaluations.length;
    document.getElementById('totalHours').textContent = totalHours + 'h';
    document.getElementById('chartAvg').textContent = avg.toFixed(2);
    document.getElementById('chartAvg').style.color = markColor(avg);
}

function renderMarksChart() {
    const evs = [...evaluations].sort((a, b) => new Date(a.date) - new Date(b.date));
    document.getElementById('marksChart').innerHTML = renderChart(evs);
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

    let runSum = 0;
    const avgPoints = evs.map((e, i) => {
    runSum += e.mark;
    return { x: xFor(i), y: yFor(runSum / (i + 1)) };
    });

    let grid = '';
    for (let m = 0; m <= 10; m += 2) {
    const y = yFor(m);
    grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#2e2e2e" stroke-width="1"/>`;
    grid += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" fill="#a1a1aa" font-size="11">${m}</text>`;
    }

    const markPath = evs.map((e, i) => `${xFor(i)},${yFor(e.mark)}`).join(' ');
    const avgPath = avgPoints.map(p => `${p.x},${p.y}`).join(' ');

    let dots = '';
    let xLabels = '';
    evs.forEach((e, i) => {
    const x = xFor(i), y = yFor(e.mark);
    dots += `<circle class="chart-dot" cx="${x}" cy="${y}" r="5" fill="${markColor(e.mark)}" stroke="#141414" stroke-width="2" onclick="showTestInfo(${e.id})"><title>${e.testId}: ${e.mark}</title></circle>`;
    const d = new Date(e.date + 'T00:00:00');
    xLabels += `<text x="${x}" y="${H - padB + 20}" text-anchor="middle" fill="#a1a1aa" font-size="10">${d.getDate()} ${monthNames[d.getMonth()]}</text>`;
    });

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

function renderMarksList() {
    const container = document.getElementById('marksList');
    const sorted = [...evaluations].sort((a, b) => new Date(b.date) - new Date(a.date));
    document.getElementById('marksCount').textContent = `${sorted.length} test${sorted.length !== 1 ? 's' : ''}`;

    container.innerHTML = sorted.map(ev => `
    <button onclick="showTestInfo(${ev.id})" class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border" style="border-color:${markColor(ev.mark)}30;background:${markColor(ev.mark)}15">
        <span class="text-sm font-bold" style="color:${markColor(ev.mark)}">${ev.mark}</span>
        </div>
        <div class="min-w-0 flex-1">
        <p class="font-medium text-foreground truncate">${ev.testId}</p>
        <p class="text-xs text-muted-foreground truncate">${formatDate(ev.date)}</p>
        </div>
        <svg class="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
    </button>
    `).join('');
}

function renderHours() {
    const container = document.getElementById('hoursChart');
    const keys = Object.keys(hoursByMonth).sort();
    const maxHours = Math.max(...Object.values(hoursByMonth), 1);

    container.innerHTML = keys.map(key => {
    const [year, m] = key.split('-');
    const label = `${monthNames[parseInt(m, 10) - 1]} '${year.slice(2)}`;
    const hours = hoursByMonth[key];
    const pct = (hours / maxHours) * 100;
    return `
        <div>
        <div class="flex items-center justify-between mb-1">
            <span class="text-sm text-muted-foreground">${label}</span>
            <span class="text-sm font-semibold text-foreground">${hours}h</span>
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
    document.getElementById('infoDescription').textContent = ev.description || 'No description provided.';

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
}