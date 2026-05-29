# Socket.io In-App Notifications — Frontend Integration Guide

> **Replaces:** Firebase FCM in-app notifications  
> **Transport:** Socket.io over WebSocket (with HTTP long-polling fallback)  
> **Auth:** JWT access token passed in the Socket.io handshake

---

## Overview

Real-time notifications are now delivered through a persistent Socket.io connection.  
When the server creates a notification for a user it:

1. Persists the record to the `notifications` database table.
2. Emits a `notification:new` event to every active socket belonging to that user.

If the user is offline when the event fires, the notification is **still saved** in the database and can be fetched via the REST API on next load.

---

## 1. Install the Client Library

```bash
npm install socket.io-client
```

---

## 2. Connect with Authentication

Pass the user's JWT **access token** in the `auth` object of the socket handshake.  
The server validates the token before allowing the connection.

```ts
// lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(accessToken: string): Socket {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_API_URL, {   // e.g. http://localhost:3000
    path: '/socket.io',
    auth: { token: accessToken },
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket!.id);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] Disconnected:', reason);
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
```

> **When to connect:** after a successful login / when the access token is available in state.  
> **When to disconnect:** on logout or when the component/app unmounts.

---

## 3. Listen for `notification:new`

Subscribe to `notification:new` to receive real-time notifications.

### Payload shape

```ts
interface InAppNotification {
  id: number;
  title: string;
  body: string;
  type: string;                // e.g. 'appointment_booked' | 'appointment_confirmed' | 'reminder' | 'test_push'
  appointment_id: number | null;
  is_read: boolean;            // always false on first delivery
  read_at: string | null;      // ISO 8601 or null
  created_at: string;          // ISO 8601
}
```

### Listener example

```ts
import { getSocket } from '@/lib/socket';
import type { InAppNotification } from '@/types/notification';

// Call this once after connectSocket()
export function subscribeToNotifications(
  onNotification: (n: InAppNotification) => void,
) {
  const socket = getSocket();
  if (!socket) return;

  socket.on('notification:new', (payload: InAppNotification) => {
    onNotification(payload);
  });
}

export function unsubscribeFromNotifications() {
  getSocket()?.off('notification:new');
}
```

---

## 4. React Integration Example

### Connect on login / disconnect on logout

```tsx
// In your auth context or root component
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { subscribeToNotifications } from '@/lib/notifications';
import { useNotificationStore } from '@/stores/notificationStore';

function AppShell({ accessToken }: { accessToken: string }) {
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    const socket = connectSocket(accessToken);

    subscribeToNotifications((n) => {
      addNotification(n);  // push into your local store
      // optionally show a toast:
      toast.info(n.title, { description: n.body });
    });

    return () => {
      disconnectSocket();
    };
  }, [accessToken]);

  return <>{/* ... */}</>;
}
```

### Simple Zustand notification store

```ts
// stores/notificationStore.ts
import { create } from 'zustand';
import type { InAppNotification } from '@/types/notification';

interface NotificationState {
  notifications: InAppNotification[];
  unreadCount: number;
  addNotification: (n: InAppNotification) => void;
  markRead: (id: number) => void;
  markAllRead: () => void;
  setInitial: (data: { notifications: InAppNotification[]; unread_count: number }) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    })),

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n,
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({
        ...n,
        is_read: true,
        read_at: n.read_at ?? new Date().toISOString(),
      })),
      unreadCount: 0,
    })),

  setInitial: ({ notifications, unread_count }) =>
    set({ notifications, unreadCount: unread_count }),
}));
```

---

## 5. REST API Reference

Use the REST API to **load existing notifications** on page load and to **mark them as read**.  
All endpoints require `Authorization: Bearer <access_token>`.

### GET `/api/v1/notifications`

Fetch paginated notification list.

**Query parameters**

| Parameter    | Type    | Default | Description                         |
|--------------|---------|---------|-------------------------------------|
| `page`       | integer | `1`     | Page number                         |
| `limit`      | integer | `20`    | Items per page (max 50)             |
| `unread_only`| boolean | `false` | Return only unread notifications    |

**Response**

```json
{
  "data": [
    {
      "id": 42,
      "title": "Appointment Confirmed",
      "body": "Your appointment on 2026-06-01 at 09:00 has been confirmed.",
      "type": "appointment_confirmed",
      "appointment_id": 7,
      "is_read": false,
      "read_at": null,
      "created_at": "2026-05-29T15:30:00.000Z"
    }
  ],
  "unread_count": 3,
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "total_pages": 1
  }
}
```

---

### GET `/api/v1/notifications/unread-count`

Fast endpoint for badge polling (optional — prefer the Socket.io live count).

**Response**

```json
{ "unread_count": 3 }
```

---

### PATCH `/api/v1/notifications/:id/read`

Mark a single notification as read.

**Response**

```json
{ "success": true, "already_read": false }
```

---

### PATCH `/api/v1/notifications/read-all`

Mark all notifications as read.

**Response**

```json
{ "success": true, "updated_count": 3 }
```

---

### POST `/api/v1/notifications/test-push`

Send yourself a test notification (saved in DB and emitted via Socket.io).

**Response**

```json
{
  "success": true,
  "online": true,
  "message": "Test notification saved and emitted via Socket.io."
}
```

---

## 6. Notification Types

| `type`                  | Who receives it | Trigger                                    |
|-------------------------|-----------------|--------------------------------------------|
| `appointment_booked`    | Doctor          | Patient books an appointment               |
| `appointment_confirmed` | Patient         | Doctor confirms a pending appointment      |
| `appointment_cancelled` | Doctor          | Patient cancels an appointment             |
| `appointment_rejected`  | Patient         | Doctor rejects a pending appointment       |
| `reminder`              | Patient + Doctor| 30 minutes before a confirmed appointment  |
| `test_push`             | Self            | POST `/notifications/test-push`            |
| `general`               | —               | Fallback for custom notifications          |

---

## 7. Token Refresh Handling

The Socket.io connection uses the **access token** at connect time. Because access tokens expire (default 15 minutes), you should reconnect with the refreshed token when the server emits `connect_error` due to an expired token.

```ts
socket.on('connect_error', async (err) => {
  if (err.message === 'Invalid or expired token') {
    const newToken = await refreshAccessToken(); // your refresh logic
    socket.auth = { token: newToken };
    socket.connect();
  }
});
```

---

## 8. Environment Variable

Add to your frontend `.env`:

```
VITE_API_URL=http://localhost:3000
```

---

## 9. Migration Checklist (from Firebase FCM)

- [ ] Remove `firebase` / `firebase/app` / `firebase/messaging` packages from the frontend.
- [ ] Remove `firebase-messaging-sw.js` service worker registration.
- [ ] Remove calls to `POST /api/v1/notifications/register-token` and `POST /api/v1/notifications/unregister-token` — these endpoints no longer exist.
- [ ] Add `socket.io-client` dependency.
- [ ] Implement `connectSocket` / `disconnectSocket` as shown above.
- [ ] Subscribe to `notification:new` in your notification bell / toast component.
- [ ] On app boot (user already logged in), call `GET /api/v1/notifications` to seed the store.
- [ ] Remove any `VITE_FIREBASE_*` environment variables.
