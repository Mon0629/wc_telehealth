import { useMemo } from "react"
import { useNavigate, useParams } from "react-router"
import { ArrowLeftIcon } from "lucide-react"

import { ConsultationNotesPanel } from "@/components/video/ConsultationNotesPanel"
import { ZegoVideoRoom } from "@/components/video/ZegoVideoRoom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import useAppointmentStore from "@/store/appointmentStore"
import useAuthStore from "@/store/authStore"

export default function VideoCallPage() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const doctorAppointments = useAppointmentStore(
    (state) => state.doctorAppointments,
  )

  const parsedAppointmentId = useMemo(() => {
    const id = Number(appointmentId)
    return Number.isFinite(id) && id > 0 ? id : null
  }, [appointmentId])

  const patientNotes = useMemo(() => {
    if (!parsedAppointmentId) return ""
    return (
      doctorAppointments.find(
        (appointment) => appointment.id === parsedAppointmentId,
      )?.patientNotes ?? ""
    )
  }, [doctorAppointments, parsedAppointmentId])

  const isDoctor = user?.role === "DOCTOR"

  const handleLeave = () => {
    if (isDoctor) {
      navigate("/doctor/appointments")
      return
    }
    navigate("/patient/appointments")
  }

  if (!parsedAppointmentId) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-slate-600">Invalid appointment.</p>
        <Button variant="outline" onClick={handleLeave}>
          Go back
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-svh flex-col bg-slate-950">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-800 px-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLeave}
          className="text-slate-200 hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeftIcon className="size-4" />
          Leave
        </Button>
        <span className="text-sm text-slate-400">Video consultation</span>
      </header>

      <main
        className={cn(
          "min-h-0 flex-1",
          isDoctor ? "flex flex-col lg:flex-row" : "flex flex-col",
        )}
      >
        <div
          className={cn(
            "min-h-0 min-w-0",
            isDoctor ? "min-h-[50vh] flex-1 lg:min-h-0" : "h-full w-full",
          )}
        >
          <ZegoVideoRoom
            appointmentId={parsedAppointmentId}
            onLeave={handleLeave}
          />
        </div>

        {isDoctor ? (
          <aside className="flex h-80 w-full shrink-0 flex-col border-t border-zinc-200 bg-white lg:h-full lg:w-[400px] lg:max-w-md lg:border-t-0 lg:border-l">
            <ConsultationNotesPanel
              appointmentId={parsedAppointmentId}
              initialPatientNotes={patientNotes}
            />
          </aside>
        ) : null}
      </main>
    </div>
  )
}
