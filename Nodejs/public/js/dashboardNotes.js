// Dashboard Notes board - sample data only for now (admin-only mockup, not
// yet wired to the database). See views/dashboardNotes.ejs.
const notes = [
    { id: 1, content: '## This week\\n\\nReview **linear equations** and complete the practice set.', expiresAt: futureDate(18) },
    { id: 2, content: 'Remember to show your work:\\n\\n- Write each step\\n- Check your answer', expiresAt: futureDate(6) },
    { id: 3, content: '> Midterm revision\\n\\nReview the notes from **Chapter 3** and bring questions to class.', expiresAt: pastDate(3) }
];

const $ = id => document.getElementById(id);

function dateOnly(date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

function futureDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return dateOnly(d);
}

function pastDate(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return dateOnly(d);
}

function today() {
    return dateOnly(new Date());
}

function formatDate(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(year, month - 1, day));
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
    label.textContent = isExpired ? 'Expired' : 'Active';

    const date = document.createElement('p');
    date.className = 'text-xs text-muted-foreground';
    date.textContent = `Expires ${formatDate(note.expiresAt)}`;

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
    const current = today();
    const active = notes.filter(note => note.expiresAt >= current).sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
    const expired = notes.filter(note => note.expiresAt < current).sort((a, b) => b.expiresAt.localeCompare(a.expiresAt));

    $('activeCount').textContent = active.length;
    $('expiredCount').textContent = expired.length;
    $('activeNotes').replaceChildren(...(active.length ? active.map(note => makeNoteCard(note, false)) : [empty('No active dashboard notes.')]));
    $('expiredNotes').replaceChildren(...(expired.length ? expired.map(note => makeNoteCard(note, true)) : [empty('No expired notes.')]));
}

$('noteContent').addEventListener('input', () => {
    const value = $('noteContent').value.trim();
    const preview = $('notePreview');
    if (value) renderMarkdown(preview, value);
    else preview.textContent = 'Your note preview will appear here.';
});

$('noteForm').addEventListener('submit', event => {
    event.preventDefault();

    const content = $('noteContent').value.trim();
    const expiresAt = $('expiresAt').value;
    if (!content || !expiresAt) return;
    if (expiresAt < today()) {
        $('formMessage').textContent = 'Choose today or a future date for a new note.';
        return;
    }

    notes.unshift({ id: Date.now(), content, expiresAt });
    $('formMessage').textContent = 'Dashboard note created.';
    $('noteForm').reset();
    $('expiresAt').min = today();
    $('notePreview').textContent = 'Your note preview will appear here.';
    render();
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
