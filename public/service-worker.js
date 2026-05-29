importScripts('https://js.pusher.com/beams/service-worker.js');

const SHOW_OS_NOTIFICATION = 'SHOW_OS_NOTIFICATION';

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== SHOW_OS_NOTIFICATION) return;

  const { title, options } = data;
  const replyPort = event.ports?.[0];

  event.waitUntil(
    self.registration
      .showNotification(title, options)
      .then(() => replyPort?.postMessage({ ok: true }))
      .catch((err) =>
        replyPort?.postMessage({ ok: false, error: String(err) }),
      ),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url;
  if (!targetUrl) return;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (!client.url.startsWith(self.location.origin)) continue;
          if ('navigate' in client && typeof client.navigate === 'function') {
            return client.navigate(targetUrl).then((c) => c.focus());
          }
          if ('focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(targetUrl);
      }),
  );
});
