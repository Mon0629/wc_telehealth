import { useEffect } from "react"
import { format, parseISO } from "date-fns"
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge"
import { WeeklyAvailabilitySchedule } from "@/components/doctor/WeeklyAvailabilitySchedule"
import { JoinRoomLink } from "@/components/video/JoinRoomLink"
import useAppointmentStore, {
  formatTime24ToDisplay,
  type DoctorAppointmentItem,
} from "@/store/appointmentStore"

function formatAppointmentDate(date: string) {
  try {
    return format(parseISO(date), "MMM d, yyyy")
  } catch {
    return date
  }
}

const APPOINTMENTS_PAGE_LIMIT = 10

function AppointmentTableSkeleton() {
  return (
    <>
      {Array.from({ length: APPOINTMENTS_PAGE_LIMIT }).map((_, index) => (
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
            <Skeleton className="h-8 w-28" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

function AppointmentActions({
  appointment,
  isUpdating,
  onConfirm,
  onDeny,
}: {
  appointment: DoctorAppointmentItem
  isUpdating: boolean
  onConfirm: () => void
  onDeny: () => void
}) {
  if (appointment.status !== "Pending") {
    return <span className="text-sm text-zinc-400">—</span>
  }

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon-sm"
            disabled={isUpdating}
            onClick={onConfirm}
            className="size-8 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700"
            aria-label="Confirm"
          >
            <CheckIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>Confirm</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            disabled={isUpdating}
            onClick={onDeny}
            className="size-8 rounded-lg border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Reject"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>Reject</TooltipContent>
      </Tooltip>
    </div>
  )
}

const DoctorAppointments = () => {
  const doctorAppointments = useAppointmentStore(
    (state) => state.doctorAppointments,
  )
  const appointmentsMeta = useAppointmentStore(
    (state) => state.appointmentsMeta,
  )
  const isLoadingAppointments = useAppointmentStore(
    (state) => state.isLoadingAppointments,
  )
  const appointmentsError = useAppointmentStore(
    (state) => state.appointmentsError,
  )
  const updatingAppointmentId = useAppointmentStore(
    (state) => state.updatingAppointmentId,
  )
  const fetchDoctorAppointments = useAppointmentStore(
    (state) => state.fetchDoctorAppointments,
  )
  const confirmAppointment = useAppointmentStore(
    (state) => state.confirmAppointment,
  )
  const rejectAppointment = useAppointmentStore(
    (state) => state.rejectAppointment,
  )
  const clearAppointmentsError = useAppointmentStore(
    (state) => state.clearAppointmentsError,
  )

  useEffect(() => {
    fetchDoctorAppointments(1, APPOINTMENTS_PAGE_LIMIT).catch(() => undefined)
  }, [fetchDoctorAppointments])

  const handlePageChange = (page: number) => {
    fetchDoctorAppointments(page, APPOINTMENTS_PAGE_LIMIT).catch(() => undefined)
  }

  const handleConfirm = async (appointmentId: number) => {
    try {
      await confirmAppointment(appointmentId)
      toast.success("Appointment confirmed")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to confirm appointment"
      toast.error(message)
    }
  }

  const handleReject = async (appointmentId: number) => {
    try {
      await rejectAppointment(appointmentId)
      toast.success("Appointment rejected")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reject appointment"
      toast.error(message)
    }
  }

  const hasAppointments = doctorAppointments.length > 0

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-12 items-center gap-2 border-b border-zinc-200 px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium text-zinc-700">
          My Appointments
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">
            Patient appointments
          </h1>
          <p className="text-sm text-zinc-500">
            Review bookings and confirm or deny requests.
          </p>
        </div>

        {appointmentsError ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{appointmentsError}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 px-2 text-red-700 hover:bg-red-100"
              onClick={() => {
                clearAppointmentsError()
                fetchDoctorAppointments(
                  appointmentsMeta?.page ?? 1,
                  APPOINTMENTS_PAGE_LIMIT,
                ).catch(() => undefined)
              }}
            >
              Retry
            </Button>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <section className="w-full min-w-0 shrink-0 lg:w-1/3">
            <WeeklyAvailabilitySchedule />
          </section>

          <section className="w-full min-w-0 lg:w-2/3">
            <Card className="w-full gap-0 overflow-hidden rounded-lg border-zinc-200 bg-white py-0 shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-200 bg-zinc-100 hover:bg-zinc-100">
                      <TableHead className="h-10 px-4 font-medium text-zinc-900">
                        Patient
                      </TableHead>
                      <TableHead className="h-10 px-4 font-medium text-zinc-900">
                        Date
                      </TableHead>
                      <TableHead className="h-10 px-4 font-medium text-zinc-900">
                        Start time
                      </TableHead>
                      <TableHead className="h-10 px-4 font-medium text-zinc-900">
                        Room Link
                      </TableHead>
                      <TableHead className="h-10 px-4 font-medium text-zinc-900">
                        Status
                      </TableHead>
                      <TableHead className="h-10 px-4 font-medium text-zinc-900">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingAppointments ? (
                      <AppointmentTableSkeleton />
                    ) : hasAppointments ? (
                      doctorAppointments.map((appointment) => {
                        const isUpdating =
                          updatingAppointmentId === appointment.id

                        return (
                          <TableRow
                            key={appointment.id}
                            className="border-zinc-200"
                          >
                            <TableCell className="px-4 py-3 font-medium text-zinc-900">
                              {appointment.patientName}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-zinc-600">
                              {formatAppointmentDate(
                                appointment.appointmentDate,
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-zinc-600">
                              {formatTime24ToDisplay(appointment.startTime)}
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
                            <TableCell className="px-4 py-3">
                              <AppointmentActions
                                appointment={appointment}
                                isUpdating={isUpdating}
                                onConfirm={() => {
                                  handleConfirm(appointment.id).catch(
                                    () => undefined,
                                  )
                                }}
                                onDeny={() => {
                                  handleReject(appointment.id).catch(
                                    () => undefined,
                                  )
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={6}
                          className="px-4 py-10 text-center text-sm text-zinc-500"
                        >
                          No appointments.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {appointmentsMeta && appointmentsMeta.totalPages > 1 ? (
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs text-zinc-500">
                  Page {appointmentsMeta.page} of {appointmentsMeta.totalPages}{" "}
                  · {appointmentsMeta.total} appointment
                  {appointmentsMeta.total !== 1 ? "s" : ""}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={
                      !appointmentsMeta.hasPrevPage || isLoadingAppointments
                    }
                    onClick={() =>
                      handlePageChange(appointmentsMeta.page - 1)
                    }
                    className="rounded-lg"
                    aria-label="Previous page"
                  >
                    <ChevronLeftIcon className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={
                      !appointmentsMeta.hasNextPage || isLoadingAppointments
                    }
                    onClick={() =>
                      handlePageChange(appointmentsMeta.page + 1)
                    }
                    className="rounded-lg"
                    aria-label="Next page"
                  >
                    <ChevronRightIcon className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  )
}

export default DoctorAppointments
