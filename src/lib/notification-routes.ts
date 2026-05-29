/**
 * Maps notification `type` (from API / Socket.io) to in-app routes.
 */
export function resolveNotificationPath(
  type: string | undefined,
  role?: string,
): string | null {
  if (!type) return null;

  const isDoctor = role === 'DOCTOR';

  switch (type) {
    // Doctor receives these
    case 'appointment_booked':
    case 'appointment_cancelled':
      return '/doctor/appointments';

    // Patient receives these
    case 'appointment_confirmed':
    case 'appointment_rejected':
      return '/patient/appointments';

    case 'consultation_notes_available':
    case 'prescription_available':
      return '/patient/medical-records';

    // Both patient and doctor (use role when available)
    case 'reminder':
      return isDoctor ? '/doctor/appointments' : '/patient/appointments';

    default:
      return null;
  }
}

/** Used by the service worker when `role` is unknown — infers doctor vs patient from an open tab URL. */
export function resolveNotificationPathFromUrl(
  type: string | undefined,
  pageUrl?: string,
): string | null {
  const isDoctorContext = Boolean(pageUrl?.includes('/doctor'));
  const role = isDoctorContext ? 'DOCTOR' : 'PATIENT';
  return resolveNotificationPath(type, role);
}
