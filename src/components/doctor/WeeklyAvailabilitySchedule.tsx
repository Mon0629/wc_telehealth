import { useEffect, useState } from "react"
import { CalendarClockIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DAYS_OF_WEEK } from "@/lib/doctor-profile-payload"
import { cn } from "@/lib/utils"
import useDoctorProfileStore, {
  type AvailabilitySlot,
  type DayOfWeek,
  type DoctorProfileDetails,
} from "@/store/doctorProfileStore"

const DEFAULT_START = "09:00"
const DEFAULT_END = "17:00"

const timeInputClassName =
  "h-7 min-w-0 flex-1 w-full rounded-md border-slate-200 bg-white px-1.5 text-xs text-slate-900 [color-scheme:light] focus-visible:border-sky-300 focus-visible:ring-sky-200/60 [&::-webkit-calendar-picker-indicator]:size-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer"

export interface DayScheduleRow {
  enabled: boolean
  startTime: string
  endTime: string
}

export type WeekSchedule = Record<DayOfWeek, DayScheduleRow>

export function availabilitySlotsToWeekSchedule(
  slots: AvailabilitySlot[],
): WeekSchedule {
  const byDay = new Map(slots.map((s) => [s.dayOfWeek, s]))
  return Object.fromEntries(
    DAYS_OF_WEEK.map(({ value }) => {
      const slot = byDay.get(value)
      return [
        value,
        {
          enabled: Boolean(slot),
          startTime: slot?.startTime ?? DEFAULT_START,
          endTime: slot?.endTime ?? DEFAULT_END,
        },
      ]
    }),
  ) as WeekSchedule
}

export function weekScheduleToAvailabilitySlots(
  schedule: WeekSchedule,
): AvailabilitySlot[] {
  return DAYS_OF_WEEK.filter(({ value }) => schedule[value].enabled).map(
    ({ value }) => ({
      id: crypto.randomUUID(),
      dayOfWeek: value,
      startTime: schedule[value].startTime,
      endTime: schedule[value].endTime,
    }),
  )
}

function validateWeekSchedule(schedule: WeekSchedule): string | null {
  const enabledDays = DAYS_OF_WEEK.filter(({ value }) => schedule[value].enabled)

  if (enabledDays.length === 0) {
    return "Select at least one day you are available."
  }

  for (const { value, label } of enabledDays) {
    const row = schedule[value]
    if (row.startTime >= row.endTime) {
      return `End time must be after start time for ${label}.`
    }
  }

  return null
}

function getDayLabel(day: DayOfWeek): string {
  return DAYS_OF_WEEK.find((d) => d.value === day)?.label ?? day
}

export function WeeklyAvailabilitySchedule() {
  const profile = useDoctorProfileStore((state) => state.profile)
  const isSaving = useDoctorProfileStore((state) => state.isLoading)
  const isFetching = useDoctorProfileStore((state) => state.isFetching)
  const saveProfile = useDoctorProfileStore((state) => state.saveProfile)

  const [schedule, setSchedule] = useState<WeekSchedule>(() =>
    availabilitySlotsToWeekSchedule(profile.availability ?? []),
  )

  useEffect(() => {
    setSchedule(availabilitySlotsToWeekSchedule(profile.availability ?? []))
  }, [profile.availability])

  const updateDay = (day: DayOfWeek, patch: Partial<DayScheduleRow>) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...patch },
    }))
  }

  const handleSave = async () => {
    const validationError = validateWeekSchedule(schedule)
    if (validationError) {
      toast.error(validationError)
      return
    }

    const availability = weekScheduleToAvailabilitySlots(schedule)
    const nextProfile: DoctorProfileDetails = {
      ...profile,
      availability,
    }

    try {
      await saveProfile(nextProfile)
      toast.success("Weekly availability saved")
    } catch {
      toast.error(
        useDoctorProfileStore.getState().error ??
          "Could not save availability. Please try again.",
      )
    }
  }

  return (
    <Card className="gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-sm">
      <CardHeader className="border-b border-slate-100 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-sky-100">
            <CalendarClockIcon className="size-3.5 text-sky-600" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Weekly availability
            </CardTitle>
            <p className="text-[11px] text-slate-500">
              Check a day, then set hours.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 p-3">
        {isFetching ? (
          <div className="flex flex-col gap-2 py-1">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full rounded-md" />
            ))}
          </div>
        ) : (
        <ul className="flex flex-col divide-y divide-slate-100">
          {DAYS_OF_WEEK.map(({ value, label }) => {
            const row = schedule[value]
            const startId = `availability-start-${value}`
            const endId = `availability-end-${value}`
            const checkboxId = `availability-day-${value}`

            return (
              <li
                key={value}
                className={cn(
                  "flex min-w-0 items-center gap-2 py-1.5 first:pt-0 last:pb-0",
                  row.enabled && "bg-sky-50/30 -mx-1 rounded-md px-1",
                )}
              >
                <Checkbox
                  id={checkboxId}
                  checked={row.enabled}
                  onCheckedChange={(checked) =>
                    updateDay(value, { enabled: checked === true })
                  }
                  aria-label={`Available on ${label}`}
                  className="size-3.5"
                />
                <Label
                  htmlFor={checkboxId}
                  className="w-24 shrink-0 cursor-pointer text-xs font-medium text-slate-800"
                >
                  {label}
                </Label>
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <Input
                    id={startId}
                    type="time"
                    value={row.startTime}
                    disabled={!row.enabled}
                    onChange={(e) =>
                      updateDay(value, { startTime: e.target.value })
                    }
                    className={timeInputClassName}
                    aria-label={`${getDayLabel(value)} start time`}
                  />
                  <Input
                    id={endId}
                    type="time"
                    value={row.endTime}
                    disabled={!row.enabled}
                    onChange={(e) =>
                      updateDay(value, { endTime: e.target.value })
                    }
                    className={timeInputClassName}
                    aria-label={`${getDayLabel(value)} end time`}
                  />
                </div>
              </li>
            )
          })}
        </ul>
        )}

        <Button
          type="button"
          disabled={isSaving || isFetching}
          onClick={() => {
            handleSave().catch(() => undefined)
          }}
          className="h-8 w-full rounded-lg bg-sky-600 text-xs font-medium text-white hover:bg-sky-700"
        >
          {isSaving ? "Saving…" : "Save availability"}
        </Button>
      </CardContent>
    </Card>
  )
}
