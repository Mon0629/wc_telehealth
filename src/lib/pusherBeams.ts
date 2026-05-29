import * as PusherPushNotifications from '@pusher/push-notifications-web';
import { requestNotificationPermission } from '@/lib/osNotification';

const instanceId = import.meta.env.VITE_PUSHER_BEAMS_INSTANCE_ID;
const beamsAuthUrl = `${import.meta.env.VITE_BASE_URL}/notifications/beams-auth`;

let beamsClient: PusherPushNotifications.Client | null = null;
let registeredUserId: string | null = null;
let initSession = 0;
let initPromise: Promise<void> | null = null;

/** Backend expects POST; the SDK TokenProvider uses GET. */
function createBeamsTokenProvider(
  accessToken: string,
): PusherPushNotifications.ITokenProvider {
  return {
    fetchToken: async () => {
      const res = await fetch(beamsAuthUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(
          `Beams auth failed (${res.status})${body ? `: ${body}` : ''}`,
        );
      }

      return res.json() as Promise<{ token: string }>;
    },
  };
}

/** Clears persisted Beams user when switching accounts on the same browser. */
async function syncBeamsUserId(
  client: PusherPushNotifications.Client,
  userIdStr: string,
  tokenProvider: PusherPushNotifications.ITokenProvider,
): Promise<void> {
  const existingUserId = await client.getUserId().catch(() => '');

  if (existingUserId === userIdStr) return;

  if (existingUserId) {
    console.log(
      `[Beams] Switching user ${existingUserId} → ${userIdStr}, clearing prior state`,
    );
    await client.clearAllState();
  }

  try {
    await client.setUserId(userIdStr, tokenProvider);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes('userId')) throw err;

    await client.clearAllState();
    await client.stop();
    await client.start();
    await client.setUserId(userIdStr, tokenProvider);
  }
}

async function ensureServiceWorker(): Promise<
  ServiceWorkerRegistration | undefined
> {
  if (!('serviceWorker' in navigator)) return undefined;

  try {
    return await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });
  } catch (err) {
    console.warn('[Beams] Service worker registration failed:', err);
    return undefined;
  }
}

/**
 * Initializes the Pusher Beams Web SDK and associates the current device
 * with the logged-in user for native push notifications.
 */
export async function initBeams(
  accessToken: string,
  userId: number,
): Promise<void> {
  if (!instanceId) {
    console.warn('[Beams] VITE_PUSHER_BEAMS_INSTANCE_ID not set — skipping');
    return;
  }

  const userIdStr = String(userId);
  if (initPromise) return initPromise;

  if (beamsClient && registeredUserId === userIdStr) {
    const current = await beamsClient.getUserId().catch(() => '');
    if (current === userIdStr) return;
  }

  const session = ++initSession;

  initPromise = (async () => {
    try {
      if (!beamsClient) {
        const serviceWorkerRegistration = await ensureServiceWorker();
        beamsClient = new PusherPushNotifications.Client({
          instanceId,
          ...(serviceWorkerRegistration
            ? { serviceWorkerRegistration }
            : {}),
        });
      }

      const client = beamsClient;
      if (!client || session !== initSession) return;

      const permissionGranted = await requestNotificationPermission();
      if (!permissionGranted) {
        console.warn(
          '[Beams] Notification permission not granted — OS push will not appear',
        );
      }

      const tokenProvider = createBeamsTokenProvider(accessToken);

      await client.start();
      if (session !== initSession) return;

      await syncBeamsUserId(client, userIdStr, tokenProvider);
      if (session !== initSession) return;

      const state = await client.getRegistrationState();
      registeredUserId = userIdStr;
      console.log('[Beams] Registered device for user', userId, '—', state);
    } catch (err) {
      if (session === initSession) {
        console.error('[Beams] Initialization failed:', err);
        registeredUserId = null;
        beamsClient = null;
      }
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Stops Beams and clears device registration. Call on logout only.
 */
export async function clearBeams(): Promise<void> {
  initSession += 1;
  registeredUserId = null;
  initPromise = null;

  if (!beamsClient) return;

  const client = beamsClient;
  beamsClient = null;

  try {
    await client.stop();
    await client.clearAllState();
  } catch (err) {
    console.error('[Beams] Cleanup failed:', err);
  }
}
