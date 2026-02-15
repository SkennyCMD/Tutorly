/**
 *
 * Modal Shared Functions
 *
 * 
 * Reusable modal functionality for lesson creation across multiple pages.
 * 
 * Features:
 * - Student selection with search/filter
 * - Lesson form with date and time inputs
 * - Modal open/close with body scroll lock
 * - Form validation
 * - Success callback support
 * 
 * Used By:
 * - home.ejs (home dashboard)
 * - calendar.ejs (calendar view)
 * 
 * Data Sources:
 * - window.allStudents (from home.ejs)
 * - window.serverData.students (from calendar.ejs)
 * 
 * Dependencies:
 * - Backend API: POST /api/lessons
 *
 */


// Global State


// Array of all students available for selection
let allStudents = [];

// Filtered students based on search term
let filteredStudents = [];


// Data Loading


/**
 * Load students from server-rendered data.
 * 
 * Attempts to load from multiple possible sources:
 * - window.allStudents (home.ejs)
 * - window.serverData.students (calendar.ejs)
 * 
 * Updates dropdown after loading.
 */
async function loadStudents() {
  try {
    // Try to get students from window.allStudents (home.ejs) or window.serverData.students (calendar.ejs)
    allStudents = window.allStudents || window.serverData?.students || [];
    filteredStudents = allStudents;
    updateStudentDropdown();
  } catch (error) {
    console.error('Error loading students:', error);
  }
}


// Student Dropdown Management


/**
 * Update student dropdown with filtered students.
 * 
 * Populates select element with student options.
 * Each option shows: Name Surname (Class) - Description
 */
function updateStudentDropdown() {
  const select = document.getElementById('studentSelect');
  if (!select) return;
  
  // Reset dropdown with default option
  select.innerHTML = '<option value="">-- Select a student --</option>';
  
  // Add each filtered student as an option
  filteredStudents.forEach(student => {
    const option = document.createElement('option');
    option.value = student.id;
    
    // Format display text: Name Surname (Class) - Description
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
 * Filters by full name (first + last name).
 * Auto-expands dropdown to show multiple matches.
 * 
 * @param {string} searchTerm - Search query to filter students
 */
function filterStudents(searchTerm) {
  const term = searchTerm.toLowerCase();
  const select = document.getElementById('studentSelect');
  
  // Filter students by name matching
  filteredStudents = allStudents.filter(student => {
    const fullName = `${student.name} ${student.surname}`.toLowerCase();
    return fullName.includes(term);
  });
  updateStudentDropdown();
  
  // Auto-expand dropdown to show multiple matches when typing
  if (select && term.length > 0 && filteredStudents.length > 0) {
    select.size = Math.min(filteredStudents.length + 1, 8); // Show up to 8 options
  } else if (select) {
    select.size = 1; // Reset to default dropdown
  }
}


// Modal Open/Close


/**
 * Open the add lesson modal.
 * 
 * - Shows modal by adding 'open' class
 * - Locks body scroll
 * - Resets search and dropdown
 * - Sets date to today by default
 * - Resets filtered students to all students
 */
function openModal() {
  const modal = document.getElementById('addLessonModal');
  if (!modal) return;
  
  // Show modal and lock body scroll
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  
  // Reset search input when opening modal
  const searchInput = document.getElementById('studentSearch');
  if (searchInput) {
    searchInput.value = '';
  }
  
  // Reset dropdown to normal size
  const select = document.getElementById('studentSelect');
  if (select) {
    select.size = 1;
  }
  
  // Set date to today by default
  const dateInput = document.getElementById('lessonDate');
  if (dateInput) {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }
  
  // Reset student filter to show all
  filteredStudents = allStudents;
  updateStudentDropdown();
}

/**
 * Close the add lesson modal.
 * 
 * - Hides modal by removing 'open' class
 * - Unlocks body scroll
 * - Resets dropdown size
 */
function closeModal() {
  const modal = document.getElementById('addLessonModal');
  if (!modal) return;
  
  // Hide modal and restore body scroll
  modal.classList.remove('open');
  document.body.style.overflow = '';
  
  // Reset dropdown to normal size
  const select = document.getElementById('studentSelect');
  if (select) {
    select.size = 1;
  }
}


// Event Listeners Setup


/**
 * Setup student search input listener.
 * 
 * Filters students in real-time as user types.
 */
function setupStudentSearch() {
  const searchInput = document.getElementById('studentSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterStudents(e.target.value);
    });
  }
}

/**
 * Setup lesson form submission
 * @param {Function} onSuccess - Callback function to execute on successful submission
 */
function setupLessonForm(onSuccess) {
  const form = document.getElementById('lessonForm');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Extract form values
    const studentId = document.getElementById('studentSelect').value;
    const description = document.getElementById('description').value;
    const lessonDate = document.getElementById('lessonDate').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    
    // Validate required fields
    if (!studentId) {
      alert('Please select a student');
      return;
    }
    
    if (!lessonDate) {
      alert('Please select a date');
      return;
    }
    
    if (!startTime || !endTime) {
      alert('Please enter start and end times');
      return;
    }
    
    try {
      // Send lesson creation request to backend
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId,
          description,
          lessonDate,
          startTime,
          endTime
        })
      });
      
      if (response.ok) {
        console.log('Lesson created successfully!');
        closeModal();
        e.target.reset();
        
        // Call the success callback if provided (e.g., page reload, data refresh)
        if (typeof onSuccess === 'function') {
          await onSuccess();
        }
      } else {
        const error = await response.json();
        alert('Failed to create lesson: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating lesson:', error);
      alert('Failed to create lesson. Please try again.');
    }
  });
}

/**
 * Setup add lesson button click listener.
 * 
 * Opens modal when add lesson button is clicked.
 */
function setupAddLessonButton() {
  const addBtn = document.getElementById('addLessonBtn');
  if (addBtn) {
    addBtn.addEventListener('click', openModal);
  }
}


// Initialization


/**
 * Initialize modal functionality.
 * 
 * Call this function on page load to set up all modal features.
 * 
 * Steps:
 * 1. Load students from server data
 * 2. Setup student search functionality
 * 3. Setup lesson form submission with callback
 * 4. Setup add lesson button listener
 * 
 * @param {Function} onSuccess - Callback function to execute after successful lesson creation
 *                                Typically used to reload page or refresh data
 * 
 * @example
 * // Initialize with page reload on success
 * initializeModal(() => {
 *   window.location.reload();
 * });
 */
function initializeModal(onSuccess) {
  loadStudents();
  setupStudentSearch();
  setupLessonForm(onSuccess);
  setupAddLessonButton();
}
