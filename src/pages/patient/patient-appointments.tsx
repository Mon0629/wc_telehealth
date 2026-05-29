import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react"
import { useLocation } from "react-router"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"
import {
  CalendarClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  StethoscopeIcon,
  TagIcon,
  XIcon,
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge"
import { RescheduleAppointmentDialog } from "@/components/appointments/RescheduleAppointmentDialog"
import { JoinRoomLink } from "@/components/video/JoinRoomLink"
import {
  formatAppointmentSlotLabel,
  getEndOfNextMonth,
  isDateWithinBookingWindow,
  isMonthWithinBookingWindow,
} from "@/lib/appointment-booking"
import { DAYS_OF_WEEK } from "@/lib/doctor-profile-payload"
import { cn } from "@/lib/utils"
import useAppointmentStore, {
  getSlotsForDate,
  type DoctorAppointmentStatus,
  type PatientAppointmentItem,
} from "@/store/appointmentStore"
import useDoctorStore, {
  isDateOnDoctorAvailableDay,
  type DoctorListItem,
} from "@/store/doctorStore"

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
        <TableRow key={index} className="border-zinc-200">
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
          <TableCell className="px-4 py-3">
            <Skeleton className="h-8 w-20" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

function canManageAppointment(status: DoctorAppointmentStatus) {
  return status === "Pending" || status === "Confirmed"
}

function findDoctorForAppointment(
  appointment: PatientAppointmentItem,
  doctors: DoctorListItem[],
): DoctorListItem | null {
  if (appointment.doctorProfileId != null) {
    const byId = doctors.find((doctor) => doctor.id === appointment.doctorProfileId)
    if (byId) return byId
  }

  return (
    doctors.find((doctor) => doctor.name === appointment.doctorName) ?? null
  )
}

function PatientAppointmentRowActions({
  appointment,
  isUpdating,
  onReschedule,
  onCancel,
}: {
  appointment: PatientAppointmentItem
  isUpdating: boolean
  onReschedule: (appointment: PatientAppointmentItem) => void
  onCancel: (appointment: PatientAppointmentItem) => void
}) {
  if (!canManageAppointment(appointment.status)) {
    return <span className="text-sm text-zinc-400">—</span>
  }

  const isThisUpdating = isUpdating

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            disabled={isThisUpdating}
            className="size-8 rounded-lg border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Reschedule"
            onClick={() => onReschedule(appointment)}
          >
            <CalendarClockIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>Reschedule</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            disabled={isThisUpdating}
            className="size-8 rounded-lg border-zinc-200 text-zinc-700 hover:bg-red-50 hover:text-red-600"
            aria-label="Cancel"
            onClick={() => onCancel(appointment)}
          >
            <XIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>Cancel</TooltipContent>
      </Tooltip>
    </div>
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
        "cursor-pointer gap-0 overflow-visible border bg-white py-0 shadow-sm transition-[border-color,box-shadow] hover:shadow-md",
        isSelected ? "border-zinc-400" : "border-zinc-200",
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
            <AvatarFallback className="rounded-xl bg-zinc-100 font-semibold text-zinc-700">
              {getInitials(doctor.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {doctor.name}
            </p>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <StethoscopeIcon className="size-3.5 shrink-0 text-zinc-400" />
              <span className="truncate">{doctor.specialization}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <TagIcon className="size-3.5 shrink-0 text-zinc-400" />
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
    <Card className="gap-0 border border-zinc-200 bg-white py-0">
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
  const location = useLocation()

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

  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [appointmentToReschedule, setAppointmentToReschedule] =
    useState<PatientAppointmentItem | null>(null)

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
  const cancelAppointment = useAppointmentStore(
    (state) => state.cancelAppointment,
  )
  const rescheduleAppointment = useAppointmentStore(
    (state) => state.rescheduleAppointment,
  )
  const updatingAppointmentId = useAppointmentStore(
    (state) => state.updatingAppointmentId,
  )
  const clearPatientAppointmentsError = useAppointmentStore(
    (state) => state.clearPatientAppointmentsError,
  )

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [appointmentToCancel, setAppointmentToCancel] =
    useState<PatientAppointmentItem | null>(null)

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

  const todayStart = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

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

  const rescheduleDoctor = useMemo(() => {
    if (!appointmentToReschedule) return null
    return findDoctorForAppointment(appointmentToReschedule, doctors)
  }, [appointmentToReschedule, doctors])

  useEffect(() => {
    fetchDoctors(1, 10).catch(() => undefined)
  }, [fetchDoctors])

  useEffect(() => {
    fetchPatientAppointments(1).catch(() => undefined)
  }, [fetchPatientAppointments])

  useEffect(() => {
    const state = location.state as { preselectedDoctor?: DoctorListItem } | null
    if (state?.preselectedDoctor) {
      setSelectedDoctor(state.preselectedDoctor)
      window.history.replaceState({}, "")
    }
  }, [location.state])

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

  const openCancelDialog = (appointment: PatientAppointmentItem) => {
    setAppointmentToCancel(appointment)
    setCancelDialogOpen(true)
  }

  const handleCancelDialogOpenChange = (open: boolean) => {
    setCancelDialogOpen(open)
    if (!open) {
      setAppointmentToCancel(null)
    }
  }

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return

    try {
      await cancelAppointment(appointmentToCancel.id)
      toast.success("Appointment cancelled")
      setCancelDialogOpen(false)
      setAppointmentToCancel(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to cancel appointment"
      toast.error(message)
    }
  }

  const isCancelling =
    cancelDialogOpen &&
    appointmentToCancel !== null &&
    updatingAppointmentId === appointmentToCancel.id

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
          matchedDay != null &&
          availableDaysOfWeek.includes(matchedDay.apiNumber)

        return (
          <th
            {...props}
            className={cn(
              className,
              isAvailable && "font-semibold text-zinc-900",
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

  const openRescheduleDialog = (appointment: PatientAppointmentItem) => {
    const doctor = findDoctorForAppointment(appointment, doctors)
    const profileId = appointment.doctorProfileId ?? doctor?.id ?? null

    if (profileId == null) {
      toast.error("Could not find this doctor. Try refreshing the page.")
      return
    }

    setAppointmentToReschedule(appointment)
    setRescheduleDialogOpen(true)
  }

  const handleRescheduleDialogOpenChange = (open: boolean) => {
    setRescheduleDialogOpen(open)
    if (!open) {
      setAppointmentToReschedule(null)
      clearWeekSlots()
    }
  }

  const handleConfirmReschedule = async (payload: {
    appointmentId: number
    appointmentDate: string
    startTime: string
  }) => {
    try {
      await rescheduleAppointment(payload.appointmentId, {
        appointment_date: payload.appointmentDate,
        start_time: payload.startTime,
      })
      toast.success("Appointment rescheduled")
      setRescheduleDialogOpen(false)
      setAppointmentToReschedule(null)
      clearWeekSlots()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reschedule appointment"
      toast.error(message)
    }
  }

  const isRescheduling =
    rescheduleDialogOpen &&
    appointmentToReschedule !== null &&
    updatingAppointmentId === appointmentToReschedule.id

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
      <header className="flex h-12 items-center gap-2 border-b border-zinc-200 px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium text-zinc-700">
          My Appointments
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-5">
        <div className="flex flex-col gap-6 xl:flex-row xl:gap-6">
        {/* Left — doctors (single column) */}
        <aside className="flex w-full shrink-0 flex-col gap-3 xl:w-[300px]">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              1. Choose Doctor
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
            className="flex flex-col gap-0 overflow-hidden border-zinc-200 bg-white py-0 shadow-sm"
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
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-200 py-10 text-center">
                    <p className="text-sm text-zinc-500">
                      No doctors available
                    </p>
                  </div>
                )}
              </div>

              {pagination && pagination.totalPages > 1 && !isLoading ? (
                <div className="mt-3 flex shrink-0 items-center justify-between gap-2 border-t border-zinc-200 pt-3">
                  <p className="text-xs text-zinc-500">
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
            <h2 className="text-lg font-semibold text-zinc-900">
              2. Choose date
            </h2>
          </div>

          <div ref={calendarCardRef} className="w-full">
            <Card className="w-full gap-0 overflow-hidden border-zinc-200 bg-white py-0 shadow-sm">
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
                      "bg-zinc-100 font-medium text-zinc-900 [&_button]:font-semibold [&_button]:text-zinc-800 [&_button]:hover:bg-zinc-200",
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
            <h2 className="text-lg font-semibold text-zinc-900">
              3. Your concern
            </h2>
          </div>

          <Card
            className="flex flex-col gap-0 overflow-hidden border-zinc-200 bg-white py-0 shadow-sm"
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
                  className="shrink-0 text-sm font-semibold text-zinc-900"
                >
                  Describe your concern or symptoms
                </Label>
                <Textarea
                  id="concern"
                  value={concern}
                  onChange={(e) => setConcern(e.target.value)}
                  placeholder="e.g. I've had a persistent cough and mild fever for 3 days..."
                  className="min-h-0 flex-1 resize-none rounded-xl border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-zinc-300/60"
                />
                <p className="shrink-0 text-xs text-zinc-500">
                  This will be shared with your doctor before the appointment.
                </p>
              </div>

              {selectedDoctor ? (
                <div className="shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                  <span className="font-medium text-zinc-900">Doctor:</span>{" "}
                  {selectedDoctor.name}
                  {selectedDate ? (
                    <>
                      <br />
                      <span className="font-medium text-zinc-900">
                        Date & Time:
                      </span>{" "}
                      {format(selectedDate, "MMM d, yyyy")}
                      {selectedTime
                        ? ` | ${formatAppointmentSlotLabel(selectedTime)}`
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
                className="h-10 w-full shrink-0 rounded-xl bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
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
            <h2 className="text-lg font-semibold text-zinc-900">
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

          <Card className="w-full gap-0 overflow-hidden rounded-lg border-zinc-200 bg-white py-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-200 bg-zinc-50/80 hover:bg-zinc-50/80">
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
                      Room
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
                  {isLoadingPatientAppointments ? (
                    <PatientAppointmentTableSkeleton />
                  ) : patientAppointments.length > 0 ? (
                    patientAppointments.map(
                      (appointment: PatientAppointmentItem) => (
                        <TableRow
                          key={appointment.id}
                          className="border-zinc-200"
                        >
                          <TableCell className="px-4 py-3 font-medium text-zinc-900">
                            {appointment.doctorName}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-zinc-600">
                            {formatAppointmentDate(appointment.appointmentDate)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-zinc-600">
                            {formatAppointmentSlotLabel(appointment.startTime)}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <JoinRoomLink
                              appointmentId={appointment.id}
                              canJoin={appointment.status === "Confirmed"}
                            />
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <AppointmentStatusBadge status={appointment.status} />
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <div className="flex justify-end">
                              <PatientAppointmentRowActions
                                appointment={appointment}
                                isUpdating={
                                  updatingAppointmentId === appointment.id
                                }
                                onReschedule={openRescheduleDialog}
                                onCancel={openCancelDialog}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ),
                    )
                  ) : (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={6}
                        className="px-4 py-10 text-center text-sm text-zinc-500"
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
              <p className="text-xs text-zinc-500">
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

      <Dialog open={slotsDialogOpen} onOpenChange={setSlotsDialogOpen}>
        <DialogContent
          overlayClassName="bg-zinc-900/15 backdrop-blur-none"
          className="max-w-[280px] gap-0 border-zinc-200 p-0 shadow-lg sm:max-w-[300px]"
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
              <p className="text-center text-sm text-zinc-500">
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
                        ? "border-zinc-900 bg-zinc-100 text-zinc-900"
                        : "border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
                    )}
                  >
                    {formatAppointmentSlotLabel(slot)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <RescheduleAppointmentDialog
        open={rescheduleDialogOpen}
        onOpenChange={handleRescheduleDialogOpenChange}
        appointmentId={appointmentToReschedule?.id ?? null}
        doctorName={appointmentToReschedule?.doctorName ?? ""}
        doctorProfileId={
          rescheduleDoctor?.id ??
          appointmentToReschedule?.doctorProfileId ??
          null
        }
        availableDaysOfWeek={
          rescheduleDoctor?.availableDaysOfWeek ??
          []
        }
        currentAppointmentDate={
          appointmentToReschedule?.appointmentDate ?? ""
        }
        currentStartTime={appointmentToReschedule?.startTime ?? ""}
        isSubmitting={isRescheduling}
        onConfirm={handleConfirmReschedule}
      />

      <Dialog
        open={cancelDialogOpen}
        onOpenChange={handleCancelDialogOpenChange}
      >
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-zinc-900/20"
          className="max-w-md gap-0 overflow-hidden rounded-lg border-zinc-200 p-0 shadow-lg sm:max-w-md"
        >
          <DialogHeader className="space-y-2 border-0 px-6 pt-6 pb-0 pr-6">
            <DialogTitle className="text-base font-semibold text-zinc-900">
              Are you sure?
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-zinc-500">
              {appointmentToCancel ? (
                <>
                  This will cancel your appointment with{" "}
                  <span className="font-medium text-zinc-700">
                    {appointmentToCancel.doctorName}
                  </span>{" "}
                  on{" "}
                  <span className="font-medium text-zinc-700">
                    {format(
                      parseISO(appointmentToCancel.appointmentDate),
                      "MMM d, yyyy",
                    )}
                  </span>{" "}
                  at{" "}
                  <span className="font-medium text-zinc-700">
                    {formatAppointmentSlotLabel(appointmentToCancel.startTime)}
                  </span>
                  . This action cannot be undone.
                </>
              ) : (
                "This will cancel your appointment. This action cannot be undone."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col-reverse gap-2 px-6 pt-5 pb-6 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isCancelling}
              onClick={() => handleCancelDialogOpenChange(false)}
              className="h-9 rounded-lg border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Keep appointment
            </Button>
            <Button
              type="button"
              disabled={isCancelling}
              onClick={() => void handleConfirmCancel()}
              className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {isCancelling ? "Cancelling…" : "Yes, cancel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PatientAppointments
