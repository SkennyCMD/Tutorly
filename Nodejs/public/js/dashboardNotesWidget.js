// Dashboard Notes strip shown above the mini calendar on the home/dashboard
// page (GET /home, see src/index.js). "Sign as viewed" clears this user's own
// see_dashboard_note row (POST /api/dashboard-notes/:noteId/viewed) and
// removes the card - it never comes back for them once cleared.
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
        signButton.className = 'px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
        signButton.textContent = translate('home.dashboardNotes.signAsViewed');
        signButton.addEventListener('click', async () => {
            signButton.disabled = true;
            try {
                const response = await fetch(`/api/dashboard-notes/${note.id}/viewed`, {
                    method: 'POST',
                    credentials: 'same-origin'
                });
                if (response.ok) {
                    card.remove();
                    // Hide the whole section once there's nothing left to show.
                    if (!container.children.length && container.parentElement) {
                        container.parentElement.classList.add('hidden');
                    }
                } else {
                    signButton.disabled = false;
                }
            } catch (error) {
                console.error('Error marking dashboard note as viewed:', error);
                signButton.disabled = false;
            }
        });

        card.append(content, signButton);
        container.appendChild(card);
    });
})();
