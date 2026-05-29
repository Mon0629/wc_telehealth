import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router"
import {
  addDays,
  compareAsc,
  format,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
} from "date-fns"
import {
  CalendarCheckIcon,
  CalendarClockIcon,
  ChevronRightIcon,
  ClockIcon,
  VideoIcon,
} from "lucide-react"

import { RecentNotificationsCard } from "@/components/notifications/RecentNotificationsCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { waitForAuthHydration } from "@/lib/auth-hydration"
import useAuthStore from "@/store/authStore"
import useAppointmentStore, {
  APPOINTMENTS_LIST_MAX_LIMIT,
  formatTime24ToDisplay,
  type DoctorAppointmentStatus,
  type PatientAppointmentItem,
} from "@/store/appointmentStore"
import stethoscopeImage from "@/assets/sthetoscope.png"

function StatusBadge({ status }: { status: DoctorAppointmentStatus }) {
  const normalized = status.toLowerCase()

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
        normalized === "confirmed" && "bg-blue-600 text-white",
        normalized === "pending" && "bg-blue-400/80 text-white",
        normalized === "denied" && "bg-red-100 text-red-700",
        normalized === "completed" && "bg-sky-100 text-sky-700",
        normalized === "cancelled" && "bg-slate-100 text-slate-600",
      )}
    >
      {normalized}
    </span>
  )
}

function StethoscopeIllustration() {
  return (
    <img
      src={stethoscopeImage}
      alt=""
      aria-hidden
      className="pointer-events-none absolute top-1/2 right-0 z-20 hidden h-26 w-auto -translate-y-1/2 translate-x-[22%] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)] sm:block sm:h-30 sm:translate-x-[24%] lg:h-32 lg:translate-x-[26%]"
    />
  )
}

function AppointmentJoinLink({
  appointmentId,
  canJoin,
}: {
  appointmentId: number
  canJoin: boolean
}) {
  if (!canJoin) {
    return null
  }

  return (
    <Link
      to={`/call/${appointmentId}`}
      className="shrink-0 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
    >
      Join
    </Link>
  )
}

function formatAppointmentDayLabel(date: string) {
  try {
    const d = parseISO(date)
    if (isToday(d)) return "Today"
    return format(d, "MMM d, yyyy")
  } catch {
    return date
  }
}

function UpcomingAppointmentCard({ appointment }: { appointment: PatientAppointmentItem }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-900">
            {appointment.doctorName}
          </h3>
          <StatusBadge status={appointment.status} />
        </div>
        <AppointmentJoinLink
          appointmentId={appointment.id}
          canJoin={appointment.status === "Confirmed"}
        />
      </div>

      <p className="mt-1.5 text-sm text-slate-500">Your scheduled consultation</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
          {formatAppointmentDayLabel(appointment.appointmentDate)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ClockIcon className="size-3.5 text-slate-400" />
          {formatTime24ToDisplay(appointment.startTime)} (30 min)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <VideoIcon className="size-3.5 text-slate-400" />
          Video Call
        </span>
      </div>
    </div>
  )
}

function TodayDateStripCard({
  selectedDate,
  onSelectDate,
  appointmentDates,
}: {
  selectedDate: Date
  onSelectDate: (date: Date) => void
  appointmentDates: Date[]
}) {
  const today = new Date()
  const dayOptions = [addDays(today, -1), today, addDays(today, 1)]

  return (
    <Card className="flex h-full w-full flex-col gap-0 border-0 bg-white py-0 shadow-sm ring-1 ring-slate-100">
      <CardContent className="flex h-full flex-col justify-center p-4 sm:p-5">
        <p className="mb-4 text-base font-bold text-slate-900">
          Today, {format(today, "d MMMM")}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {dayOptions.map((day) => {
            const isSelected = isSameDay(day, selectedDate)
            const hasAppointment = appointmentDates.some((d) => isSameDay(d, day))

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onSelectDate(day)}
                className={cn(
                  "flex flex-col items-center rounded-xl border px-2 py-2.5 text-center transition-colors",
                  isSelected
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                  !isSelected && hasAppointment && "border-blue-300",
                )}
              >
                <span className="text-lg font-semibold leading-none">
                  {format(day, "d")}
                </span>
                <span
                  className={cn(
                    "mt-1 text-xs font-medium",
                    isSelected ? "text-blue-100" : "text-slate-500",
                  )}
                >
                  {format(day, "EEE")}
                </span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function UpcomingAppointmentsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-[108px] w-full rounded-xl" />
      ))}
    </div>
  )
}

export default function PatientDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())

  const patientAppointments = useAppointmentStore((s) => s.patientAppointments)
  const isLoading = useAppointmentStore((s) => s.isLoadingPatientAppointments)
  const fetchPatientAppointments = useAppointmentStore(
    (s) => s.fetchPatientAppointments,
  )

  useEffect(() => {
    let cancelled = false

    void (async () => {
      await waitForAuthHydration()
      if (cancelled) return
      try {
        await fetchPatientAppointments(1, APPOINTMENTS_LIST_MAX_LIMIT)
      } catch {
        // Errors are stored on the appointment store.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [fetchPatientAppointments])

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "there"

  const appointmentDates = useMemo(() => {
    const dates: Date[] = []
    for (const appointment of patientAppointments) {
      try {
        dates.push(parseISO(appointment.appointmentDate))
      } catch {
        // skip invalid dates
      }
    }
    return dates
  }, [patientAppointments])

  const upcomingAppointments = useMemo(() => {
    const today = startOfDay(new Date())

    return patientAppointments
      .filter((appointment) => {
        if (
          appointment.status === "Denied" ||
          appointment.status === "Cancelled" ||
          appointment.status === "Completed"
        ) {
          return false
        }
        try {
          const appointmentDay = startOfDay(parseISO(appointment.appointmentDate))
          return compareAsc(appointmentDay, today) >= 0
        } catch {
          return false
        }
      })
      .sort((a, b) => {
        try {
          const dateCompare = compareAsc(
            parseISO(a.appointmentDate),
            parseISO(b.appointmentDate),
          )
          if (dateCompare !== 0) return dateCompare
          return a.startTime.localeCompare(b.startTime)
        } catch {
          return 0
        }
      })
  }, [patientAppointments])

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-12 items-center gap-2 border-b border-slate-100 px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium text-slate-700">Dashboard</span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-5">
        <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:items-stretch">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 lg:w-3/4">
            <div className="flex shrink-0 flex-col gap-5 overflow-visible lg:flex-row lg:items-stretch">
              <Card className="relative flex h-full w-full min-w-0 flex-2 gap-0 overflow-visible border-0 bg-linear-to-br from-blue-600 via-blue-500 to-blue-700 py-0 shadow-lg ring-0">
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.12),transparent_60%)]" />
                <CardContent className="relative overflow-visible p-4 pr-20 sm:p-5 sm:pr-24 lg:pr-28">
                  <div className="relative z-10 flex min-w-0 flex-col gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-blue-100 sm:text-sm">
                        Welcome back, {user?.firstName ?? displayName}
                      </p>
                      <h2 className="text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl">
                        Manage Your Health
                      </h2>
                    </div>
                    <Button
                      size="default"
                      className="w-fit rounded-full bg-white px-5 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
                      onClick={() => navigate("/patient/appointments")}
                    >
                      <CalendarCheckIcon className="size-4" />
                      Book Appointment
                    </Button>
                  </div>
                  <StethoscopeIllustration />
                </CardContent>
              </Card>

              <div className="w-full min-w-0 flex-1">
                {isLoading ? (
                  <Skeleton className="h-full min-h-[140px] w-full rounded-xl" />
                ) : (
                  <TodayDateStripCard
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    appointmentDates={appointmentDates}
                  />
                )}
              </div>
            </div>

            <section className="flex min-h-0 flex-1 flex-col">
              <div className="mb-4 flex shrink-0 items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">
                  Upcoming Appointments
                </h2>
                {!isLoading && upcomingAppointments.length > 0 ? (
                  <span className="text-sm font-medium text-slate-500">
                    {upcomingAppointments.length} scheduled
                  </span>
                ) : null}
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {isLoading ? (
                  <div className="p-4">
                    <UpcomingAppointmentsSkeleton />
                  </div>
                ) : upcomingAppointments.length > 0 ? (
                  <>
                    <div className="flex-1 overflow-y-auto p-4">
                      <div className="space-y-3">
                        {upcomingAppointments.slice(0, 3).map((appointment) => (
                          <UpcomingAppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 border-t border-slate-100 p-3 text-center">
                      <button
                        type="button"
                        onClick={() => navigate("/patient/appointments")}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                      >
                        See all appointments
                        <ChevronRightIcon className="size-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-xl p-8 text-center">
                    <CalendarClockIcon className="mb-3 size-10 text-slate-300" />
                    <p className="text-sm font-medium text-slate-700">
                      No upcoming appointments
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Book an appointment to see your consultations here.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <RecentNotificationsCard className="w-full lg:w-1/4 lg:shrink-0" />
        </div>
      </div>
    </div>
  )
}
