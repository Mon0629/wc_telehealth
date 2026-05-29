import { useEffect } from "react"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { WeeklyAvailabilitySchedule } from "@/components/doctor/WeeklyAvailabilitySchedule"
import { JoinRoomLink } from "@/components/video/JoinRoomLink"
import { cn } from "@/lib/utils"
import useAppointmentStore, {
  formatTime24ToDisplay,
  type DoctorAppointmentItem,
  type DoctorAppointmentStatus,
} from "@/store/appointmentStore"

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

function AppointmentTableSkeleton() {
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
    return <span className="text-sm text-slate-400">—</span>
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        disabled={isUpdating}
        onClick={onConfirm}
        className="h-8 rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-700"
      >
        Confirm
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isUpdating}
        onClick={onDeny}
        className="h-8 rounded-lg border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        Denied
      </Button>
    </div>
  )
}

const DoctorAppointments = () => {
  const doctorAppointments = useAppointmentStore(
    (state) => state.doctorAppointments,
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
    fetchDoctorAppointments().catch(() => undefined)
  }, [fetchDoctorAppointments])

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
      <header className="flex h-12 items-center gap-2 border-b border-slate-100 px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium text-slate-700">
          My Appointments
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">
            Patient appointments
          </h1>
          <p className="text-sm text-slate-500">
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
                fetchDoctorAppointments().catch(() => undefined)
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
            <Card className="w-full gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="h-11 px-4 text-slate-600">
                        Patient
                      </TableHead>
                      <TableHead className="h-11 px-4 text-slate-600">
                        Date
                      </TableHead>
                      <TableHead className="h-11 px-4 text-slate-600">
                        Start time
                      </TableHead>
                      <TableHead className="h-11 px-4 text-slate-600">
                        Room Link
                      </TableHead>
                      <TableHead className="h-11 px-4 text-slate-600">
                        Status
                      </TableHead>
                      <TableHead className="h-11 px-4 text-slate-600">
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
                            className="border-slate-100"
                          >
                            <TableCell className="px-4 py-3 font-medium text-slate-800">
                              {appointment.patientName}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-slate-600">
                              {formatAppointmentDate(
                                appointment.appointmentDate,
                              )}
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
                          className="px-4 py-10 text-center text-sm text-slate-500"
                        >
                          No appointments.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}

export default DoctorAppointments
