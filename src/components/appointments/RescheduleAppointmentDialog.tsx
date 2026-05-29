import { useEffect, useState } from "react"
import { format, parseISO } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DoctorAvailabilityPicker } from "@/components/appointments/DoctorAvailabilityPicker"
import { formatAppointmentSlotLabel } from "@/lib/appointment-booking"
import useAppointmentStore from "@/store/appointmentStore"

export interface RescheduleAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: number | null
  doctorName: string
  doctorProfileId: number | null
  availableDaysOfWeek: number[]
  currentAppointmentDate: string
  currentStartTime: string
  onConfirm?: (payload: {
    appointmentId: number
    appointmentDate: string
    startTime: string
  }) => void | Promise<void>
  isSubmitting?: boolean
}

export function RescheduleAppointmentDialog({
  open,
  onOpenChange,
  appointmentId,
  doctorName,
  doctorProfileId,
  availableDaysOfWeek,
  currentAppointmentDate,
  currentStartTime,
  onConfirm,
  isSubmitting = false,
}: RescheduleAppointmentDialogProps) {
  const clearWeekSlots = useAppointmentStore((state) => state.clearWeekSlots)

  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setSelectedDate(undefined)
      setSelectedTime(null)
      clearWeekSlots()
      return
    }

    try {
      const initial = parseISO(currentAppointmentDate)
      initial.setHours(0, 0, 0, 0)
      setSelectedDate(initial)
    } catch {
      setSelectedDate(undefined)
    }
    setSelectedTime(null)
  }, [open, currentAppointmentDate, clearWeekSlots])

  const selectedDateKey = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : null

  const handleConfirm = () => {
    if (!appointmentId || !selectedDateKey || !selectedTime || !onConfirm) return
    void onConfirm({
      appointmentId,
      appointmentDate: selectedDateKey,
      startTime: selectedTime,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={!isSubmitting}
        overlayClassName="bg-zinc-900/20 backdrop-blur-sm"
        className="flex max-h-[min(92dvh,720px)] w-[min(100vw-2rem,56rem)] max-w-none flex-col gap-0 overflow-hidden rounded-lg border-zinc-200 p-0 sm:w-[min(100vw-2rem,56rem)]"
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-zinc-200 px-6 py-5">
          <DialogTitle className="text-base font-semibold text-zinc-900">
            Reschedule appointment
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-500">
            Choose a new date and time with{" "}
            <span className="font-medium text-zinc-700">{doctorName}</span>.
            Current:{" "}
            <span className="font-medium text-zinc-700">
              {formatAppointmentSlotLabel(currentStartTime)}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <DoctorAvailabilityPicker
            doctorProfileId={doctorProfileId}
            availableDaysOfWeek={availableDaysOfWeek}
            selectedDate={selectedDate}
            onSelectedDateChange={setSelectedDate}
            selectedTime={selectedTime}
            onSelectedTimeChange={setSelectedTime}
            emptyDoctorMessage="Could not load this doctor's availability."
          />
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-zinc-200 px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-lg border-zinc-200 px-4 text-sm font-medium text-zinc-700"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={
              isSubmitting ||
              !appointmentId ||
              !selectedDateKey ||
              !selectedTime
            }
            onClick={handleConfirm}
            className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Confirm reschedule"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
