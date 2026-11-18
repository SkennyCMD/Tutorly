// Real tutor data (every active GENERIC/STAFF tutor's recurring weekly
// availability, plus STAFF-approved one-off exceptions for specific dates) -
// see window.initialTutors in availability.ejs, built server-side by
// GET /availability in src/index.js.
const tutors = window.initialTutors || [];

// Pending exception_day requests awaiting STAFF review - empty/unused for a
// GENERIC viewer, since the toggle button/list aren't even rendered for them
// (see availability.ejs). Reassigned (not just mutated) when a request is
// approved/refused, so `let` rather than `const`.
let pendingExceptions = window.initialPendingExceptions || [];

const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
let selectedTutorId = tutors.length ? tutors[0].id : null;
let weekStart = getMonday(new Date());
const $ = id => document.getElementById(id);

// Same 48-color per-tutor palette as the Calendar page (calendarScript.js) -
// a tutor gets the same color on both pages, since the hash is purely
// `tutorId % 48`. Kept as a small, dependency-free copy rather than a shared
// import, consistent with how other per-page constants are duplicated across
// this app's plain <script> files (e.g. the .mobile-menu CSS rules).
const TUTOR_COLOR_VAR_COUNT = 48;
function getTutorColorVar(tutorId) {
    const index = Math.abs(Number(tutorId)) % TUTOR_COLOR_VAR_COUNT;
    return `--color-tutor-${index + 1}`;
}

function getMonday(date) {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
}

function dateAtDay(day) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + day);
    return date;
}

function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Parses a "YYYY-MM-DD" string (as returned by the Java API for a LocalDate)
// into a local Date at midnight. New Date("YYYY-MM-DD") parses as UTC instead,
// which can land on the wrong calendar day once converted back to local time
// in timezones behind UTC - building it from the parts avoids that entirely.
function parseDateOnly(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function timeLabel(value) {
    const [h, m] = value.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    return `${h % 12 || 12}${m ? ':' + String(m).padStart(2, '0') : ''} ${suffix}`;
}

// Single entry point for picking a tutor, used by both the day-grouped
// cards and the flat "All Tutors" list below, so selection stays in sync
// across all three UI surfaces (day cards, tutor list, week view).
function selectTutor(tutorId) {
    selectedTutorId = tutorId;
    renderTutorDays();
    renderTutorList();
    renderWeek();
}

function formatWeek() {
    const end = dateAtDay(6);
    const opts = { month: 'short', day: 'numeric' };
    const startText = weekStart.toLocaleDateString('en-US', opts);
    const endText = end.toLocaleDateString('en-US', opts);
    $('weekLabel').textContent = weekStart.getFullYear() === end.getFullYear()
        ? `${startText} – ${endText}, ${end.getFullYear()}`
        : `${startText}, ${weekStart.getFullYear()} – ${endText}, ${end.getFullYear()}`;
}

// "Available tutors by day" - tied to the currently selected week (weekStart/
// dateAtDay()), not a generic recurring weekday view, so a tutor's approved
// exception for one of this week's specific dates correctly adds/removes
// them from that day's list and swaps in their exception hours.
function renderTutorDays() {
    const dayDates = Array.from({ length: 7 }, (_, i) => dateAtDay(i));
    const dayToEntries = Array.from({ length: 7 }, () => []);

    dayDates.forEach(date => {
        const jsDay = date.getDay();
        tutors.forEach(tutor => {
            const { isException, slots } = effectiveSlotsForDate(tutor, date);
            if (slots.length) dayToEntries[jsDay].push({ tutor, slots, isException });
        });
    });

    // Not rendered for a GENERIC viewer (see availability.ejs) - they only
    // ever have one tutor (themselves) in `tutors`, so a count is pointless
    const tutorCountEl = $('tutorCount');
    if (tutorCountEl) tutorCountEl.textContent = `${tutors.length} tutors`;

    const MAX_VISIBLE_TUTORS_PER_DAY = 3;
    // A GENERIC viewer only ever has themselves in `tutors` (see
    // buildTutorAvailability's restrictToTutorId) - the "N available"
    // counter and "No tutors available" wording only make sense when
    // browsing multiple tutors, so STAFF keeps them and GENERIC instead just
    // gets a plain "Absent" on a day they have nothing scheduled.
    const isGeneric = window.userRole === 'GENERIC';

    $('dayList').innerHTML = dayDates.map(date => {
        const jsDay = date.getDay();
        const entries = dayToEntries[jsDay];
        const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const scrollClasses = entries.length > MAX_VISIBLE_TUTORS_PER_DAY
            ? 'max-h-44 overflow-y-auto scrollbar-thin pr-1'
            : '';
        const countBadge = isGeneric ? '' : `<span class="text-xs font-normal text-muted-foreground">${entries.length} available</span>`;
        const emptyText = isGeneric ? 'Absent' : 'No tutors available';
        return `<article class="rounded-xl border border-border bg-card p-4"><h3 class="mb-3 flex items-center justify-between text-sm font-semibold"><span>${weekdayNames[jsDay]} <span class="font-normal text-muted-foreground">${dateLabel}</span></span>${countBadge}</h3>${entries.length ? `<ul class="space-y-2 ${scrollClasses}">${entries.map(({ tutor, slots, isException }) => `<li><button type="button" class="tutor-card flex w-full items-center gap-3 rounded-lg border border-transparent p-2 text-left transition hover:bg-secondary" data-tutor="${tutor.id}" aria-pressed="${tutor.id === selectedTutorId}" aria-label="View ${tutor.name}, available ${slots.map(slot => `${timeLabel(slot.start)} to ${timeLabel(slot.end)}`).join(' and ')}${isException ? ' (exception)' : ''}"><span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold" style="background-color: rgb(var(${getTutorColorVar(tutor.id)}) / 0.15); color: rgb(var(${getTutorColorVar(tutor.id)}))">${tutor.initials}</span><span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium">${tutor.name}</span><span class="block truncate text-xs text-muted-foreground">${slots.map(slot => `${timeLabel(slot.start)}–${timeLabel(slot.end)}`).join(' · ')}${isException ? ` · <span style="color: rgb(var(--color-note))">Exception</span>` : ''}</span></span></button></li>`).join('')}</ul>` : `<p class="py-2 text-sm text-muted-foreground">${emptyText}</p>`}</article>`;
    }).join('');

    document.querySelectorAll('#dayList .tutor-card').forEach(button => button.addEventListener('click', () => {
        // data-tutor is always a string; tutor.id is a real DB number - must
        // convert, or the === comparisons in aria-pressed/renderWeek() below
        // silently never match again after the first click
        selectTutor(Number(button.dataset.tutor));
    }));
}

// Flat list of every tutor (unlike #dayList, not grouped/limited by day) -
// clicking one shows their full week below, same as clicking them from a day
// card. Not rendered for a GENERIC viewer (see availability.ejs) - they only
// ever have one tutor (themselves) in `tutors`, so there's nothing to list.
function renderTutorList() {
    const list = $('tutorList');
    if (!list) return;

    list.innerHTML = tutors.map(tutor => `<button type="button" class="tutor-card flex items-center gap-2 rounded-full border border-transparent bg-secondary py-1.5 pl-1.5 pr-3 text-left transition hover:bg-secondary/70" data-tutor="${tutor.id}" aria-pressed="${tutor.id === selectedTutorId}" aria-label="View ${tutor.name}'s weekly availability"><span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold" style="background-color: rgb(var(${getTutorColorVar(tutor.id)}) / 0.15); color: rgb(var(${getTutorColorVar(tutor.id)}))">${tutor.initials}</span><span class="text-sm font-medium text-foreground">${tutor.name}</span></button>`).join('');

    document.querySelectorAll('#tutorList .tutor-card').forEach(button => button.addEventListener('click', () => {
        selectTutor(Number(button.dataset.tutor));
    }));
}

// Resolves what a tutor's schedule actually looks like on one specific date:
// an approved exception for that exact date (if any) fully overrides the
// regular weekly schedule - "absent" clears it, "present" swaps in the
// exception's own time range instead. Shared by both the week view
// (scheduleMarkup) and the day cards (renderTutorDays), so they always agree
// on the same week's data.
function effectiveSlotsForDate(tutor, date) {
    const exception = tutor.exceptions[dateKey(date)];
    if (exception) {
        // No `id` - an exception override has no availability row behind it
        // to edit/delete, unlike a regular slot below.
        return {
            isException: true,
            isAbsentException: exception.type === 'absent',
            slots: exception.type === 'present' ? [{ id: null, start: exception.startTime, end: exception.endTime }] : []
        };
    }
    return { isException: false, isAbsentException: false, slots: tutor.days[date.getDay()] || [] };
}

// Renders one day's cell for a tutor in the week view - always styled/labeled
// distinctly when an exception applies, so it's clear this day differs from
// the tutor's routine rather than just reading as a normal slot or a plain
// "no schedule" day.
function scheduleMarkup(tutor, date) {
    const { isException, isAbsentException, slots } = effectiveSlotsForDate(tutor, date);

    if (isAbsentException) {
        return `<div class="exception-block exception-absent mt-3 rounded-md px-2 py-2 text-xs font-medium"><span class="block">Unavailable</span><span class="mt-0.5 block text-[10px] opacity-80">Exception</span></div>`;
    }

    if (!slots.length) {
        return `<p class="mt-3 text-xs text-muted-foreground">Unavailable</p>`;
    }

    const blockClass = isException ? 'exception-block exception-present' : 'availability-block';
    const label = isException ? ' · Exception' : '';
    // Only a regular weekly slot can be edited/deleted here (an exception
    // override has no availability row behind it), and only for STAFF, who
    // are the only ones who can create one in the first place (see
    // openAddAvailabilityModal). This only decides whether to show the
    // affordance - the real enforcement is server-side on PUT/DELETE
    // /api/availability/:id.
    const isEditable = !isException && window.userRole === 'STAFF';
    const isoWeekDay = date.getDay() === 0 ? 7 : date.getDay();

    return `<div class="mt-3 space-y-2">${slots.map(slot => {
        const clickableClass = isEditable ? ' cursor-pointer hover:opacity-80 transition' : '';
        const clickableAttrs = isEditable
            ? ` role="button" tabindex="0" data-availability-id="${slot.id}" data-week-day="${isoWeekDay}" data-start-time="${slot.start}" data-end-time="${slot.end}" data-tutor-name="${tutor.name}" onclick="openEditAvailabilityModal(this)"`
            : '';
        return `<div class="${blockClass}${clickableClass} rounded-md px-2 py-2 text-xs font-medium"${clickableAttrs}><span class="block">${timeLabel(slot.start)} – ${timeLabel(slot.end)}</span><span class="mt-0.5 block text-[10px] opacity-70">${slot.start}–${slot.end}${label}</span></div>`;
    }).join('')}</div>`;
}

function renderWeek() {
    const tutor = tutors.find(item => item.id === selectedTutorId) || tutors[0];
    if (!tutor) {
        $('selectedTutorLabel').textContent = '';
        formatWeek();
        $('desktopWeek').innerHTML = '';
        $('mobileWeek').innerHTML = '';
        return;
    }

    $('selectedTutorLabel').textContent = tutor.name;
    formatWeek();

    $('desktopWeek').innerHTML = Array.from({ length: 7 }, (_, i) => {
        const date = dateAtDay(i);
        return `<section class="min-h-[220px] border-r border-border p-2 last:border-r-0 sm:p-3"><div class="border-b border-border pb-2 text-center"><p class="text-xs text-muted-foreground">${shortDays[(i + 1) % 7]}</p><p class="mt-1 text-sm font-semibold">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p></div>${scheduleMarkup(tutor, date)}</section>`;
    }).join('');

    $('mobileWeek').innerHTML = Array.from({ length: 7 }, (_, i) => {
        const date = dateAtDay(i);
        return `<section class="rounded-xl border border-border p-3"><div class="flex items-center justify-between"><h3 class="text-sm font-semibold">${weekdayNames[date.getDay()]}</h3><span class="text-xs text-muted-foreground">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></div>${scheduleMarkup(tutor, date)}</section>`;
    }).join('');
}

function setMenu(open) {
    $('mobileMenu').classList.toggle('open', open);
    $('menuOverlay').classList.toggle('hidden', !open);
    $('menuToggle').setAttribute('aria-expanded', String(open));
}

$('menuToggle').addEventListener('click', () => setMenu(true));
$('closeMenu').addEventListener('click', () => setMenu(false));
$('menuOverlay').addEventListener('click', () => setMenu(false));

// renderTutorDays() is re-run alongside renderWeek() on every week change too
// - the day cards are tied to this week's actual dates, not a generic
// recurring weekday view, so they need to pick up that week's exceptions.
$('prevWeek').addEventListener('click', () => {
    weekStart.setDate(weekStart.getDate() - 7);
    renderTutorDays();
    renderWeek();
});
$('nextWeek').addEventListener('click', () => {
    weekStart.setDate(weekStart.getDate() + 7);
    renderTutorDays();
    renderWeek();
});
$('todayButton').addEventListener('click', () => {
    weekStart = getMonday(new Date());
    renderTutorDays();
    renderWeek();
});

// Add Availability (STAFF only - button isn't even rendered for GENERIC, see
// availability.ejs, but the real enforcement is server-side on POST /api/availability)
function openAddAvailabilityModal() {
    $('addAvailabilityModal').classList.add('open');
}

function closeAddAvailabilityModal() {
    $('addAvailabilityModal').classList.remove('open');
    $('addAvailabilityForm').reset();
}

const addAvailabilityBtn = $('addAvailabilityBtn');
if (addAvailabilityBtn) addAvailabilityBtn.addEventListener('click', openAddAvailabilityModal);

const addAvailabilityForm = $('addAvailabilityForm');
if (addAvailabilityForm) {
    addAvailabilityForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const tutorId = $('availabilityTutor').value;
        const weekDay = $('availabilityWeekDay').value;
        const startTime = $('availabilityStartTime').value;
        const endTime = $('availabilityEndTime').value;

        if (!tutorId) {
            alert('Please select a tutor.');
            return;
        }
        if (startTime >= endTime) {
            alert('End time must be after start time.');
            return;
        }

        try {
            const response = await fetch('/api/availability', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tutorId, weekDay, startTime, endTime })
            });

            if (response.ok) {
                closeAddAvailabilityModal();
                window.location.reload();
            } else {
                const error = await response.json();
                alert(`Failed to create availability slot: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error creating availability slot:', error);
            alert('Failed to create availability slot. Please try again.');
        }
    });
}

// Edit/Delete Availability (STAFF only - clicking a regular slot in the week
// view below isn't even wired up for GENERIC, see isEditable in
// scheduleMarkup(); the real enforcement is server-side on PUT/DELETE
// /api/availability/:id). Opened from the slot's own data attributes rather
// than passing them as inline onclick() arguments, so a tutor name
// containing a quote/apostrophe can't break the generated markup.
function openEditAvailabilityModal(el) {
    const { availabilityId, weekDay, startTime, endTime, tutorName } = el.dataset;
    $('editAvailabilityId').value = availabilityId;
    $('editAvailabilityTutorName').textContent = tutorName;
    $('editAvailabilityWeekDay').value = weekDay;
    $('editAvailabilityStartTime').value = startTime;
    $('editAvailabilityEndTime').value = endTime;
    $('editAvailabilityModal').classList.add('open');
}

function closeEditAvailabilityModal() {
    $('editAvailabilityModal').classList.remove('open');
}

const editAvailabilityForm = $('editAvailabilityForm');
if (editAvailabilityForm) {
    editAvailabilityForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = $('editAvailabilityId').value;
        const weekDay = $('editAvailabilityWeekDay').value;
        const startTime = $('editAvailabilityStartTime').value;
        const endTime = $('editAvailabilityEndTime').value;

        if (startTime >= endTime) {
            alert('End time must be after start time.');
            return;
        }

        try {
            const response = await fetch(`/api/availability/${id}`, {
                method: 'PUT',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weekDay, startTime, endTime })
            });

            if (response.ok) {
                closeEditAvailabilityModal();
                window.location.reload();
            } else {
                const error = await response.json();
                alert(`Failed to update availability slot: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating availability slot:', error);
            alert('Failed to update availability slot. Please try again.');
        }
    });
}

const deleteAvailabilityBtn = $('deleteAvailabilityBtn');
if (deleteAvailabilityBtn) {
    deleteAvailabilityBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete this availability slot?')) return;

        const id = $('editAvailabilityId').value;

        try {
            const response = await fetch(`/api/availability/${id}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });

            if (response.ok) {
                closeEditAvailabilityModal();
                window.location.reload();
            } else {
                const error = await response.json();
                alert(`Failed to delete availability slot: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting availability slot:', error);
            alert('Failed to delete availability slot. Please try again.');
        }
    });
}

// Add Exception - Present/Absent (STAFF + GENERIC) - one shared modal, the
// clicked button's type decides which fields are shown and what gets submitted
function openAddExceptionModal(type) {
    $('exceptionType').value = type;
    $('addExceptionModalTitle').textContent = type === 'present' ? 'Add Presence' : 'Add Absence';
    $('exceptionTimeFields').classList.toggle('hidden', type !== 'present');
    $('exceptionStartTime').required = type === 'present';
    $('exceptionEndTime').required = type === 'present';
    $('addExceptionModal').classList.add('open');
}

function closeAddExceptionModal() {
    $('addExceptionModal').classList.remove('open');
    $('addExceptionForm').reset();
}

const addPresentExceptionBtn = $('addPresentExceptionBtn');
if (addPresentExceptionBtn) addPresentExceptionBtn.addEventListener('click', () => openAddExceptionModal('present'));

const addAbsentExceptionBtn = $('addAbsentExceptionBtn');
if (addAbsentExceptionBtn) addAbsentExceptionBtn.addEventListener('click', () => openAddExceptionModal('absent'));

const addExceptionForm = $('addExceptionForm');
if (addExceptionForm) {
    addExceptionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const type = $('exceptionType').value;
        const day = $('exceptionDay').value;
        const startTime = $('exceptionStartTime').value;
        const endTime = $('exceptionEndTime').value;

        if (!day) {
            alert('Please select a date.');
            return;
        }
        if (type === 'present' && (!startTime || !endTime || startTime >= endTime)) {
            alert('Please enter a valid start/end time.');
            return;
        }

        try {
            const response = await fetch('/api/exception-days', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, day, startTime: type === 'present' ? startTime : undefined, endTime: type === 'present' ? endTime : undefined })
            });

            if (response.ok) {
                closeAddExceptionModal();
                window.location.reload();
            } else {
                const error = await response.json();
                alert(`Failed to submit exception: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error submitting exception day:', error);
            alert('Failed to submit exception. Please try again.');
        }
    });
}

// Pending Requests toggle + list (STAFF only - the button/list markup isn't
// even rendered for a GENERIC viewer, see availability.ejs)
function renderPendingExceptions() {
    const list = $('pendingList');
    if (!list) return;

    $('pendingCount').textContent = pendingExceptions.length;

    if (pendingExceptions.length === 0) {
        list.innerHTML = `<p class="text-sm text-muted-foreground">No pending requests.</p>`;
        return;
    }

    const isStaff = window.userRole === 'STAFF';

    list.innerHTML = pendingExceptions.map(exception => {
        const borderClass = exception.type === 'present' ? 'border-green-600' : 'border-destructive';
        const weekday = weekdayNames[parseDateOnly(exception.day).getDay()];
        // STAFF can approve/refuse any request; GENERIC only ever sees their
        // own here (see restrictToTutorId in src/index.js) and read-only - no
        // reviewing their own request
        const actions = isStaff
            ? `<div class="flex items-center gap-2 shrink-0">
                <button type="button" class="approve-exception-btn p-2 rounded-lg text-green-600 hover:bg-green-600/10 transition-colors" data-exception-id="${exception.id}" aria-label="Approve">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                </button>
                <button type="button" class="refuse-exception-btn p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors" data-exception-id="${exception.id}" aria-label="Refuse">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>`
            : `<span class="shrink-0 text-xs font-medium text-muted-foreground">Pending</span>`;
        return `
        <div class="flex items-center justify-between gap-3 rounded-lg border-2 ${borderClass} bg-card p-3 min-w-[240px]">
            <div class="min-w-0">
                <p class="text-sm font-medium text-foreground">${exception.tutorName}</p>
                <p class="text-xs text-muted-foreground">${exception.type === 'present' ? 'Presence' : 'Absence'} · ${exception.day} (${weekday})${exception.type === 'present' ? ` · ${timeLabel(exception.startTime)} – ${timeLabel(exception.endTime)}` : ''}</p>
            </div>
            ${actions}
        </div>
    `;
    }).join('');

    document.querySelectorAll('.approve-exception-btn').forEach(button => button.addEventListener('click', () => {
        reviewPendingException(button.dataset.exceptionId, 'approve');
    }));
    document.querySelectorAll('.refuse-exception-btn').forEach(button => button.addEventListener('click', () => {
        reviewPendingException(button.dataset.exceptionId, 'refuse');
    }));
}

async function reviewPendingException(id, action) {
    if (!confirm(`Are you sure you want to ${action} this request?`)) return;

    const numericId = Number(id);

    try {
        const response = await fetch(`/api/exception-days/${id}/${action}`, {
            method: 'PUT',
            credentials: 'same-origin'
        });

        if (response.ok) {
            const result = await response.json();

            // No page reload: drop it from the pending list, and if it was
            // approved, patch the matching tutor's exceptions in place so the
            // day cards/week view pick it up immediately
            pendingExceptions = pendingExceptions.filter(exception => exception.id !== numericId);

            if (action === 'approve' && result.exception) {
                const tutor = tutors.find(item => item.id === result.exception.tutorId);
                if (tutor) {
                    tutor.exceptions[result.exception.day] = {
                        type: result.exception.type,
                        startTime: result.exception.startTime ? result.exception.startTime.slice(0, 5) : null,
                        endTime: result.exception.endTime ? result.exception.endTime.slice(0, 5) : null
                    };
                }
            }

            renderPendingExceptions();
            renderTutorDays();
            renderWeek();
        } else {
            const error = await response.json();
            alert(`Failed to ${action} request: ${error.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error(`Error ${action}ing pending exception:`, error);
        alert(`Failed to ${action} request. Please try again.`);
    }
}

const togglePendingBtn = $('togglePendingBtn');
if (togglePendingBtn) {
    togglePendingBtn.addEventListener('click', () => {
        $('pendingList').classList.toggle('hidden');
        $('pendingChevron').classList.toggle('rotate-180');
    });
}

// Delete All Availability (STAFF only - button/modal aren't even rendered
// for GENERIC, see availability.ejs). Must match the server's own check in
// index.js exactly - kept here purely to drive the submit button's
// disabled state, since the server re-validates it regardless and a
// mismatch there is the only thing that actually stops the deletion.
const DELETE_ALL_CONFIRM_TEXT = 'DELETE ALL';

function openDeleteAllAvailabilityModal() {
    $('deleteAllAvailabilityModal').classList.add('open');
}

function closeDeleteAllAvailabilityModal() {
    $('deleteAllAvailabilityModal').classList.remove('open');
    $('deleteAllAvailabilityForm').reset();
    $('confirmDeleteAllAvailabilityBtn').disabled = true;
}

const deleteAllAvailabilityBtn = $('deleteAllAvailabilityBtn');
if (deleteAllAvailabilityBtn) deleteAllAvailabilityBtn.addEventListener('click', openDeleteAllAvailabilityModal);

const deleteAllAvailabilityConfirmText = $('deleteAllAvailabilityConfirmText');
if (deleteAllAvailabilityConfirmText) {
    deleteAllAvailabilityConfirmText.addEventListener('input', () => {
        $('confirmDeleteAllAvailabilityBtn').disabled = deleteAllAvailabilityConfirmText.value !== DELETE_ALL_CONFIRM_TEXT;
    });
}

const deleteAllAvailabilityForm = $('deleteAllAvailabilityForm');
if (deleteAllAvailabilityForm) {
    deleteAllAvailabilityForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const confirmText = $('deleteAllAvailabilityConfirmText').value;
        if (confirmText !== DELETE_ALL_CONFIRM_TEXT) return;

        try {
            const response = await fetch('/api/availability', {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmText })
            });

            if (response.ok) {
                closeDeleteAllAvailabilityModal();
                window.location.reload();
            } else {
                const error = await response.json();
                alert(`Failed to delete all availability: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting all availability:', error);
            alert('Failed to delete all availability. Please try again.');
        }
    });
}

renderTutorDays();
renderTutorList();
renderPendingExceptions();
renderWeek();
