// Mobile sidebar functionality
const menuBtn = document.getElementById('menuBtn');
const mobileSidebar = document.getElementById('mobileSidebar');
const closeSidebar = document.getElementById('closeSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function openSidebar() {
    mobileSidebar.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeSidebarFn() {
    mobileSidebar.classList.add('hidden');
    document.body.style.overflow = '';
}

menuBtn.addEventListener('click', openSidebar);
closeSidebar.addEventListener('click', closeSidebarFn);
sidebarOverlay.addEventListener('click', closeSidebarFn);