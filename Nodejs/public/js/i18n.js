/*
 * Client-side translation helper.
 *
 * Reads from window.translations, injected server-side by res.locals.translations
 * (see server_utilities/i18n.js) into a small inline <script> on each page that
 * uses it. Mirrors the server-side t() helper available to EJS templates, so
 * client-side strings (alerts, dynamically-rendered labels) use the same
 * dictionaries and the same dot-notation keys.
 */
(function () {
  /**
   * Look up a translation by dot-notation key (e.g. "common.cancel"),
   * substituting any {placeholder} tokens with the given params.
   *
   * @param {string} key - Dot-notation key into window.translations
   * @param {Object} [params] - Values to substitute for {placeholder} tokens
   * @returns {string} Translated string, or the key itself if not found
   */
  window.t = function (key, params) {
    const dict = window.translations || {};
    const value = key.split('.').reduce((obj, part) => (obj && obj[part] !== undefined ? obj[part] : undefined), dict);

    if (value === undefined) return key;
    if (typeof value !== 'string' || !params) return value;

    return value.replace(/\{(\w+)\}/g, function (match, token) {
      return params[token] !== undefined ? params[token] : match;
    });
  };
})();
