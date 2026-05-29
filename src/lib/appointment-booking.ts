import { formatTime24ToDisplay } from "@/store/appointmentStore"

export function getEndOfNextMonth(from: Date = new Date()) {
  const end = new Date(from.getFullYear(), from.getMonth() + 2, 0)
  end.setHours(0, 0, 0, 0)
  return end
}

export function isDateWithinBookingWindow(date: Date, todayStart: Date) {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  if (day < todayStart) return false
  return day <= getEndOfNextMonth()
}

export function isMonthWithinBookingWindow(month: Date, from: Date = new Date()) {
  const current = new Date(from.getFullYear(), from.getMonth(), 1)
  const next = new Date(from.getFullYear(), from.getMonth() + 1, 1)
  const viewed = new Date(month.getFullYear(), month.getMonth(), 1)
  return (
    viewed.getTime() === current.getTime() ||
    viewed.getTime() === next.getTime()
  )
}

export function formatAppointmentSlotLabel(time: string) {
  return formatTime24ToDisplay(time)
}

export type SlotPeriod = "morning" | "afternoon" | "evening"

export function getSlotPeriod(time: string): SlotPeriod {
  const hour = Number(time.split(":")[0])
  if (Number.isNaN(hour)) return "morning"
  if (hour < 12) return "morning"
  if (hour < 17) return "afternoon"
  return "evening"
}

const SLOT_PERIOD_ORDER: SlotPeriod[] = ["morning", "afternoon", "evening"]

const SLOT_PERIOD_LABELS: Record<SlotPeriod, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
}

export function groupSlotsByPeriod(slots: string[]) {
  const groups = new Map<SlotPeriod, string[]>()

  for (const slot of slots) {
    const period = getSlotPeriod(slot)
    const list = groups.get(period) ?? []
    list.push(slot)
    groups.set(period, list)
  }

  return SLOT_PERIOD_ORDER.filter((period) => groups.has(period)).map(
    (period) => ({
      period,
      label: SLOT_PERIOD_LABELS[period],
      slots: groups.get(period) ?? [],
    }),
  )
}
