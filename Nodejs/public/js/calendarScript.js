    // Sample data
    let events = [
      { id: 1, type: 'lesson', firstName: 'Emma', lastName: 'Wilson', classType: 'M', date: getTodayString(), startTime: '09:00', endTime: '10:00' },
      { id: 2, type: 'lesson', firstName: 'Lucas', lastName: 'Brown', classType: 'S', date: getTodayString(), startTime: '09:30', endTime: '10:30' },
      { id: 3, type: 'note', description: 'Prepare exam materials', date: getTodayString(), startTime: '11:00', endTime: '12:00', assignees: ['myself'] },
      { id: 4, type: 'lesson', firstName: 'Sofia', lastName: 'Garcia', classType: 'U', date: getTodayString(), startTime: '14:00', endTime: '15:00' },
      { id: 5, type: 'note', description: 'Team meeting', date: getTodayString(), startTime: '14:30', endTime: '15:30', assignees: ['myself', 'emma'] },
    ];

    let currentWeekStart = getWeekStart(new Date());
    let currentMobileDate = new Date();
    let eventIdCounter = 6;
    
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
      return date.toISOString().split('T')[0];
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
    });
    
    // Load students from API
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
      
      // Group events by date and time slot for overlap handling
      const eventsByDateAndTime = {};
      
      events.forEach(event => {
        const key = `${event.date}-${event.startTime.split(':')[0]}`;
        if (!eventsByDateAndTime[key]) {
          eventsByDateAndTime[key] = [];
        }
        eventsByDateAndTime[key].push(event);
      });
      
      events.forEach(event => {
        const startHour = parseInt(event.startTime.split(':')[0]);
        const startMinutes = parseInt(event.startTime.split(':')[1]);
        const endHour = parseInt(event.endTime.split(':')[0]);
        const endMinutes = parseInt(event.endTime.split(':')[1]);
        
        const duration = (endHour * 60 + endMinutes) - (startHour * 60 + startMinutes);
        const heightPx = (duration / 60) * 60; // 60px per hour
        const topOffset = (startMinutes / 60) * 60;
        
        // Find overlapping events
        const key = `${event.date}-${startHour}`;
        const overlapping = eventsByDateAndTime[key] || [];
        const eventIndex = overlapping.indexOf(event);
        const totalOverlapping = overlapping.length;
        
        // Calculate width and left position for overlapping events
        const widthPercent = totalOverlapping > 1 ? (100 / totalOverlapping) - 2 : 100;
        const leftPercent = eventIndex * (100 / totalOverlapping);
        
        const cell = document.querySelector(`.day-column[data-date="${event.date}"][data-hour="${startHour}"]`);
        
        if (cell) {
          const eventEl = document.createElement('div');
          eventEl.className = `event event-${event.type}`;
          eventEl.style.top = `${topOffset}px`;
          eventEl.style.height = `${heightPx}px`;
          eventEl.style.minHeight = '20px';
          
          if (totalOverlapping > 1) {
            eventEl.style.width = `${widthPercent}%`;
            eventEl.style.left = `${leftPercent}%`;
            eventEl.style.right = 'auto';
          }
          
          if (event.type === 'lesson') {
            eventEl.innerHTML = `
              <div class="font-medium truncate">${event.firstName} ${event.lastName}</div>
              <div class="opacity-75">${event.classType} · ${event.startTime}</div>
            `;
          } else {
            eventEl.innerHTML = `
              <div class="font-medium truncate">${event.description}</div>
              <div class="opacity-75">${event.startTime}</div>
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
      
      // Group by start hour for overlap handling
      const eventsByHour = {};
      dayEvents.forEach(event => {
        const hour = event.startTime.split(':')[0];
        if (!eventsByHour[hour]) {
          eventsByHour[hour] = [];
        }
        eventsByHour[hour].push(event);
      });
      
      dayEvents.forEach(event => {
        const startHour = parseInt(event.startTime.split(':')[0]);
        const startMinutes = parseInt(event.startTime.split(':')[1]);
        const endHour = parseInt(event.endTime.split(':')[0]);
        const endMinutes = parseInt(event.endTime.split(':')[1]);
        
        const duration = (endHour * 60 + endMinutes) - (startHour * 60 + startMinutes);
        const heightPx = (duration / 60) * 60;
        const topOffset = (startMinutes / 60) * 60;
        
        // Handle overlapping
        const hour = event.startTime.split(':')[0];
        const overlapping = eventsByHour[hour] || [];
        const eventIndex = overlapping.indexOf(event);
        const totalOverlapping = overlapping.length;
        
        const widthPercent = totalOverlapping > 1 ? (100 / totalOverlapping) - 2 : 100;
        const leftPercent = eventIndex * (100 / totalOverlapping);
        
        const cell = document.querySelector(`.day-column[data-date="${dateStr}"][data-hour="${startHour}"][data-mobile="true"]`);
        
        if (cell) {
          const eventEl = document.createElement('div');
          eventEl.className = `event event-${event.type}`;
          eventEl.style.top = `${topOffset}px`;
          eventEl.style.height = `${heightPx}px`;
          eventEl.style.minHeight = '20px';
          
          if (totalOverlapping > 1) {
            eventEl.style.width = `${widthPercent}%`;
            eventEl.style.left = `${leftPercent}%`;
            eventEl.style.right = 'auto';
          }
          
          if (event.type === 'lesson') {
            eventEl.innerHTML = `
              <div class="font-medium truncate">${event.firstName} ${event.lastName}</div>
              <div class="opacity-75">${event.classType} · ${event.startTime} - ${event.endTime}</div>
            `;
          } else {
            eventEl.innerHTML = `
              <div class="font-medium truncate">${event.description}</div>
              <div class="opacity-75">${event.startTime} - ${event.endTime}</div>
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
    }

    function closeLessonModal() {
      document.getElementById('addLessonModal').classList.remove('open');
      document.getElementById('lessonForm').reset();
      setDefaultDates();
    }

    function openNoteModal() {
      document.getElementById('addNoteModal').classList.add('open');
      closeMenu();
    }

    function closeNoteModal() {
      document.getElementById('addNoteModal').classList.remove('open');
      document.getElementById('noteForm').reset();
      setDefaultDates();
    }

    function assignToMyself() {
      const myselfCheckbox = document.querySelector('input[name="assignees"][value="myself"]');
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
      
      // Prepare datetime with the selected date
      const [year, month, day] = lessonDate.split('-');
      const startDateTime = `${year}-${month}-${day}T${startTime}:00`;
      const endDateTime = `${year}-${month}-${day}T${endTime}:00`;
      
      try {
        const response = await fetch('/api/prenotations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            studentId,
            startTime: startDateTime,
            endTime: endDateTime
          })
        });
        
        if (response.ok) {
          alert('Prenotation created successfully!');
          closeLessonModal();
          
          // Add to local events for immediate display
          const student = allStudents.find(s => s.id === parseInt(studentId));
          if (student) {
            const newLesson = {
              id: eventIdCounter++,
              type: 'lesson',
              firstName: student.name,
              lastName: student.surname,
              classType: student.studentClass,
              date: lessonDate,
              startTime: startTime,
              endTime: endTime
            };
            events.push(newLesson);
            renderWeekView();
            renderMobileDayView();
          }
        } else {
          const error = await response.json();
          alert('Failed to create prenotation: ' + (error.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error creating prenotation:', error);
        alert('Failed to create prenotation. Please try again.');
      }
    }

    function handleNoteSubmit(e) {
      e.preventDefault();
      
      const assigneeCheckboxes = document.querySelectorAll('input[name="assignees"]:checked');
      const assignees = Array.from(assigneeCheckboxes).map(cb => cb.value);
      
      const newNote = {
        id: eventIdCounter++,
        type: 'note',
        description: document.getElementById('noteDescription').value,
        date: document.getElementById('noteDate').value,
        startTime: document.getElementById('noteStartTime').value,
        endTime: document.getElementById('noteEndTime').value,
        assignees: assignees
      };
      
      events.push(newNote);
      closeNoteModal();
      renderWeekView();
      renderMobileDayView();
    }