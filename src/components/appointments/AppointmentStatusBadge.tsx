import {
  BanIcon,
  CheckCircle2Icon,
  CircleXIcon,
  Loader2Icon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { DoctorAppointmentStatus } from "@/store/appointmentStore"

const pillBase =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"

/** Outline-only Lucide icons (no solid fills). */
const iconOutline = "size-3.5 shrink-0 fill-none stroke-[2]"

export function AppointmentStatusBadge({
  status,
}: {
  status: DoctorAppointmentStatus
}) {
  const normalized = status.toLowerCase()

  if (normalized === "pending") {
    return (
      <span className={cn(pillBase, "border-zinc-200 bg-white text-zinc-700")}>
        <Loader2Icon
          className={cn(iconOutline, "animate-spin text-zinc-600")}
          aria-hidden
        />
        {status}
      </span>
    )
  }

  if (normalized === "confirmed") {
    return (
      <span className={cn(pillBase, "border-zinc-200 bg-white text-zinc-700")}>
        <CheckCircle2Icon
          className={cn(iconOutline, "text-zinc-800")}
          aria-hidden
        />
        {status}
      </span>
    )
  }

  if (normalized === "completed") {
    return (
      <span
        className={cn(pillBase, "border-zinc-900 bg-zinc-900 text-white")}
      >
        <CheckCircle2Icon
          className={cn(iconOutline, "text-white")}
          aria-hidden
        />
        {status}
      </span>
    )
  }

  if (normalized === "denied") {
    return (
      <span className={cn(pillBase, "border-zinc-200 bg-white text-zinc-700")}>
        <CircleXIcon
          className={cn(iconOutline, "text-zinc-800")}
          aria-hidden
        />
        {status}
      </span>
    )
  }

  return (
    <span className={cn(pillBase, "border-zinc-200 bg-white text-zinc-600")}>
      <BanIcon className={cn(iconOutline, "text-zinc-500")} aria-hidden />
      {status}
    </span>
  )
}
