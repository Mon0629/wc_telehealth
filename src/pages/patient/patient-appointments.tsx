import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  StethoscopeIcon,
  TagIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { JoinRoomLink } from "@/components/video/JoinRoomLink"
import { cn } from "@/lib/utils"
import { DAYS_OF_WEEK } from "@/lib/doctor-profile-payload"
import useAppointmentStore, {
  formatTime24ToDisplay,
  getSlotsForDate,
  type DoctorAppointmentStatus,
  type PatientAppointmentItem,
} from "@/store/appointmentStore"
import useDoctorStore, {
  isDateOnDoctorAvailableDay,
  type DoctorListItem,
} from "@/store/doctorStore"

function StatusBadge({ status }: { status: DoctorAppointmentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "Confirmed" && "bg-emerald-100 text-emerald-700",
        status === "Pending" && "bg-amber-100 text-amber-700",
        status === "Denied" && "bg-red-100 text-red-700",
        status === "Completed" && "bg-sky-100 text-sky-700",
        status === "Cancelled" && "bg-slate-100 text-slate-600",
      )}
    >
      {status}
    </span>
  )
}

function formatAppointmentDate(date: string) {
  try {
    return format(parseISO(date), "MMM d, yyyy")
  } catch {
    return date
  }
}

function PatientAppointmentTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index} className="border-slate-100">
          <TableCell className="px-4 py-3">
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell className="px-4 py-3">
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell className="px-4 py-3">
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell className="px-4 py-3">
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell className="px-4 py-3">
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

function formatFee(fee: string) {
  const amount = Number(fee)
  if (Number.isNaN(amount)) return fee
  return `₱${amount.toLocaleString()}`
}

function getInitials(name: string) {
  return name
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function getEndOfNextMonth(from: Date = new Date()) {
  const end = new Date(from.getFullYear(), from.getMonth() + 2, 0)
  end.setHours(0, 0, 0, 0)
  return end
}

function isDateWithinBookingWindow(date: Date, todayStart: Date) {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  if (day < todayStart) return false
  return day <= getEndOfNextMonth()
}

function isMonthWithinBookingWindow(month: Date, from: Date = new Date()) {
  const current = new Date(from.getFullYear(), from.getMonth(), 1)
  const next = new Date(from.getFullYear(), from.getMonth() + 1, 1)
  const viewed = new Date(month.getFullYear(), month.getMonth(), 1)
  return (
    viewed.getTime() === current.getTime() ||
    viewed.getTime() === next.getTime()
  )
}

function formatSlotLabel(time: string) {
  const [hourPart, minutePart = "00"] = time.split(":")
  const hour = Number(hourPart)
  const minute = Number(minutePart)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time

  const period = hour >= 12 ? "pm" : "am"
  const hour12 = hour % 12 || 12
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`
}

function AppointmentDoctorCard({
  doctor,
  isSelected,
  onSelect,
}: {
  doctor: DoctorListItem
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        "cursor-pointer gap-0 overflow-visible border-2 bg-white py-0 shadow-sm transition-[border-color,box-shadow] hover:shadow-md",
        isSelected ? "border-sky-400" : "border-slate-200",
      )}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="size-16 shrink-0 rounded-xl">
            <AvatarImage
              src={doctor.avatar}
              alt={doctor.name}
              className="rounded-xl object-cover"
            />
            <AvatarFallback className="rounded-xl bg-sky-100 font-semibold text-sky-700">
              {getInitials(doctor.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <p className="truncate text-sm font-semibold text-slate-800">
              {doctor.name}
            </p>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <StethoscopeIcon className="size-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{doctor.specialization}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <TagIcon className="size-3.5 shrink-0 text-slate-400" />
              <span className="truncate">
                {formatFee(doctor.fee)}/appointment
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AppointmentDoctorCardSkeleton() {
  return (
    <Card className="gap-0 border-2 border-slate-200 bg-white py-0">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Skeleton className="size-16 shrink-0 rounded-xl" />
          <div className="flex flex-1 flex-col justify-center gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const PatientAppointments = () => {
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorListItem | null>(
    null,
  )
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  )
  const [displayMonth, setDisplayMonth] = useState<Date>(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [concern, setConcern] = useState("")
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [slotsDialogOpen, setSlotsDialogOpen] = useState(false)
  const [calendarCardHeight, setCalendarCardHeight] = useState<number>()
  const calendarCardRef = useRef<HTMLDivElement>(null)

  const { doctors, pagination, isLoading, error, fetchDoctors, clearError } =
    useDoctorStore()

  const fetchWeekSlots = useAppointmentStore((state) => state.fetchWeekSlots)
  const createAppointment = useAppointmentStore((state) => state.createAppointment)
  const isBooking = useAppointmentStore((state) => state.isBooking)
  const clearWeekSlots = useAppointmentStore((state) => state.clearWeekSlots)
  const weekSlots = useAppointmentStore((state) => state.weekSlots)
  const isLoadingSlots = useAppointmentStore((state) => state.isLoadingSlots)
  const slotsError = useAppointmentStore((state) => state.slotsError)
  const patientAppointments = useAppointmentStore(
    (state) => state.patientAppointments,
  )
  const patientAppointmentsMeta = useAppointmentStore(
    (state) => state.patientAppointmentsMeta,
  )
  const isLoadingPatientAppointments = useAppointmentStore(
    (state) => state.isLoadingPatientAppointments,
  )
  const patientAppointmentsError = useAppointmentStore(
    (state) => state.patientAppointmentsError,
  )
  const fetchPatientAppointments = useAppointmentStore(
    (state) => state.fetchPatientAppointments,
  )
  const clearPatientAppointmentsError = useAppointmentStore(
    (state) => state.clearPatientAppointmentsError,
  )

  const todayStart = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const availableDaysOfWeek = useMemo(
    () => selectedDoctor?.availableDaysOfWeek ?? [],
    [selectedDoctor?.availableDaysOfWeek],
  )

  const selectedDoctorId = selectedDoctor?.id ?? null

  const selectedDateKey = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : null

  const availableSlots = useMemo(() => {
    if (!selectedDateKey || !weekSlots) return []
    return getSlotsForDate(weekSlots, selectedDateKey)
  }, [weekSlots, selectedDateKey])

  const bookingWindowEnd = useMemo(() => getEndOfNextMonth(), [])

  const calendarDisabled = useMemo(() => {
    const matchers: Array<{ before: Date } | ((date: Date) => boolean)> = [
      { before: todayStart },
      (date) => {
        const day = new Date(date)
        day.setHours(0, 0, 0, 0)
        return day > bookingWindowEnd
      },
    ]

    if (selectedDoctor) {
      matchers.push((date) => {
        const day = new Date(date)
        day.setHours(0, 0, 0, 0)
        if (day < todayStart) return false
        if (day > bookingWindowEnd) return false
        return !isDateOnDoctorAvailableDay(date, availableDaysOfWeek)
      })
    }

    return matchers
  }, [todayStart, bookingWindowEnd, selectedDoctor, availableDaysOfWeek])

  useEffect(() => {
    fetchDoctors(1, 10).catch(() => undefined)
  }, [fetchDoctors])

  useEffect(() => {
    fetchPatientAppointments(1).catch(() => undefined)
  }, [fetchPatientAppointments])

  useEffect(() => {
    if (!selectedDate) return
    if (
      !isDateWithinBookingWindow(selectedDate, todayStart) ||
      (selectedDoctor &&
        !isDateOnDoctorAvailableDay(selectedDate, availableDaysOfWeek))
    ) {
      setSelectedDate(undefined)
    }
  }, [selectedDoctor, availableDaysOfWeek, selectedDate, todayStart])

  useEffect(() => {
    if (!selectedDoctorId || !selectedDateKey) {
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

    fetchWeekSlots(selectedDoctorId, selectedDateKey).catch(() => undefined)
  }, [selectedDoctorId, selectedDateKey, availableDaysOfWeek, todayStart])

  useEffect(() => {
    if (!selectedDate) {
      setSlotsDialogOpen(false)
      setSelectedTime(null)
    }
  }, [selectedDate])

  useEffect(() => {
    setSlotsDialogOpen(false)
    setSelectedTime(null)
  }, [selectedDoctorId])

  useLayoutEffect(() => {
    const node = calendarCardRef.current
    if (!node) return

    const updateHeight = () => {
      setCalendarCardHeight(node.getBoundingClientRect().height)
    }

    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(node)
    window.addEventListener("resize", updateHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateHeight)
    }
  }, [isLoading, selectedDate, doctors.length])

  const handleDoctorPageChange = (page: number) => {
    fetchDoctors(page, pagination?.limit ?? 10).catch(() => undefined)
  }

  const handleAppointmentsPageChange = (page: number) => {
    fetchPatientAppointments(page).catch(() => undefined)
  }

  const calendarComponents = useMemo(
    () => ({
      Weekday: ({
        className,
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
          Boolean(selectedDoctor) &&
          isMonthWithinBookingWindow(displayMonth) &&
          Boolean(matchedDay) &&
          availableDaysOfWeek.includes(matchedDay.apiNumber)

        return (
          <th
            {...props}
            className={cn(
              className,
              isAvailable && "font-semibold text-emerald-700",
            )}
          >
            {children}
          </th>
        )
      },
    }),
    [selectedDoctor, availableDaysOfWeek, displayMonth],
  )

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedTime(null)

    if (!date || !selectedDoctor) {
      setSlotsDialogOpen(false)
      return
    }

    if (
      !isDateWithinBookingWindow(date, todayStart) ||
      !isDateOnDoctorAvailableDay(date, availableDaysOfWeek)
    ) {
      setSlotsDialogOpen(false)
      return
    }

    setSlotsDialogOpen(true)
  }

  const handleBookAppointment = async () => {
    if (
      !selectedDoctor ||
      !selectedDate ||
      !selectedDateKey ||
      !selectedTime ||
      !concern.trim()
    ) {
      return
    }

    try {
      await createAppointment({
        doctor_profile_id: selectedDoctor.id,
        appointment_date: selectedDateKey,
        start_time: selectedTime,
        patient_notes: concern.trim(),
      })

      toast.success("Appointment booked successfully")

      await fetchPatientAppointments(
        patientAppointmentsMeta?.page ?? 1,
      )

      setSelectedDoctor(null)
      setSelectedDate(undefined)
      setSelectedTime(null)
      setSlotsDialogOpen(false)
      setConcern("")
      clearWeekSlots()

      const currentMonth = new Date()
      currentMonth.setDate(1)
      currentMonth.setHours(0, 0, 0, 0)
      setDisplayMonth(currentMonth)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to book appointment"
      toast.error(message)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-12 items-center gap-2 border-b border-slate-100 px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium text-slate-700">
          My Appointments
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-5">
        <div className="flex flex-col gap-6 xl:flex-row xl:gap-6">
        {/* Left — doctors (single column) */}
        <aside className="flex w-full shrink-0 flex-col gap-3 xl:w-[300px]">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Choose Doctor
            </h2>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              <p>{error}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-7 px-2 text-red-700 hover:bg-red-100"
                onClick={() => {
                  clearError()
                  fetchDoctors(
                    pagination?.page ?? 1,
                    pagination?.limit ?? 10,
                  ).catch(() => undefined)
                }}
              >
                Retry
              </Button>
            </div>
          ) : null}

          <Card
            className="flex flex-col gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-sm"
            style={
              calendarCardHeight
                ? { height: `${calendarCardHeight}px` }
                : undefined
            }
          >
            <CardContent className="flex h-full min-h-0 flex-col p-3">
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <AppointmentDoctorCardSkeleton key={i} />
                  ))
                ) : doctors.length > 0 ? (
                  doctors.map((doctor) => (
                    <AppointmentDoctorCard
                      key={doctor.id}
                      doctor={doctor}
                      isSelected={selectedDoctor?.id === doctor.id}
                      onSelect={() => setSelectedDoctor(doctor)}
                    />
                  ))
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center">
                    <p className="text-sm text-slate-500">
                      No doctors available
                    </p>
                  </div>
                )}
              </div>

              {pagination && pagination.totalPages > 1 && !isLoading ? (
                <div className="mt-3 flex shrink-0 items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-500">
                    {pagination.page}/{pagination.totalPages}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={!pagination.hasPrevPage}
                      onClick={() => handleDoctorPageChange(pagination.page - 1)}
                      className="rounded-lg"
                    >
                      <ChevronLeftIcon className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={!pagination.hasNextPage}
                      onClick={() => handleDoctorPageChange(pagination.page + 1)}
                      className="rounded-lg"
                    >
                      <ChevronRightIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </aside>

        {/* Middle — date */}
        <section className="flex w-full shrink-0 flex-col gap-3 xl:w-[340px]">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Choose date
            </h2>

          </div>

          <div ref={calendarCardRef} className="w-full">
            <Card className="w-full gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-sm">
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  weekStartsOn={1}
                  month={displayMonth}
                  onMonthChange={setDisplayMonth}
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={calendarDisabled}
                  modifiers={{
                    doctorAvailable: (date) => {
                      if (!selectedDoctor) return false
                      if (!isDateWithinBookingWindow(date, todayStart))
                        return false
                      return isDateOnDoctorAvailableDay(
                        date,
                        availableDaysOfWeek,
                      )
                    },
                  }}
                  modifiersClassNames={{
                    doctorAvailable:
                      "bg-emerald-50 font-medium text-emerald-900 [&_button]:font-semibold [&_button]:text-emerald-800 [&_button]:hover:bg-emerald-100",
                  }}
                  components={calendarComponents}
                  className="w-full rounded-xl [--cell-size:2.25rem]"
                  classNames={{
                    root: "w-full",
                    month: "w-full",
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Right — patient concern */}
        <section className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Your concern
            </h2>
          </div>

          <Card
            className="flex flex-col gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-sm"
            style={
              calendarCardHeight
                ? { height: `${calendarCardHeight}px` }
                : undefined
            }
          >
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <Label
                  htmlFor="concern"
                  className="shrink-0 text-sm font-semibold text-slate-900"
                >
                  Describe your concern or symptoms
                </Label>
                <Textarea
                  id="concern"
                  value={concern}
                  onChange={(e) => setConcern(e.target.value)}
                  placeholder="e.g. I've had a persistent cough and mild fever for 3 days..."
                  className="min-h-0 flex-1 resize-none rounded-xl border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/60"
                />
                <p className="shrink-0 text-xs text-slate-500">
                  This will be shared with your doctor before the appointment.
                </p>
              </div>

              {selectedDoctor ? (
                <div className="shrink-0 rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-slate-600">
                  <span className="font-medium text-slate-800">Doctor:</span>{" "}
                  {selectedDoctor.name}
                  {selectedDate ? (
                    <>
                      <br />
                      <span className="font-medium text-slate-800">
                        Date & Time:
                      </span>{" "}
                      {format(selectedDate, "MMM d, yyyy")}
                      {selectedTime
                        ? ` | ${formatSlotLabel(selectedTime)}`
                        : null}
                    </>
                  ) : null}
                </div>
              ) : null}

              <Button
                type="button"
                disabled={
                  isBooking ||
                  !selectedDoctor ||
                  !selectedDate ||
                  !selectedTime ||
                  !concern.trim()
                }
                onClick={() => {
                  handleBookAppointment().catch(() => undefined)
                }}
                className="h-10 w-full shrink-0 rounded-xl bg-indigo-500 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
              >
                {isBooking ? "Booking…" : "Book appointment"}
              </Button>
            </CardContent>
          </Card>
        </section>
        </div>

        {/* Appointments table — full width */}
        <section className="w-full min-w-0">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-slate-800">
              My Appointments
            </h2>
          </div>

          {patientAppointmentsError ? (
            <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p>{patientAppointmentsError}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 px-2 text-red-700 hover:bg-red-100"
                onClick={() => {
                  clearPatientAppointmentsError()
                  fetchPatientAppointments(
                    patientAppointmentsMeta?.page ?? 1,
                  ).catch(() => undefined)
                }}
              >
                Retry
              </Button>
            </div>
          ) : null}

          <Card className="w-full gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="h-11 px-4 text-slate-600">
                      Doctor
                    </TableHead>
                    <TableHead className="h-11 px-4 text-slate-600">
                      Date
                    </TableHead>
                    <TableHead className="h-11 px-4 text-slate-600">
                      Time
                    </TableHead>
                    <TableHead className="h-11 px-4 text-slate-600">
                      Room
                    </TableHead>
                    <TableHead className="h-11 px-4 text-slate-600">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingPatientAppointments ? (
                    <PatientAppointmentTableSkeleton />
                  ) : patientAppointments.length > 0 ? (
                    patientAppointments.map(
                      (appointment: PatientAppointmentItem) => (
                        <TableRow
                          key={appointment.id}
                          className="border-slate-100"
                        >
                          <TableCell className="px-4 py-3 font-medium text-slate-800">
                            {appointment.doctorName}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-slate-600">
                            {formatAppointmentDate(appointment.appointmentDate)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-slate-600">
                            {formatTime24ToDisplay(appointment.startTime)}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <JoinRoomLink
                              appointmentId={appointment.id}
                              canJoin={appointment.status === "Confirmed"}
                            />
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <StatusBadge status={appointment.status} />
                          </TableCell>
                        </TableRow>
                      ),
                    )
                  ) : (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={5}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No appointments yet. Book one above to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {patientAppointmentsMeta &&
          patientAppointmentsMeta.totalPages > 1 &&
          !isLoadingPatientAppointments ? (
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                Page {patientAppointmentsMeta.page} of{" "}
                {patientAppointmentsMeta.totalPages}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={!patientAppointmentsMeta.hasPrevPage}
                  onClick={() =>
                    handleAppointmentsPageChange(
                      patientAppointmentsMeta.page - 1,
                    )
                  }
                  className="rounded-lg"
                >
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={!patientAppointmentsMeta.hasNextPage}
                  onClick={() =>
                    handleAppointmentsPageChange(
                      patientAppointmentsMeta.page + 1,
                    )
                  }
                  className="rounded-lg"
                >
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <Dialog
        open={slotsDialogOpen}
        onOpenChange={setSlotsDialogOpen}
      >
        <DialogContent
          overlayClassName="bg-slate-900/15 backdrop-blur-none"
          className="max-w-[280px] gap-0 border-slate-200 p-0 shadow-lg sm:max-w-[300px]"
        >
          <DialogHeader className="border-b-0 px-5 pt-5 pb-2">
            <DialogTitle className="text-base">Choose a time</DialogTitle>
            {selectedDate ? (
              <DialogDescription>
                {format(selectedDate, "EEEE, MMM d, yyyy")}
              </DialogDescription>
            ) : null}
          </DialogHeader>

          <div className="px-5 pb-5">
            {isLoadingSlots ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton
                    key={index}
                    className="h-9 w-full rounded-full"
                  />
                ))}
              </div>
            ) : slotsError ? (
              <p className="text-center text-sm text-red-600">{slotsError}</p>
            ) : availableSlots.length === 0 ? (
              <p className="text-center text-sm text-slate-500">
                No time slots available for this date.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      setSelectedTime(slot)
                      setSlotsDialogOpen(false)
                    }}
                    className={cn(
                      "rounded-full border bg-white px-3 py-2 text-sm font-medium transition-colors",
                      selectedTime === slot
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                        : "border-slate-300 text-sky-600 hover:border-sky-300 hover:bg-sky-50",
                    )}
                  >
                    {formatSlotLabel(slot)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PatientAppointments
