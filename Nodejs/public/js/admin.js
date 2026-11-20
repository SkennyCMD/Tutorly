/**
 *
 * Admin Panel - Tutor & Student Management
 *
 * 
 * Administrative interface for managing tutors and students.
 * 
 * Features:
 * - View and search tutors/students
 * - Toggle tutor roles (STAFF/GENERIC)
 * - Block/unblock tutor accounts
 * - Change student class levels (M/S/U)
 * - Rename a student directly from the list
 * - Flag groups of possibly-duplicate students (same name/surname/class/description)
 *   and merge them (lessons/prenotations/tests/packs reassigned, duplicates deleted)
 * - Create new tutor accounts with password validation
 * - Track recently created tutors
 * - Mobile-responsive menu
 * 
 * User Roles:
 * - STAFF: Elevated tutor privileges
 * - GENERIC: Standard tutor role
 * 
 * Student Classes:
 * - M: Middle School
 * - S: High School (Superiori)
 * - U: University
 * 
 * Security:
 * - Password strength validation (length, uppercase, numbers, special chars)
 * - Password confirmation matching
 * - Confirmation modals for destructive actions
 * 
 * Dependencies:
 * - Requires authenticated admin session
 * - Backend API endpoints: /api/admin/tutors, /api/admin/students
 *
 */


// Global State


// Reads from window.translations/window.t, injected by admin.ejs (see public/js/i18n.js)
const translate = window.t || (key => key);

// Array of all tutor objects
let tutors = [];

// Array of all student objects
let students = [];

// Array of all guest (GUEST role) account objects
let guests = [];

// Recently created tutors (max 3) for display
let recentlyCreated = [];

// Pending action to execute when confirmation modal is confirmed
let pendingAction = null;


// Initialization


/**
 * Initialize the admin panel on page load.
 * 
 * - Loads all tutors from API
 * - Loads all students from API
 * - Sets up all event listeners
 */
document.addEventListener('DOMContentLoaded', () => {
    loadTutors();
    loadStudents();
    loadGuests();
    setupEventListeners();
});


// API Data Loading


/**
 * Load all tutors from backend API.
 * 
 * Fetches tutor data and renders the tutor list.
 * Shows error toast if request fails.
 */
async function loadTutors() {
    try {
        const response = await fetch('/api/admin/tutors', { credentials: 'same-origin' });
        if (response.ok) {
            tutors = await response.json();
            renderTutors();
        } else {
            showToast(translate('admin.loadTutorsFailed'), 'error');
        }
    } catch (error) {
        console.error('Error loading tutors:', error);
        showToast(translate('admin.loadTutorsError'), 'error');
    }
}

/**
 * Load all students from backend API.
 * 
 * Fetches student data and renders the student list.
 * Shows error toast if request fails.
 */
async function loadStudents() {
    try {
        const response = await fetch('/api/admin/students', { credentials: 'same-origin' });
        if (response.ok) {
            students = await response.json();
            renderStudents();
        } else {
            showToast(translate('admin.loadStudentsFailed'), 'error');
        }
    } catch (error) {
        console.error('Error loading students:', error);
        showToast(translate('admin.loadStudentsError'), 'error');
    }
}

/**
 * Load all guest (GUEST role) accounts from backend API.
 *
 * Fetches guest account data and renders the guest list.
 * Shows error toast if request fails.
 */
async function loadGuests() {
    try {
        const response = await fetch('/api/admin/guests', { credentials: 'same-origin' });
        if (response.ok) {
            guests = await response.json();
            renderGuests();
        } else {
            showToast(translate('admin.loadGuestsFailed'), 'error');
        }
    } catch (error) {
        console.error('Error loading guest accounts:', error);
        showToast(translate('admin.loadGuestsError'), 'error');
    }
}


// Event Listeners Setup


/**
 * Set up all event listeners for the admin panel.
 * 
 * Handles:
 * - Mobile menu toggle
 * - Search inputs for filtering
 * - Create tutor form submission
 * - Password visibility toggle
 * - Password strength indicator
 * - Password confirmation matching
 */
function setupEventListeners() {
    // Mobile menu toggle - open sidebar
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('mobileMenu').classList.add('open');
        document.getElementById('menuOverlay').classList.remove('hidden');
    });

    // Mobile menu - close button
    document.getElementById('closeMenu').addEventListener('click', closeMenuFn);

    // Mobile menu - click outside to close
    document.getElementById('menuOverlay').addEventListener('click', closeMenuFn);

    // Search filters - real-time filtering of tutors, students, and guest accounts
    document.getElementById('tutorSearch').addEventListener('input', renderTutors);
    document.getElementById('studentSearch').addEventListener('input', renderStudents);
    document.getElementById('guestSearch').addEventListener('input', renderGuests);

    // Create tutor form submission
    document.getElementById('createTutorForm').addEventListener('submit', handleCreateTutor);

    // Create guest form submission
    document.getElementById('createGuestForm').addEventListener('submit', handleCreateGuest);

    // Guest detail modal: profile edit form + assign-student button
    document.getElementById('editGuestForm').addEventListener('submit', handleEditGuestProfile);
    document.getElementById('assignStudentBtn').addEventListener('click', assignSelectedStudent);
    document.getElementById('assignStudentSearch').addEventListener('input', filterUnassignedStudentsSelect);

    // Guest edit form: new-password visibility toggle (eye icon)
    document.getElementById('toggleEditGuestPassword').addEventListener('click', () => {
        const input = document.getElementById('editGuestPassword');
        const icon = document.getElementById('editGuestEyeIcon');

        if (input.type === 'password') {
            input.type = 'text';
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18"/>';
        } else {
            input.type = 'password';
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>';
        }
    });

    // Guest edit form: confirm new-password matching indicator
    document.getElementById('confirmEditGuestPassword').addEventListener('input', (e) => {
        const match = document.getElementById('editGuestPasswordMatch');
        const pw = document.getElementById('editGuestPassword').value;

        if (e.target.value.length === 0) { match.classList.add('hidden'); return; }

        match.classList.remove('hidden');

        if (e.target.value === pw) {
            match.textContent = translate('admin.passwordsMatch');
            match.className = 'text-xs mt-1 text-primary';
        } else {
            match.textContent = translate('admin.passwordsDoNotMatch');
            match.className = 'text-xs mt-1 text-destructive';
        }
    });

    // Password visibility toggle (eye icon)
    document.getElementById('togglePassword').addEventListener('click', () => {
        const input = document.getElementById('newPassword');
        const icon = document.getElementById('eyeIcon');

        // Toggle between password and text type
        if (input.type === 'password') {
            // Show password - change to eye-off icon
            input.type = 'text';
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18"/>';
        } else {
            // Hide password - change to eye icon
            input.type = 'password';
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>';
        }
    });

    // Password strength indicator (updates as user types)
    document.getElementById('newPassword').addEventListener('input', (e) => {
        const val = e.target.value;
        const container = document.getElementById('passwordStrength');

        // Hide if empty
        if (val.length === 0) { container.classList.add('hidden'); return; }

        container.classList.remove('hidden');

        // Calculate strength score (0-4)
        let score = 0;
        if (val.length >= 8) score++;          // Length check
        if (/[A-Z]/.test(val)) score++;        // Has uppercase
        if (/[0-9]/.test(val)) score++;        // Has digit
        if (/[^A-Za-z0-9]/.test(val)) score++; // Has special character

        // Color and label based on score
        const colors = ['bg-destructive', 'bg-orange-500', 'bg-yellow-500', 'bg-primary'];
        const labels = [translate('admin.strengthWeak'), translate('admin.strengthFair'), translate('admin.strengthGood'), translate('admin.strengthStrong')];

        // Update strength bars
        for (let i = 1; i <= 4; i++) {
            const el = document.getElementById('str' + i);
            el.className = 'h-1 flex-1 rounded-full ' + (i <= score ? colors[score - 1] : 'bg-border');
        }

        // Update label text
        document.getElementById('strengthText').textContent = labels[score - 1] || '';
    });

    // Confirm password matching indicator
    document.getElementById('confirmPassword').addEventListener('input', (e) => {
        const match = document.getElementById('passwordMatch');
        const pw = document.getElementById('newPassword').value;

        // Hide if empty
        if (e.target.value.length === 0) { match.classList.add('hidden'); return; }

        match.classList.remove('hidden');

        // Check if passwords match
        if (e.target.value === pw) {
            match.textContent = translate('admin.passwordsMatch');
            match.className = 'text-xs mt-1 text-primary';
        } else {
            match.textContent = translate('admin.passwordsDoNotMatch');
            match.className = 'text-xs mt-1 text-destructive';
        }
    });

    // Guest form: password visibility toggle (eye icon)
    document.getElementById('toggleGuestPassword').addEventListener('click', () => {
        const input = document.getElementById('newGuestPassword');
        const icon = document.getElementById('guestEyeIcon');

        if (input.type === 'password') {
            input.type = 'text';
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18"/>';
        } else {
            input.type = 'password';
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>';
        }
    });

    // Guest form: confirm password matching indicator
    document.getElementById('confirmGuestPassword').addEventListener('input', (e) => {
        const match = document.getElementById('guestPasswordMatch');
        const pw = document.getElementById('newGuestPassword').value;

        if (e.target.value.length === 0) { match.classList.add('hidden'); return; }

        match.classList.remove('hidden');

        if (e.target.value === pw) {
            match.textContent = translate('admin.passwordsMatch');
            match.className = 'text-xs mt-1 text-primary';
        } else {
            match.textContent = translate('admin.passwordsDoNotMatch');
            match.className = 'text-xs mt-1 text-destructive';
        }
    });
}

/**
 * Close the mobile menu.
 * 
 * Removes 'open' class from menu and shows overlay again.
 */
function closeMenuFn() {
    document.getElementById('mobileMenu').classList.remove('open');
    document.getElementById('menuOverlay').classList.add('hidden');
}


// Tutors List Rendering


/**
 * Render the tutors list with search filtering.
 * 
 * - Filters tutors based on search input
 * - Updates tutor count display
 * - Shows role badges (STAFF/GENERIC)
 * - Shows blocked status
 * - Provides role change and block/unblock buttons
 */
function renderTutors() {
    // Get search term and filter tutors
    const search = document.getElementById('tutorSearch').value.toLowerCase();
    const filtered = tutors.filter(t => t.username.toLowerCase().includes(search));

    // Update count display
    document.getElementById('tutorCount').textContent = translate(filtered.length === 1 ? 'admin.tutorCount' : 'admin.tutorCountPlural', { count: filtered.length });

    const container = document.getElementById('tutorsList');

    // Show empty state if no results
    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-sm text-muted-foreground py-4 text-center">${translate('admin.noTutorsFound')}</p>`;
        return;
    }

    // Generate HTML for each tutor card
    container.innerHTML = filtered.map(t => {
        const isBlocked = t.status === 'BLOCKED';
        const isErased = !!t.anonymizedAt;
        return `
        <div class="p-3 border border-border rounded-lg ${isBlocked || isErased ? 'opacity-60' : ''}">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-9 h-9 ${isBlocked ? 'bg-destructive/20' : 'bg-secondary'} rounded-full flex items-center justify-center flex-shrink-0">
                    <span class="text-sm font-medium ${isBlocked ? 'text-destructive' : 'text-foreground'}">${t.username.charAt(0).toUpperCase()}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-foreground truncate">${t.username}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-xs px-1.5 py-0.5 rounded ${t.role === 'STAFF' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}">${t.role}</span>
                        ${isBlocked ? `<span class="text-xs px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">${translate('admin.blockedBadge')}</span>` : ''}
                        ${isErased ? `<span class="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">${translate('admin.erasedBadge')}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="confirmRoleChange(${t.id})" class="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-secondary transition-colors ${isBlocked || isErased ? 'pointer-events-none opacity-50' : ''}">
                    ${translate('admin.setRolePrefix')} ${t.role === 'STAFF' ? 'GENERIC' : 'STAFF'}
                </button>
                <button onclick="confirmBlockToggle(${t.id})" class="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isErased ? 'pointer-events-none opacity-50' : ''} ${isBlocked ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-destructive/20 text-destructive hover:bg-destructive/30'}">
                    ${isBlocked ? translate('admin.unblockButton') : translate('admin.blockButton')}
                </button>
            </div>
            <button onclick="confirmTutorErasure(${t.id})" class="w-full mt-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors ${isErased ? 'pointer-events-none opacity-50' : ''}">
                ${translate('admin.eraseGdprButton')}
            </button>
        </div>
        `;
    }).join('');
}


// Students List Rendering


/**
 * Render the students list with search filtering.
 * 
 * - Filters students based on search input (name + surname)
 * - Updates student count display
 * - Shows class dropdown for each student (M/S/U)
 * - Allows inline class change
 */
function renderStudents() {
    // Get search term and filter by full name
    const search = document.getElementById('studentSearch').value.toLowerCase();
    const filtered = students.filter(s => `${s.name} ${s.surname}`.toLowerCase().includes(search));

    // Update count display
    document.getElementById('studentCount').textContent = translate(filtered.length === 1 ? 'admin.studentCount' : 'admin.studentCountPlural', { count: filtered.length });

    const container = document.getElementById('studentsList');

    // Show empty state if no results
    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-sm text-muted-foreground py-4 text-center">${translate('admin.noStudentsFound')}</p>`;
        return;
    }

    // Generate HTML for each student card with inline-editable name/surname and class dropdown
    container.innerHTML = filtered.map(s => {
        const isErased = !!s.anonymizedAt;
        return `
        <div class="flex items-center gap-3 p-3 border border-border rounded-lg ${isErased ? 'opacity-60' : ''}">
            <div class="w-9 h-9 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-sm font-medium text-foreground">${s.name.charAt(0)}${s.surname.charAt(0)}</span>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1 -ml-1.5">
                    <input type="text" data-student-id="${s.id}" data-field="name" onblur="changeStudentName(${s.id})" ${isErased ? 'disabled' : ''}
                        class="w-20 sm:w-28 min-w-0 px-1.5 py-0.5 bg-transparent border border-transparent rounded text-sm font-medium text-foreground truncate hover:border-border focus:bg-secondary focus:border-border focus:outline-none ${isErased ? 'opacity-50' : ''}">
                    <input type="text" data-student-id="${s.id}" data-field="surname" onblur="changeStudentName(${s.id})" ${isErased ? 'disabled' : ''}
                        class="w-20 sm:w-28 min-w-0 px-1.5 py-0.5 bg-transparent border border-transparent rounded text-sm font-medium text-foreground truncate hover:border-border focus:bg-secondary focus:border-border focus:outline-none ${isErased ? 'opacity-50' : ''}">
                </div>
                ${isErased ? `<span class="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">${translate('admin.erasedBadge')}</span>` : ''}
            </div>
            <select onchange="changeStudentClass(${s.id}, this.value)" class="px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer ${isErased ? 'pointer-events-none opacity-50' : ''}">
                <option value="M" ${s.studentClass === 'M' ? 'selected' : ''}>M</option>
                <option value="S" ${s.studentClass === 'S' ? 'selected' : ''}>S</option>
                <option value="U" ${s.studentClass === 'U' ? 'selected' : ''}>U</option>
            </select>
            <button onclick="confirmStudentErasure(${s.id})" class="px-3 py-1.5 text-xs font-medium rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors ${isErased ? 'pointer-events-none opacity-50' : ''}">
                ${translate('admin.eraseButton')}
            </button>
        </div>
    `;
    }).join('');

    // Set input values via the DOM property, not an HTML attribute in the template above -
    // a name/surname containing a `"` would otherwise break out of the value="..." attribute.
    container.querySelectorAll('input[data-field="name"]').forEach(input => {
        const student = students.find(s => s.id === Number(input.dataset.studentId));
        if (student) input.value = student.name;
    });
    container.querySelectorAll('input[data-field="surname"]').forEach(input => {
        const student = students.find(s => s.id === Number(input.dataset.studentId));
        if (student) input.value = student.surname;
    });

    renderDuplicateStudents();
}


// Duplicate Students Detection


/**
 * Render the "Possible Duplicate Students" list: groups of non-erased
 * students that share the same name, surname, class, and description -
 * likely the same student entered more than once by mistake.
 *
 * Re-run every time renderStudents() runs, so it stays in sync with every
 * students mutation (load, rename, class change, erasure) without a
 * separate refresh call at each of those sites.
 */
function renderDuplicateStudents() {
    const container = document.getElementById('duplicateStudentsList');
    const countEl = document.getElementById('duplicateStudentsCount');
    if (!container || !countEl) return;

    // Erased students are scrubbed (name "Erased", description null) - matching
    // on that scrubbed state would be meaningless noise, not a real duplicate.
    const groups = new Map();
    students.filter(s => !s.anonymizedAt).forEach(s => {
        const key = `${s.name}|${s.surname}|${s.studentClass || ''}|${s.description || ''}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(s);
    });

    const duplicateGroups = [...groups.values()].filter(group => group.length > 1);

    countEl.textContent = translate(duplicateGroups.length === 1 ? 'admin.groupCount' : 'admin.groupCountPlural', { count: duplicateGroups.length });

    if (duplicateGroups.length === 0) {
        container.innerHTML = `<p class="text-sm text-muted-foreground py-4 text-center">${translate('admin.noDuplicatesFound')}</p>`;
        return;
    }

    container.innerHTML = duplicateGroups.map(group => {
        // Lowest id is the one kept - matches the pattern the user's own merge
        // SQL already used (MIN(id)), and avoids a modal/picker for something
        // that's otherwise an arbitrary tie-break.
        const sorted = [...group].sort((a, b) => a.id - b.id);
        const keep = sorted[0];
        const mergeIds = sorted.slice(1).map(s => s.id);
        return `
        <div class="border border-border rounded-lg p-3">
            <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium text-foreground">${keep.name} ${keep.surname} <span class="text-muted-foreground font-normal">- ${translate('admin.classPrefix')} ${keep.studentClass || '—'}</span></p>
                <span class="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">${group.length} ${translate('admin.studentsCountSuffix')}</span>
            </div>
            ${keep.description ? `<p class="text-xs text-muted-foreground mb-2 truncate">${keep.description}</p>` : ''}
            <div class="flex flex-wrap items-center gap-2">
                ${sorted.map(s => `<span class="text-xs px-2 py-1 rounded-lg bg-secondary text-foreground">#${s.id}${s.id === keep.id ? ` (${translate('admin.keptBadge')})` : ''}</span>`).join('')}
                <button onclick='mergeDuplicateGroup(${keep.id}, ${JSON.stringify(mergeIds)})' class="ml-auto px-3 py-1.5 text-xs font-medium rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors">
                    ${translate('admin.mergeIntoPrefix')}${keep.id}
                </button>
            </div>
        </div>
    `;
    }).join('');
}

/**
 * Merge every duplicate in `mergeIds` into `keepId`, one at a time: each
 * duplicate's lessons, prenotations, tests, and lesson packages are
 * reassigned to `keepId` and the duplicate is then permanently deleted
 * (not anonymized). Irreversible, so confirms first.
 *
 * Stops and reloads the student list on the first failure, rather than
 * attempting the rest of the group - a partial merge is still a valid,
 * safe state (each merge call is its own all-or-nothing transaction on the
 * Java side), just not a complete one.
 *
 * @param {number} keepId - The student to keep
 * @param {number[]} mergeIds - The duplicate student IDs to merge away and delete
 */
async function mergeDuplicateGroup(keepId, mergeIds) {
    const count = mergeIds.length;
    const confirmMessage = translate(count === 1 ? 'admin.mergeConfirmSingular' : 'admin.mergeConfirmPlural', { count, keepId });
    if (!confirm(confirmMessage)) {
        return;
    }

    for (const mergeId of mergeIds) {
        try {
            const response = await fetch(`/api/admin/students/${keepId}/merge`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mergeId })
            });

            if (!response.ok) {
                showToast(translate('admin.mergeFailedForId', { id: mergeId }), 'error');
                await loadStudents();
                return;
            }
        } catch (error) {
            console.error('Error merging duplicate students:', error);
            showToast(translate('admin.mergeErrorForId', { id: mergeId }), 'error');
            await loadStudents();
            return;
        }
    }

    showToast(translate('admin.mergeSuccess'), 'success');
    await loadStudents();
}


// Guest Accounts List Rendering


/**
 * Render the guest accounts list with search filtering.
 *
 * - Filters guest accounts based on search input (username + email)
 * - Updates guest count display
 * - Shows username and email for each account
 */
function renderGuests() {
    const search = document.getElementById('guestSearch').value.toLowerCase();
    const filtered = guests.filter(g =>
        g.username.toLowerCase().includes(search) || (g.mail || '').toLowerCase().includes(search)
    );

    document.getElementById('guestCount').textContent = translate(filtered.length === 1 ? 'admin.guestCount' : 'admin.guestCountPlural', { count: filtered.length });

    const container = document.getElementById('guestsList');

    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-sm text-muted-foreground py-4 text-center">${translate('admin.noGuestsFound')}</p>`;
        return;
    }

    container.innerHTML = filtered.map(g => {
        const isErased = !!g.anonymizedAt;
        return `
        <div onclick="${isErased ? '' : `openGuestModal(${g.id})`}" class="flex items-center gap-3 p-3 border border-border rounded-lg ${isErased ? 'opacity-60' : 'cursor-pointer hover:bg-secondary/50 transition-colors'}">
            <div class="w-9 h-9 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-sm font-medium text-foreground">${g.username.charAt(0).toUpperCase()}</span>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-foreground truncate">${g.username}</p>
                <p class="text-xs text-muted-foreground truncate">${g.mail || ''}</p>
            </div>
            <span class="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">${translate('admin.guestBadge')}</span>
            ${isErased ? `<span class="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">${translate('admin.erasedBadge')}</span>` : `
            <button onclick="event.stopPropagation(); confirmGuestErasure(${g.id})" class="px-3 py-1.5 text-xs font-medium rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors">
                ${translate('admin.eraseButton')}
            </button>`}
        </div>
    `;
    }).join('');
}


// Student Class Management


/**
 * Change a student's class level (M/S/U).
 * 
 * Sends PATCH request to update class in database.
 * Updates local state and shows success/error toast.
 * Reverts UI on error.
 * 
 * @param {number} id - Student ID
 * @param {string} newClass - New class level: 'M', 'S', or 'U'
 */
async function changeStudentClass(id, newClass) {
    try {
        const response = await fetch(`/api/admin/students/${id}/class`, {
            method: 'PATCH',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentClass: newClass })
        });

        if (response.ok) {
            // Update local state
            const student = students.find(s => s.id === id);
            if (student) {
                student.studentClass = newClass;
                showToast(translate('admin.classChangedSuccess', { name: `${student.name} ${student.surname}`, class: newClass }), 'success');
            }
        } else {
            showToast(translate('admin.classChangeFailed'), 'error');
            renderStudents(); // Revert dropdown to previous value
        }
    } catch (error) {
        console.error('Error updating student class:', error);
        showToast(translate('admin.classChangeError'), 'error');
        renderStudents(); // Revert dropdown to previous value
    }
}


// Student Name Management


/**
 * Rename a student, reading both the name and surname inputs directly from
 * the list row - fired on blur from either field, so tabbing/clicking out of
 * either one commits both at once.
 *
 * No-ops (no request sent) if neither field actually changed, so simply
 * clicking into and back out of a field doesn't spam the API or the toast.
 * Reverts both inputs to their last known-good value on error.
 *
 * @param {number} id - Student ID
 */
async function changeStudentName(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    const nameInput = document.querySelector(`input[data-student-id="${id}"][data-field="name"]`);
    const surnameInput = document.querySelector(`input[data-student-id="${id}"][data-field="surname"]`);
    if (!nameInput || !surnameInput) return;

    const name = nameInput.value.trim();
    const surname = surnameInput.value.trim();

    if (!name || !surname) {
        showToast(translate('admin.nameRequired'), 'error');
        nameInput.value = student.name;
        surnameInput.value = student.surname;
        return;
    }

    if (name === student.name && surname === student.surname) return;

    try {
        const response = await fetch(`/api/admin/students/${id}/name`, {
            method: 'PATCH',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, surname })
        });

        if (response.ok) {
            student.name = name;
            student.surname = surname;
            showToast(translate('admin.renameSuccess', { name: `${name} ${surname}` }), 'success');
            renderStudents(); // Refreshes the avatar initials too
        } else {
            showToast(translate('admin.renameFailed'), 'error');
            nameInput.value = student.name;
            surnameInput.value = student.surname;
        }
    } catch (error) {
        console.error('Error updating student name:', error);
        showToast(translate('admin.renameError'), 'error');
        nameInput.value = student.name;
        surnameInput.value = student.surname;
    }
}


// Tutor Role & Status Management


/**
 * Show confirmation modal for changing a tutor's role.
 * 
 * Toggles between STAFF and GENERIC roles.
 * Sets up pendingAction to execute on confirmation.
 * 
 * @param {number} id - Tutor ID
 */
function confirmRoleChange(id) {
    const tutor = tutors.find(t => t.id === id);
    if (!tutor) return;

    // Determine new role (toggle)
    const newRole = tutor.role === 'STAFF' ? 'GENERIC' : 'STAFF';

    // Set up the action to execute on confirmation
    pendingAction = async () => {
        try {
            const response = await fetch(`/api/admin/tutors/${id}/role`, {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });

            if (response.ok) {
                // Update local state and re-render
                tutor.role = newRole;
                renderTutors();
                showToast(translate('admin.roleChangedSuccess', { username: tutor.username, role: newRole }), 'success');
            } else {
                showToast(translate('admin.roleChangeFailed'), 'error');
            }
        } catch (error) {
            console.error('Error updating tutor role:', error);
            showToast(translate('admin.roleChangeError'), 'error');
        }
    };

    // Show confirmation modal with appropriate styling
    showConfirmModal(
        translate('admin.changeRoleTitle'),
        translate('admin.confirmRoleChangeMessage', { username: tutor.username, role: newRole }),
        newRole === 'STAFF' ? 'bg-primary/20' : 'bg-secondary',
        newRole === 'STAFF' ? 'text-primary' : 'text-foreground',
        translate('admin.confirmButton'),
        'bg-primary text-primary-foreground hover:bg-primary/90'
    );
}

/**
 * Show confirmation modal for blocking/unblocking a tutor.
 * 
 * Toggles between BLOCKED and ACTIVE status.
 * Blocked tutors cannot log in.
 * Sets up pendingAction to execute on confirmation.
 * 
 * @param {number} id - Tutor ID
 */
function confirmBlockToggle(id) {
    const tutor = tutors.find(t => t.id === id);
    if (!tutor) return;

    // Determine action and new status
    const willBlock = tutor.status !== 'BLOCKED';
    const newStatus = willBlock ? 'BLOCKED' : 'ACTIVE';

    // Set up the action to execute on confirmation
    pendingAction = async () => {
        try {
            const response = await fetch(`/api/admin/tutors/${id}/status`, {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Update local state and re-render
                tutor.status = newStatus;
                renderTutors();
                showToast(
                    translate(willBlock ? 'admin.tutorBlockedSuccess' : 'admin.tutorUnblockedSuccess', { username: tutor.username }),
                    willBlock ? 'error' : 'success'
                );
            } else {
                showToast(translate('admin.statusChangeFailed'), 'error');
            }
        } catch (error) {
            console.error('Error updating tutor status:', error);
            showToast(translate('admin.statusChangeError'), 'error');
        }
    };

    // Show confirmation modal with destructive or primary styling
    showConfirmModal(
        translate(willBlock ? 'admin.blockTutorTitle' : 'admin.unblockTutorTitle'),
        translate(willBlock ? 'admin.confirmBlockMessage' : 'admin.confirmUnblockMessage', { username: tutor.username }),
        willBlock ? 'bg-destructive/20' : 'bg-primary/20',
        willBlock ? 'text-destructive' : 'text-primary',
        willBlock ? translate('admin.blockButton') : translate('admin.unblockButton'),
        willBlock ? 'bg-destructive text-white hover:bg-destructive/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'
    );
}


// GDPR Right-to-Erasure


/**
 * Show confirmation modal for erasing (GDPR right to erasure) a tutor account.
 *
 * Irreversible: anonymizes the account's username/password/mail and status
 * server-side, but keeps their lesson/test/prenotation/calendar-note history
 * intact. Requires typing the username to confirm.
 *
 * @param {number} id - Tutor ID
 */
function confirmTutorErasure(id) {
    const tutor = tutors.find(t => t.id === id);
    if (!tutor) return;

    const originalUsername = tutor.username;

    pendingAction = async () => {
        try {
            const response = await fetch(`/api/admin/tutors/${id}/erasure`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });

            if (response.ok) {
                const erased = await response.json();
                Object.assign(tutor, erased);
                renderTutors();
                showToast(translate('admin.eraseSuccess', { name: originalUsername }), 'success');
            } else if (response.status === 409) {
                showToast(translate('admin.tutorAlreadyErased'), 'error');
            } else {
                showToast(translate('admin.eraseTutorFailed'), 'error');
            }
        } catch (error) {
            console.error('Error erasing tutor:', error);
            showToast(translate('admin.eraseTutorError'), 'error');
        }
    };

    showConfirmModal(
        translate('admin.eraseTutorTitle'),
        translate('admin.eraseTutorMessage', { username: tutor.username }),
        'bg-destructive/20', 'text-destructive', translate('admin.eraseButton'), 'bg-destructive text-white hover:bg-destructive/90',
        tutor.username
    );
}

/**
 * Show confirmation modal for erasing (GDPR right to erasure) a guest account.
 *
 * Same anonymize-in-place behavior as tutor erasure (guests are app_user rows
 * too) - the student(s) they're linked to are never affected.
 *
 * @param {number} id - Guest account ID
 */
function confirmGuestErasure(id) {
    const guest = guests.find(g => g.id === id);
    if (!guest) return;

    const originalUsername = guest.username;

    pendingAction = async () => {
        try {
            const response = await fetch(`/api/admin/guests/${id}/erasure`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });

            if (response.ok) {
                const erased = await response.json();
                Object.assign(guest, erased);
                renderGuests();
                showToast(translate('admin.eraseSuccess', { name: originalUsername }), 'success');
            } else if (response.status === 409) {
                showToast(translate('admin.guestAlreadyErased'), 'error');
            } else {
                showToast(translate('admin.eraseGuestFailed'), 'error');
            }
        } catch (error) {
            console.error('Error erasing guest account:', error);
            showToast(translate('admin.eraseGuestError'), 'error');
        }
    };

    showConfirmModal(
        translate('admin.eraseGuestTitle'),
        translate('admin.eraseGuestMessage', { username: guest.username }),
        'bg-destructive/20', 'text-destructive', translate('admin.eraseButton'), 'bg-destructive text-white hover:bg-destructive/90',
        guest.username
    );
}

/**
 * Show confirmation modal for erasing (GDPR right to erasure) a student.
 *
 * Irreversible: anonymizes the student's name/surname/description and status
 * server-side, but keeps their lesson/test/prenotation/pack history intact.
 * Requires typing the student's full name to confirm.
 *
 * @param {number} id - Student ID
 */
function confirmStudentErasure(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    const fullName = `${student.name} ${student.surname}`;

    pendingAction = async () => {
        try {
            const response = await fetch(`/api/admin/students/${id}/erasure`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });

            if (response.ok) {
                const erased = await response.json();
                Object.assign(student, erased);
                renderStudents();
                showToast(translate('admin.eraseSuccess', { name: fullName }), 'success');
            } else if (response.status === 409) {
                showToast(translate('admin.studentAlreadyErased'), 'error');
            } else {
                showToast(translate('admin.eraseStudentFailed'), 'error');
            }
        } catch (error) {
            console.error('Error erasing student:', error);
            showToast(translate('admin.eraseStudentError'), 'error');
        }
    };

    showConfirmModal(
        translate('admin.eraseStudentTitle'),
        translate('admin.eraseStudentMessage', { name: fullName }),
        'bg-destructive/20', 'text-destructive', translate('admin.eraseButton'), 'bg-destructive text-white hover:bg-destructive/90',
        fullName
    );
}


// Confirmation Modal


/**
 * Show a confirmation modal with custom content and styling.
 *
 * The modal executes the pendingAction when the confirm button is clicked.
 *
 * @param {string} title - Modal title
 * @param {string} message - Modal message (can include HTML)
 * @param {string} iconBg - Background color class for icon
 * @param {string} iconColor - Text color class for icon
 * @param {string} btnText - Confirm button text
 * @param {string} btnClass - Confirm button CSS classes
 * @param {string|null} [typeToConfirmWord] - If set, the confirm button stays disabled
 *   until the user types this exact word into an extra input row. Used for irreversible
 *   actions (e.g. GDPR erasure) that warrant a stronger confirmation than the others.
 */
function showConfirmModal(title, message, iconBg, iconColor, btnText, btnClass, typeToConfirmWord = null) {
    const modal = document.getElementById('confirmModal');

    // Set modal content
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').innerHTML = message;

    // Set icon styling
    document.getElementById('confirmIcon').className = `w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${iconBg}`;
    document.getElementById('confirmIcon').innerHTML = `<svg class="w-7 h-7 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;

    // Set confirm button
    const btn = document.getElementById('confirmBtn');
    btn.textContent = btnText;
    btn.className = `flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${btnClass}`;

    // Type-to-confirm row: only shown for irreversible actions
    const row = document.getElementById('confirmTypeToConfirmRow');
    const input = document.getElementById('confirmTypeToConfirmInput');
    const word = document.getElementById('confirmTypeToConfirmWord');
    if (typeToConfirmWord) {
        row.classList.remove('hidden');
        word.textContent = typeToConfirmWord;
        input.value = '';
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        input.oninput = () => {
            const matches = input.value === typeToConfirmWord;
            btn.disabled = !matches;
            btn.classList.toggle('opacity-50', !matches);
            btn.classList.toggle('cursor-not-allowed', !matches);
        };
    } else {
        row.classList.add('hidden');
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        input.oninput = null;
    }

    // Execute pending action on confirm
    btn.onclick = () => {
        if (pendingAction) pendingAction();
        pendingAction = null;
        closeConfirmModal();
    };

    // Show modal
    modal.classList.add('open');
}

/**
 * Close the confirmation modal.
 *
 * Clears the pending action and resets the type-to-confirm row.
 */
function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('open');
    document.getElementById('confirmTypeToConfirmRow').classList.add('hidden');
    document.getElementById('confirmTypeToConfirmInput').value = '';
    pendingAction = null;
}


// Create Tutor


/**
 * Handle create tutor form submission.
 * 
 * Validates:
 * - Password length (minimum 8 characters)
 * - Password confirmation match
 * 
 * On success:
 * - Adds new tutor to list
 * - Shows in recently created section
 * - Resets form
 * 
 * @param {Event} e - Form submit event
 */
async function handleCreateTutor(e) {
    e.preventDefault();

    // Get form values
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    const role = document.querySelector('input[name="role"]:checked').value;

    // Validate password length
    if (password.length < 8) {
        showToast(translate('admin.passwordMinLength'), 'error');
        return;
    }

    // Validate password confirmation
    if (password !== confirm) {
        showToast(translate('admin.passwordsDoNotMatch'), 'error');
        return;
    }

    try {
        const response = await fetch('/api/admin/tutors', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });

        if (response.ok) {
            const newTutor = await response.json();

            // Add to tutors list (at beginning)
            tutors.unshift(newTutor);
            renderTutors();

            // Add to recently created list (max 3)
            recentlyCreated.unshift({ username, role, time: new Date() });
            if (recentlyCreated.length > 3) recentlyCreated.pop();
            renderRecentlyCreated();

            // Reset form and hide indicators
            e.target.reset();
            document.getElementById('passwordStrength').classList.add('hidden');
            document.getElementById('passwordMatch').classList.add('hidden');

            showToast(translate('admin.tutorCreatedSuccess', { username, role }), 'success');
        } else {
            const error = await response.json();
            showToast(error.error || translate('admin.createTutorFailed'), 'error');
        }
    } catch (error) {
        console.error('Error creating tutor:', error);
        showToast(translate('admin.createTutorError'), 'error');
    }
}


// Create Guest


/**
 * Handle create guest account form submission.
 *
 * Validates:
 * - Password length (minimum 8 characters)
 * - Password confirmation match
 *
 * On success:
 * - Adds new guest account to list
 * - Resets form
 *
 * @param {Event} e - Form submit event
 */
async function handleCreateGuest(e) {
    e.preventDefault();

    const username = document.getElementById('newGuestUsername').value.trim();
    const mail = document.getElementById('newGuestMail').value.trim();
    const password = document.getElementById('newGuestPassword').value;
    const confirm = document.getElementById('confirmGuestPassword').value;

    if (password.length < 8) {
        showToast(translate('admin.passwordMinLength'), 'error');
        return;
    }

    if (password !== confirm) {
        showToast(translate('admin.passwordsDoNotMatch'), 'error');
        return;
    }

    try {
        const response = await fetch('/api/admin/guests', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, mail, password })
        });

        if (response.ok) {
            const newGuest = await response.json();

            // Add to guests list (at beginning)
            guests.unshift(newGuest);
            renderGuests();

            // Reset form and hide indicators
            e.target.reset();
            document.getElementById('guestPasswordMatch').classList.add('hidden');

            showToast(translate('admin.guestCreatedSuccess', { username }), 'success');
        } else {
            const error = await response.json();
            showToast(error.error || translate('admin.createGuestFailed'), 'error');
        }
    } catch (error) {
        console.error('Error creating guest account:', error);
        showToast(translate('admin.createGuestError'), 'error');
    }
}


// Guest Detail/Edit Modal


// The guest currently open in the edit modal, or null if closed
let currentGuestId = null;

/**
 * Open the guest detail/edit modal for a specific guest account.
 *
 * Populates the profile form with the guest's current username/email, then
 * loads both the students already assigned to this guest and the pool of
 * students available to assign (those with no guest linked yet).
 *
 * @param {number} id - Guest account ID
 */
async function openGuestModal(id) {
    const guest = guests.find(g => g.id === id);
    if (!guest) return;

    currentGuestId = id;
    document.getElementById('editGuestId').value = id;
    document.getElementById('editGuestUsername').value = guest.username;
    document.getElementById('editGuestMail').value = guest.mail || '';

    // Clear any leftover password input/search text from a previous time the modal was open
    document.getElementById('editGuestPassword').value = '';
    document.getElementById('confirmEditGuestPassword').value = '';
    document.getElementById('editGuestPasswordMatch').classList.add('hidden');
    document.getElementById('assignStudentSearch').value = '';

    document.getElementById('guestModal').classList.add('open');

    await refreshGuestModalStudents();
}

/**
 * Close the guest detail/edit modal and clear its state.
 */
function closeGuestModal() {
    document.getElementById('guestModal').classList.remove('open');
    currentGuestId = null;
}

/**
 * Reload and re-render both the assigned-students list and the unassigned-students
 * dropdown for the guest currently open in the modal.
 */
async function refreshGuestModalStudents() {
    if (!currentGuestId) return;

    try {
        const [assignedRes, unassignedRes] = await Promise.all([
            fetch(`/api/admin/guests/${currentGuestId}/students`, { credentials: 'same-origin' }),
            fetch('/api/admin/students/unassigned', { credentials: 'same-origin' })
        ]);

        const assigned = assignedRes.ok ? await assignedRes.json() : [];
        const unassigned = unassignedRes.ok ? await unassignedRes.json() : [];

        renderAssignedStudents(assigned);
        renderUnassignedStudentsSelect(unassigned);
    } catch (error) {
        console.error('Error loading guest students:', error);
        showToast(translate('admin.loadStudentsError'), 'error');
    }
}

/**
 * Render the list of students currently assigned to the guest open in the modal,
 * each with an "Unassign" button.
 *
 * @param {Array} students - Students linked to the current guest
 */
function renderAssignedStudents(students) {
    const container = document.getElementById('assignedStudentsList');

    if (students.length === 0) {
        container.innerHTML = `<p class="text-sm text-muted-foreground py-2">${translate('admin.noStudentsAssignedYet')}</p>`;
        return;
    }

    container.innerHTML = students.map(s => `
        <div class="flex items-center gap-3 p-2.5 border border-border rounded-lg">
            <div class="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-xs font-medium text-foreground">${s.name.charAt(0)}${s.surname.charAt(0)}</span>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm text-foreground truncate">${s.name} ${s.surname}</p>
            </div>
            <button onclick="unassignStudent(${s.id})" class="px-2.5 py-1 text-xs font-medium rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors">
                ${translate('admin.unassignButton')}
            </button>
        </div>
    `).join('');
}

// Full pool of unassigned students for the guest modal currently open, cached so the
// search box can filter it locally without refetching on every keystroke.
let unassignedStudentsCache = [];

/**
 * Populate the "Assign a Student" dropdown with students that have no guest
 * linked yet - mandatorily filtered server-side (GET /api/admin/students/unassigned),
 * so an already-assigned student can never appear here. Caches the full list so the
 * search box (see filterUnassignedStudentsSelect) can filter it without refetching.
 *
 * @param {Array} students - Students with no guest account linked
 */
function renderUnassignedStudentsSelect(students) {
    unassignedStudentsCache = students;
    populateUnassignedStudentsSelect(students);
}

/**
 * Fill the "Assign a Student" dropdown's options from a given (already-filtered) list.
 *
 * @param {Array} students - Students to show as options
 */
function populateUnassignedStudentsSelect(students) {
    const select = document.getElementById('unassignedStudentsSelect');
    select.innerHTML = `<option value="">${translate('admin.selectStudentOption')}</option>` +
        students.map(s => `<option value="${s.id}">${s.name} ${s.surname}</option>`).join('');
}

/**
 * Filter the cached unassigned-students pool by the search box's value (name + surname)
 * and re-populate the dropdown with just the matches.
 */
function filterUnassignedStudentsSelect() {
    const search = document.getElementById('assignStudentSearch').value.toLowerCase();
    const filtered = unassignedStudentsCache.filter(s =>
        `${s.name} ${s.surname}`.toLowerCase().includes(search)
    );
    populateUnassignedStudentsSelect(filtered);
}

/**
 * Assign the student selected in the dropdown to the guest open in the modal.
 */
async function assignSelectedStudent() {
    const select = document.getElementById('unassignedStudentsSelect');
    const studentId = select.value;
    if (!studentId || !currentGuestId) return;

    try {
        const response = await fetch(`/api/admin/students/${studentId}/guest`, {
            method: 'PATCH',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentGuestId })
        });

        if (response.ok) {
            await refreshGuestModalStudents();
            showToast(translate('admin.studentAssignedSuccess'), 'success');
        } else {
            const error = await response.json();
            showToast(error.error || translate('admin.assignStudentFailed'), 'error');
        }
    } catch (error) {
        console.error('Error assigning student:', error);
        showToast(translate('admin.assignStudentError'), 'error');
    }
}

/**
 * Unassign a student from the guest open in the modal (clears the student's guest link).
 *
 * @param {number} studentId - Student ID to unassign
 */
async function unassignStudent(studentId) {
    try {
        const response = await fetch(`/api/admin/students/${studentId}/guest`, {
            method: 'PATCH',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: null })
        });

        if (response.ok) {
            await refreshGuestModalStudents();
            showToast(translate('admin.studentUnassignedSuccess'), 'success');
        } else {
            const error = await response.json();
            showToast(error.error || translate('admin.unassignStudentFailed'), 'error');
        }
    } catch (error) {
        console.error('Error unassigning student:', error);
        showToast(translate('admin.unassignStudentError'), 'error');
    }
}

/**
 * Handle the guest profile edit form submission (username/email only).
 *
 * @param {Event} e - Form submit event
 */
async function handleEditGuestProfile(e) {
    e.preventDefault();

    const id = document.getElementById('editGuestId').value;
    const username = document.getElementById('editGuestUsername').value.trim();
    const mail = document.getElementById('editGuestMail').value.trim();
    const password = document.getElementById('editGuestPassword').value;
    const confirmPassword = document.getElementById('confirmEditGuestPassword').value;

    // Password is optional here - only validate it if the admin actually typed one
    if (password) {
        if (password.length < 8) {
            showToast(translate('admin.passwordMinLength'), 'error');
            return;
        }
        if (password !== confirmPassword) {
            showToast(translate('admin.passwordsDoNotMatch'), 'error');
            return;
        }
    }

    const payload = { username, mail };
    if (password) payload.password = password;

    try {
        const response = await fetch(`/api/admin/guests/${id}`, {
            method: 'PATCH',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const updatedGuest = await response.json();

            const idx = guests.findIndex(g => g.id === updatedGuest.id);
            if (idx !== -1) guests[idx] = updatedGuest;
            renderGuests();

            // Clear password fields so the plaintext doesn't linger in the form
            document.getElementById('editGuestPassword').value = '';
            document.getElementById('confirmEditGuestPassword').value = '';
            document.getElementById('editGuestPasswordMatch').classList.add('hidden');

            showToast(translate('admin.guestUpdatedSuccess'), 'success');
        } else {
            const error = await response.json();
            showToast(error.error || translate('admin.updateGuestFailed'), 'error');
        }
    } catch (error) {
        console.error('Error updating guest account:', error);
        showToast(translate('admin.updateGuestError'), 'error');
    }
}

/**
 * Render the recently created tutors list.
 * 
 * Shows the last 3 created tutors with:
 * - Username
 * - Role
 * - Creation time
 * 
 * Hides the section if list is empty.
 */
function renderRecentlyCreated() {
    const container = document.getElementById('recentlyCreated');
    const list = document.getElementById('recentList');

    // Hide section if empty
    if (recentlyCreated.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');

    // Generate HTML for each recent tutor
    list.innerHTML = recentlyCreated.map(r => `
    <div class="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
        <div class="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center">
        <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        </div>
        <div class="flex-1 min-w-0">
        <p class="text-sm text-foreground truncate">${r.username}</p>
        <p class="text-xs text-muted-foreground">${r.role} &middot; ${r.time.toLocaleTimeString(window.lang || 'en', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
    </div>
    `).join('');
}


// Toast Notifications


/**
 * Show a toast notification.
 * 
 * Toast automatically disappears after 3 seconds.
 * 
 * @param {string} message - Message to display
 * @param {string} type - Toast type: 'success' or 'error'
 */
function showToast(message, type) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');

    // Style based on type
    const bgColor = type === 'success' ? 'bg-primary' : 'bg-destructive';
    toast.className = `toast ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-xs`;
    toast.textContent = message;

    // Add to container
    container.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => toast.remove(), 3000);
}