// Direct unit tests for pushService.js - not a route test. web-push and the
// Java API client are mocked directly (no nock) since this is testing
// pushService's own branching logic (truncation, 404/410 pruning, error
// logging), not an HTTP integration. VAPID keys are forced on via a partial
// config mock, since sendPushToUser no-ops entirely when they're unset (and
// whether the real .env has them is irrelevant/unknown to this test).
jest.mock('web-push', () => ({
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn()
}));
jest.mock('../server_utilities/javaApiService', () => ({
    fetchPushSubscriptionsByUser: jest.fn(),
    deletePushSubscriptionByEndpoint: jest.fn()
}));
jest.mock('../server_utilities/config', () => ({
    ...jest.requireActual('../server_utilities/config'),
    VAPID_PUBLIC_KEY: 'fake-public-key',
    VAPID_PRIVATE_KEY: 'fake-private-key'
}));
jest.mock('../server_utilities/logger', () => ({ logError: jest.fn() }));

const webpush = require('web-push');
const { fetchPushSubscriptionsByUser, deletePushSubscriptionByEndpoint } = require('../server_utilities/javaApiService');
const { logError } = require('../server_utilities/logger');
const { sendPushToUser } = require('../server_utilities/pushService');

beforeEach(() => {
    webpush.sendNotification.mockReset();
    fetchPushSubscriptionsByUser.mockReset();
    deletePushSubscriptionByEndpoint.mockReset();
    logError.mockClear();
});

describe('sendPushToUser', () => {
    test('sends to every subscription for the user', async () => {
        fetchPushSubscriptionsByUser.mockResolvedValue([
            { endpoint: 'https://push.example.com/a', p256dh: 'p1', auth: 'a1' },
            { endpoint: 'https://push.example.com/b', p256dh: 'p2', auth: 'a2' }
        ]);
        webpush.sendNotification.mockResolvedValue();

        await sendPushToUser(1, { title: 'Hi', body: 'short body', url: '/calendar' });

        expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
    });

    test('is a no-op with no subscriptions', async () => {
        fetchPushSubscriptionsByUser.mockResolvedValue([]);

        await sendPushToUser(1, { title: 'Hi', body: 'x', url: '/calendar' });

        expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    test('truncates an overly long body before sending - a free-text field like a note description has no length cap elsewhere', async () => {
        fetchPushSubscriptionsByUser.mockResolvedValue([{ endpoint: 'e', p256dh: 'p', auth: 'a' }]);
        webpush.sendNotification.mockResolvedValue();

        await sendPushToUser(1, { title: 'Hi', body: 'x'.repeat(600), url: '/calendar' });

        const sentPayload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
        expect(sentPayload.body.length).toBe(500);
        expect(sentPayload.body.endsWith('…')).toBe(true);
    });

    test('does not truncate a body within the limit', async () => {
        fetchPushSubscriptionsByUser.mockResolvedValue([{ endpoint: 'e', p256dh: 'p', auth: 'a' }]);
        webpush.sendNotification.mockResolvedValue();

        await sendPushToUser(1, { title: 'Hi', body: 'short', url: '/calendar' });

        const sentPayload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
        expect(sentPayload.body).toBe('short');
    });

    test.each([404, 410])('prunes a subscription that returns %i', async (statusCode) => {
        fetchPushSubscriptionsByUser.mockResolvedValue([{ endpoint: 'dead-endpoint', p256dh: 'p', auth: 'a' }]);
        webpush.sendNotification.mockRejectedValue(Object.assign(new Error('Gone'), { statusCode }));

        await sendPushToUser(1, { title: 'Hi', body: 'x', url: '/calendar' });

        expect(deletePushSubscriptionByEndpoint).toHaveBeenCalledWith('dead-endpoint');
    });

    test('does not prune and does not reject on a non-404/410 error', async () => {
        fetchPushSubscriptionsByUser.mockResolvedValue([{ endpoint: 'flaky-endpoint', p256dh: 'p', auth: 'a' }]);
        webpush.sendNotification.mockRejectedValue(Object.assign(new Error('Payload too large'), { statusCode: 413 }));

        await expect(sendPushToUser(1, { title: 'Hi', body: 'x', url: '/calendar' })).resolves.toBeUndefined();
        expect(deletePushSubscriptionByEndpoint).not.toHaveBeenCalled();
    });

    test('logs userId/endpoint/statusCode on a non-404/410 failure, so it is actually traceable', async () => {
        fetchPushSubscriptionsByUser.mockResolvedValue([{ endpoint: 'flaky-endpoint', p256dh: 'p', auth: 'a' }]);
        webpush.sendNotification.mockRejectedValue(Object.assign(new Error('Payload too large'), { statusCode: 413 }));

        await sendPushToUser(42, { title: 'Hi', body: 'x', url: '/calendar' });

        expect(logError).toHaveBeenCalledWith(
            expect.stringContaining('Push send failed'),
            null,
            expect.objectContaining({ userId: 42, endpoint: 'flaky-endpoint', statusCode: 413 })
        );
    });

    test('logs the userId when fetching subscriptions itself fails', async () => {
        fetchPushSubscriptionsByUser.mockRejectedValue(new Error('Java API down'));

        await sendPushToUser(42, { title: 'Hi', body: 'x', url: '/calendar' });

        expect(logError).toHaveBeenCalledWith(
            expect.stringContaining('Error fetching subscriptions'),
            null,
            expect.objectContaining({ userId: 42 })
        );
        expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    test('a failure sending to one subscription does not block sending to the others', async () => {
        fetchPushSubscriptionsByUser.mockResolvedValue([
            { endpoint: 'bad', p256dh: 'p', auth: 'a' },
            { endpoint: 'good', p256dh: 'p', auth: 'a' }
        ]);
        webpush.sendNotification.mockImplementation((sub) => sub.endpoint === 'bad'
            ? Promise.reject(Object.assign(new Error('fail'), { statusCode: 500 }))
            : Promise.resolve());

        await sendPushToUser(1, { title: 'Hi', body: 'x', url: '/calendar' });

        expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
    });

    test('is a no-op for a null userId', async () => {
        await sendPushToUser(null, { title: 'Hi', body: 'x', url: '/calendar' });

        expect(fetchPushSubscriptionsByUser).not.toHaveBeenCalled();
    });
});
