// Shared modal functions for lesson management

let allStudents = [];
let filteredStudents = [];

/**
 * Load students from API
 */
async function loadStudents() {
  try {
    const response = await fetch('/api/students');
    if (response.ok) {
      allStudents = await response.json();
      filteredStudents = allStudents;
      updateStudentDropdown();
    } else {
      console.error('Failed to load students:', response.statusText);
    }
  } catch (error) {
    console.error('Error loading students:', error);
  }
}

/**
 * Update student dropdown with filtered students
 */
function updateStudentDropdown() {
  const select = document.getElementById('studentSelect');
  if (!select) return;
  
  select.innerHTML = '<option value="">-- Select a student --</option>';
  
  filteredStudents.forEach(student => {
    const option = document.createElement('option');
    option.value = student.id;
    option.textContent = `${student.name} ${student.surname} (${student.studentClass})`;
    select.appendChild(option);
  });
}

/**
 * Filter students based on search term
 */
function filterStudents(searchTerm) {
  const term = searchTerm.toLowerCase();
  filteredStudents = allStudents.filter(student => {
    const fullName = `${student.name} ${student.surname}`.toLowerCase();
    return fullName.includes(term);
  });
  updateStudentDropdown();
}

/**
 * Open the add lesson modal
 */
function openModal() {
  const modal = document.getElementById('addLessonModal');
  if (!modal) return;
  
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  
  // Reset search when opening modal
  const searchInput = document.getElementById('studentSearch');
  if (searchInput) {
    searchInput.value = '';
  }
  
  // Set date to today by default
  const dateInput = document.getElementById('lessonDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }
  
  filteredStudents = allStudents;
  updateStudentDropdown();
}

/**
 * Close the add lesson modal
 */
function closeModal() {
  const modal = document.getElementById('addLessonModal');
  if (!modal) return;
  
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

/**
 * Setup student search listener
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
    
    const studentId = document.getElementById('studentSelect').value;
    const description = document.getElementById('description').value;
    const lessonDate = document.getElementById('lessonDate').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    
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
        
        // Call the success callback if provided
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
 * Setup add lesson button listener
 */
function setupAddLessonButton() {
  const addBtn = document.getElementById('addLessonBtn');
  if (addBtn) {
    addBtn.addEventListener('click', openModal);
  }
}

/**
 * Initialize modal functionality
 * @param {Function} onSuccess - Callback function to execute after successful lesson creation
 */
function initializeModal(onSuccess) {
  loadStudents();
  setupStudentSearch();
  setupLessonForm(onSuccess);
  setupAddLessonButton();
}
