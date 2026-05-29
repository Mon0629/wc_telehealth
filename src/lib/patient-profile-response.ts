import {
  extractAvatarUrlFromProfileResponse,
  extractPayload,
  normalizeDateForInput,
  parseJsonObject,
  readProfileString,
} from "@/lib/profile-response"
import type { PatientProfileDetails } from "@/store/patientProfileStore"

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readProfileId(record: Record<string, unknown> | null): number | null {
  if (!record) return null

  const candidates = [
    record.id,
    record.patient_profile_id,
    record.patientProfileId,
    record.profile_id,
    record.profileId,
  ]

  for (const id of candidates) {
    if (typeof id === "number" && Number.isFinite(id)) return id
    if (typeof id === "string" && id.trim()) {
      const parsed = Number(id)
      if (Number.isFinite(parsed)) return parsed
    }
  }

  return null
}

export function extractPatientProfileRecord(
  response: unknown,
): Record<string, unknown> | null {
  const root = asRecord(extractPayload(response))
  if (!root) return null

  const candidates = [
    root.patientProfile,
    root.patient_profile,
    root.patient,
    root.profile,
  ]

  for (const candidate of candidates) {
    const record = asRecord(candidate)
    if (record) return record
  }

  if (
    root.birthday !== undefined ||
    root.weight_kg !== undefined ||
    root.weightKg !== undefined ||
    root.contact_details !== undefined ||
    root.contactDetails !== undefined ||
    root.medical_history !== undefined ||
    root.medicalHistory !== undefined
  ) {
    return root
  }

  const user = asRecord(root.user)
  if (user) {
    const fromUser = extractPatientProfileRecord(user)
    if (fromUser) return fromUser

    for (const key of ["patientProfile", "patient_profile", "patient"] as const) {
      const nested = asRecord(user[key])
      if (nested) return nested
    }
  }

  return null
}

/** Resolves the numeric patient profile id from a GET /profile/me response. */
export function extractPatientProfileIdFromApi(
  response: unknown,
): number | null {
  const patient = extractPatientProfileRecord(response)
  const fromPatient = readProfileId(patient)
  if (fromPatient) return fromPatient

  const root = asRecord(extractPayload(response))
  if (!root) return null

  return readProfileId(root)
}

function parseCommaSeparatedField(value: unknown): string {
  const raw = readProfileString(value)
  if (!raw) return ""

  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean).join(", ")
    }
  } catch {
    // use raw string
  }

  return raw
}

function parseMedicalHistory(details: unknown): Pick<
  PatientProfileDetails,
  "allergies" | "conditions"
> {
  const record = parseJsonObject(details)
  if (!record) {
    return { allergies: "", conditions: "" }
  }

  return {
    allergies: parseCommaSeparatedField(
      record.allergies ?? record.allergy_list,
    ),
    conditions: parseCommaSeparatedField(
      record.medical_conditions ?? record.conditions ?? record.medicalConditions,
    ),
  }
}

function parseContactDetails(details: unknown): Pick<
  PatientProfileDetails,
  "phone" | "address"
> {
  const record = parseJsonObject(details)
  if (!record) {
    return { phone: "", address: "" }
  }

  return {
    phone: readProfileString(record.phone),
    address: readProfileString(record.address),
  }
}

export function parsePatientProfileFromApi(
  response: unknown,
): PatientProfileDetails {
  const patient = extractPatientProfileRecord(response)
  const contact = parseContactDetails(
    patient?.contact_details ?? patient?.contactDetails,
  )
  const medical = parseMedicalHistory(
    patient?.medical_history ?? patient?.medicalHistory,
  )

  const avatarUrl =
    extractAvatarUrlFromProfileResponse(patient) ??
    extractAvatarUrlFromProfileResponse(response) ??
    ""

  return {
    profileId: extractPatientProfileIdFromApi(response),
    avatarUrl,
    birthday: normalizeDateForInput(patient?.birthday ?? patient?.date_of_birth),
    weightKg: readProfileString(patient?.weight_kg ?? patient?.weightKg),
    heightCm: readProfileString(patient?.height_cm ?? patient?.heightCm),
    phone: contact.phone,
    address: contact.address,
    allergies: medical.allergies,
    conditions: medical.conditions,
  }
}
