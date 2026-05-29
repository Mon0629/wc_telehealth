import axios from "axios"
import api from "@/lib/axios"
import type { ConsultationNotesForm } from "@/lib/consultation-notes"
import type { PrescriptionItem } from "@/lib/prescription"

export interface PatientMedicalRecordApi {
  id: number
  appointment_id: number
  appointment_date: string | null
  start_time: string | null
  doctor_name: string | null
  specialization?: string | null
  chief_complaint: string
  findings: string
  diagnosis: string
  recommendations?: string | null
  follow_up_date?: string | null
}

export interface PatientPrescriptionMedicineApi {
  medicine: string
  dosage?: string | null
  frequency?: string | null
  duration?: string | null
  instructions?: string | null
}

export interface PatientPrescriptionApi {
  prescription_id: number
  appointment_id: number
  appointment_date: string | null
  start_time: string | null
  doctor_name: string | null
  specialization?: string | null
  medicines: PatientPrescriptionMedicineApi[]
}

export interface PatientMedicalRecordRow {
  appointmentId: number
  doctorName: string
  appointmentDate: string
  startTime: string
  notes: ConsultationNotesForm | null
  prescription: PrescriptionItem[] | null
}

function extractPayload<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

function extractArray<T>(payload: T[] | { data: T[] } | unknown): T[] {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data: unknown }).data
    if (Array.isArray(data)) return data as T[]
  }
  return []
}

function readProfileId(profile: Record<string, unknown>): number | null {
  const id = profile.id
  if (typeof id === "number" && Number.isFinite(id)) return id
  if (typeof id === "string" && id.trim()) {
    const parsed = Number(id)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function extractPatientProfileId(profileResponse: unknown): number | null {
  if (!profileResponse || typeof profileResponse !== "object") return null

  const root = profileResponse as Record<string, unknown>

  if (root.patientProfile && typeof root.patientProfile === "object") {
    return readProfileId(root.patientProfile as Record<string, unknown>)
  }

  if (root.user && typeof root.user === "object") {
    const user = root.user as Record<string, unknown>
    if (user.patientProfile && typeof user.patientProfile === "object") {
      return readProfileId(user.patientProfile as Record<string, unknown>)
    }
  }

  if (root.data && typeof root.data === "object") {
    return extractPatientProfileId(root.data)
  }

  return null
}

export function formatDoctorDisplayName(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? ""
  if (!trimmed) return "Unknown doctor"
  if (/^dr\.?\s/i.test(trimmed)) return trimmed
  return `Dr. ${trimmed}`
}

export function medicalRecordToNotesForm(
  record: PatientMedicalRecordApi,
): ConsultationNotesForm {
  return {
    chief_complaint: record.chief_complaint ?? "",
    findings: record.findings ?? "",
    diagnosis: record.diagnosis ?? "",
    recommendations: record.recommendations ?? "",
  }
}

export function prescriptionApiToItems(
  prescription: PatientPrescriptionApi,
): PrescriptionItem[] {
  return (prescription.medicines ?? [])
    .map((item) => ({
      medicine_name: String(item.medicine ?? "").trim(),
      dosage: String(item.dosage ?? "").trim(),
      frequency: String(item.frequency ?? "").trim(),
      duration: String(item.duration ?? "").trim(),
      instructions: String(item.instructions ?? "").trim(),
    }))
    .filter((item) => item.medicine_name.length > 0)
}

export function hasConsultationNotes(notes: ConsultationNotesForm | null) {
  if (!notes) return false
  return (
    notes.chief_complaint.trim() ||
    notes.findings.trim() ||
    notes.diagnosis.trim() ||
    notes.recommendations.trim()
  )
}

export function hasPrescription(items: PrescriptionItem[] | null) {
  return Boolean(items?.some((item) => item.medicine_name.trim()))
}

function normalizeDateString(value: string | null | undefined): string {
  if (!value) return ""
  return value.includes("T") ? value.split("T")[0] : value
}

export function buildMedicalRecordRows(
  appointments: Array<{
    id: number
    doctorName: string
    appointmentDate: string
    startTime: string
  }>,
  medicalRecords: PatientMedicalRecordApi[],
  prescriptions: PatientPrescriptionApi[],
): PatientMedicalRecordRow[] {
  const appointmentsById = new Map(
    appointments.map((appointment) => [appointment.id, appointment]),
  )

  const notesByAppointmentId = new Map<number, ConsultationNotesForm>()
  for (const record of medicalRecords) {
    const notes = medicalRecordToNotesForm(record)
    if (hasConsultationNotes(notes)) {
      notesByAppointmentId.set(record.appointment_id, notes)
    }
  }

  const prescriptionsByAppointmentId = new Map<number, PrescriptionItem[]>()
  for (const prescription of prescriptions) {
    const items = prescriptionApiToItems(prescription)
    if (hasPrescription(items)) {
      prescriptionsByAppointmentId.set(prescription.appointment_id, items)
    }
  }

  const appointmentIds = new Set<number>()
  appointments.forEach((appointment) => appointmentIds.add(appointment.id))
  medicalRecords.forEach((record) => appointmentIds.add(record.appointment_id))
  prescriptions.forEach((prescription) =>
    appointmentIds.add(prescription.appointment_id),
  )

  const rows: PatientMedicalRecordRow[] = []

  for (const appointmentId of appointmentIds) {
    const notes = notesByAppointmentId.get(appointmentId) ?? null
    const prescription = prescriptionsByAppointmentId.get(appointmentId) ?? null

    if (!hasConsultationNotes(notes) && !hasPrescription(prescription)) {
      continue
    }

    const appointment = appointmentsById.get(appointmentId)
    const recordMeta = medicalRecords.find(
      (record) => record.appointment_id === appointmentId,
    )
    const prescriptionMeta = prescriptions.find(
      (item) => item.appointment_id === appointmentId,
    )

    rows.push({
      appointmentId,
      doctorName:
        appointment?.doctorName ??
        formatDoctorDisplayName(
          recordMeta?.doctor_name ?? prescriptionMeta?.doctor_name,
        ),
      appointmentDate: normalizeDateString(
        appointment?.appointmentDate ??
          recordMeta?.appointment_date ??
          prescriptionMeta?.appointment_date,
      ),
      startTime:
        appointment?.startTime ??
        recordMeta?.start_time ??
        prescriptionMeta?.start_time ??
        "",
      notes,
      prescription,
    })
  }

  return rows.sort((a, b) => {
    const dateCompare = b.appointmentDate.localeCompare(a.appointmentDate)
    if (dateCompare !== 0) return dateCompare
    return b.startTime.localeCompare(a.startTime)
  })
}

export async function fetchMyPatientProfileId(): Promise<number> {
  const { data } = await api.get<unknown>("/profile/me")
  const profileId = extractPatientProfileId(extractPayload(data))
  if (!profileId) {
    throw new Error("Patient profile not found")
  }
  return profileId
}

export async function fetchPatientMedicalRecords(
  patientProfileId: number,
): Promise<PatientMedicalRecordApi[]> {
  const { data } = await api.get<unknown>(
    `/patients/${patientProfileId}/medical-records`,
  )
  return extractArray<PatientMedicalRecordApi>(data)
}

export async function fetchPatientPrescriptions(
  patientProfileId: number,
): Promise<PatientPrescriptionApi[]> {
  const { data } = await api.get<unknown>(
    `/patients/${patientProfileId}/prescriptions`,
  )
  return extractArray<PatientPrescriptionApi>(data)
}

export function getErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    return String(
      err.response?.data?.message ??
        err.response?.data?.error ??
        err.message ??
        fallback,
    )
  }
  if (err instanceof Error) return err.message
  return fallback
}
