import { useEffect, useRef, useState } from "react"
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt"

import {
  VideoConsultationPrejoin,
  type PrejoinMediaState,
} from "@/components/video/VideoConsultationPrejoin"
import { buildKitToken, fetchAppointmentJoinToken } from "@/lib/zego"
import useAuthStore from "@/store/authStore"

import "@/styles/zego-zinc.css"

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
  const [isJoining, setIsJoining] = useState(false)
  const [hasConfirmedPrejoin, setHasConfirmedPrejoin] = useState(false)
  const [joinPrefs, setJoinPrefs] = useState<{
    displayName: string
    media: PrejoinMediaState
  } | null>(null)

  const defaultDisplayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "Guest"

  useEffect(() => {
    onLeaveRef.current = onLeave
  }, [onLeave])

  useEffect(() => {
    if (!hasConfirmedPrejoin || !joinPrefs) return

    const container = containerRef.current
    if (!container) return

    let cancelled = false

    const joinRoom = async () => {
      setIsJoining(true)
      setError(null)

      try {
        const joinData = await fetchAppointmentJoinToken(appointmentId)
        if (cancelled) return

        const kitToken = buildKitToken(joinData, joinPrefs.displayName)
        const zp = ZegoUIKitPrebuilt.create(kitToken)
        zegoInstanceRef.current = zp

        zp.joinRoom({
          container,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          showPreJoinView: false,
          turnOnMicrophoneWhenJoining: joinPrefs.media.microphoneOn,
          turnOnCameraWhenJoining: joinPrefs.media.cameraOn,
          layout: "Auto",
          showLeaveRoomConfirmDialog: true,
          leaveRoomDialogConfig: {
            titleText: "Leave consultation?",
            descriptionText:
              "You will exit the video call and return to your appointments.",
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
        setHasConfirmedPrejoin(false)
        setJoinPrefs(null)
      }
    }

    void joinRoom()

    return () => {
      cancelled = true
      zegoInstanceRef.current?.destroy()
      zegoInstanceRef.current = null
    }
  }, [appointmentId, hasConfirmedPrejoin, joinPrefs])

  const handlePrejoin = (displayName: string, media: PrejoinMediaState) => {
    setJoinPrefs({ displayName, media })
    setHasConfirmedPrejoin(true)
  }

  if (!hasConfirmedPrejoin) {
    return (
      <VideoConsultationPrejoin
        key={defaultDisplayName}
        defaultDisplayName={defaultDisplayName}
        isJoining={isJoining}
        onJoin={handlePrejoin}
      />
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-zinc-950 p-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <p className="text-xs text-zinc-500">
          Make sure the appointment is confirmed and you are allowed to join.
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full bg-zinc-950">
      {isJoining ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/90">
          <p className="text-sm font-medium text-zinc-300">Connecting to room…</p>
        </div>
      ) : null}
      <div
        ref={containerRef}
        className="zego-room-container h-full w-full"
      />
    </div>
  )
}
