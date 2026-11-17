const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// Kept on disk but gitignored (see .gitignore) - its content is specific to
// each deployment (the tutoring center's own privacy notice), not something
// to track in the repo. ensurePrivacyNoticeFile() creates it with a default
// placeholder on first run, so the /privacy page always has something to
// render out of the box, same as config/subjects.json's pattern but
// auto-created instead of requiring a manual copy from an example file.
const PRIVACY_NOTICE_PATH = path.join(__dirname, '..', 'config', 'privacy-notice.md');

const DEFAULT_PRIVACY_NOTICE = `# Informativa sulla Privacy

_Questo è un testo segnaposto. Sostituiscilo con l'informativa privacy del tuo centro, scritta in Markdown, nel file \`Nodejs/config/privacy-notice.md\` - non viene incluso nel repository Git._
`;

/**
 * Creates config/privacy-notice.md with a default placeholder if it doesn't
 * exist yet. Safe to call on every startup - a no-op once the file exists.
 */
function ensurePrivacyNoticeFile() {
    if (!fs.existsSync(PRIVACY_NOTICE_PATH)) {
        fs.writeFileSync(PRIVACY_NOTICE_PATH, DEFAULT_PRIVACY_NOTICE, 'utf8');
    }
}

/**
 * Reads config/privacy-notice.md and renders it to HTML for the /privacy
 * page. Re-read on every call (not cached) so editing the file takes effect
 * immediately, without a server restart - this is a low-traffic page.
 */
function getPrivacyNoticeHtml() {
    ensurePrivacyNoticeFile();
    const markdown = fs.readFileSync(PRIVACY_NOTICE_PATH, 'utf8');
    return marked.parse(markdown);
}

module.exports = {
    PRIVACY_NOTICE_PATH,
    ensurePrivacyNoticeFile,
    getPrivacyNoticeHtml
};
