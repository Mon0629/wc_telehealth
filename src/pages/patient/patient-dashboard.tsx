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

import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge"
import { RecentNotificationsCard } from "@/components/notifications/RecentNotificationsCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { waitForAuthHydration } from "@/lib/auth-hydration"
import useAuthStore from "@/store/authStore"
import useAppointmentStore, {
  APPOINTMENTS_LIST_MAX_LIMIT,
  formatTime24ToDisplay,
  type PatientAppointmentItem,
} from "@/store/appointmentStore"
import stethoscopeImage from "@/assets/sthetoscope.png"

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
      className="shrink-0 text-sm font-medium text-zinc-900 underline-offset-4 hover:underline"
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

function UpcomingAppointmentRow({
  appointment,
}: {
  appointment: PatientAppointmentItem
}) {
  return (
    <TableRow className="border-zinc-200">
      <TableCell className="px-4 py-3">
        <div className="font-medium text-zinc-900">{appointment.doctorName}</div>
        <p className="mt-0.5 text-xs text-zinc-500">Your scheduled consultation</p>
      </TableCell>
      <TableCell className="px-4 py-3 text-zinc-600">
        {formatAppointmentDayLabel(appointment.appointmentDate)}
      </TableCell>
      <TableCell className="px-4 py-3 text-zinc-600">
        <span className="inline-flex items-center gap-1.5">
          <ClockIcon className="size-3.5 text-zinc-400" />
          {formatTime24ToDisplay(appointment.startTime)} (30 min)
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
          <VideoIcon className="size-3.5 text-zinc-400" />
          Video Call
        </span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <AppointmentStatusBadge status={appointment.status} />
      </TableCell>
      <TableCell className="px-4 py-3 text-right">
        <AppointmentJoinLink
          appointmentId={appointment.id}
          canJoin={appointment.status === "Confirmed"}
        />
      </TableCell>
    </TableRow>
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
    <Card className="flex h-full w-full flex-col gap-0 border-zinc-200 bg-white py-0 shadow-sm">
      <CardContent className="flex h-full flex-col justify-center p-4 sm:p-5">
        <p className="mb-4 text-base font-bold text-zinc-900">
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
                    ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
                  !isSelected && hasAppointment && "border-zinc-400",
                )}
              >
                <span className="text-lg font-semibold leading-none">
                  {format(day, "d")}
                </span>
                <span
                  className={cn(
                    "mt-1 text-xs font-medium",
                    isSelected ? "text-zinc-300" : "text-zinc-500",
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

function UpcomingAppointmentsTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i} className="border-zinc-200">
          <TableCell className="px-4 py-3" colSpan={5}>
            <Skeleton className="h-10 w-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
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
      <header className="flex h-12 items-center gap-2 border-b border-zinc-200 px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium text-zinc-700">Dashboard</span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-5">
        <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:items-stretch">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 lg:w-3/4">
            <div className="flex shrink-0 flex-col gap-5 overflow-visible lg:flex-row lg:items-stretch">
              <Card className="relative flex h-full w-full min-w-0 flex-2 gap-0 overflow-visible border-0 bg-zinc-900 py-0 shadow-lg ring-0">
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.08),transparent_60%)]" />
                <CardContent className="relative overflow-visible p-4 pr-20 sm:p-5 sm:pr-24 lg:pr-28">
                  <div className="relative z-10 flex min-w-0 flex-col gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-zinc-400 sm:text-sm">
                        Welcome back, {user?.firstName ?? displayName}
                      </p>
                      <h2 className="text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl">
                        Manage Your Health
                      </h2>
                    </div>
                    <Button
                      size="default"
                      className="w-fit rounded-full bg-white px-5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-100"
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
                <h2 className="text-base font-semibold text-zinc-900">
                  Upcoming Appointments
                </h2>
                {!isLoading && upcomingAppointments.length > 0 ? (
                  <span className="text-sm font-medium text-zinc-500">
                    {upcomingAppointments.length} scheduled
                  </span>
                ) : null}
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                {isLoading ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-200 bg-zinc-100 hover:bg-zinc-100">
                        <TableHead className="h-10 px-4 font-medium text-zinc-900">
                          Doctor
                        </TableHead>
                        <TableHead className="h-10 px-4 font-medium text-zinc-900">
                          Date
                        </TableHead>
                        <TableHead className="h-10 px-4 font-medium text-zinc-900">
                          Time
                        </TableHead>
                        <TableHead className="h-10 px-4 font-medium text-zinc-900">
                          Status
                        </TableHead>
                        <TableHead className="h-10 px-4 text-right font-medium text-zinc-900">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <UpcomingAppointmentsTableSkeleton />
                    </TableBody>
                  </Table>
                ) : upcomingAppointments.length > 0 ? (
                  <>
                    <div className="flex-1 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-zinc-200 bg-zinc-100 hover:bg-zinc-100">
                            <TableHead className="h-10 px-4 font-medium text-zinc-900">
                              Doctor
                            </TableHead>
                            <TableHead className="h-10 px-4 font-medium text-zinc-900">
                              Date
                            </TableHead>
                            <TableHead className="h-10 px-4 font-medium text-zinc-900">
                              Time
                            </TableHead>
                            <TableHead className="h-10 px-4 font-medium text-zinc-900">
                              Status
                            </TableHead>
                            <TableHead className="h-10 px-4 text-right font-medium text-zinc-900">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {upcomingAppointments.slice(0, 5).map((appointment) => (
                            <UpcomingAppointmentRow
                              key={appointment.id}
                              appointment={appointment}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="shrink-0 border-t border-zinc-200 p-3 text-center">
                      <button
                        type="button"
                        onClick={() => navigate("/patient/appointments")}
                        className="inline-flex items-center gap-1 text-sm font-medium text-zinc-900 transition-colors hover:underline"
                      >
                        See all appointments
                        <ChevronRightIcon className="size-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                    <CalendarClockIcon className="mb-3 size-10 text-zinc-300" />
                    <p className="text-sm font-medium text-zinc-700">
                      No upcoming appointments
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
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
