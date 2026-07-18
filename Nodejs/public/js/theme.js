/*
 * Theme toggle behavior. Relies on window.__theme (defined in
 * partials/theme-init.ejs) for the actual get/set/apply primitives so
 * there is exactly one place that reads/writes the theme.
 */
(function () {
    // Called by every toggle button's onclick="toggleTheme()".
    window.toggleTheme = function () {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        window.__theme.set(next);
        window.__theme.apply(next);
    };

    // Keep following the OS/browser preference live, unless the user has
    // explicitly picked a theme with the toggle button.
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (!window.__theme.get()) {
            window.__theme.apply(e.matches ? 'dark' : 'light');
        }
    });
})();
