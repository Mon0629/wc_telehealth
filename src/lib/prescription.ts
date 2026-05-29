import axios from "axios"
import api from "@/lib/axios"

export interface PrescriptionItem {
  medicine_name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

export function emptyPrescriptionItem(): PrescriptionItem {
  return {
    medicine_name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  }
}

function formatPrescriptionItem(item: PrescriptionItem) {
  const dosage = item.dosage.trim()
  const frequency = item.frequency.trim()
  const duration = item.duration.trim()

  return {
    medicine_name: item.medicine_name.trim(),
    dosage: dosage ? `${dosage}mg` : "",
    frequency: frequency ? `${frequency}x a day` : "",
    duration: duration ? `${duration} days` : "",
    instructions: item.instructions.trim(),
  }
}

function extractPayload<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

function normalizePrescriptionItem(raw: unknown): PrescriptionItem | null {
  if (!raw || typeof raw !== "object") return null

  const item = raw as Record<string, unknown>
  const medicineName = String(
    item.medicine_name ?? item.medicineName ?? "",
  ).trim()

  if (!medicineName) return null

  return {
    medicine_name: medicineName,
    dosage: String(item.dosage ?? "").trim(),
    frequency: String(item.frequency ?? "").trim(),
    duration: String(item.duration ?? "").trim(),
    instructions: String(item.instructions ?? "").trim(),
  }
}

function normalizePrescriptionItems(raw: unknown): PrescriptionItem[] {
  if (!raw) return []

  if (Array.isArray(raw)) {
    return raw
      .map(normalizePrescriptionItem)
      .filter((item): item is PrescriptionItem => item !== null)
  }

  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>

    if (Array.isArray(obj.prescription_items)) {
      return normalizePrescriptionItems(obj.prescription_items)
    }

    if (Array.isArray(obj.items)) {
      return normalizePrescriptionItems(obj.items)
    }

    if (obj.data) {
      return normalizePrescriptionItems(obj.data)
    }

    const single = normalizePrescriptionItem(obj)
    return single ? [single] : []
  }

  return []
}

export function prescriptionStorageKey(appointmentId: number) {
  return `konsultify:prescription:${appointmentId}`
}

export function parseStoredPrescription(
  raw: string | null,
): PrescriptionItem[] | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as unknown
    const items = normalizePrescriptionItems(parsed)
    return items.length > 0 ? items : null
  } catch {
    return null
  }
}

export function storePrescription(
  appointmentId: number,
  items: PrescriptionItem[],
) {
  localStorage.setItem(
    prescriptionStorageKey(appointmentId),
    JSON.stringify(items),
  )
}

export async function fetchPrescription(
  appointmentId: number,
): Promise<PrescriptionItem[] | null> {
  const stored = parseStoredPrescription(
    localStorage.getItem(prescriptionStorageKey(appointmentId)),
  )

  try {
    const { data } = await api.get<unknown>(
      `/appointments/${appointmentId}/prescription`,
    )
    const items = normalizePrescriptionItems(extractPayload(data))
    if (items.length > 0) {
      storePrescription(appointmentId, items)
      return items
    }
    return stored
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return stored
    }
    throw err
  }
}

export async function savePrescription(
  appointmentId: number,
  items: PrescriptionItem[],
): Promise<PrescriptionItem[]> {
  const prescription_items = items
    .map(formatPrescriptionItem)
    .filter((item) => item.medicine_name.length > 0)

  await api.post(`/appointments/${appointmentId}/prescription`, {
    prescription_items,
  })

  storePrescription(appointmentId, prescription_items)
  return prescription_items
}
