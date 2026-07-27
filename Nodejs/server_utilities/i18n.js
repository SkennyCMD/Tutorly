/**
 *
 * i18n (Internationalization) Utilities
 *
 *
 * Detects the tutor's device/browser language and provides translation
 * lookup for both server-rendered EJS templates and client-side JavaScript.
 * Language is detected automatically from the browser's Accept-Language
 * header - there is no manual switcher.
 *
 * Currently supported: English (default) and Italian.
 *
 * Usage in EJS templates:
 *   <%= t('common.cancel') %>
 *
 * Usage in client-side JS (see public/js/i18n.js for the t() helper that
 * reads from window.translations, injected via res.locals.translations):
 *   t('common.validation.selectStudent')
 *
 */

const fs = require('fs');
const path = require('path');

const SUPPORTED_LANGUAGES = ['en', 'it'];
const DEFAULT_LANGUAGE = 'en';

const dictionaries = {};
SUPPORTED_LANGUAGES.forEach(lang => {
    const filePath = path.join(__dirname, '..', 'locales', `${lang}.json`);
    dictionaries[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
});

/**
 * Parse an Accept-Language header and return the first language the app
 * supports, ranked by the header's own quality (q) values.
 *
 * @param {string} [header] - Raw Accept-Language header value
 * @returns {string} A supported language code
 *
 * @example
 * parseAcceptLanguage('it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7') // -> 'it'
 */
function parseAcceptLanguage(header) {
    if (!header) return DEFAULT_LANGUAGE;

    const ranked = header
        .split(',')
        .map(part => {
            const [tag, qPart] = part.trim().split(';q=');
            return { tag: tag.trim().split('-')[0].toLowerCase(), q: qPart ? parseFloat(qPart) : 1 };
        })
        .sort((a, b) => b.q - a.q);

    const match = ranked.find(entry => SUPPORTED_LANGUAGES.includes(entry.tag));
    return match ? match.tag : DEFAULT_LANGUAGE;
}

/**
 * Determine which language to use for a request, based on the device's
 * Accept-Language header.
 *
 * @param {import('express').Request} req
 * @returns {string} A supported language code
 */
function detectLanguage(req) {
    return parseAcceptLanguage(req.headers['accept-language']);
}

/**
 * Look up a translation by dot-notation key (e.g. "common.cancel"). Falls
 * back to the default language, then to the key itself, if missing.
 *
 * @param {string} lang - Language code
 * @param {string} key - Dot-notation key into the dictionary
 * @param {Object} [params] - Values to substitute for {placeholder} tokens
 * @returns {string} Translated string
 */
function translate(lang, key, params) {
    const dict = dictionaries[lang] || dictionaries[DEFAULT_LANGUAGE];
    let value = lookup(dict, key);

    if (value === undefined && lang !== DEFAULT_LANGUAGE) {
        value = lookup(dictionaries[DEFAULT_LANGUAGE], key);
    }

    if (value === undefined) return key;
    if (typeof value !== 'string' || !params) return value;

    return value.replace(/\{(\w+)\}/g, (match, token) => (params[token] !== undefined ? params[token] : match));
}

function lookup(dict, key) {
    return key.split('.').reduce((obj, part) => (obj && obj[part] !== undefined ? obj[part] : undefined), dict);
}

/**
 * Express middleware: detects the request's language and exposes a `t()`
 * translation helper, the current language, and the full dictionary (for
 * client-side injection) via res.locals.
 */
function i18nMiddleware(req, res, next) {
    const lang = detectLanguage(req);
    req.lang = lang;
    res.locals.lang = lang;
    res.locals.t = (key, params) => translate(lang, key, params);
    res.locals.translations = dictionaries[lang];
    next();
}

module.exports = {
    i18nMiddleware,
    translate,
    detectLanguage,
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE
};
