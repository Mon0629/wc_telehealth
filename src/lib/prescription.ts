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

export async function savePrescription(
  appointmentId: number,
  items: PrescriptionItem[],
) {
  const prescription_items = items
    .map(formatPrescriptionItem)
    .filter((item) => item.medicine_name.length > 0)

  await api.post(`/appointments/${appointmentId}/prescription`, {
    prescription_items,
  })
}
