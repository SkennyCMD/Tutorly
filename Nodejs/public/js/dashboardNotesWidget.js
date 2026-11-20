// Dashboard Notes strip shown above the mini calendar on the home/dashboard
// page (GET /home, see src/index.js). Read-only - "Sign as viewed" is a
// placeholder button that doesn't do anything yet.
(function () {
    const notes = window.initialDashboardNotes || [];
    const container = document.getElementById('dashboardNotesList');
    if (!container || !notes.length) return;

    function renderMarkdown(element, source) {
        if (window.marked && window.DOMPurify) {
            element.innerHTML = window.DOMPurify.sanitize(window.marked.parse(source));
        } else {
            element.textContent = source;
        }
    }

    const translate = window.t || (key => key);

    notes.forEach(note => {
        const card = document.createElement('article');
        card.className = 'dashboard-note-card rounded-xl border border-border bg-card p-4';

        const content = document.createElement('div');
        content.className = 'markdown-note break-words text-sm leading-6 mb-3';
        renderMarkdown(content, note.content);

        const signButton = document.createElement('button');
        signButton.type = 'button';
        signButton.className = 'px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-secondary transition-colors';
        signButton.textContent = translate('home.dashboardNotes.signAsViewed');

        card.append(content, signButton);
        container.appendChild(card);
    });
})();
