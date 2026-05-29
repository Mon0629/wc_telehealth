import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { BellIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { resolveNotificationPath } from '@/lib/notification-routes';
import { cn } from '@/lib/utils';
import useAuthStore from '@/store/authStore';
import useNotificationStore from '@/store/notificationStore';
import type { AppNotification } from '@/types/notifications';

const PAGE_SIZE = 20;

function formatRelativeTime(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

function NotificationListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}

function NotificationRow({
  notification,
  onOpen,
}: {
  notification: AppNotification;
  onOpen: (n: AppNotification) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={cn(
        'w-full rounded-xl border px-4 py-3 text-left transition hover:bg-slate-50',
        notification.is_read
          ? 'border-slate-100 bg-white'
          : 'border-sky-100 bg-sky-50/50',
      )}
    >
      <div className="flex items-start gap-3">
        {!notification.is_read && (
          <span
            className="mt-2 size-2 shrink-0 rounded-full bg-sky-600"
            aria-hidden
          />
        )}
        <div className={cn('min-w-0 flex-1', notification.is_read && 'pl-0')}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p
              className={cn(
                'text-sm text-slate-900',
                !notification.is_read && 'font-semibold',
              )}
            >
              {notification.title}
            </p>
            <span className="shrink-0 text-xs text-slate-400">
              {formatRelativeTime(notification.created_at)}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{notification.body}</p>
        </div>
      </div>
    </button>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const listMeta = useNotificationStore((s) => s.listMeta);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const error = useNotificationStore((s) => s.error);
  const fetchList = useNotificationStore((s) => s.fetchList);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    fetchList({ page, limit: PAGE_SIZE, unreadOnly }).catch(() => undefined);
  }, [fetchList, page, unreadOnly]);

  async function handleOpen(notification: AppNotification) {
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

  function handleFilterChange(nextUnreadOnly: boolean) {
    setUnreadOnly(nextUnreadOnly);
    setPage(1);
  }

  const totalPages = listMeta?.totalPages ?? 1;
  const hasPrev = listMeta?.hasPrevPage ?? page > 1;
  const hasNext = listMeta?.hasNextPage ?? page < totalPages;

  return (
    <div className="flex min-h-full flex-col bg-slate-50/80">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200/80 bg-white px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium text-slate-700">Notifications</span>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Notifications</h1>
            <p className="text-sm text-slate-500">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : 'You are all caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead().catch(() => undefined)}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={unreadOnly ? 'outline' : 'default'}
            onClick={() => handleFilterChange(false)}
          >
            All
          </Button>
          <Button
            type="button"
            size="sm"
            variant={unreadOnly ? 'default' : 'outline'}
            onClick={() => handleFilterChange(true)}
          >
            Unread only
          </Button>
        </div>

        <Card className="border-0 shadow-sm ring-1 ring-slate-100">
          <CardContent className="p-4 sm:p-5">
            {isLoading && <NotificationListSkeleton />}

            {!isLoading && error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {!isLoading && !error && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BellIcon className="size-10 text-slate-300" aria-hidden />
                <p className="mt-3 text-sm font-medium text-slate-700">
                  No notifications
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {unreadOnly
                    ? 'No unread notifications right now.'
                    : 'New alerts will appear here when something happens.'}
                </p>
              </div>
            )}

            {!isLoading && !error && notifications.length > 0 && (
              <ul className="space-y-3">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <NotificationRow
                      notification={notification}
                      onOpen={handleOpen}
                    />
                  </li>
                ))}
              </ul>
            )}

            {!isLoading && !error && listMeta && listMeta.total > 0 && (
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">
                  Page {listMeta.page} of {listMeta.totalPages} · {listMeta.total}{' '}
                  total
                </p>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={!hasPrev || isLoading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeftIcon className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={!hasNext || isLoading}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label="Next page"
                  >
                    <ChevronRightIcon className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
