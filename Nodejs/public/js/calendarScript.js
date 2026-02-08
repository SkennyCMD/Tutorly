    // Initialize events from server data
    let events = [];
    
    // Helper function to parse datetime as local time (ignore timezone)
    function parseAsLocalDate(dateString) {
      // Remove timezone info and parse as local
      const cleanDate = dateString.replace(/\.\d{3}Z?$/, '').replace(/[+-]\d{2}:\d{2}$/, '');
      const [datePart, timePart] = cleanDate.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute, second = 0] = (timePart || '00:00:00').split(':').map(Number);
      return new Date(year, month - 1, day, hour, minute, second);
    }
    
    // Debug: Log server data
    console.log('Server Data:', window.serverData);
    console.log('Prenotations:', window.serverData?.prenotations);
    console.log('Calendar Notes:', window.serverData?.calendarNotes);
    
    // Convert prenotations to event format
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
    
    // Convert calendar notes to event format
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

    let currentWeekStart = getWeekStart(new Date());
    let currentMobileDate = new Date();
    let eventIdCounter = events.length > 0 ? Math.max(...events.map(e => e.id)) + 1 : 1;
    
    let allStudents = [];
    let filteredStudents = [];

    function getTodayString() {
      const today = new Date();
      return today.toISOString().split('T')[0];
    }

    function getWeekStart(date) {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    }

    function formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    function formatDateDisplay(date) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }

    function getDayName(date) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[date.getDay()];
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
      renderWeekView();
      renderMobileDayView();
      setupEventListeners();
      setDefaultDates();
      loadStudents();
      loadTutors();
    });
    
    // Load students from server data
    async function loadStudents() {
      try {
        allStudents = window.serverData?.students || [];
        filteredStudents = allStudents;
        updateStudentDropdown();
      } catch (error) {
        console.error('Error loading students:', error);
      }
    }

    // Load tutors from server data
    async function loadTutors() {
      try {
        const tutors = window.serverData?.tutors || [];
        updateAssigneesContainer(tutors);
      } catch (error) {
        console.error('Error loading tutors:', error);
      }
    }

    // Update assignees container with tutor data
    function updateAssigneesContainer(tutors) {
      const container = document.getElementById('assigneesContainer');
      if (!container) return;
      
      const currentUserId = window.serverData?.currentUserId;
      const userRole = window.serverData?.userRole;
      const isStaff = userRole === 'STAFF';
      
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
      
      // Filter tutors based on role
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

    // Update student dropdown
    function updateStudentDropdown() {
      const select = document.getElementById('studentSelect');
      select.innerHTML = '<option value="">-- Select a student --</option>';
      
      filteredStudents.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name} ${student.surname} (${student.studentClass})`;
        select.appendChild(option);
      });
    }

    // Filter students based on search
    function filterStudents(searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredStudents = allStudents.filter(student => {
        const fullName = `${student.name} ${student.surname}`.toLowerCase();
        return fullName.includes(term);
      });
      updateStudentDropdown();
    }

    function setDefaultDates() {
      const today = getTodayString();
      document.getElementById('lessonDate').value = today;
      document.getElementById('noteDate').value = today;
    }

    function renderWeekView() {
      renderWeekHeader();
      renderDayHeaders();
      renderTimeGrid();
    }

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
      
      // Render events
      renderEventsOnGrid();
    }

    function renderEventsOnGrid() {
      // Clear existing events
      document.querySelectorAll('.event').forEach(el => el.remove());
      
      // Helper function to check if two events overlap
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
        
        const duration = (endHour * 60 + endMinutes) - (startHour * 60 + startMinutes);
        const heightPx = (duration / 60) * 60; // 60px per hour
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
        
        // Calculate width and left position for overlapping events
        const widthPercent = totalOverlapping > 1 ? (100 / totalOverlapping) - 1 : 98;
        const leftPercent = totalOverlapping > 1 ? eventIndex * (100 / totalOverlapping) : 1;
        
        const cell = document.querySelector(`.day-column[data-date="${event.date}"][data-hour="${startHour}"]`);
        
        if (cell) {
          const eventEl = document.createElement('div');
          eventEl.className = `event event-${event.type}`;
          eventEl.style.top = `${topOffset}px`;
          eventEl.style.height = `${heightPx}px`;
          eventEl.style.minHeight = '20px';
          eventEl.style.width = `${widthPercent}%`;
          eventEl.style.left = `${leftPercent}%`;
          eventEl.style.right = 'auto';
          
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

    function renderMobileDayView() {
      const dateLabel = document.getElementById('mobileDateLabel');
      const dayLabel = document.getElementById('mobileDayLabel');
      
      dateLabel.textContent = formatDateDisplay(currentMobileDate);
      dayLabel.textContent = getDayName(currentMobileDate);
      
      renderMobileTimeGrid();
    }

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
      
      // Render events for mobile
      renderMobileEvents();
    }

    function renderMobileEvents() {
      const dateStr = formatDate(currentMobileDate);
      const dayEvents = events.filter(e => e.date === dateStr);
      
      // Helper function to check if two events overlap
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
      
      // Student search
      document.getElementById('studentSearch').addEventListener('input', (e) => {
        filterStudents(e.target.value);
      });
    }

    function closeMenu() {
      document.getElementById('mobileMenu').classList.remove('open');
      document.getElementById('menuOverlay').classList.add('hidden');
    }

    function openLessonModal() {
      document.getElementById('addLessonModal').classList.add('open');
      // Reset search when opening modal
      document.getElementById('studentSearch').value = '';
      filteredStudents = allStudents;
      updateStudentDropdown();
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

    function closeLessonModal() {
      document.getElementById('addLessonModal').classList.remove('open');
      document.getElementById('lessonForm').reset();
      setDefaultDates();
    }

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

    function closeNoteModal() {
      document.getElementById('addNoteModal').classList.remove('open');
      document.getElementById('noteForm').reset();
      setDefaultDates();
    }

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

    function assignLessonToMyself() {
      const currentUserId = window.serverData?.currentUserId;
      if (!currentUserId) return;
      
      const myselfRadio = document.querySelector(`input[name="lessonTutors"][value="${currentUserId}"]`);
      if (myselfRadio) {
        myselfRadio.checked = true;
      }
    }

    function assignToMyself() {
      const currentUserId = window.serverData?.currentUserId;
      if (!currentUserId) return;
      
      const myselfCheckbox = document.querySelector(`input[name="assignees"][value="${currentUserId}"]`);
      if (myselfCheckbox) {
        myselfCheckbox.checked = true;
      }
    }

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