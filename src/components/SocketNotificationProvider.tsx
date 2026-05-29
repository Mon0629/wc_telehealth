import type { ReactNode } from "react"
import { useProfileSync } from "@/hooks/useProfileSync"
import { useSocketNotifications } from "@/hooks/useSocketNotifications"

/** Authenticated session: realtime notifications + `/profile/me` sync. */
export function SocketNotificationProvider({
  children,
}: {
  children: ReactNode
}) {
  useSocketNotifications()
  useProfileSync()
  return children
}
