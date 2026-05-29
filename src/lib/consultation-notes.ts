import axios from "axios"
import api from "@/lib/axios"

export interface ConsultationNotesForm {
  chief_complaint: string
  findings: string
  diagnosis: string
  recommendations: string
}

export const emptyConsultationNotes = (): ConsultationNotesForm => ({
  chief_complaint: "",
  findings: "",
  diagnosis: "",
  recommendations: "",
})

function extractPayload<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

export function consultationNotesStorageKey(appointmentId: number) {
  return `konsultify:consultation-notes:${appointmentId}`
}

export function parseStoredConsultationNotes(
  raw: string | null,
): ConsultationNotesForm | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<ConsultationNotesForm>
    return {
      chief_complaint: parsed.chief_complaint ?? "",
      findings: parsed.findings ?? "",
      diagnosis: parsed.diagnosis ?? "",
      recommendations: parsed.recommendations ?? "",
    }
  } catch {
    return null
  }
}

export async function fetchConsultationNotes(
  appointmentId: number,
): Promise<ConsultationNotesForm | null> {
  try {
    const { data } = await api.get<
      ConsultationNotesForm | { data: ConsultationNotesForm }
    >(`/appointments/${appointmentId}/consultation-notes`)
    return extractPayload(data)
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return null
    }
    throw err
  }
}

export async function saveConsultationNotes(
  appointmentId: number,
  payload: ConsultationNotesForm,
) {
  const body = {
    chief_complaint: payload.chief_complaint.trim(),
    findings: payload.findings.trim(),
    diagnosis: payload.diagnosis.trim(),
    recommendations: payload.recommendations.trim(),
  }

  await api.post(`/appointments/${appointmentId}/consultation-notes`, body)
}
