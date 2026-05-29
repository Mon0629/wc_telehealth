import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import axios from "axios"

import { PrescriptionDialog } from "@/components/video/PrescriptionDialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/axios"
import {
  consultationNotesStorageKey,
  emptyConsultationNotes,
  fetchConsultationNotes,
  parseStoredConsultationNotes,
  saveConsultationNotes,
  type ConsultationNotesForm,
} from "@/lib/consultation-notes"

interface AppointmentPatientNotesData {
  patient_notes?: string | null
}

function extractAppointmentData(
  payload: AppointmentPatientNotesData | { data: AppointmentPatientNotesData },
): AppointmentPatientNotesData {
  if ("data" in payload && payload.data) {
    return payload.data
  }
  return payload as AppointmentPatientNotesData
}

const NOTE_FIELDS: Array<{
  key: keyof ConsultationNotesForm
  label: string
  placeholder: string
  minHeight: string
}> = [
  {
    key: "chief_complaint",
    label: "Chief complaint",
    placeholder: "e.g. Persistent headache for 3 days",
    minHeight: "min-h-16",
  },
  {
    key: "findings",
    label: "Findings",
    placeholder: "e.g. Blood pressure slightly elevated at 140/90",
    minHeight: "min-h-20",
  },
  {
    key: "diagnosis",
    label: "Diagnosis",
    placeholder: "e.g. Tension-type headache, mild hypertension",
    minHeight: "min-h-16",
  },
  {
    key: "recommendations",
    label: "Recommendations",
    placeholder: "e.g. Rest, reduce caffeine, monitor blood pressure daily",
    minHeight: "min-h-20",
  },
]

interface ConsultationNotesPanelProps {
  appointmentId: number
  /** From doctor appointments list (`patient_notes` on the appointment). */
  initialPatientNotes?: string
}

export function ConsultationNotesPanel({
  appointmentId,
  initialPatientNotes = "",
}: ConsultationNotesPanelProps) {
  const [patientNotes, setPatientNotes] = useState(initialPatientNotes.trim())
  const [form, setForm] = useState<ConsultationNotesForm>(emptyConsultationNotes)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [prescriptionOpen, setPrescriptionOpen] = useState(false)

  useEffect(() => {
    setPatientNotes(initialPatientNotes.trim())
  }, [initialPatientNotes])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      const stored = parseStoredConsultationNotes(
        localStorage.getItem(consultationNotesStorageKey(appointmentId)),
      )

      try {
        const [consultationNotes, appointmentRes] = await Promise.all([
          fetchConsultationNotes(appointmentId).catch(() => null),
          api
            .get<
              | AppointmentPatientNotesData
              | { data: AppointmentPatientNotesData }
            >(`/appointments/${appointmentId}`)
            .catch(() => null),
        ])

        if (cancelled) return

        if (appointmentRes?.data) {
          const appointment = extractAppointmentData(appointmentRes.data)
          setPatientNotes(
            appointment.patient_notes?.trim() || initialPatientNotes.trim(),
          )
        } else {
          setPatientNotes(initialPatientNotes.trim())
        }

        setForm(consultationNotes ?? stored ?? emptyConsultationNotes())
      } catch {
        if (cancelled) return
        setPatientNotes(initialPatientNotes.trim())
        setForm(stored ?? emptyConsultationNotes())
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [appointmentId, initialPatientNotes])

  useEffect(() => {
    if (isLoading) return
    localStorage.setItem(
      consultationNotesStorageKey(appointmentId),
      JSON.stringify(form),
    )
  }, [appointmentId, form, isLoading])

  const updateField = (key: keyof ConsultationNotesForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    localStorage.setItem(
      consultationNotesStorageKey(appointmentId),
      JSON.stringify(form),
    )

    try {
      await saveConsultationNotes(appointmentId, form)
      toast.success("Consultation notes saved")
      setPrescriptionOpen(true)
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? String(
            err.response?.data?.message ??
              err.response?.data?.error ??
              "Could not save consultation notes",
          )
        : "Could not save consultation notes"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }, [appointmentId, form])

  const textareaClassName =
    "resize-none rounded-xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-200/60"

  return (
    <>
      <PrescriptionDialog
        open={prescriptionOpen}
        onOpenChange={setPrescriptionOpen}
        appointmentId={appointmentId}
      />

    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">
          Consultation notes
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Patient concern is from their booking. Complete all fields before
          saving.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="patient-notes"
            className="text-sm font-medium text-slate-800"
          >
            Patient concern
          </Label>
          {isLoading && !patientNotes ? (
            <div className="min-h-16 rounded-xl border border-slate-200 bg-slate-50" />
          ) : (
            <Textarea
              id="patient-notes"
              readOnly
              value={patientNotes || "No concern provided."}
              className="min-h-16 resize-none rounded-xl border-slate-200 bg-slate-50 text-sm text-slate-600"
            />
          )}
        </div>

        {NOTE_FIELDS.map(({ key, label, placeholder, minHeight }) => (
          <div key={key} className="flex flex-col gap-2">
            <Label htmlFor={key} className="text-sm font-medium text-slate-800">
              {label}
            </Label>
            <Textarea
              id={key}
              value={form[key]}
              onChange={(e) => updateField(key, e.target.value)}
              disabled={isLoading}
              placeholder={placeholder}
              className={`${minHeight} ${textareaClassName}`}
            />
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 px-5 py-4">
        <Button
          type="button"
          disabled={isLoading || isSaving}
          onClick={() => {
            handleSave().catch(() => undefined)
          }}
          className="h-10 w-full rounded-xl bg-indigo-500 text-sm font-medium text-white hover:bg-indigo-600"
        >
          {isSaving ? "Saving…" : "Save notes"}
        </Button>
      </div>
    </div>
    </>
  )
}
