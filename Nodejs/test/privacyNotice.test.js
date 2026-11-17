// Direct unit tests for privacyNotice.js. fs is mocked with an in-memory
// store keyed by path, so these tests never touch the real
// config/privacy-notice.md on disk.
const fakeFiles = {};

jest.mock('fs', () => ({
    existsSync: jest.fn((p) => Object.prototype.hasOwnProperty.call(fakeFiles, p)),
    writeFileSync: jest.fn((p, content) => { fakeFiles[p] = content; }),
    readFileSync: jest.fn((p) => fakeFiles[p])
}));

const {
    PRIVACY_NOTICE_PATH,
    ensurePrivacyNoticeFile,
    getPrivacyNoticeHtml
} = require('../server_utilities/privacyNotice');

beforeEach(() => {
    for (const key of Object.keys(fakeFiles)) delete fakeFiles[key];
    jest.clearAllMocks();
});

describe('ensurePrivacyNoticeFile', () => {
    test('creates the file with a default placeholder if missing', () => {
        ensurePrivacyNoticeFile();
        expect(fakeFiles[PRIVACY_NOTICE_PATH]).toContain('Informativa sulla Privacy');
    });

    test('does not overwrite an already-existing file', () => {
        fakeFiles[PRIVACY_NOTICE_PATH] = '# Custom notice';
        ensurePrivacyNoticeFile();
        expect(fakeFiles[PRIVACY_NOTICE_PATH]).toBe('# Custom notice');
    });
});

describe('getPrivacyNoticeHtml', () => {
    test('renders the file\'s markdown to HTML', () => {
        fakeFiles[PRIVACY_NOTICE_PATH] = '# Title\n\nSome **bold** text.';

        const html = getPrivacyNoticeHtml();

        expect(html).toContain('<h1>Title</h1>');
        expect(html).toContain('<strong>bold</strong>');
    });

    test('creates the file first if missing, then renders the default placeholder', () => {
        const html = getPrivacyNoticeHtml();

        expect(fakeFiles[PRIVACY_NOTICE_PATH]).toBeDefined();
        expect(html).toContain('<h1>');
    });
});
