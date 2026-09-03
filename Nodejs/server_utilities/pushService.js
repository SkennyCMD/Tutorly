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
 * service reports as dead (404/410) after a failed send.
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

const vapidConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

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
        console.error('[pushService] Error fetching subscriptions for user', userId, error.message);
        return;
    }

    const body = JSON.stringify(payload);

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
                console.error('[pushService] Push send failed:', error.message);
            }
        }
    }));
}

module.exports = { sendPushToUser };
