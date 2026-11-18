// Support ticket board - real data from GET /ticketing (window.initialTickets,
// see src/index.js). Admin: status changes via PUT /api/tickets/:id/{manage,close}.
// STAFF/GENERIC tutor: read-only board, plus submitting a new ticket via
// POST /api/tickets (window.canManageTickets gates which of these a given
// viewer can do - see card() and the New Ticket button below).
const tickets = window.initialTickets || [];
const statusStyles = { open: 'bg-amber-500/10 text-amber-300 border-amber-500/20', managing: 'bg-sky-500/10 text-sky-300 border-sky-500/20', closed: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' };
const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const safe = (value) => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Date unavailable' : dateFormat.format(date); }

// Finds a ticket by id and replaces it in place with the server's response,
// so re-rendering always reflects the real (persisted) state - not a locally
// guessed one.
function replaceTicket(updated) {
    const index = tickets.findIndex(t => t.id === updated.id);
    if (index !== -1) tickets[index] = updated;
}

async function startManaging(ticket) {
    try {
        const response = await fetch(`/api/tickets/${ticket.id}/manage`, {
            method: 'PUT',
            credentials: 'same-origin'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.ticket) replaceTicket(result.ticket);
            render();
        } else {
            const error = await response.json();
            alert(`Failed to update ticket: ${error.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error managing ticket:', error);
        alert('Failed to update ticket. Please try again.');
    }
}

// Close Ticket modal - replaces a native window.prompt() for entering the
// optional resolution comment, consistent with the rest of the app's modals.
let ticketPendingClose = null;

function openCloseTicketModal(ticket) {
    ticketPendingClose = ticket;
    document.getElementById('closeTicketComment').value = '';
    document.getElementById('closeTicketModal').classList.add('open');
}

function closeCloseTicketModal() {
    document.getElementById('closeTicketModal').classList.remove('open');
    ticketPendingClose = null;
}

document.getElementById('closeTicketForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!ticketPendingClose) return;

    const ticket = ticketPendingClose;
    const comment = document.getElementById('closeTicketComment').value;

    try {
        const response = await fetch(`/api/tickets/${ticket.id}/close`, {
            method: 'PUT',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.ticket) replaceTicket(result.ticket);
            closeCloseTicketModal();
            render();
        } else {
            const error = await response.json();
            alert(`Failed to close ticket: ${error.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error closing ticket:', error);
        alert('Failed to close ticket. Please try again.');
    }
});

// New Ticket modal (STAFF/GENERIC only - the trigger button isn't even
// rendered for an admin viewer, see ticketing.ejs). Submitting reloads the
// page on success, same simple pattern as every other "Add X" form in this
// app (Add Availability, Add Exception, etc.), rather than patching local
// state in place.
function openNewTicketModal() {
    document.getElementById('newTicketContent').value = '';
    document.getElementById('newTicketModal').classList.add('open');
}

function closeNewTicketModal() {
    document.getElementById('newTicketModal').classList.remove('open');
}

const newTicketBtn = document.getElementById('newTicketBtn');
if (newTicketBtn) newTicketBtn.addEventListener('click', openNewTicketModal);

document.getElementById('newTicketForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const content = document.getElementById('newTicketContent').value.trim();
    if (!content) return;

    try {
        const response = await fetch('/api/tickets', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });

        if (response.ok) {
            closeNewTicketModal();
            window.location.reload();
        } else {
            const error = await response.json();
            alert(`Failed to submit ticket: ${error.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error submitting ticket:', error);
        alert('Failed to submit ticket. Please try again.');
    }
});

function card(ticket, withActions = false) {
    const article = document.createElement('article');
    article.className = 'rounded-xl border border-border bg-card p-4 sm:p-5';
    const top = document.createElement('div');
    top.className = 'flex flex-wrap items-start justify-between gap-3';
    top.innerHTML = `<div><p class="text-xs font-semibold tracking-wide text-muted-foreground">T-${safe(ticket.id)}</p><p class="mt-1 text-sm text-muted-foreground">${safe(ticket.requesterUsername || 'Unknown')} &middot; ${safe(formatDate(ticket.creation))}</p></div><span class="rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[ticket.status]}">${safe(ticket.status)}</span>`;
    const body = document.createElement('p');
    body.className = 'mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground';
    body.textContent = ticket.content;
    article.append(top, body);

    // Managing/closing a ticket requires an admin identity - a STAFF/GENERIC
    // tutor viewer is read-only, so neither button is ever shown to them.
    // Enforced server-side regardless (PUT /api/tickets/:id/{manage,close}),
    // this only decides whether to offer the affordance at all.
    if (withActions && window.canManageTickets) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mt-4 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90';
        button.textContent = 'Start managing';
        button.setAttribute('aria-label', `Start managing ticket T-${ticket.id}`);
        button.addEventListener('click', () => startManaging(ticket));
        article.append(button);
    }
    if (ticket.status === 'managing' && window.canManageTickets) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mt-4 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary';
        button.textContent = 'Mark as closed';
        button.setAttribute('aria-label', `Close ticket T-${ticket.id}`);
        button.addEventListener('click', () => openCloseTicketModal(ticket));
        article.append(button);
    }
    if (ticket.status === 'closed') {
        const meta = document.createElement('p');
        meta.className = 'mt-3 text-xs text-muted-foreground';
        meta.innerHTML = `Opened ${safe(formatDate(ticket.creation))} &middot;<br> Closed ${safe(formatDate(ticket.closure))} &middot;<br> Resolved by ${safe(ticket.resolverUsername || 'Unknown')}`;
        article.append(meta);

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'Show admin comment';
        const comment = document.createElement('div');
        comment.className = 'mt-3 hidden rounded-lg border border-border bg-background p-3 text-sm leading-6 text-muted-foreground';
        comment.textContent = ticket.comment || 'No admin comment was added to this ticket.';
        toggle.addEventListener('click', () => {
            const visible = comment.classList.toggle('hidden') === false;
            toggle.setAttribute('aria-expanded', String(visible));
            toggle.textContent = visible ? 'Hide admin comment' : 'Show admin comment';
        });
        article.append(toggle, comment);
    }
    return article;
}

function empty(message) {
    const item = document.createElement('div');
    item.className = 'rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground';
    item.textContent = message;
    return item;
}

function fillList(id, items, message, actions = false) {
    const container = document.getElementById(id);
    container.replaceChildren();
    if (!items.length) { container.append(empty(message)); return; }
    items.forEach(ticket => container.append(card(ticket, actions)));
}

function render() {
    const open = tickets.filter(t => t.status === 'open').sort((a, b) => new Date(b.creation) - new Date(a.creation));
    const managing = tickets.filter(t => t.status === 'managing').sort((a, b) => new Date(b.creation) - new Date(a.creation));
    const closed = tickets.filter(t => t.status === 'closed').sort((a, b) => new Date(b.creation) - new Date(a.creation));
    fillList('openList', open, 'No open tickets.', true);
    fillList('managingList', managing, 'No tickets are being managed.');
    fillList('closedList', closed, 'No closed tickets.');
    document.getElementById('openCount').textContent = open.length;
    document.getElementById('managingCount').textContent = managing.length;
    document.getElementById('closedCount').textContent = closed.length;
    // "Total" deliberately excludes closed tickets - it's meant to reflect
    // the current workload (open + managing), not the full historical count.
    const activeCount = open.length + managing.length;
    document.getElementById('summary').innerHTML = `<span class="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">${activeCount} total</span><span class="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">${open.length} need review</span>`;
}

function setMenu(isOpen) {
    document.getElementById('mobileMenu').classList.toggle('open', isOpen);
    document.getElementById('menuOverlay').classList.toggle('hidden', !isOpen);
    document.getElementById('menuToggle').setAttribute('aria-expanded', String(isOpen));
}
document.getElementById('menuToggle').addEventListener('click', () => setMenu(true));
document.getElementById('closeMenu').addEventListener('click', () => setMenu(false));
document.getElementById('menuOverlay').addEventListener('click', () => setMenu(false));
render();
