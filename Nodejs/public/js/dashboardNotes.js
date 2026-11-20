// Dashboard Notes board - real data from GET /dashboardNotes
// (window.initialNotes, see src/index.js). Publishing a new note goes
// through POST /api/dashboard-notes; every admin manages the same shared
// board, so there's no per-admin scoping here, unlike the Ticketing page.
const notes = window.initialNotes || [];
const translate = window.t || (key => key);

const dateFormat = new Intl.DateTimeFormat(window.lang || 'en', { month: 'short', day: 'numeric', year: 'numeric' });

const $ = id => document.getElementById(id);

function dateOnly(date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

function today() {
    return dateOnly(new Date());
}

function formatDate(value) {
    return dateFormat.format(new Date(value));
}

function renderMarkdown(element, source) {
    if (window.marked && window.DOMPurify) {
        element.innerHTML = window.DOMPurify.sanitize(window.marked.parse(source));
        return;
    }
    element.textContent = source;
}

function makeNoteCard(note, isExpired) {
    const card = document.createElement('article');
    card.className = 'rounded-xl border border-border bg-card p-4 sm:p-5';

    const header = document.createElement('div');
    header.className = 'mb-3 flex flex-wrap items-center justify-between gap-2';

    const label = document.createElement('span');
    label.className = `rounded-full border px-2.5 py-1 text-xs font-medium ${isExpired ? 'border-zinc-700 bg-zinc-800 text-zinc-300' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'}`;
    label.textContent = isExpired ? translate('dashboardNotes.statusExpired') : translate('dashboardNotes.statusActive');

    const date = document.createElement('p');
    date.className = 'text-xs text-muted-foreground';
    date.textContent = translate('dashboardNotes.expiresPrefix', { date: formatDate(note.expiration) });

    header.append(label, date);

    const content = document.createElement('div');
    content.className = 'markdown-note break-words text-sm leading-6';
    renderMarkdown(content, note.content);

    card.append(header, content);
    return card;
}

function empty(message) {
    const el = document.createElement('p');
    el.className = 'rounded-xl border border-dashed border-border bg-card/50 p-5 text-center text-sm text-muted-foreground';
    el.textContent = message;
    return el;
}

function render() {
    const now = new Date();
    const active = notes.filter(note => new Date(note.expiration) >= now).sort((a, b) => new Date(a.expiration) - new Date(b.expiration));
    const expired = notes.filter(note => new Date(note.expiration) < now).sort((a, b) => new Date(b.expiration) - new Date(a.expiration));

    $('activeCount').textContent = active.length;
    $('expiredCount').textContent = expired.length;
    $('activeNotes').replaceChildren(...(active.length ? active.map(note => makeNoteCard(note, false)) : [empty(translate('dashboardNotes.noActiveNotes'))]));
    $('expiredNotes').replaceChildren(...(expired.length ? expired.map(note => makeNoteCard(note, true)) : [empty(translate('dashboardNotes.noExpiredNotes'))]));
}

$('noteContent').addEventListener('input', () => {
    const value = $('noteContent').value.trim();
    const preview = $('notePreview');
    if (value) renderMarkdown(preview, value);
    else preview.textContent = translate('dashboardNotes.previewPlaceholder');
});

$('noteForm').addEventListener('submit', async event => {
    event.preventDefault();

    const content = $('noteContent').value.trim();
    const expiresAt = $('expiresAt').value;
    if (!content || !expiresAt) return;
    if (expiresAt < today()) {
        $('formMessage').textContent = translate('dashboardNotes.chooseFutureDate');
        return;
    }

    try {
        const response = await fetch('/api/dashboard-notes', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, expiresAt })
        });

        if (response.ok) {
            window.location.reload();
        } else {
            const error = await response.json();
            $('formMessage').textContent = error.error || translate('dashboardNotes.publishFailed');
        }
    } catch (error) {
        console.error('Error publishing dashboard note:', error);
        $('formMessage').textContent = translate('dashboardNotes.publishFailedRetry');
    }
});

function setMenu(open) {
    $('mobileMenu').classList.toggle('open', open);
    $('menuOverlay').classList.toggle('hidden', !open);
    $('menuToggle').setAttribute('aria-expanded', String(open));
}

$('menuToggle').addEventListener('click', () => setMenu(true));
$('closeMenu').addEventListener('click', () => setMenu(false));
$('menuOverlay').addEventListener('click', () => setMenu(false));
$('expiresAt').min = today();
render();
