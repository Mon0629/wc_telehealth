import { useCallback, useEffect, useRef, useState } from "react"
import {
  Loader2Icon,
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type PrejoinMediaState = {
  microphoneOn: boolean
  cameraOn: boolean
}

type VideoConsultationPrejoinProps = {
  defaultDisplayName: string
  isJoining?: boolean
  onJoin: (displayName: string, media: PrejoinMediaState) => void
}

export function VideoConsultationPrejoin({
  defaultDisplayName,
  isJoining = false,
  onJoin,
}: VideoConsultationPrejoinProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [displayName, setDisplayName] = useState(defaultDisplayName)
  const [microphoneOn, setMicrophoneOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(true)

  const stopPreview = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const startPreview = async () => {
      setIsPreviewLoading(true)
      setPreviewError(null)
      stopPreview()

      if (!cameraOn && !microphoneOn) {
        setIsPreviewLoading(false)
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: cameraOn,
          audio: microphoneOn,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        stream.getAudioTracks().forEach((track) => {
          track.enabled = microphoneOn
        })
        stream.getVideoTracks().forEach((track) => {
          track.enabled = cameraOn
        })

        if (videoRef.current && cameraOn) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => undefined)
        }
      } catch {
        if (!cancelled) {
          setPreviewError(
            "Camera or microphone access was denied. You can still join the call.",
          )
        }
      } finally {
        if (!cancelled) setIsPreviewLoading(false)
      }
    }

    void startPreview()

    return () => {
      cancelled = true
      stopPreview()
    }
  }, [cameraOn, microphoneOn, stopPreview])

  const handleToggleMic = () => {
    const next = !microphoneOn
    setMicrophoneOn(next)
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = next
    })
  }

  const handleToggleCamera = () => {
    const next = !cameraOn
    setCameraOn(next)
    streamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next
    })
  }

  const handleJoin = () => {
    const name = displayName.trim()
    if (!name || isJoining) return
    stopPreview()
    onJoin(name, { microphoneOn, cameraOn })
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-zinc-100 p-4 sm:p-8">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg md:grid-cols-[1.1fr_0.9fr]">
        <div className="relative flex min-h-[280px] items-center justify-center bg-zinc-900 md:min-h-[360px]">
          {cameraOn ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={cn(
                "h-full w-full object-cover",
                isPreviewLoading && "opacity-0",
              )}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-400">
              <VideoOffIcon className="size-10" aria-hidden />
              <p className="text-sm">Camera is off</p>
            </div>
          )}

          {isPreviewLoading && cameraOn ? (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
              <Loader2Icon className="size-8 animate-spin text-zinc-400" />
            </div>
          ) : null}

          {previewError ? (
            <p className="absolute bottom-14 left-4 right-4 text-center text-xs text-zinc-400">
              {previewError}
            </p>
          ) : null}

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
            <button
              type="button"
              onClick={handleToggleMic}
              disabled={isJoining}
              aria-label={microphoneOn ? "Mute microphone" : "Unmute microphone"}
              className={cn(
                "flex size-11 items-center justify-center rounded-full border transition",
                microphoneOn
                  ? "border-zinc-600 bg-zinc-800/90 text-white hover:bg-zinc-700"
                  : "border-red-500/50 bg-red-950/80 text-red-200 hover:bg-red-900",
              )}
            >
              {microphoneOn ? (
                <MicIcon className="size-5" />
              ) : (
                <MicOffIcon className="size-5" />
              )}
            </button>
            <button
              type="button"
              onClick={handleToggleCamera}
              disabled={isJoining}
              aria-label={cameraOn ? "Turn off camera" : "Turn on camera"}
              className={cn(
                "flex size-11 items-center justify-center rounded-full border transition",
                cameraOn
                  ? "border-zinc-600 bg-zinc-800/90 text-white hover:bg-zinc-700"
                  : "border-red-500/50 bg-red-950/80 text-red-200 hover:bg-red-900",
              )}
            >
              {cameraOn ? (
                <VideoIcon className="size-5" />
              ) : (
                <VideoOffIcon className="size-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-6 px-6 py-8 sm:px-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Join room
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Check your camera and microphone, then enter the consultation.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display-name" className="text-sm text-zinc-700">
              Display name
            </Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              disabled={isJoining}
              className="h-12 rounded-xl border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/60"
            />
          </div>

          <Button
            type="button"
            disabled={!displayName.trim() || isJoining}
            onClick={handleJoin}
            className="h-12 w-full rounded-xl bg-zinc-900 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {isJoining ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Joining…
              </>
            ) : (
              "Join"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
