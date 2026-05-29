import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { getAccessToken, syncTokensFromPersistedAuth } from '@/lib/auth-token';
import { resolveNotificationPath } from '@/lib/notification-routes';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import type { AppNotification } from '@/types/notifications';
import useAuthStore from '@/store/authStore';
import useNotificationStore from '@/store/notificationStore';

function useAuthHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    useAuthStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const onReady = () => {
      syncTokensFromPersistedAuth();
      setHydrated(true);
    };
    if (useAuthStore.persist.hasHydrated()) {
      onReady();
      return;
    }
    return useAuthStore.persist.onFinishHydration(onReady);
  }, []);

  return hydrated;
}

/**
 * Connects Socket.io after login and handles `notification:new` events.
 */
export function useSocketNotifications() {
  const authHydrated = useAuthHydrated();
  const { isAuthenticated, accessToken, user } = useAuthStore();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authHydrated || !isAuthenticated || !accessToken) return;

    const token = getAccessToken() ?? accessToken;
    if (!token) return;

    const socket = connectSocket(token);

    const onNotification = (payload: AppNotification) => {
      addNotification(payload);
      const path = resolveNotificationPath(payload.type, user?.role);

      toast.info(payload.title, {
        description: payload.body,
        ...(path && {
          action: {
            label: 'View',
            onClick: () => navigate(path),
          },
        }),
      });
    };

    socket.on('notification:new', onNotification);
    fetchUnreadCount().catch(() => undefined);

    return () => {
      socket.off('notification:new', onNotification);
      disconnectSocket();
    };
  }, [
    authHydrated,
    isAuthenticated,
    accessToken,
    user?.role,
    addNotification,
    fetchUnreadCount,
    navigate,
  ]);
}
