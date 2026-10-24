/**
 *
 * Web Push Notification Service
 *
 *
 * Sends Web Push notifications (standard Push API + VAPID) to a user's
 * subscribed devices. Not Firebase Cloud Messaging - uses the `web-push`
 * npm package directly against whatever push service each subscription's
 * endpoint belongs to (Chrome -> FCM, Firefox -> Mozilla's autopush, etc.),
 * which is transparent to this module: it just POSTs to `subscription.endpoint`.
 *
 * Subscriptions themselves are stored in the Java backend (see
 * javaApiService.js's fetchPushSubscriptionsByUser/deletePushSubscriptionByEndpoint) -
 * this module only handles sending, and prunes a subscription the push
 * service reports as dead (404/410) after a failed send. Caps `payload.body`
 * at MAX_BODY_LENGTH before sending - a free-text field (e.g. a calendar
 * note's description) with no length cap elsewhere could otherwise exceed
 * Web Push's hard payload-size limit and silently fail to deliver.
 *
 * Configuration:
 * - VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT (see config.js)
 * - If either key is missing, sendPushToUser becomes a no-op (push disabled,
 *   the rest of the app keeps working normally).
 *
 * @module pushService
 *
 */

const webpush = require('web-push');
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = require('./config');
const { fetchPushSubscriptionsByUser, deletePushSubscriptionByEndpoint } = require('./javaApiService');
const { logError } = require('./logger');

const vapidConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

// Web Push payloads have a hard encrypted-size limit (~4KB, RFC 8291) - well
// below that in practice once a free-text field (a calendar note's
// description has no length cap anywhere else in the app) is involved. A
// payload over the limit is rejected by the push service (typically 413),
// which - same as any other non-404/410 error below - silently drops the
// notification. Truncating here, centrally, protects every call site
// (today's and any future one) rather than each one remembering to do it.
const MAX_BODY_LENGTH = 500;

function truncateBody(body) {
    if (typeof body !== 'string' || body.length <= MAX_BODY_LENGTH) return body;
    return `${body.slice(0, MAX_BODY_LENGTH - 1)}…`;
}

if (vapidConfigured) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
    console.warn('[pushService] VAPID keys not configured - push notifications are disabled. See server_utilities/config.js.');
}

/**
 * Send a push notification to every subscribed device for a given user.
 *
 * Fire-and-forget from the caller's perspective - never throws, always
 * resolves, and is safe to call without awaiting before responding to an
 * HTTP request. Prunes any subscription the push service reports as gone
 * (404/410 - uninstalled, permission revoked, or expired).
 *
 * @param {number|string} userId - app_user.id of the recipient (tutor or GUEST)
 * @param {object} payload - { title, body, url, tag? } - JSON-serialized into the push message
 * @returns {Promise<void>}
 *
 * @example
 * sendPushToUser(tutorId, {
 *   title: 'New lesson booked',
 *   body: 'Mario Rossi, 10:00-11:00',
 *   url: '/calendar',
 *   tag: 'prenotation-42'
 * });
 */
async function sendPushToUser(userId, payload) {
    if (!vapidConfigured || userId == null) return;

    let subscriptions;
    try {
        subscriptions = await fetchPushSubscriptionsByUser(userId);
    } catch (error) {
        logError('[pushService] Error fetching subscriptions for user', null, { userId, error: error.message });
        return;
    }

    const body = JSON.stringify({ ...payload, body: truncateBody(payload.body) });

    await Promise.all((subscriptions || []).map(async (sub) => {
        try {
            await webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                body
            );
        } catch (error) {
            if (error.statusCode === 404 || error.statusCode === 410) {
                // Dead subscription (uninstalled, permission revoked, expired) - prune it
                deletePushSubscriptionByEndpoint(sub.endpoint);
            } else {
                // Anything else (401/403 bad VAPID keys, 413 payload too large, 429
                // rate-limited, network errors) was previously just a bare, untraceable
                // console.error - logged here with full context so a specific user's
                // missed notification can actually be diagnosed after the fact.
                logError('[pushService] Push send failed', null, { userId, endpoint: sub.endpoint, statusCode: error.statusCode, error: error.message });
            }
        }
    }));
}

module.exports = { sendPushToUser };
