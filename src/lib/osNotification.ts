import { resolveNotificationPath } from '@/lib/notification-routes';

const SW_MESSAGE_TYPE = 'SHOW_OS_NOTIFICATION';
const SW_REPLY_TIMEOUT_MS = 4000;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function getNotificationIconUrl(): string {
  return `${window.location.origin}/notification-icon.png`;
}

function buildNotificationOptions(
  body: string,
  url: string,
  type: string | undefined,
  tag: string,
): NotificationOptions {
  return {
    body,
    icon: getNotificationIconUrl(),
    badge: getNotificationIconUrl(),
    tag: `${tag}-${Date.now()}`,
    data: { url, type },
    silent: false,
  };
}

async function showViaServiceWorker(
  registration: ServiceWorkerRegistration,
  title: string,
  options: NotificationOptions,
): Promise<'worker' | 'registration'> {
  const sw = registration.active ?? registration.waiting ?? registration.installing;

  if (!sw) {
    await registration.showNotification(title, options);
    return 'registration';
  }

  try {
    await new Promise<void>((resolve, reject) => {
      const channel = new MessageChannel();
      const timeout = window.setTimeout(() => {
        reject(new Error('Service worker did not respond in time'));
      }, SW_REPLY_TIMEOUT_MS);

      channel.port1.onmessage = (event) => {
        window.clearTimeout(timeout);
        if (event.data?.ok) resolve();
        else reject(new Error(event.data?.error ?? 'Service worker failed'));
      };

      sw.postMessage(
        { type: SW_MESSAGE_TYPE, title, options },
        [channel.port2],
      );
    });
    return 'worker';
  } catch {
    await registration.showNotification(title, options);
    return 'registration';
  }
}

function showViaPage(title: string, options: NotificationOptions): void {
  const notification = new Notification(title, options);
  notification.onerror = () => {
    console.warn('[OS Notification] Page notification error');
  };
}

/**
 * Shows a native OS / system-tray notification.
 * Chrome: page API when the tab is focused; service worker (postMessage) when hidden.
 */
export async function showOsNotification(
  title: string,
  body: string,
  options?: {
    type?: string;
    role?: string;
    tag?: string;
  },
): Promise<void> {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const path = resolveNotificationPath(options?.type, options?.role);
  const url = path
    ? `${window.location.origin}${path}`
    : window.location.origin;

  const tag = options?.tag ?? `konsultify-${options?.type ?? 'general'}`;
  const notificationOptions = buildNotificationOptions(
    body,
    url,
    options?.type,
    tag,
  );

  try {
    if (document.visibilityState === 'visible') {
      showViaPage(title, notificationOptions);
      console.log('[OS Notification] Shown (page):', title);
      return;
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const via = await showViaServiceWorker(
        registration,
        title,
        notificationOptions,
      );
      console.log(`[OS Notification] Shown (${via}):`, title);
      return;
    }

    showViaPage(title, notificationOptions);
    console.log('[OS Notification] Shown (page fallback):', title);
  } catch (err) {
    console.warn('[OS Notification] Failed to show:', err);
    try {
      showViaPage(title, notificationOptions);
      console.log('[OS Notification] Shown (page recovery):', title);
    } catch (recoveryErr) {
      console.warn('[OS Notification] Recovery failed:', recoveryErr);
    }
  }
}
