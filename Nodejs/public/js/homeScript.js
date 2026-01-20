// Sample data
    let lessons = [];
    let tasks = [];

    let currentDate = new Date();
    let calendarDate = new Date();

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
      updateCurrentDate();
      renderCalendar();
      loadTasks();
      loadLessons();
      initializeModal(loadLessons); // Use shared modal initialization
      setupEventListeners();
    });

    // Load tasks from API
    async function loadTasks() {
      try {
        const response = await fetch('/api/tasks/today');
        if (response.ok) {
          tasks = await response.json();
          renderTasks();
        } else {
          console.error('Failed to load tasks:', response.statusText);
          renderTasks(); // Render empty state
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
        renderTasks(); // Render empty state
      }
    }

    // Load lessons from API
    async function loadLessons() {
      try {
        const response = await fetch('/api/lessons/today');
        if (response.ok) {
          lessons = await response.json();
          renderLessons();
        } else {
          console.error('Failed to load lessons:', response.statusText);
          renderLessons(); // Render empty state
        }
      } catch (error) {
        console.error('Error loading lessons:', error);
        renderLessons(); // Render empty state
      }
    }

    function updateCurrentDate() {
      const options = { weekday: 'short', day: 'numeric', month: 'short' };
      document.getElementById('currentDate').textContent = currentDate.toLocaleDateString('en-US', options);
    }

    function renderCalendar() {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      document.getElementById('calendarMonth').textContent = `${monthNames[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`;
      
      const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
      const lastDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
      const startDay = (firstDay.getDay() + 6) % 7;
      
      let html = '';
      
      // Empty cells for days before month starts
      for (let i = 0; i < startDay; i++) {
        html += '<span class="py-1.5"></span>';
      }
      
      // Days of the month
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const isToday = day === currentDate.getDate() && 
                        calendarDate.getMonth() === currentDate.getMonth() && 
                        calendarDate.getFullYear() === currentDate.getFullYear();
        
        html += `<span class="py-1.5 rounded-lg cursor-pointer transition-colors ${isToday ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-secondary text-foreground'}">${day}</span>`;
      }
      
      document.getElementById('calendarDays').innerHTML = html;
    }

    function renderTasks() {
      const container = document.getElementById('tasksList');
      
      if (tasks.length === 0) {
        container.innerHTML = '<p class="text-sm text-muted-foreground py-2">There are no tasks for today</p>';
        return;
      }
      
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

    function renderLessons() {
      const tableBody = document.getElementById('lessonsTableBody');
      const mobileList = document.getElementById('lessonsMobileList');
      const emptyState = document.getElementById('emptyLessons');
      const countEl = document.getElementById('lessonCount');
      
      countEl.textContent = `${lessons.length} lesson${lessons.length !== 1 ? 's' : ''}`;
      
      if (lessons.length === 0) {
        tableBody.innerHTML = '';
        mobileList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
      }
      
      emptyState.classList.add('hidden');
      
      // Desktop table
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
      
      // Mobile list
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

    function setupEventListeners() {
      // Mobile menu
      const menuToggle = document.getElementById('menuToggle');
      const closeMenu = document.getElementById('closeMenu');
      const mobileMenu = document.getElementById('mobileMenu');
      const menuOverlay = document.getElementById('menuOverlay');
      
      menuToggle.addEventListener('click', () => {
        mobileMenu.classList.add('open');
        menuOverlay.classList.remove('hidden');
      });
      
      const closeMenuFn = () => {
        mobileMenu.classList.remove('open');
        menuOverlay.classList.add('hidden');
      };
      
      closeMenu.addEventListener('click', closeMenuFn);
      menuOverlay.addEventListener('click', closeMenuFn);
      
      // Calendar navigation
      document.getElementById('prevMonth').addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendar();
      });
      
      document.getElementById('nextMonth').addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendar();
      });
    }