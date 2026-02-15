/**
 *
 * 404 Page - Mobile Sidebar Handler
 *
 * 
 * Manages mobile sidebar functionality for the 404 error page.
 * 
 * Features:
 * - Toggle mobile sidebar visibility
 * - Prevent body scroll when sidebar is open
 * - Close sidebar via close button or overlay click
 * 
 * Elements:
 * - menuBtn: Hamburger menu button to open sidebar
 * - mobileSidebar: The sidebar container element
 * - closeSidebar: Close button inside sidebar
 * - sidebarOverlay: Semi-transparent overlay behind sidebar
 * 
 * User Interactions:
 * 1. Click menu button -> Open sidebar and disable body scroll
 * 2. Click close button -> Close sidebar and restore body scroll
 * 3. Click overlay -> Close sidebar and restore body scroll
 *
 */


// DOM Element References


// Mobile menu button (hamburger icon)
const menuBtn = document.getElementById('menuBtn');

// Mobile sidebar container
const mobileSidebar = document.getElementById('mobileSidebar');

// Close button inside sidebar
const closeSidebar = document.getElementById('closeSidebar');

// Semi-transparent overlay behind sidebar
const sidebarOverlay = document.getElementById('sidebarOverlay');


// Sidebar Toggle Functions


/**
 * Open the mobile sidebar.
 * 
 * - Removes 'hidden' class to show sidebar
 * - Disables body scrolling to prevent background scroll
 */
function openSidebar() {
    mobileSidebar.classList.remove('hidden');
    document.body.style.overflow = 'hidden';  // Prevent body scroll
}

/**
 * Close the mobile sidebar.
 * 
 * - Adds 'hidden' class to hide sidebar
 * - Restores body scrolling
 */
function closeSidebarFn() {
    mobileSidebar.classList.add('hidden');
    document.body.style.overflow = '';  // Restore body scroll
}


// Event Listeners


// Open sidebar when menu button is clicked
menuBtn.addEventListener('click', openSidebar);

// Close sidebar when close button is clicked
closeSidebar.addEventListener('click', closeSidebarFn);

// Close sidebar when overlay (outside sidebar) is clicked
sidebarOverlay.addEventListener('click', closeSidebarFn);