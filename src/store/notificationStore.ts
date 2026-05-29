import { create } from 'zustand';
import axios from 'axios';
import api from '@/lib/axios';
import type {
  AppNotification,
  NotificationListMeta,
  NotificationListResponse,
} from '@/types/notifications';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  listMeta: NotificationListMeta | null;
  isLoading: boolean;
  error: string | null;
}

interface NotificationActions {
  addNotification: (n: AppNotification) => void;
  fetchRecent: (limit?: number) => Promise<void>;
  fetchList: (options?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearError: () => void;
}

const useNotificationStore = create<NotificationState & NotificationActions>(
  (set, get) => ({
    notifications: [],
    unreadCount: 0,
    listMeta: null,
    isLoading: false,
    error: null,

    addNotification: (n) =>
      set((state) => {
        if (state.notifications.some((item) => item.id === n.id)) {
          return state;
        }
        return {
          notifications: [n, ...state.notifications],
          unreadCount: n.is_read ? state.unreadCount : state.unreadCount + 1,
        };
      }),

    fetchList: async ({ page = 1, limit = 20, unreadOnly = false } = {}) => {
      set({ isLoading: true, error: null });
      try {
        const { data } = await api.get<NotificationListResponse>(
          '/notifications',
          {
            params: {
              page,
              limit,
              ...(unreadOnly ? { unread_only: true } : {}),
            },
          },
        );
        set({
          notifications: data.data,
          unreadCount: data.unread_count,
          listMeta: data.meta,
          isLoading: false,
        });
      } catch (err) {
        let message = 'Failed to load notifications.';
        if (axios.isAxiosError(err)) {
          message =
            err.response?.data?.message ??
            err.response?.data?.error ??
            message;
        }
        set({ error: message, isLoading: false });
        throw err;
      }
    },

    fetchRecent: async (limit = 5) => {
      await get().fetchList({ page: 1, limit, unreadOnly: false });
    },

    fetchUnreadCount: async () => {
      try {
        const { data } = await api.get<{ unread_count: number }>(
          '/notifications/unread-count',
        );
        set({ unreadCount: data.unread_count });
      } catch {
        // non-critical for badge
      }
    },

    markAsRead: async (id) => {
      await api.patch(`/notifications/${id}/read`);
      const { notifications, unreadCount } = get();
      const target = notifications.find((n) => n.id === id);
      const wasUnread = target && !target.is_read;

      set({
        notifications: notifications.map((n) =>
          n.id === id
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n,
        ),
        unreadCount: wasUnread ? Math.max(0, unreadCount - 1) : unreadCount,
      });
    },

    markAllAsRead: async () => {
      await api.patch('/notifications/read-all');
      set((state) => ({
        unreadCount: 0,
        notifications: state.notifications.map((n) => ({
          ...n,
          is_read: true,
          read_at: n.read_at ?? new Date().toISOString(),
        })),
      }));
    },

    clearError: () => set({ error: null }),
  }),
);

export default useNotificationStore;
