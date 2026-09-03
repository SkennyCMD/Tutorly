/**
 *
 * Web Push Notification Opt-In
 *
 *
 * Client-side subscribe/unsubscribe flow for the bell toggle(s) in
 * partials/push-toggle.ejs (desktop) and partials/push-toggle-mobile.ejs
 * (mobile menu), both included on home.ejs only (see push-toggle.ejs for
 * why one page covers both the GUEST and tutor notification scenarios).
 *
 * Subscription state is per-browser, not per-button, so it's reflected via
 * [data-push-subscribed] on <html> (same pattern theme.js uses for
 * [data-theme]) - this keeps the desktop and mobile toggle in sync
 * automatically since both read the same shared CSS state.
 *
 * - On load: checks the current subscription state (no permission prompt -
 *   only reads it) to set the toggles' initial icon, then unhides them.
 * - On click (either toggle): subscribes (prompting for Notification
 *   permission if needed) or unsubscribes, depending on the current state.
 *
 * Feature-detects serviceWorker/PushManager support and leaves the toggles
 * hidden entirely if either is missing (e.g. iOS Safari before the PWA is
 * added to the home screen - Web Push only works there once installed).
 *
 */
(function () {
  const toggles = document.querySelectorAll('.push-toggle');
  if (toggles.length === 0) return;

  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (!supported) return; // stay hidden (see the `hidden` attribute in the partials)

  /**
   * Convert a base64url-encoded VAPID public key into the Uint8Array
   * applicationServerKey expects. Standard boilerplate for this API.
   *
   * @param {string} base64String
   * @returns {Uint8Array}
   */
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Reflect the given subscription state on every toggle button at once
   * (icon swap is pure CSS off [data-push-subscribed] on <html>; only the
   * aria-label/title need updating per-button here).
   * @param {boolean} isSubscribed
   */
  function setToggleState(isSubscribed) {
    document.documentElement.dataset.pushSubscribed = isSubscribed ? 'true' : 'false';
    const label = isSubscribed
      ? (window.t ? window.t('common.notificationsDisable') : 'Disable notifications')
      : (window.t ? window.t('common.notificationsEnable') : 'Enable notifications');
    toggles.forEach((toggle) => {
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('title', label);
    });
  }

  async function subscribe() {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      if (permission === 'denied') {
        alert(window.t ? window.t('common.notificationsBlocked') : 'Notifications are blocked - re-enable them in your browser settings.');
      }
      return;
    }

    const reg = await navigator.serviceWorker.ready;
    const keyResponse = await fetch('/api/push/vapid-public-key', { credentials: 'same-origin' });
    const { publicKey } = await keyResponse.json();
    if (!publicKey) {
      console.error('[push] No VAPID public key configured server-side - cannot subscribe.');
      return;
    }

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    await fetch('/api/push/subscribe', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subscription.toJSON() })
    });

    setToggleState(true);
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
      await subscription.unsubscribe();
    }
    setToggleState(false);
  }

  function handleToggleClick() {
    const isSubscribed = document.documentElement.dataset.pushSubscribed === 'true';
    (isSubscribed ? unsubscribe() : subscribe()).catch((error) => {
      console.error('[push] Subscribe/unsubscribe failed:', error);
    });
  }

  toggles.forEach((toggle) => toggle.addEventListener('click', handleToggleClick));

  // Reflect the real current state on load (read-only - no permission prompt)
  navigator.serviceWorker.ready
    .then((reg) => reg.pushManager.getSubscription())
    .then((subscription) => {
      setToggleState(Boolean(subscription));
      toggles.forEach((toggle) => { toggle.hidden = false; });
    })
    .catch((error) => {
      console.error('[push] Could not read current subscription state:', error);
    });
})();
