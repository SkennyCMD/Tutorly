/**
 *
 * Home Dashboard Script
 *
 * 
 * Main dashboard interface showing today's overview for tutors.
 * 
 * Features:
 * - Current date display
 * - Monthly calendar view with navigation
 * - Today's tasks/notes list with time ranges
 * - Today's lessons table (responsive: table on desktop, cards on mobile)
 * - Student creation modal
 * - Mobile menu
 * 
 * Data Sources:
 * - Tasks (calendar notes): From window.initialTasks (server-rendered)
 * - Lessons (prenotations): From window.initialLessons (server-rendered)
 * 
 * Responsive Design:
 * - Desktop: Shows lessons in table format
 * - Mobile: Shows lessons as cards, collapsible menu
 * 
 * Dependencies:
 * - Backend API: /api/students (POST)
 * - modalShared.js: Modal initialization for calendar notes
 *
 */


// Global State


// Array of today's lessons (prenotations)
let lessons = [];

// Array of today's tasks (calendar notes)
let tasks = [];

// Current actual date (for "today" display)
let currentDate = new Date();

// Calendar display date (can be navigated month-by-month)
let calendarDate = new Date();


// Initialization


/**
 * Initialize the home dashboard on page load.
 * 
 * - Updates current date display
 * - Renders calendar for current month
 * - Loads tasks and lessons from server data
 * - Sets up event listeners
 * - Initializes modal system
 */
document.addEventListener('DOMContentLoaded', () => {
  updateCurrentDate();
  renderCalendar();
  loadTasks();
  loadLessons();
  setupEventListeners();
  
  // Initialize modal with page reload callback to refresh server-rendered data
  initializeModal(() => {
    window.location.reload();
  });
});


// Data Loading


/**
 * Load tasks from server-rendered initial data.
 * 
 * Tasks are calendar notes assigned to the current tutor for today.
 * Renders tasks list after loading.
 */
async function loadTasks() {
  try {
    tasks = window.initialTasks || [];
    renderTasks();
  } catch (error) {
    console.error('Error loading tasks:', error);
    renderTasks(); // Render empty state
  }
}

/**
 * Load lessons from server-rendered initial data.
 * 
 * Lessons are prenotations (tutoring sessions) for today.
 * Renders lessons table/list after loading.
 */
async function loadLessons() {
  try {
    lessons = window.initialLessons || [];
    renderLessons();
  } catch (error) {
    console.error('Error loading lessons:', error);
    renderLessons(); // Render empty state
  }
}


// Date Display


/**
 * Update current date display in header.
 * 
 * Shows date in format: "Thu, 15 Feb"
 */
function updateCurrentDate() {
  const options = { weekday: 'short', day: 'numeric', month: 'short' };
  document.getElementById('currentDate').textContent = currentDate.toLocaleDateString('en-US', options);
}


// Calendar Rendering


/**
 * Render calendar for the current calendarDate month.
 * 
 * Features:
 * - Shows full month grid (Mon-Sun)
 * - Highlights today with primary color
 * - Handles different month start days
 * - Empty cells before month starts
 */
function renderCalendar() {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  document.getElementById('calendarMonth').textContent = `${monthNames[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`;
  
  const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
  const lastDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
  const startDay = (firstDay.getDay() + 6) % 7;
  
  let html = '';
  
  // Empty cells for days before month starts (e.g., if month starts on Wednesday)
  for (let i = 0; i < startDay; i++) {
    html += '<span class="py-1.5"></span>';
  }
  
  // Days of the month (1 to last day)
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const isToday = day === currentDate.getDate() && 
                    calendarDate.getMonth() === currentDate.getMonth() && 
                    calendarDate.getFullYear() === currentDate.getFullYear();
    
    // Highlight today with primary color, others with hover effect
    html += `<span class="py-1.5 rounded-lg cursor-pointer transition-colors ${isToday ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-secondary text-foreground'}">${day}</span>`;
  }
  
  document.getElementById('calendarDays').innerHTML = html;
}


// Tasks Rendering


/**
 * Render today's tasks (calendar notes) list.
 * 
 * Shows:
 * - Task description
 * - Time range (if available)
 * - Empty state if no tasks
 */
function renderTasks() {
  const container = document.getElementById('tasksList');
  
  // Show empty state if no tasks
  if (tasks.length === 0) {
    container.innerHTML = '<p class="text-sm text-muted-foreground py-2">There are no tasks for today</p>';
    return;
  }
  
  // Render each task with bullet point and time range
  container.innerHTML = tasks.map(task => {
    const startTime = task.startTime ? new Date(task.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
    const endTime = task.endTime ? new Date(task.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
    const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : '';
    
    return `
      <div class="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary transition-colors">
        <span class="text-primary mt-1">•</span>
        <div class="flex-1">
          <span class="text-sm text-foreground block">${task.text}</span>
          ${timeRange ? `<span class="text-xs text-muted-foreground">${timeRange}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}


// Lessons Rendering


/**
 * Render today's lessons (prenotations).
 * 
 * Responsive rendering:
 * - Desktop: Table format with columns (Student, Class, Time, Status)
 * - Mobile: Card list with avatars and details
 * 
 * Shows:
 * - Student avatar with initials
 * - Full name
 * - Class type (M/S/U)
 * - Time range
 * - Status badge (Done/Confirmed/etc)
 */
function renderLessons() {
  const tableBody = document.getElementById('lessonsTableBody');
  const mobileList = document.getElementById('lessonsMobileList');
  const emptyState = document.getElementById('emptyLessons');
  const countEl = document.getElementById('lessonCount');
  
  // Update lesson count display
  countEl.textContent = `${lessons.length} lesson${lessons.length !== 1 ? 's' : ''}`;
  
  // Show empty state if no lessons
  if (lessons.length === 0) {
    tableBody.innerHTML = '';
    mobileList.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  
  // Desktop table view - full details in table rows
  tableBody.innerHTML = lessons.map(lesson => `
    <tr class="group">
      <td class="py-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-secondary rounded-full flex items-center justify-center">
            <span class="text-sm font-medium text-foreground">${lesson.firstName[0]}${lesson.lastName ? lesson.lastName[0] : ''}</span>
          </div>
          <span class="font-medium text-foreground">${lesson.firstName} ${lesson.lastName}</span>
        </div>
      </td>
      <td class="py-4">
        <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-sm font-medium text-foreground">${lesson.classType}</span>
      </td>
      <td class="py-4 text-muted-foreground">${new Date(lesson.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(lesson.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</td>
      <td class="py-4 text-right">
        ${lesson.status ? `<span class="text-xs px-2 py-1 rounded ${lesson.status === 'Done' ? 'bg-primary/10 text-primary' : lesson.status === 'Confirmed' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}">${lesson.status}</span>` : ''}
      </td>
    </tr>
  `).join('');
  
  // Mobile list view - card layout with avatars and compact info
  mobileList.innerHTML = lessons.map(lesson => `
    <div class="flex items-center justify-between p-4 bg-secondary rounded-xl">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-card rounded-full flex items-center justify-center border border-border">
          <span class="text-sm font-medium text-foreground">${lesson.firstName[0]}${lesson.lastName ? lesson.lastName[0] : ''}</span>
        </div>
        <div>
          <p class="font-medium text-foreground">${lesson.firstName} ${lesson.lastName}</p>
          <p class="text-sm text-muted-foreground">${new Date(lesson.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(lesson.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-card border border-border text-sm font-medium text-foreground">${lesson.classType}</span>
        ${lesson.status ? `<span class="text-xs px-2 py-1 rounded ${lesson.status === 'Done' ? 'bg-primary/10 text-primary' : lesson.status === 'Confirmed' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}">${lesson.status}</span>` : ''}
      </div>
    </div>
  `).join('');
}


// Event Listeners Setup


/**
 * Set up all event listeners for the home dashboard.
 * 
 * Handles:
 * - Mobile menu toggle
 * - Calendar month navigation
 * - Student creation form submission
 */
function setupEventListeners() {
  // Mobile menu
  const menuToggle = document.getElementById('menuToggle');
  const closeMenu = document.getElementById('closeMenu');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuOverlay = document.getElementById('menuOverlay');
  
  // Open mobile menu
  menuToggle.addEventListener('click', () => {
    mobileMenu.classList.add('open');
    menuOverlay.classList.remove('hidden');
  });
  
  // Close mobile menu function
  const closeMenuFn = () => {
    mobileMenu.classList.remove('open');
    menuOverlay.classList.add('hidden');
  };
  
  closeMenu.addEventListener('click', closeMenuFn);
  menuOverlay.addEventListener('click', closeMenuFn);
  
  // Calendar navigation - previous month
  document.getElementById('prevMonth').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
  });
  
  // Calendar navigation - next month
  document.getElementById('nextMonth').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
  });
  
  // Add student form submission
  document.getElementById('addStudentForm').addEventListener('submit', handleAddStudentSubmit);
}


// Student Modal Functions


/**
 * Open the student creation modal.
 */
function openAddStudentModal() {
  document.getElementById('addStudentModal').classList.add('open');
}

/**
 * Close the student creation modal and reset form.
 */
function closeAddStudentModal() {
  document.getElementById('addStudentModal').classList.remove('open');
  document.getElementById('addStudentForm').reset();
}

/**
 * Handle student creation form submission.
 * 
 * - Validates form data
 * - Sends POST request to /api/students
 * - Shows success/error message
 * - Reloads page on success to refresh student list
 * 
 * @param {Event} e - Form submit event
 */
async function handleAddStudentSubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById('studentName').value;
  const surname = document.getElementById('studentSurname').value;
  const studentClass = document.getElementById('studentClass').value;
  const description = document.getElementById('studentDescription').value;
  
  try {
    const response = await fetch('/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        surname,
        studentClass,
        description
      })
    });
    
    if (response.ok) {
      const newStudent = await response.json();
      alert('Student added successfully!');
      closeAddStudentModal();
      
      // Reload page to refresh student list and other data
      window.location.reload();
    } else {
      const error = await response.json();
      alert('Failed to add student: ' + (error.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error adding student:', error);
    alert('Failed to add student. Please try again.');
  }
}