/**
 *
 * Settings Menu (gear icon)
 *
 *
 * Open/close wiring for the settings menu - a gear button that reveals the
 * theme toggle, push-notification toggle, and logout, previously three
 * separate items in each page's header/mobile menu. Shared by every page
 * that includes partials/settings-menu.ejs (desktop dropdown) and
 * partials/settings-menu-mobile.ejs (mobile sidebar accordion): home,
 * calendar, lessons, reports, staffPanel, student.
 *
 * Desktop: button+absolute-panel+outside-click-close, same pattern as the
 * tutor filter dropdown in calendarScript.js.
 * Mobile: the gear row expands an inline accordion (no popup needed, the
 * sidebar already scrolls in its own flow) - collapsed back automatically
 * when the mobile sidebar itself closes (#closeMenu/#menuOverlay, present
 * on every page that has a mobile menu), so it starts closed next time.
 */
document.addEventListener('DOMContentLoaded', () => {
  const settingsMenuBtn = document.getElementById('settingsMenuBtn');
  const settingsMenu = document.getElementById('settingsMenu');

  if (settingsMenuBtn && settingsMenu) {
    settingsMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = settingsMenu.classList.toggle('hidden') === false;
      settingsMenuBtn.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', () => {
      settingsMenu.classList.add('hidden');
      settingsMenuBtn.setAttribute('aria-expanded', 'false');
    });
  }

  const settingsMenuBtnMobile = document.getElementById('settingsMenuBtnMobile');
  const settingsMenuMobile = document.getElementById('settingsMenuMobile');

  if (settingsMenuBtnMobile && settingsMenuMobile) {
    settingsMenuBtnMobile.addEventListener('click', () => {
      const isOpen = settingsMenuMobile.classList.toggle('hidden') === false;
      settingsMenuBtnMobile.setAttribute('aria-expanded', String(isOpen));
    });

    const collapse = () => {
      settingsMenuMobile.classList.add('hidden');
      settingsMenuBtnMobile.setAttribute('aria-expanded', 'false');
    };
    const closeMenuBtn = document.getElementById('closeMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', collapse);
    if (menuOverlay) menuOverlay.addEventListener('click', collapse);
  }
});
