import { useEffect, useRef, useState } from "react"
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt"

import { buildKitToken, fetchAppointmentJoinToken } from "@/lib/zego"
import useAuthStore from "@/store/authStore"

interface ZegoVideoRoomProps {
  appointmentId: number
  onLeave?: () => void
}

export function ZegoVideoRoom({ appointmentId, onLeave }: ZegoVideoRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const zegoInstanceRef = useRef<ZegoUIKitPrebuilt | null>(null)
  const onLeaveRef = useRef(onLeave)
  const user = useAuthStore((state) => state.user)
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(true)

  useEffect(() => {
    onLeaveRef.current = onLeave
  }, [onLeave])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false

    const joinRoom = async () => {
      setIsJoining(true)
      setError(null)

      try {
        const joinData = await fetchAppointmentJoinToken(appointmentId)
        if (cancelled) return

        const userName =
          [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
          joinData.user_id

        const kitToken = buildKitToken(joinData, userName)
        const zp = ZegoUIKitPrebuilt.create(kitToken)
        zegoInstanceRef.current = zp

        zp.joinRoom({
          container,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          onLeaveRoom: () => {
            onLeaveRef.current?.()
          },
        })

        if (!cancelled) {
          setIsJoining(false)
        }
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : "Could not join the video call."
        setError(message)
        setIsJoining(false)
      }
    }

    joinRoom()

    return () => {
      cancelled = true
      zegoInstanceRef.current?.destroy()
      zegoInstanceRef.current = null
    }
  }, [appointmentId, user?.firstName, user?.lastName])

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <p className="text-xs text-slate-500">
          Make sure the appointment is confirmed and you are allowed to join.
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {isJoining ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80">
          <p className="text-sm text-white">Joining call…</p>
        </div>
      ) : null}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
}
