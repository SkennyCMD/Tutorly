/**
 *
 * Calendar Management Script
 *
 * 
 * Comprehensive calendar interface for managing lessons (prenotations) and notes.
 * 
 * Features:
 * - Week view (desktop) and day view (mobile)
 * - Create/edit/delete lessons (prenotations)
 * - Create/edit/delete calendar notes
 * - Manage students
 * - Tutor assignment (STAFF role)
 * - Overlapping event detection and display
 * - Real-time student search and filtering
 * - Role-based access control
 * 
 * Event Types:
 * - Lesson (prenotation): Student tutoring session with specific tutor
 * - Note: Calendar reminder/task assigned to tutor(s)
 * 
 * User Roles:
 * - STAFF: Can assign lessons/notes to any tutor, full access
 * - Regular Tutor: Can only create/edit own lessons/notes
 * 
 * Timezone Handling:
 * - All dates parsed as local time to avoid timezone shifts
 * - Server data (ISO strings) converted to local Date objects
 * 
 * Dependencies:
 * - Backend API: /api/prenotations, /api/calendar-notes, /api/students
 * - Server data: window.serverData (prenotations, calendarNotes, students, tutors)
 * ============================================================================
 */

// ============================================================================
// Global State
// ============================================================================

// Array of all calendar events (lessons + notes)
let events = [];

// ============================================================================
// Date/Time Utilities
// ============================================================================

/**
 * Parse ISO datetime string as local time (ignores timezone).
 * 
 * Prevents timezone conversion issues when displaying events.
 * Strips timezone info and parses directly into local Date object.
 * 
 * @param {string} dateString - ISO datetime string (e.g., "2024-03-15T14:30:00.000Z")
 * @returns {Date} Local Date object
 */
function parseAsLocalDate(dateString) {
  // Remove timezone info and parse as local
  const cleanDate = dateString.replace(/\.\d{3}Z?$/, '').replace(/[+-]\d{2}:\d{2}$/, '');
  const [datePart, timePart] = cleanDate.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second = 0] = (timePart || '00:00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
}


// Data Initialization


// Debug: Log server data for troubleshooting
console.log('Server Data:', window.serverData);
console.log('Prenotations:', window.serverData?.prenotations);
console.log('Calendar Notes:', window.serverData?.calendarNotes);

/**
 * Convert server prenotations (lessons) to unified event format.
 * 
 * Each prenotation becomes a 'lesson' type event with:
 * - Student information
 * - Tutor assignment
 * - Date and time range
 */
if (window.serverData && window.serverData.prenotations) {
  console.log('Converting', window.serverData.prenotations.length, 'prenotations');
  window.serverData.prenotations.forEach(prenotation => {
    const startDate = parseAsLocalDate(prenotation.startTime);
    const endDate = parseAsLocalDate(prenotation.endTime);
    
    // Format date in local timezone to avoid timezone shifts
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;
    
    events.push({
      id: prenotation.id,
      type: 'lesson',
      firstName: prenotation.studentName || 'Unknown',
      lastName: prenotation.studentSurname || '',
      classType: prenotation.studentClass || '',
      tutorUsername: prenotation.tutorUsername || '',
      tutorId: prenotation.tutorId,
      date: localDateStr,
      startTime: startDate.toTimeString().slice(0, 5),
      endTime: endDate.toTimeString().slice(0, 5)
    });
  });
}

/**
 * Convert server calendar notes to unified event format.
 * 
 * Each note becomes a 'note' type event with:
 * - Description text
 * - Date and time range
 * - Assignees (tutors)
 */
if (window.serverData && window.serverData.calendarNotes) {
  console.log('Converting', window.serverData.calendarNotes.length, 'calendar notes');
  window.serverData.calendarNotes.forEach(note => {
    const startDate = parseAsLocalDate(note.startTime);
    const endDate = parseAsLocalDate(note.endTime);
    
    // Format date in local timezone to avoid timezone shifts
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;
    
    events.push({
      id: note.id,
      type: 'note',
      description: note.description,
      date: localDateStr,
      startTime: startDate.toTimeString().slice(0, 5),
      endTime: endDate.toTimeString().slice(0, 5),
      assignees: ['myself'] // Default assignees
    });
  });
}

console.log('Total events loaded:', events.length);
console.log('Events:', events);

// Current week start for desktop week view
let currentWeekStart = getWeekStart(new Date());

// Current date for mobile day view
let currentMobileDate = new Date();

// Counter for generating new event IDs
let eventIdCounter = events.length > 0 ? Math.max(...events.map(e => e.id)) + 1 : 1;

// Student data and filtered results for search
let allStudents = [];
let filteredStudents = [];

/**
 * Get today's date as YYYY-MM-DD string.
 * 
 * @returns {string} Today's date in ISO format
 */
function getTodayString() {

  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Get the Monday of the week containing the given date.
 * 
 * @param {Date} date - Reference date
 * @returns {Date} Monday of that week
 */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

/**
 * Format Date object as YYYY-MM-DD string.
 * 
 * @param {Date} date - Date to format
 * @returns {string} Date string in YYYY-MM-DD format
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format Date object as human-readable string (e.g., "Jan 15, 2024").
 * 
 * @param {Date} date - Date to format
 * @returns {string} Human-readable date string
 */
function formatDateDisplay(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Get day of week name from Date object.
 * 
 * @param {Date} date - Date to get day name for
 * @returns {string} Day name (e.g., "Monday")
 */
function getDayName(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}


// Initialization


/**
 * Initialize calendar on page load.
 * 
 * - Renders week view (desktop)
 * - Renders mobile day view
 * - Sets up event listeners
 * - Loads students and tutors
 */
document.addEventListener('DOMContentLoaded', () => {
  renderWeekView();
  renderMobileDayView();
  setupEventListeners();
  setDefaultDates();
  loadStudents();
  loadTutors();
});


// Data Loading


/**
 * Load students from server data.
 * 
 * Populates global student arrays and updates dropdown.
 */
async function loadStudents() {
  try {
    allStudents = window.serverData?.students || [];
    filteredStudents = allStudents;
    updateStudentDropdown();
  } catch (error) {
    console.error('Error loading students:', error);
  }
}

/**
 * Load tutors from server data.
 * 
 * Updates assignees container for note creation.
 */
async function loadTutors() {
  try {
    const tutors = window.serverData?.tutors || [];
    updateAssigneesContainer(tutors);
  } catch (error) {
    console.error('Error loading tutors:', error);
  }
}

/**
 * Update assignees container with tutor checkboxes.
 * 
 * STAFF users see all tutors, regular users see only themselves.
 * Each tutor gets a colored avatar with initials.
 * 
 * @param {Array} tutors - Array of tutor objects
 */
function updateAssigneesContainer(tutors) {
  const container = document.getElementById('assigneesContainer');
  if (!container) return;
  
  const currentUserId = window.serverData?.currentUserId;
  const userRole = window.serverData?.userRole;
  const isStaff = userRole === 'STAFF';
  
  // Color classes for tutor avatars
  const colors = [
    'bg-primary/20 text-primary',
    'bg-blue-500/20 text-blue-400',
    'bg-green-500/20 text-green-400',
    'bg-pink-500/20 text-pink-400',
    'bg-purple-500/20 text-purple-400',
    'bg-orange-500/20 text-orange-400',
    'bg-teal-500/20 text-teal-400'
  ];
  
  container.innerHTML = '';
  
  // STAFF sees all tutors, regular users see only themselves
  const filteredTutors = isStaff ? tutors : tutors.filter(t => t.id === currentUserId);
  
  if (filteredTutors.length === 0) {
    container.innerHTML = '<p class="text-sm text-muted p-3">No tutors available to assign.</p>';
    return;
  }
  
  filteredTutors.forEach((tutor, index) => {
    const colorClass = colors[index % colors.length];
    const initials = (tutor.name?.substring(0, 1) || '') + (tutor.surname?.substring(0, 1) || '');
    const displayName = tutor.username + (tutor.id === currentUserId ? ' (You)' : '');
    
    const label = document.createElement('label');
    label.className = 'checkbox-item flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted transition-colors';
    
    label.innerHTML = `
      <input type="checkbox" name="assignees" value="${tutor.id}" class="w-4 h-4 rounded border-border bg-background accent-primary">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 ${colorClass} rounded-full flex items-center justify-center">
          <span class="text-xs font-medium">${initials.toUpperCase()}</span>
        </div>
        <span class="text-sm text-foreground">${displayName}</span>
      </div>
    `;
    
    container.appendChild(label);
  });
}

/**
 * Update student dropdown with filtered student list.
 * 
 * Shows student name, surname, class, and description.
 */
function updateStudentDropdown() {
  const select = document.getElementById('studentSelect');
  select.innerHTML = '<option value="">-- Select a student --</option>';
  
  filteredStudents.forEach(student => {
    const option = document.createElement('option');
    option.value = student.id;
    let displayText = `${student.name} ${student.surname} (${student.studentClass})`;
    if (student.description && student.description.trim() !== '') {
      displayText += ` - ${student.description}`;
    }
    option.textContent = displayText;
    select.appendChild(option);
  });
}

/**
 * Filter students based on search term.
 * 
 * Updates dropdown and auto-expands to show multiple matches.
 * 
 * @param {string} searchTerm - Search query for student names
 */
function filterStudents(searchTerm) {
  const term = searchTerm.toLowerCase();
  const select = document.getElementById('studentSelect');
  
  filteredStudents = allStudents.filter(student => {
    const fullName = `${student.name} ${student.surname}`.toLowerCase();
    return fullName.includes(term);
  });
  updateStudentDropdown();
  
  // Auto-open dropdown and show multiple options when typing
  if (term.length > 0 && filteredStudents.length > 0) {
    select.size = Math.min(filteredStudents.length + 1, 8); // Show up to 8 options
  } else {
    select.size = 1; // Reset to default dropdown
  }
}

/**
 * Set default dates (today) for lesson and note forms.
 */
function setDefaultDates() {
  const today = getTodayString();
  document.getElementById('lessonDate').value = today;
  document.getElementById('noteDate').value = today;
}


// Week View Rendering (Desktop)


/**
 * Render complete week view (header, day labels, time grid).
 */
function renderWeekView() {
  renderWeekHeader();
  renderDayHeaders();
  renderTimeGrid();
}

/**
 * Render week header with date range label.
 * 
 * Shows range like "January 15 - 21, 2024" or "Jan 30 - Feb 5, 2024".
 */
function renderWeekHeader() {
  const endOfWeek = new Date(currentWeekStart);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  let label = '';
  if (currentWeekStart.getMonth() === endOfWeek.getMonth()) {
    label = `${months[currentWeekStart.getMonth()]} ${currentWeekStart.getDate()} - ${endOfWeek.getDate()}, ${currentWeekStart.getFullYear()}`;
  } else if (currentWeekStart.getFullYear() === endOfWeek.getFullYear()) {
    label = `${months[currentWeekStart.getMonth()]} ${currentWeekStart.getDate()} - ${months[endOfWeek.getMonth()]} ${endOfWeek.getDate()}, ${currentWeekStart.getFullYear()}`;
  } else {
    label = `${months[currentWeekStart.getMonth()]} ${currentWeekStart.getDate()}, ${currentWeekStart.getFullYear()} - ${months[endOfWeek.getMonth()]} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
  }
  
  document.getElementById('currentWeekLabel').textContent = label;
}

/**
 * Render day headers (Mon-Sun) with dates.
 * 
 * Highlights today with primary color.
 */
function renderDayHeaders() {
  const container = document.getElementById('dayHeaders');
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  
  let html = '';
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    
    const isToday = date.toDateString() === today.toDateString();
    
    html += `
      <div class="p-2 text-center border-l border-border">
        <span class="text-xs text-muted-foreground">${days[i]}</span>
        <div class="mt-1 w-8 h-8 mx-auto rounded-full flex items-center justify-center ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}">
          <span class="text-sm font-medium">${date.getDate()}</span>
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

/**
 * Render time grid (24 hours x 7 days).
 * 
 * Creates grid cells for each hour of each day.
 * Then renders all events on the grid.
 */
function renderTimeGrid() {
  const container = document.getElementById('timeGrid');
  let html = '';
  
  // Time column + 7 day columns
  for (let hour = 0; hour < 24; hour++) {
    // Time label
    html += `
      <div class="time-slot flex items-start justify-end pr-2 pt-1">
        <span class="text-xs text-muted-foreground">${hour.toString().padStart(2, '0')}:00</span>
      </div>
    `;
    
    // Day columns
    for (let day = 0; day < 7; day++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + day);
      const dateStr = formatDate(date);
      
      html += `<div class="day-column time-slot relative" data-date="${dateStr}" data-hour="${hour}"></div>`;
    }
  }
  
  container.innerHTML = html;
  
  // Render events on the grid after grid is created
  renderEventsOnGrid();
}


// Event Rendering (Desktop)


/**
 * Render all events on the week grid.
 * 
 * Features:
 * - Detects overlapping events
 * - Adjusts width and position for overlaps
 * - Adds click handlers for editing
 * - Shows tutor name for STAFF users
 */
function renderEventsOnGrid() {
  // Clear existing events from previous render
  document.querySelectorAll('.event').forEach(el => el.remove());
  
  /**
   * Check if two events overlap in time.
   * 
   * @param {Object} event1 - First event
   * @param {Object} event2 - Second event
   * @returns {boolean} True if events overlap
   */
  function eventsOverlap(event1, event2) {
    if (event1.date !== event2.date) return false;
    
    const start1 = parseInt(event1.startTime.replace(':', ''));
    const end1 = parseInt(event1.endTime.replace(':', ''));
    const start2 = parseInt(event2.startTime.replace(':', ''));
    const end2 = parseInt(event2.endTime.replace(':', ''));
    
    return start1 < end2 && start2 < end1;
  }
  
  // Group overlapping events
  const eventGroups = [];
  events.forEach(event => {
    let addedToGroup = false;
    for (let group of eventGroups) {
      if (group.some(e => eventsOverlap(e, event))) {
        group.push(event);
        addedToGroup = true;
        break;
      }
    }
    if (!addedToGroup) {
      eventGroups.push([event]);
    }
  });
  
  events.forEach(event => {
    const startHour = parseInt(event.startTime.split(':')[0]);
    const startMinutes = parseInt(event.startTime.split(':')[1]);
    const endHour = parseInt(event.endTime.split(':')[0]);
    const endMinutes = parseInt(event.endTime.split(':')[1]);
    
    // Calculate height based on duration (60px per hour)
    const duration = (endHour * 60 + endMinutes) - (startHour * 60 + startMinutes);
    const heightPx = (duration / 60) * 60;
    const topOffset = (startMinutes / 60) * 60;
    
    // Find the group this event belongs to
    let overlappingGroup = [];
    for (let group of eventGroups) {
      if (group.includes(event)) {
        overlappingGroup = group;
        break;
      }
    }
    
    const eventIndex = overlappingGroup.indexOf(event);
    const totalOverlapping = overlappingGroup.length;
    
    // Calculate width and left position to show overlapping events side-by-side
    const widthPercent = totalOverlapping > 1 ? (100 / totalOverlapping) - 1 : 98;
    const leftPercent = totalOverlapping > 1 ? eventIndex * (100 / totalOverlapping) : 1;
    
    const cell = document.querySelector(`.day-column[data-date="${event.date}"][data-hour="${startHour}"]`);
    
    if (cell) {
      // Create event element with calculated position and size
      const eventEl = document.createElement('div');
      eventEl.className = `event event-${event.type}`;
      eventEl.style.top = `${topOffset}px`;
      eventEl.style.height = `${heightPx}px`;
      eventEl.style.minHeight = '20px';
      eventEl.style.width = `${widthPercent}%`;
      eventEl.style.left = `${leftPercent}%`;
      eventEl.style.right = 'auto';
      eventEl.style.cursor = 'pointer';
      
      // Add click handler based on event type
      const eventId = event.id;
      const eventType = event.type;
      console.log('[Desktop] Setting up click for:', eventType, 'ID:', eventId);
      if (eventType === 'lesson') {
        eventEl.addEventListener('click', (e) => {
          console.log('[Desktop] Clicked lesson ID:', eventId);
          e.stopPropagation();
          openEditPrenotationModal(eventId);
        });
      } else if (eventType === 'note') {
        eventEl.addEventListener('click', (e) => {
          console.log('[Desktop] Clicked note ID:', eventId);
          e.stopPropagation();
          openEditNoteModal(eventId);
        });
      }
      
      if (event.type === 'lesson') {
        const currentUserId = window.serverData?.currentUserId;
        const isStaff = window.serverData?.userRole === 'STAFF';
        const showTutor = isStaff && event.tutorId !== currentUserId;
        
        eventEl.innerHTML = `
          <div class="font-medium truncate">${event.firstName} ${event.lastName}</div>
          <div class="opacity-75 truncate">${event.classType} · ${event.startTime}</div>
          ${showTutor ? `<div class="opacity-60 text-xs truncate">👤 ${event.tutorUsername}</div>` : ''}
        `;
      } else {
        eventEl.innerHTML = `
          <div class="font-medium truncate">${event.description}</div>
          <div class="opacity-75 truncate">${event.startTime}</div>
        `;
      }
      
      cell.appendChild(eventEl);
    }
  });
}


// Mobile Day View Rendering


/**
 * Render mobile day view with current date.
 * 
 * Shows single day with date label and day name.
 */
function renderMobileDayView() {
  const dateLabel = document.getElementById('mobileDateLabel');
  const dayLabel = document.getElementById('mobileDayLabel');
  
  dateLabel.textContent = formatDateDisplay(currentMobileDate);
  dayLabel.textContent = getDayName(currentMobileDate);
  
  renderMobileTimeGrid();
}

/**
 * Render mobile time grid (24 hours for single day).
 * 
 * Similar to desktop but shows only one day column.
 */
function renderMobileTimeGrid() {
  const container = document.getElementById('mobileTimeGrid');
  const dateStr = formatDate(currentMobileDate);
  
  let html = '';
  
  for (let hour = 0; hour < 24; hour++) {
    html += `
      <div class="time-slot flex items-start justify-end pr-2 pt-1">
        <span class="text-xs text-muted-foreground">${hour.toString().padStart(2, '0')}:00</span>
      </div>
      <div class="day-column time-slot relative" data-date="${dateStr}" data-hour="${hour}" data-mobile="true"></div>
    `;
  }
  
  container.innerHTML = html;
  
  // Render events for the mobile view
  renderMobileEvents();
}

/**
 * Render events on mobile day view.
 * 
 * Similar to desktop rendering but for single day.
 * Handles overlapping events the same way.
 */
function renderMobileEvents() {
  const dateStr = formatDate(currentMobileDate);
  const dayEvents = events.filter(e => e.date === dateStr);
  
  /**
   * Check if two events overlap in time (mobile version).
   * 
   * @param {Object} event1 - First event
   * @param {Object} event2 - Second event
   * @returns {boolean} True if events overlap
   */
  function eventsOverlap(event1, event2) {
    const start1 = parseInt(event1.startTime.replace(':', ''));
    const end1 = parseInt(event1.endTime.replace(':', ''));
    const start2 = parseInt(event2.startTime.replace(':', ''));
    const end2 = parseInt(event2.endTime.replace(':', ''));
    
    return start1 < end2 && start2 < end1;
  }
  
  // Group overlapping events
  const eventGroups = [];
  dayEvents.forEach(event => {
    let addedToGroup = false;
    for (let group of eventGroups) {
      if (group.some(e => eventsOverlap(e, event))) {
        group.push(event);
        addedToGroup = true;
        break;
      }
    }
    if (!addedToGroup) {
      eventGroups.push([event]);
    }
  });
  
  dayEvents.forEach(event => {
    const startHour = parseInt(event.startTime.split(':')[0]);
    const startMinutes = parseInt(event.startTime.split(':')[1]);
    const endHour = parseInt(event.endTime.split(':')[0]);
    const endMinutes = parseInt(event.endTime.split(':')[1]);
    
    const duration = (endHour * 60 + endMinutes) - (startHour * 60 + startMinutes);
    const heightPx = (duration / 60) * 60;
    const topOffset = (startMinutes / 60) * 60;
    
    // Find the group this event belongs to
    let overlappingGroup = [];
    for (let group of eventGroups) {
      if (group.includes(event)) {
        overlappingGroup = group;
        break;
      }
    }
    
    const eventIndex = overlappingGroup.indexOf(event);
    const totalOverlapping = overlappingGroup.length;
    
    const widthPercent = totalOverlapping > 1 ? (100 / totalOverlapping) - 1 : 98;
    const leftPercent = totalOverlapping > 1 ? eventIndex * (100 / totalOverlapping) : 1;
    
    const cell = document.querySelector(`.day-column[data-date="${dateStr}"][data-hour="${startHour}"][data-mobile="true"]`);
    
    if (cell) {
      const eventEl = document.createElement('div');
      eventEl.className = `event event-${event.type}`;
      eventEl.style.top = `${topOffset}px`;
      eventEl.style.height = `${heightPx}px`;
      eventEl.style.minHeight = '20px';
      eventEl.style.width = `${widthPercent}%`;
      eventEl.style.left = `${leftPercent}%`;
      eventEl.style.right = 'auto';
      eventEl.style.cursor = 'pointer';
      
      // Add click handler based on event type
      const eventId = event.id;
      const eventType = event.type;
      if (eventType === 'lesson') {
        eventEl.addEventListener('click', (e) => {
          e.stopPropagation();
          openEditPrenotationModal(eventId);
        });
      } else if (eventType === 'note') {
        eventEl.addEventListener('click', (e) => {
          e.stopPropagation();
          openEditNoteModal(eventId);
        });
      }
      
      if (event.type === 'lesson') {
        const currentUserId = window.serverData?.currentUserId;
        const isStaff = window.serverData?.userRole === 'STAFF';
        const showTutor = isStaff && event.tutorId !== currentUserId;
        
        eventEl.innerHTML = `
          <div class="font-medium truncate">${event.firstName} ${event.lastName}</div>
          <div class="opacity-75 truncate">${event.classType} · ${event.startTime} - ${event.endTime}</div>
          ${showTutor ? `<div class="opacity-60 text-xs truncate">👤 ${event.tutorUsername}</div>` : ''}
        `;
      } else {
        eventEl.innerHTML = `
          <div class="font-medium truncate">${event.description}</div>
          <div class="opacity-75 truncate">${event.startTime} - ${event.endTime}</div>
        `;
      }
      
      cell.appendChild(eventEl);
    }
  });
}


// Event Listeners Setup


/**
 * Set up all event listeners for calendar interactions.
 * 
 * Includes:
 * - Mobile menu toggle
 * - Week/day navigation
 * - Modal open/close
 * - Form submissions
 * - Student search
 */
function setupEventListeners() {
  // Mobile menu
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.add('open');
    document.getElementById('menuOverlay').classList.remove('hidden');
  });
  
  document.getElementById('closeMenu').addEventListener('click', closeMenu);
  document.getElementById('menuOverlay').addEventListener('click', closeMenu);
  
  // Week navigation
  document.getElementById('prevWeek').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    renderWeekView();
  });
  
  document.getElementById('nextWeek').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    renderWeekView();
  });
  
  document.getElementById('todayBtn').addEventListener('click', () => {
    currentWeekStart = getWeekStart(new Date());
    currentMobileDate = new Date();
    renderWeekView();
    renderMobileDayView();
  });
  
  // Mobile day navigation
  document.getElementById('prevDay').addEventListener('click', () => {
    currentMobileDate.setDate(currentMobileDate.getDate() - 1);
    renderMobileDayView();
  });
  
  document.getElementById('nextDay').addEventListener('click', () => {
    currentMobileDate.setDate(currentMobileDate.getDate() + 1);
    renderMobileDayView();
  });
  
  // Modal buttons
  document.getElementById('addLessonBtn').addEventListener('click', openLessonModal);
  document.getElementById('addNoteBtn').addEventListener('click', openNoteModal);
  
  // Forms
  document.getElementById('lessonForm').addEventListener('submit', handleLessonSubmit);
  document.getElementById('noteForm').addEventListener('submit', handleNoteSubmit);
  document.getElementById('addStudentForm').addEventListener('submit', handleAddStudentSubmit);
  
  // Student search - real-time filtering
  document.getElementById('studentSearch').addEventListener('input', (e) => {
    filterStudents(e.target.value);
  });
}

// Edit student search filter - updates edit modal dropdown
document.getElementById('editStudentSearch').addEventListener('input', function(e) {
filterEditStudents(e.target.value);
});

/**
 * Close mobile menu.
 */
function closeMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
  document.getElementById('menuOverlay').classList.add('hidden');
}


// Lesson Modal


/**
 * Open lesson (prenotation) creation modal.
 * 
 * - Resets student search
 * - Shows tutor assignment for STAFF users
 * - Auto-assigns to current user
 */
function openLessonModal() {
  document.getElementById('addLessonModal').classList.add('open');
  // Reset search when opening modal
  document.getElementById('studentSearch').value = '';
  filteredStudents = allStudents;
  updateStudentDropdown();
  // Reset dropdown to normal size
  document.getElementById('studentSelect').size = 1;
  closeMenu();
  
  // Auto-assign to current user
  const currentUserId = window.serverData?.currentUserId;
  const userRole = window.serverData?.userRole;
  const isStaff = userRole === 'STAFF';
  
  // Hide "Assign To" section if not STAFF
  const lessonAssignToSection = document.getElementById('lessonAssignToSection');
  if (lessonAssignToSection) {
    lessonAssignToSection.style.display = isStaff ? 'block' : 'none';
  }
  
  // Populate tutors in lesson modal
  populateLessonTutors();
  
  // Auto-check current user's checkbox
  setTimeout(() => {
    if (currentUserId) {
      const myselfCheckbox = document.querySelector(`input[name="lessonTutors"][value="${currentUserId}"]`);
      if (myselfCheckbox) {
        myselfCheckbox.checked = true;
      }
    }
  }, 100);
}

/**
 * Close lesson creation modal and reset form.
 */
function closeLessonModal() {
  document.getElementById('addLessonModal').classList.remove('open');
  document.getElementById('lessonForm').reset();
  document.getElementById('studentSelect').size = 1;
  setDefaultDates();
}


// Note Modal


/**
 * Open calendar note creation modal.
 * 
 * - Shows assignee selection for STAFF users
 * - Auto-assigns to current user
 */
function openNoteModal() {
  document.getElementById('addNoteModal').classList.add('open');
  closeMenu();
  
  // Auto-assign to current user
  const currentUserId = window.serverData?.currentUserId;
  const userRole = window.serverData?.userRole;
  const isStaff = userRole === 'STAFF';
  
  // Hide "Assign To" section if not STAFF
  const assignToSection = document.getElementById('assignToSection');
  if (assignToSection) {
    assignToSection.style.display = isStaff ? 'block' : 'none';
  }
  
  // Auto-check current user's checkbox
  setTimeout(() => {
    if (currentUserId) {
      const myselfCheckbox = document.querySelector(`input[name="assignees"][value="${currentUserId}"]`);
      if (myselfCheckbox) {
        myselfCheckbox.checked = true;
      }
    }
  }, 100);
}

/**
 * Close note creation modal and reset form.
 */
function closeNoteModal() {
  document.getElementById('addNoteModal').classList.remove('open');
  document.getElementById('noteForm').reset();
  setDefaultDates();
}

/**
 * Open student creation modal.
 */
function openAddStudentModal() {
  document.getElementById('addStudentModal').classList.add('open');
}

/**
 * Close student creation modal and reset form.
 */
function closeAddStudentModal() {
  document.getElementById('addStudentModal').classList.remove('open');
  document.getElementById('addStudentForm').reset();
}


// Form Submission Handlers


/**
 * Handle student creation form submission.
 * 
 * Creates new student and adds to dropdown.
 * Auto-selects the new student after creation.
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
      
      // Add to students list
      allStudents.push(newStudent);
      filteredStudents.push(newStudent);
      updateStudentDropdown();
      
      // Auto-select the new student
      document.getElementById('studentSelect').value = newStudent.id;
    } else {
      const error = await response.json();
      alert('Failed to add student: ' + (error.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error adding student:', error);
    alert('Failed to add student. Please try again.');
  }
}

/**
 * Populate lesson tutors container (radio buttons).
 * 
 * Used in lesson creation modal.
 * Shows all tutors with colored avatars.
 */
function populateLessonTutors() {
  const container = document.getElementById('lessonTutorsContainer');
  if (!container) return;
  
  const tutors = window.serverData?.tutors || [];
  const currentUserId = window.serverData?.currentUserId;
  
  const colors = [
    'bg-primary/20 text-primary',
    'bg-blue-500/20 text-blue-400',
    'bg-green-500/20 text-green-400',
    'bg-pink-500/20 text-pink-400',
    'bg-purple-500/20 text-purple-400',
    'bg-orange-500/20 text-orange-400',
    'bg-teal-500/20 text-teal-400'
  ];
  
  container.innerHTML = '';
  
  if (tutors.length === 0) {
    container.innerHTML = '<p class="text-sm text-muted p-3">No tutors available.</p>';
    return;
  }
  
  tutors.forEach((tutor, index) => {
    const colorClass = colors[index % colors.length];
    const initials = (tutor.name?.substring(0, 1) || '') + (tutor.surname?.substring(0, 1) || '');
    const displayName = tutor.username + (tutor.id === currentUserId ? ' (You)' : '');
    
    const label = document.createElement('label');
    label.className = 'checkbox-item flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted transition-colors';
    
    label.innerHTML = `
      <input type="radio" name="lessonTutors" value="${tutor.id}" class="w-4 h-4 rounded border-border bg-background accent-primary">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 ${colorClass} rounded-full flex items-center justify-center">
          <span class="text-xs font-medium">${initials.toUpperCase()}</span>
        </div>
        <span class="text-sm text-foreground">${displayName}</span>
      </div>
    `;
    
    container.appendChild(label);
  });
}

/**
 * Auto-assign lesson to current user (radio button).
 * 
 * Helper function for lesson modal.
 */
function assignLessonToMyself() {
  const currentUserId = window.serverData?.currentUserId;
  if (!currentUserId) return;
  
  const myselfRadio = document.querySelector(`input[name="lessonTutors"][value="${currentUserId}"]`);
  if (myselfRadio) {
    myselfRadio.checked = true;
  }
}

/**
 * Auto-assign note to current user (checkbox).
 * 
 * Helper function for note modal.
 */
function assignToMyself() {
  const currentUserId = window.serverData?.currentUserId;
  if (!currentUserId) return;
  
  const myselfCheckbox = document.querySelector(`input[name="assignees"][value="${currentUserId}"]`);
  if (myselfCheckbox) {
    myselfCheckbox.checked = true;
  }
}

/**
 * Handle lesson (prenotation) creation form submission.
 * 
 * Validates student selection and times.
 * For STAFF: uses selected tutor or defaults to current user.
 * For regular users: assigns to current user.
 * Reloads page on success to refresh data.
 * 
 * @param {Event} e - Form submit event
 */
async function handleLessonSubmit(e) {
  e.preventDefault();
  
  const studentId = document.getElementById('studentSelect').value;
  const lessonDate = document.getElementById('lessonDate').value;
  const startTime = document.getElementById('lessonStartTime').value;
  const endTime = document.getElementById('lessonEndTime').value;
  
  if (!studentId) {
    alert('Please select a student');
    return;
  }
  
  if (!startTime || !endTime) {
    alert('Please enter start and end times');
    return;
  }
  
  // Get selected tutor (for STAFF users)
  const selectedTutorRadio = document.querySelector('input[name="lessonTutors"]:checked');
  let assignedTutorId = selectedTutorRadio ? parseInt(selectedTutorRadio.value) : null;
  
  // If no tutor selected, default to current user
  if (!assignedTutorId) {
    assignedTutorId = window.serverData?.currentUserId;
  }
  
  // Prepare datetime with the selected date
  const [year, month, day] = lessonDate.split('-');
  const startDateTime = `${year}-${month}-${day}T${startTime}:00`;
  const endDateTime = `${year}-${month}-${day}T${endTime}:00`;
  
  const payload = {
    studentId,
    startTime: startDateTime,
    endTime: endDateTime
  };
  
  // Add tutorId if different from current user
  if (assignedTutorId && assignedTutorId !== window.serverData?.currentUserId) {
    payload.tutorId = assignedTutorId;
  }
  
  try {
    const response = await fetch('/api/prenotations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      alert('Prenotation created successfully!');
      closeLessonModal();
      
      // Reload page to refresh server-rendered data
      window.location.reload();
    } else {
      const error = await response.json();
      alert('Failed to create prenotation: ' + (error.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error creating prenotation:', error);
    alert('Failed to create prenotation. Please try again.');
  }
}

/**
 * Handle calendar note creation form submission.
 * 
 * Validates description and times.
 * For STAFF: assigns to selected tutors.
 * For regular users: assigns to current user only.
 * Reloads page on success to refresh data.
 * 
 * @param {Event} e - Form submit event
 */
async function handleNoteSubmit(e) {
  e.preventDefault();
  
  const description = document.getElementById('noteDescription').value;
  const noteDate = document.getElementById('noteDate').value;
  const startTime = document.getElementById('noteStartTime').value;
  const endTime = document.getElementById('noteEndTime').value;
  
  if (!description) {
    alert('Please enter a description');
    return;
  }
  
  if (!startTime || !endTime) {
    alert('Please enter start and end times');
    return;
  }
  
  // Get selected assignee tutor IDs
  const assigneeCheckboxes = document.querySelectorAll('input[name="assignees"]:checked');
  let tutorIds = Array.from(assigneeCheckboxes).map(cb => parseInt(cb.value));
  
  // If no tutors selected (non-STAFF users), default to current user
  if (tutorIds.length === 0) {
    const currentUserId = window.serverData?.currentUserId;
    if (currentUserId) {
      tutorIds = [currentUserId];
    }
  }
  
  // Prepare datetime with the selected date
  const [year, month, day] = noteDate.split('-');
  const startDateTime = `${year}-${month}-${day}T${startTime}:00`;
  const endDateTime = `${year}-${month}-${day}T${endTime}:00`;
  
  try {
    const response = await fetch('/api/calendar-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description,
        startTime: startDateTime,
        endTime: endDateTime,
        tutorIds: tutorIds
      })
    });
    
    if (response.ok) {
      alert('Calendar note created successfully!');
      closeNoteModal();
      
      // Reload page to refresh server-rendered data
      window.location.reload();
    } else {
      const error = await response.json();
      alert('Failed to create calendar note: ' + (error.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error creating calendar note:', error);
    alert('Failed to create calendar note. Please try again.');
  }
}


// Edit Prenotation Modal


/**
 * Open edit modal for existing prenotation.
 * 
 * Populates form with current prenotation data.
 * Shows tutor assignment for STAFF users.
 * 
 * @param {number} prenotationId - ID of prenotation to edit
 */
window.openEditPrenotationModal = function(prenotationId) {
  console.log('[PRENOTATION] Opening modal for ID:', prenotationId);
  console.log('[PRENOTATION] Available prenotations:', window.serverData.prenotations);
  const prenotation = window.serverData.prenotations.find(p => p.id === prenotationId);
  console.log('[PRENOTATION] Found:', prenotation);
  if (!prenotation) {
    console.error('Prenotation not found for ID:', prenotationId);
    return;
  }

  console.log('[PRENOTATION] Step 1: Setting prenotation ID');
  // Populate form fields
  const editPrenotationIdElement = document.getElementById('editPrenotationId');
  console.log('[PRENOTATION] editPrenotationId element:', editPrenotationIdElement);
  if (!editPrenotationIdElement) {
    console.error('[PRENOTATION] ERROR: editPrenotationId element not found!');
    return;
  }
  editPrenotationIdElement.value = prenotation.id;
  
  console.log('[PRENOTATION] Step 2: Setting student');
  // Set student
  const studentId = prenotation.student?.id || prenotation.studentId;
  console.log('[PRENOTATION] Student ID:', studentId);
  
  console.log('[PRENOTATION] Step 3: Updating student dropdown');
  updateEditStudentDropdown('');
  
  // Select the student after populating the dropdown
  const studentSelect = document.getElementById('editStudentSelect');
  studentSelect.value = studentId;

  console.log('[PRENOTATION] Step 4: Setting dates');
  // Set date and times
  const startDate = parseAsLocalDate(prenotation.startTime);
  const endDate = parseAsLocalDate(prenotation.endTime);
  document.getElementById('editPrenotationDate').value = formatDateForInput(startDate);
  document.getElementById('editPrenotationStartTime').value = formatTimeForInput(startDate);
  document.getElementById('editPrenotationEndTime').value = formatTimeForInput(endDate);

  console.log('[PRENOTATION] Step 5: Checking STAFF role');
  // Populate tutor assignment for STAFF
  const assignToSection = document.getElementById('editPrenotationAssignToSection');
  if (window.serverData.userRole === 'STAFF') {
    console.log('[PRENOTATION] User is STAFF, populating tutors');
    assignToSection.style.display = 'block';
    
    const container = document.getElementById('editPrenotationTutorsContainer');
    container.innerHTML = '';
    
    const assignedTutorId = prenotation.tutor?.id || prenotation.tutorId;
    
    console.log('[PRENOTATION] Sample tutor object:', window.serverData.tutors[0]);
    
    window.serverData.tutors.forEach(tutor => {
      const isAssigned = assignedTutorId === tutor.id;
      const radioDiv = document.createElement('div');
      radioDiv.className = 'flex items-center';
      // Tutors have username field, not name/surname
      const tutorName = tutor.username || `Tutor ${tutor.id}`;
      radioDiv.innerHTML = `
        <input type="radio" id="editTutor${tutor.id}" name="editAssignToTutor" 
                value="${tutor.id}" ${isAssigned ? 'checked' : ''}
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500">
        <label for="editTutor${tutor.id}" class="ml-2 text-sm font-medium text-white">
          ${tutorName}
        </label>
      `;
      container.appendChild(radioDiv);
    });
  } else {
    // Hide assign section for non-STAFF users
    assignToSection.style.display = 'none';
  }

  console.log('[PRENOTATION] Step 6: Opening modal');
  const modalElement = document.getElementById('editPrenotationModal');
  console.log('[PRENOTATION] Modal element:', modalElement);
  if (!modalElement) {
    console.error('[PRENOTATION] ERROR: editPrenotationModal element not found!');
    return;
  }
  console.log('[PRENOTATION] Modal classes before:', modalElement.className);
  modalElement.classList.add('open');
  console.log('[PRENOTATION] Modal classes after:', modalElement.className);
  console.log('[PRENOTATION] Modal opened successfully');
};

/**
 * Close edit prenotation modal and reset form.
 */
window.closeEditPrenotationModal = function() {
  document.getElementById('editPrenotationModal').classList.remove('open');
  document.getElementById('editPrenotationForm').reset();
  
  // Reset student select size
  const select = document.getElementById('editStudentSelect');
  select.size = 1;
};

/**
 * Delete prenotation after confirmation.
 * 
 * Shows confirm dialog and reloads page on success.
 */
window.deletePrenotation = async function() {
  if (!confirm('Are you sure you want to delete this prenotation?')) return;

  const prenotationId = document.getElementById('editPrenotationId').value;

  try {
    const response = await fetch(`/api/prenotations/${prenotationId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      alert('Prenotation deleted successfully!');
      closeEditPrenotationModal();
      window.location.reload();
    } else {
      const error = await response.json();
      alert('Failed to delete prenotation: ' + (error.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error deleting prenotation:', error);
    alert('Failed to delete prenotation. Please try again.');
  }
};

/**
 * Handle edit prenotation form submission.
 * 
 * Updates prenotation with new data.
 * For STAFF: can change assigned tutor.
 * Reloads page on success.
 */
document.getElementById('editPrenotationForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const prenotationId = document.getElementById('editPrenotationId').value;
  const studentId = document.getElementById('editStudentSelect').value;
  const prenotationDate = document.getElementById('editPrenotationDate').value;
  const startTime = document.getElementById('editPrenotationStartTime').value;
  const endTime = document.getElementById('editPrenotationEndTime').value;

  if (!studentId || studentId === '') {
    alert('Please select a student');
    return;
  }

  if (!startTime || !endTime) {
    alert('Please enter start and end times');
    return;
  }

  // Get selected tutor (for STAFF users) or use current user
  let tutorId = window.serverData.currentUserId;
  if (window.serverData.userRole === 'STAFF') {
    const selectedTutor = document.querySelector('input[name="editAssignToTutor"]:checked');
    if (selectedTutor) {
      tutorId = parseInt(selectedTutor.value);
    }
  }

  const [year, month, day] = prenotationDate.split('-');
  const startDateTime = `${year}-${month}-${day}T${startTime}:00`;
  const endDateTime = `${year}-${month}-${day}T${endTime}:00`;

  try {
    const response = await fetch(`/api/prenotations/${prenotationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studentId: parseInt(studentId),
        startTime: startDateTime,
        endTime: endDateTime,
        tutorId: tutorId
      })
    });

    if (response.ok) {
      alert('Prenotation updated successfully!');
      closeEditPrenotationModal();
      window.location.reload();
    } else {
      const error = await response.json();
      alert('Failed to update prenotation: ' + (error.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error updating prenotation:', error);
    alert('Failed to update prenotation. Please try again.');
  }
});

/**
 * Filter students in edit modal based on search term.
 * 
 * Shows/hides options and adjusts dropdown size.
 * 
 * @param {string} searchTerm - Search query
 */
function filterEditStudents(searchTerm) {
  const select = document.getElementById('editStudentSelect');
  const options = select.querySelectorAll('option');
  let visibleCount = 0;

  options.forEach(option => {
    if (option.value === '') {
      option.style.display = 'none';
      return;
    }

    const text = option.textContent.toLowerCase();
    const matches = text.includes(searchTerm.toLowerCase());
    option.style.display = matches ? '' : 'none';
    if (matches) visibleCount++;
  });

  select.size = Math.min(Math.max(visibleCount, 1), 8);
}

/**
 * Update student dropdown in edit prenotation modal.
 * 
 * Filters students by search term and populates dropdown.
 * 
 * @param {string} searchTerm - Filter query
 */
function updateEditStudentDropdown(searchTerm) {
  const select = document.getElementById('editStudentSelect');
  select.innerHTML = '<option value="">-- Select Student --</option>';
  
  const students = window.serverData.students || [];
  const filteredStudents = students.filter(student => {
    const studentClass = student.studentClass || student.class || '';
    const fullName = `${student.name} ${student.surname} (${studentClass})`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  filteredStudents.forEach(student => {
    const option = document.createElement('option');
    option.value = student.id;
    const studentClass = student.studentClass || student.class || '';
    const displayText = `${student.name} ${student.surname} (${studentClass})`;
    option.textContent = student.description ? `${displayText} - ${student.description}` : displayText;
    select.appendChild(option);
  });

  const visibleCount = filteredStudents.length;
  select.size = Math.min(Math.max(visibleCount, 1), 8);
}


// Edit Calendar Note Modal


/**
 * Open edit modal for existing calendar note.
 * 
 * Fetches full note details from server (including assignees).
 * Only creator can edit the note.
 * Shows assignee selection for STAFF users.
 * 
 * @param {number} noteId - ID of note to edit
 */
window.openEditNoteModal = async function(noteId) {
  console.log('[NOTE] Opening modal for ID:', noteId);
  const note = window.serverData.calendarNotes.find(n => n.id === noteId);
  console.log('[NOTE] Found in local data:', note);
  if (!note) {
    console.error('Note not found for ID:', noteId);
    return;
  }

  // Fetch full note details from server to get tutors list
  console.log('[NOTE] Fetching full details from server...');
  try {
    const response = await fetch(`/api/calendar-notes/${noteId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch note details');
    }
    const fullNote = await response.json();
    console.log('[NOTE] Full note from server:', fullNote);
    console.log('[NOTE] Tutors array:', fullNote.tutors);
    
    // Check if current user is the creator
    const currentUserId = window.serverData.currentUserId;
    const creatorId = fullNote.creator?.id;
    console.log('[NOTE] Current user ID:', currentUserId, 'Creator ID:', creatorId);
    
    if (creatorId && creatorId !== currentUserId) {
      alert('Only the creator can edit this note');
      return;
    }

    // Populate form fields
    document.getElementById('editNoteId').value = fullNote.id;
    document.getElementById('editNoteDescription').value = fullNote.description;

    // Set date and times
    const startDate = parseAsLocalDate(fullNote.startTime);
    const endDate = parseAsLocalDate(fullNote.endTime);
    document.getElementById('editNoteDate').value = formatDateForInput(startDate);
    document.getElementById('editNoteStartTime').value = formatTimeForInput(startDate);
    document.getElementById('editNoteEndTime').value = formatTimeForInput(endDate);

    // Populate assignees (only for STAFF users)
    const assignToSection = document.getElementById('editNoteAssignToSection');
    if (window.serverData.userRole === 'STAFF') {
      assignToSection.style.display = 'block';
      
      const container = document.getElementById('editNoteAssigneesContainer');
      container.innerHTML = '';
      
      // Get assigned tutor IDs from full note details
      const assignedTutorIds = fullNote.tutors ? fullNote.tutors.map(t => t.id) : [];
      console.log('[NOTE] Assigned tutor IDs:', assignedTutorIds);
      
      window.serverData.tutors.forEach(tutor => {
        const isAssigned = assignedTutorIds.includes(tutor.id);
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'flex items-center';
        const tutorName = tutor.username || `Tutor ${tutor.id}`;
        checkboxDiv.innerHTML = `
          <input type="checkbox" id="editAssignee${tutor.id}" name="editAssignees" 
                  value="${tutor.id}" ${isAssigned ? 'checked' : ''}
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500">
          <label for="editAssignee${tutor.id}" class="ml-2 text-sm font-medium text-white">
            ${tutorName}
          </label>
        `;
        container.appendChild(checkboxDiv);
      });
    } else {
      // Hide assign section for non-STAFF users
      assignToSection.style.display = 'none';
    }

    document.getElementById('editNoteModal').classList.add('open');
  } catch (error) {
    console.error('Error fetching note details:', error);
    alert('Failed to load note details');
  }
};

/**
 * Close edit note modal and reset form.
 */
window.closeEditNoteModal = function() {
  document.getElementById('editNoteModal').classList.remove('open');
  document.getElementById('editNoteForm').reset();
};

/**
 * Delete calendar note after confirmation.
 * 
 * Shows confirm dialog and reloads page on success.
 */
window.deleteNote = async function() {
  if (!confirm('Are you sure you want to delete this note?')) return;

  const noteId = document.getElementById('editNoteId').value;

  try {
    const response = await fetch(`/api/calendar-notes/${noteId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      alert('Note deleted successfully!');
      closeEditNoteModal();
      window.location.reload();
    } else {
      const error = await response.json();
      alert('Failed to delete note: ' + (error.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    alert('Failed to delete note. Please try again.');
  }
};

/**
 * Handle edit note form submission.
 * 
 * Updates note with new data.
 * For STAFF: can change assignees.
 * For regular users: keeps current user as assignee.
 * Reloads page on success.
 */
document.getElementById('editNoteForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const noteId = document.getElementById('editNoteId').value;
  const description = document.getElementById('editNoteDescription').value;
  const noteDate = document.getElementById('editNoteDate').value;
  const startTime = document.getElementById('editNoteStartTime').value;
  const endTime = document.getElementById('editNoteEndTime').value;

  if (!description) {
    alert('Please enter a description');
    return;
  }

  if (!startTime || !endTime) {
    alert('Please enter start and end times');
    return;
  }

  // Get selected assignee tutor IDs (only if STAFF, otherwise keep existing assignments)
  let tutorIds;
  if (window.serverData.userRole === 'STAFF') {
    const assigneeCheckboxes = document.querySelectorAll('input[name="editAssignees"]:checked');
    tutorIds = Array.from(assigneeCheckboxes).map(cb => parseInt(cb.value));
    
    // If no tutors selected, default to current user
    if (tutorIds.length === 0) {
      tutorIds = [window.serverData.currentUserId];
    }
  } else {
    // For non-STAFF users, keep current user as the only assignee
    tutorIds = [window.serverData.currentUserId];
  }

  const [year, month, day] = noteDate.split('-');
  const startDateTime = `${year}-${month}-${day}T${startTime}:00`;
  const endDateTime = `${year}-${month}-${day}T${endTime}:00`;

  try {
    const response = await fetch(`/api/calendar-notes/${noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description,
        startTime: startDateTime,
        endTime: endDateTime,
        tutorIds: tutorIds
      })
    });

    if (response.ok) {
      alert('Note updated successfully!');
      closeEditNoteModal();
      window.location.reload();
    } else {
      const error = await response.json();
      alert('Failed to update note: ' + (error.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error updating note:', error);
    alert('Failed to update note. Please try again.');
  }
});


// Date/Time Formatting Helpers


/**
 * Format Date object for input field (YYYY-MM-DD).
 * 
 * @param {Date} date - Date to format
 * @returns {string} Date string for input value
 */
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format Date object for time input field (HH:mm).
 * 
 * @param {Date} date - Date to format
 * @returns {string} Time string for input value
 */
function formatTimeForInput(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}