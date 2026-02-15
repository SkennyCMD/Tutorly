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


// Array of all tutor objects
let tutors = [];

// Array of all student objects
let students = [];

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
        const response = await fetch('/api/admin/tutors');
        if (response.ok) {
            tutors = await response.json();
            renderTutors();
        } else {
            showToast('Failed to load tutors', 'error');
        }
    } catch (error) {
        console.error('Error loading tutors:', error);
        showToast('Error loading tutors', 'error');
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
        const response = await fetch('/api/admin/students');
        if (response.ok) {
            students = await response.json();
            renderStudents();
        } else {
            showToast('Failed to load students', 'error');
        }
    } catch (error) {
        console.error('Error loading students:', error);
        showToast('Error loading students', 'error');
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

    // Search filters - real-time filtering of tutors and students
    document.getElementById('tutorSearch').addEventListener('input', renderTutors);
    document.getElementById('studentSearch').addEventListener('input', renderStudents);

    // Create tutor form submission
    document.getElementById('createTutorForm').addEventListener('submit', handleCreateTutor);

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
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    
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
        match.textContent = 'Passwords match';
        match.className = 'text-xs mt-1 text-primary';
    } else {
        match.textContent = 'Passwords do not match';
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
    document.getElementById('tutorCount').textContent = `${filtered.length} tutor${filtered.length !== 1 ? 's' : ''}`;

    const container = document.getElementById('tutorsList');
    
    // Show empty state if no results
    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-sm text-muted-foreground py-4 text-center">No tutors found</p>';
        return;
    }

    // Generate HTML for each tutor card
    container.innerHTML = filtered.map(t => {
        const isBlocked = t.status === 'BLOCKED';
        return `
        <div class="p-3 border border-border rounded-lg ${isBlocked ? 'opacity-60' : ''}">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-9 h-9 ${isBlocked ? 'bg-destructive/20' : 'bg-secondary'} rounded-full flex items-center justify-center flex-shrink-0">
                    <span class="text-sm font-medium ${isBlocked ? 'text-destructive' : 'text-foreground'}">${t.username.charAt(0).toUpperCase()}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-foreground truncate">${t.username}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-xs px-1.5 py-0.5 rounded ${t.role === 'STAFF' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}">${t.role}</span>
                        ${isBlocked ? '<span class="text-xs px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">BLOCKED</span>' : ''}
                    </div>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="confirmRoleChange(${t.id})" class="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-secondary transition-colors ${isBlocked ? 'pointer-events-none opacity-50' : ''}">
                    ${t.role === 'STAFF' ? 'Set GENERIC' : 'Set STAFF'}
                </button>
                <button onclick="confirmBlockToggle(${t.id})" class="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isBlocked ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-destructive/20 text-destructive hover:bg-destructive/30'}">
                    ${isBlocked ? 'Unblock' : 'Block'}
                </button>
            </div>
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
    document.getElementById('studentCount').textContent = `${filtered.length} student${filtered.length !== 1 ? 's' : ''}`;

    const container = document.getElementById('studentsList');
    
    // Show empty state if no results
    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-sm text-muted-foreground py-4 text-center">No students found</p>';
        return;
    }

    // Generate HTML for each student card with class dropdown
    container.innerHTML = filtered.map(s => `
        <div class="flex items-center gap-3 p-3 border border-border rounded-lg">
            <div class="w-9 h-9 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-sm font-medium text-foreground">${s.name.charAt(0)}${s.surname.charAt(0)}</span>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-foreground truncate">${s.name} ${s.surname}</p>
            </div>
            <select onchange="changeStudentClass(${s.id}, this.value)" class="px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer">
                <option value="M" ${s.studentClass === 'M' ? 'selected' : ''}>M</option>
                <option value="S" ${s.studentClass === 'S' ? 'selected' : ''}>S</option>
                <option value="U" ${s.studentClass === 'U' ? 'selected' : ''}>U</option>
            </select>
        </div>
    `).join('');
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentClass: newClass })
        });

        if (response.ok) {
            // Update local state
            const student = students.find(s => s.id === id);
            if (student) {
                student.studentClass = newClass;
                showToast(`${student.name} ${student.surname} changed to class ${newClass}`, 'success');
            }
        } else {
            showToast('Failed to update student class', 'error');
            renderStudents(); // Revert dropdown to previous value
        }
    } catch (error) {
        console.error('Error updating student class:', error);
        showToast('Error updating student class', 'error');
        renderStudents(); // Revert dropdown to previous value
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });

            if (response.ok) {
                // Update local state and re-render
                tutor.role = newRole;
                renderTutors();
                showToast(`${tutor.username} is now ${newRole}`, 'success');
            } else {
                showToast('Failed to update tutor role', 'error');
            }
        } catch (error) {
            console.error('Error updating tutor role:', error);
            showToast('Error updating tutor role', 'error');
        }
    };
    
    // Show confirmation modal with appropriate styling
    showConfirmModal(
        'Change Role',
        `Are you sure you want to change <strong>${tutor.username}</strong> to <strong>${newRole}</strong>?`,
        newRole === 'STAFF' ? 'bg-primary/20' : 'bg-secondary',
        newRole === 'STAFF' ? 'text-primary' : 'text-foreground',
        'Confirm',
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Update local state and re-render
                tutor.status = newStatus;
                renderTutors();
                showToast(
                    `${tutor.username} has been ${willBlock ? 'blocked' : 'unblocked'}`,
                    willBlock ? 'error' : 'success'
                );
            } else {
                showToast('Failed to update tutor status', 'error');
            }
        } catch (error) {
            console.error('Error updating tutor status:', error);
            showToast('Error updating tutor status', 'error');
        }
    };
    
    // Show confirmation modal with destructive or primary styling
    showConfirmModal(
        willBlock ? 'Block Tutor' : 'Unblock Tutor',
        `Are you sure you want to ${willBlock ? 'block' : 'unblock'} <strong>${tutor.username}</strong>?${willBlock ? ' They will not be able to log in.' : ''}`,
        willBlock ? 'bg-destructive/20' : 'bg-primary/20',
        willBlock ? 'text-destructive' : 'text-primary',
        willBlock ? 'Block' : 'Unblock',
        willBlock ? 'bg-destructive text-white hover:bg-destructive/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'
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
 */
function showConfirmModal(title, message, iconBg, iconColor, btnText, btnClass) {
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
 * Clears the pending action.
 */
function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('open');
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
        showToast('Password must be at least 8 characters', 'error');
        return;
    }
    
    // Validate password confirmation
    if (password !== confirm) {
        showToast('Passwords do not match', 'error');
        return;
    }

    try {
        const response = await fetch('/api/admin/tutors', {
            method: 'POST',
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

            showToast(`Tutor "${username}" created as ${role}`, 'success');
        } else {
            const error = await response.json();
            showToast(error.error || 'Failed to create tutor', 'error');
        }
    } catch (error) {
        console.error('Error creating tutor:', error);
        showToast('Error creating tutor', 'error');
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
        <p class="text-xs text-muted-foreground">${r.role} &middot; ${r.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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