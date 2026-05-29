import {
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
} from "react"
import { format } from "date-fns"

import { Calendar } from "@/components/ui/calendar"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { DAYS_OF_WEEK } from "@/lib/doctor-profile-payload"
import {
  formatAppointmentSlotLabel,
  getEndOfNextMonth,
  groupSlotsByPeriod,
  isDateWithinBookingWindow,
  isMonthWithinBookingWindow,
} from "@/lib/appointment-booking"
import useAppointmentStore, { getSlotsForDate } from "@/store/appointmentStore"
import { isDateOnDoctorAvailableDay } from "@/store/doctorStore"

export interface DoctorAvailabilityPickerProps {
  doctorProfileId: number | null
  availableDaysOfWeek: number[]
  selectedDate?: Date
  onSelectedDateChange: (date: Date | undefined) => void
  selectedTime: string | null
  onSelectedTimeChange: (time: string | null) => void
  className?: string
  emptyDoctorMessage?: string
}

function TimeSlotGrid({
  slots,
  selectedTime,
  onSelectTime,
}: {
  slots: string[]
  selectedTime: string | null
  onSelectTime: (time: string) => void
}) {
  const grouped = groupSlotsByPeriod(slots)

  return (
    <div className="space-y-5">
      {grouped.map(({ period, label, slots: periodSlots }) => (
        <div key={period}>
          <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            {label}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {periodSlots.map((slot) => {
              const isSelected = selectedTime === slot
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onSelectTime(slot)}
                  className={cn(
                    "rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors",
                    isSelected
                      ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                      : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50",
                  )}
                >
                  {formatAppointmentSlotLabel(slot)}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export function DoctorAvailabilityPicker({
  doctorProfileId,
  availableDaysOfWeek,
  selectedDate,
  onSelectedDateChange,
  selectedTime,
  onSelectedTimeChange,
  className,
  emptyDoctorMessage = "Doctor availability is not available.",
}: DoctorAvailabilityPickerProps) {
  const [displayMonth, setDisplayMonth] = useState<Date>(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })

  const fetchWeekSlots = useAppointmentStore((state) => state.fetchWeekSlots)
  const clearWeekSlots = useAppointmentStore((state) => state.clearWeekSlots)
  const weekSlots = useAppointmentStore((state) => state.weekSlots)
  const isLoadingSlots = useAppointmentStore((state) => state.isLoadingSlots)
  const slotsError = useAppointmentStore((state) => state.slotsError)

  const todayStart = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const bookingWindowEnd = useMemo(() => getEndOfNextMonth(), [])
  const hasDoctor = doctorProfileId !== null

  const selectedDateKey = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : null

  const availableSlots = useMemo(() => {
    if (!selectedDateKey || !weekSlots) return []
    return getSlotsForDate(weekSlots, selectedDateKey)
  }, [weekSlots, selectedDateKey])

  const calendarDisabled = useMemo(() => {
    const matchers: Array<{ before: Date } | ((date: Date) => boolean)> = [
      { before: todayStart },
      (date) => {
        const day = new Date(date)
        day.setHours(0, 0, 0, 0)
        return day > bookingWindowEnd
      },
    ]

    if (hasDoctor) {
      matchers.push((date) => {
        const day = new Date(date)
        day.setHours(0, 0, 0, 0)
        if (day < todayStart) return false
        if (day > bookingWindowEnd) return false
        return !isDateOnDoctorAvailableDay(date, availableDaysOfWeek)
      })
    }

    return matchers
  }, [todayStart, bookingWindowEnd, hasDoctor, availableDaysOfWeek])

  const calendarComponents = useMemo(
    () => ({
      Weekday: ({
        className: weekdayClassName,
        children,
        ...props
      }: ComponentProps<"th">) => {
        const text = String(children ?? "").trim()
        const matchedDay = DAYS_OF_WEEK.find((day) => {
          const short = day.label.slice(0, 3).toLowerCase()
          return (
            short.startsWith(text.toLowerCase()) ||
            text.toLowerCase().startsWith(short.slice(0, 2))
          )
        })
        const isAvailable =
          hasDoctor &&
          isMonthWithinBookingWindow(displayMonth) &&
          matchedDay != null &&
          availableDaysOfWeek.includes(matchedDay.apiNumber)

        return (
          <th
            {...props}
            className={cn(
              weekdayClassName,
              isAvailable && "font-semibold text-zinc-900",
            )}
          >
            {children}
          </th>
        )
      },
    }),
    [hasDoctor, availableDaysOfWeek, displayMonth],
  )

  useEffect(() => {
    if (!selectedDate) return
    if (
      !isDateWithinBookingWindow(selectedDate, todayStart) ||
      (hasDoctor &&
        !isDateOnDoctorAvailableDay(selectedDate, availableDaysOfWeek))
    ) {
      onSelectedDateChange(undefined)
    }
  }, [
    hasDoctor,
    availableDaysOfWeek,
    selectedDate,
    todayStart,
    onSelectedDateChange,
  ])

  useEffect(() => {
    if (!doctorProfileId || !selectedDateKey) {
      clearWeekSlots()
      return
    }

    const [year, month, day] = selectedDateKey.split("-").map(Number)
    const dateForCheck = new Date(year, month - 1, day)

    if (
      !isDateWithinBookingWindow(dateForCheck, todayStart) ||
      !isDateOnDoctorAvailableDay(dateForCheck, availableDaysOfWeek)
    ) {
      return
    }

    fetchWeekSlots(doctorProfileId, selectedDateKey).catch(() => undefined)
  }, [
    doctorProfileId,
    selectedDateKey,
    availableDaysOfWeek,
    todayStart,
    fetchWeekSlots,
    clearWeekSlots,
  ])

  useEffect(() => {
    if (!selectedDate) {
      onSelectedTimeChange(null)
    }
  }, [selectedDate, onSelectedTimeChange])

  const handleDateSelect = (date: Date | undefined) => {
    onSelectedDateChange(date)
    onSelectedTimeChange(null)
  }

  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row lg:divide-x lg:divide-zinc-200",
        className,
      )}
    >
      <div className="flex shrink-0 justify-center p-4 lg:justify-start">
        <Calendar
          mode="single"
          weekStartsOn={1}
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={!hasDoctor ? true : calendarDisabled}
          modifiers={{
            doctorAvailable: (date) => {
              if (!hasDoctor) return false
              if (!isDateWithinBookingWindow(date, todayStart)) return false
              return isDateOnDoctorAvailableDay(date, availableDaysOfWeek)
            },
          }}
          modifiersClassNames={{
            doctorAvailable:
              "bg-zinc-100 font-medium text-zinc-900 [&_button]:font-semibold [&_button]:text-zinc-800 [&_button]:hover:bg-zinc-200",
          }}
          components={calendarComponents}
          className="rounded-xl [--cell-size:2.25rem] **:data-[selected-single=true]:bg-zinc-900 **:data-[selected-single=true]:text-white"
        />
      </div>

      <div className="min-h-[240px] min-w-0 flex-1 border-t border-zinc-200 p-4 lg:min-h-0 lg:border-t-0">
        {!hasDoctor ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="max-w-xs text-sm text-zinc-500">{emptyDoctorMessage}</p>
          </div>
        ) : !selectedDate ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="max-w-xs text-sm text-zinc-500">
              Select an available date to see time slots.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                Available times
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">
                {format(selectedDate, "EEEE, MMM d, yyyy")}
              </p>
            </div>

            <div className="max-h-[min(50vh,320px)] overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {isLoadingSlots ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={index} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              ) : slotsError ? (
                <p className="text-sm text-red-600">{slotsError}</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No time slots available for this date.
                </p>
              ) : (
                <TimeSlotGrid
                  slots={availableSlots}
                  selectedTime={selectedTime}
                  onSelectTime={onSelectedTimeChange}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
