// Data
let tutors = [];
let students = [];
let recentlyCreated = [];
let pendingAction = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTutors();
    loadStudents();
    setupEventListeners();
});

// Load tutors from API
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

// Load students from API
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

function setupEventListeners() {
    // Mobile menu
    document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.add('open');
    document.getElementById('menuOverlay').classList.remove('hidden');
    });
    document.getElementById('closeMenu').addEventListener('click', closeMenuFn);
    document.getElementById('menuOverlay').addEventListener('click', closeMenuFn);

    // Search
    document.getElementById('tutorSearch').addEventListener('input', renderTutors);
    document.getElementById('studentSearch').addEventListener('input', renderStudents);

    // Create tutor form
    document.getElementById('createTutorForm').addEventListener('submit', handleCreateTutor);

    // Password toggle
    document.getElementById('togglePassword').addEventListener('click', () => {
    const input = document.getElementById('newPassword');
    const icon = document.getElementById('eyeIcon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18"/>';
    } else {
        input.type = 'password';
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>';
    }
    });

    // Password strength
    document.getElementById('newPassword').addEventListener('input', (e) => {
    const val = e.target.value;
    const container = document.getElementById('passwordStrength');
    if (val.length === 0) { container.classList.add('hidden'); return; }
    container.classList.remove('hidden');
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const colors = ['bg-destructive', 'bg-orange-500', 'bg-yellow-500', 'bg-primary'];
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    for (let i = 1; i <= 4; i++) {
        const el = document.getElementById('str' + i);
        el.className = 'h-1 flex-1 rounded-full ' + (i <= score ? colors[score - 1] : 'bg-border');
    }
    document.getElementById('strengthText').textContent = labels[score - 1] || '';
    });

    // Confirm password match
    document.getElementById('confirmPassword').addEventListener('input', (e) => {
    const match = document.getElementById('passwordMatch');
    const pw = document.getElementById('newPassword').value;
    if (e.target.value.length === 0) { match.classList.add('hidden'); return; }
    match.classList.remove('hidden');
    if (e.target.value === pw) {
        match.textContent = 'Passwords match';
        match.className = 'text-xs mt-1 text-primary';
    } else {
        match.textContent = 'Passwords do not match';
        match.className = 'text-xs mt-1 text-destructive';
    }
    });
}

function closeMenuFn() {
    document.getElementById('mobileMenu').classList.remove('open');
    document.getElementById('menuOverlay').classList.add('hidden');
}

// Render Tutors
function renderTutors() {
    const search = document.getElementById('tutorSearch').value.toLowerCase();
    const filtered = tutors.filter(t => t.username.toLowerCase().includes(search));
    document.getElementById('tutorCount').textContent = `${filtered.length} tutor${filtered.length !== 1 ? 's' : ''}`;

    const container = document.getElementById('tutorsList');
    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-sm text-muted-foreground py-4 text-center">No tutors found</p>';
        return;
    }

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

// Render Students
function renderStudents() {
    const search = document.getElementById('studentSearch').value.toLowerCase();
    const filtered = students.filter(s => `${s.name} ${s.surname}`.toLowerCase().includes(search));
    document.getElementById('studentCount').textContent = `${filtered.length} student${filtered.length !== 1 ? 's' : ''}`;

    const container = document.getElementById('studentsList');
    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-sm text-muted-foreground py-4 text-center">No students found</p>';
        return;
    }

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

// Change student class
async function changeStudentClass(id, newClass) {
    try {
        const response = await fetch(`/api/admin/students/${id}/class`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentClass: newClass })
        });

        if (response.ok) {
            const student = students.find(s => s.id === id);
            if (student) {
                student.studentClass = newClass;
                showToast(`${student.name} ${student.surname} changed to class ${newClass}`, 'success');
            }
        } else {
            showToast('Failed to update student class', 'error');
            renderStudents(); // Revert UI
        }
    } catch (error) {
        console.error('Error updating student class:', error);
        showToast('Error updating student class', 'error');
        renderStudents(); // Revert UI
    }
}

// Confirm modals
function confirmRoleChange(id) {
    const tutor = tutors.find(t => t.id === id);
    if (!tutor) return;
    const newRole = tutor.role === 'STAFF' ? 'GENERIC' : 'STAFF';
    pendingAction = async () => {
        try {
            const response = await fetch(`/api/admin/tutors/${id}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });

            if (response.ok) {
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
    showConfirmModal(
        'Change Role',
        `Are you sure you want to change <strong>${tutor.username}</strong> to <strong>${newRole}</strong>?`,
        newRole === 'STAFF' ? 'bg-primary/20' : 'bg-secondary',
        newRole === 'STAFF' ? 'text-primary' : 'text-foreground',
        'Confirm',
        'bg-primary text-primary-foreground hover:bg-primary/90'
    );
}

function confirmBlockToggle(id) {
    const tutor = tutors.find(t => t.id === id);
    if (!tutor) return;
    const willBlock = tutor.status !== 'BLOCKED';
    const newStatus = willBlock ? 'BLOCKED' : 'ACTIVE';
    
    pendingAction = async () => {
        try {
            const response = await fetch(`/api/admin/tutors/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                tutor.status = newStatus;
                renderTutors();
                showToast(`${tutor.username} has been ${willBlock ? 'blocked' : 'unblocked'}`, willBlock ? 'error' : 'success');
            } else {
                showToast('Failed to update tutor status', 'error');
            }
        } catch (error) {
            console.error('Error updating tutor status:', error);
            showToast('Error updating tutor status', 'error');
        }
    };
    showConfirmModal(
        willBlock ? 'Block Tutor' : 'Unblock Tutor',
        `Are you sure you want to ${willBlock ? 'block' : 'unblock'} <strong>${tutor.username}</strong>?${willBlock ? ' They will not be able to log in.' : ''}`,
        willBlock ? 'bg-destructive/20' : 'bg-primary/20',
        willBlock ? 'text-destructive' : 'text-primary',
        willBlock ? 'Block' : 'Unblock',
        willBlock ? 'bg-destructive text-white hover:bg-destructive/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'
    );
}

function showConfirmModal(title, message, iconBg, iconColor, btnText, btnClass) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').innerHTML = message;
    document.getElementById('confirmIcon').className = `w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${iconBg}`;
    document.getElementById('confirmIcon').innerHTML = `<svg class="w-7 h-7 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
    const btn = document.getElementById('confirmBtn');
    btn.textContent = btnText;
    btn.className = `flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${btnClass}`;
    btn.onclick = () => {
    if (pendingAction) pendingAction();
    pendingAction = null;
    closeConfirmModal();
    };
    modal.classList.add('open');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('open');
    pendingAction = null;
}

// Create Tutor
async function handleCreateTutor(e) {
    e.preventDefault();
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    const role = document.querySelector('input[name="role"]:checked').value;

    if (password.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
    }
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
            tutors.unshift(newTutor);
            renderTutors();

            // Add to recently created
            recentlyCreated.unshift({ username, role, time: new Date() });
            if (recentlyCreated.length > 3) recentlyCreated.pop();
            renderRecentlyCreated();

            // Reset form
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

function renderRecentlyCreated() {
    const container = document.getElementById('recentlyCreated');
    const list = document.getElementById('recentList');
    if (recentlyCreated.length === 0) { container.classList.add('hidden'); return; }
    container.classList.remove('hidden');

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

// Toast
function showToast(message, type) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-primary' : 'bg-destructive';
    toast.className = `toast ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-xs`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}