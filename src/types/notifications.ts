export type NotificationType =
  | 'appointment_booked'
  | 'appointment_confirmed'
  | 'appointment_rejected'
  | 'appointment_cancelled'
  | 'reminder'
  | 'consultation_notes_available'
  | 'prescription_available'
  | 'test_push'
  | 'general';

export interface AppNotification {
  id: number;
  title: string;
  body: string;
  type: NotificationType | string;
  appointment_id: number | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface NotificationListResponse {
  data: AppNotification[];
  unread_count: number;
  meta: NotificationListMeta;
}
