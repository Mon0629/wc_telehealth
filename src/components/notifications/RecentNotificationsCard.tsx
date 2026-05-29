import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { BellIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { resolveNotificationPath } from '@/lib/notification-routes';
import { cn } from '@/lib/utils';
import useAuthStore from '@/store/authStore';
import useNotificationStore from '@/store/notificationStore';

function formatRelativeTime(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

export function RecentNotificationsCard({
  className,
  limit = 5,
}: {
  className?: string;
  limit?: number;
}) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const error = useNotificationStore((s) => s.error);
  const fetchRecent = useNotificationStore((s) => s.fetchRecent);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  useEffect(() => {
    fetchRecent(limit).catch(() => undefined);
  }, [fetchRecent, limit]);

  useEffect(() => {
    const onFocus = () => {
      fetchRecent(limit).catch(() => undefined);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchRecent, limit]);

  async function handleItemClick(notification: (typeof notifications)[0]) {
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id);
      } catch {
        // still navigate
      }
    }
    const path = resolveNotificationPath(notification.type, user?.role);
    if (path) navigate(path);
  }

  return (
    <Card
      className={cn(
        'flex h-full min-h-[280px] flex-col gap-0 border-0 bg-white py-0 shadow-sm ring-1 ring-slate-100',
        className,
      )}
    >
      <CardContent className="flex h-full flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              Recent notifications
            </h3>
            {unreadCount > 0 && (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-sky-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 shrink-0 px-2 text-xs text-slate-600"
              onClick={() => markAllAsRead().catch(() => undefined)}
            >
              Mark all read
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        {!isLoading && !error && notifications.length === 0 && (
          <div className="mt-6 flex flex-1 flex-col items-center justify-center text-center">
            <BellIcon className="size-8 text-slate-300" aria-hidden />
            <p className="mt-2 text-sm text-slate-500">No notifications yet</p>
          </div>
        )}

        {!isLoading && !error && notifications.length > 0 && (
          <ul className="mt-3 flex flex-1 flex-col gap-2 overflow-y-auto">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => handleItemClick(notification)}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2.5 text-left transition hover:bg-slate-50',
                    notification.is_read
                      ? 'border-slate-100 bg-white'
                      : 'border-sky-100 bg-sky-50/60',
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!notification.is_read && (
                      <span
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-sky-600"
                        aria-hidden
                      />
                    )}
                    <div className={cn('min-w-0 flex-1', notification.is_read && 'pl-0')}>
                      <p
                        className={cn(
                          'truncate text-sm text-slate-900',
                          !notification.is_read && 'font-semibold',
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                        {notification.body}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
