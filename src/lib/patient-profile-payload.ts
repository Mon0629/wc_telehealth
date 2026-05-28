import type { PatientProfileDetails } from "@/store/patientProfileStore"

/** Normalizes user input into a comma-separated string (e.g. "Asthma,Hypertension"). */
export function toCommaSeparated(value: string): string {
  return value
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(",")
}

export function buildPatientProfileFormData(
  profile: PatientProfileDetails,
  avatarFile?: File | null
): FormData {
  const formData = new FormData()

  if (avatarFile) {
    formData.append("profile_picture", avatarFile)
  }

  formData.append("birthday", profile.birthday)

  if (profile.weightKg) {
    formData.append("weight_kg", profile.weightKg)
  }

  if (profile.heightCm) {
    formData.append("height_cm", profile.heightCm)
  }

  formData.append(
    "contact_details",
    JSON.stringify({
      phone: profile.phone,
      address: profile.address,
    })
  )

  formData.append(
    "medical_history",
    JSON.stringify({
      allergies: toCommaSeparated(profile.allergies),
      medical_conditions: toCommaSeparated(profile.conditions),
    })
  )

  return formData
}
