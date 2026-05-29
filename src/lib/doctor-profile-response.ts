import { DAYS_OF_WEEK } from "@/lib/doctor-profile-payload"
import {
  extractAvatarUrlFromProfileResponse,
  extractPayload,
  parseJsonObject,
  readProfileString,
} from "@/lib/profile-response"
import type {
  AvailabilitySlot,
  DayOfWeek,
  DoctorProfileDetails,
} from "@/store/doctorProfileStore"

const API_DAY_TO_ENUM = Object.fromEntries(
  DAYS_OF_WEEK.map((day) => [day.apiNumber, day.value]),
) as Record<number, DayOfWeek>

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function normalizeTimeForInput(time: unknown): string {
  if (typeof time !== "string" || !time.trim()) return "09:00"
  const [hourPart, minutePart = "00"] = time.trim().split(":")
  const hour = Number(hourPart)
  const minute = Number(minutePart)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return "09:00"
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function resolveDayOfWeek(value: unknown): DayOfWeek | null {
  if (typeof value === "number" && API_DAY_TO_ENUM[value]) {
    return API_DAY_TO_ENUM[value]
  }

  if (typeof value === "string") {
    const upper = value.trim().toUpperCase()
    if (DAYS_OF_WEEK.some((day) => day.value === upper)) {
      return upper as DayOfWeek
    }

    const asNumber = Number(value)
    if (Number.isFinite(asNumber) && API_DAY_TO_ENUM[asNumber]) {
      return API_DAY_TO_ENUM[asNumber]
    }
  }

  return null
}

export function parseAvailabilityFromApi(slots: unknown): AvailabilitySlot[] {
  if (!Array.isArray(slots)) return []

  const parsed: AvailabilitySlot[] = []

  for (const raw of slots) {
    const slot = asRecord(raw)
    if (!slot) continue

    const isAvailable = slot.is_available ?? slot.isAvailable
    if (isAvailable === false) continue

    const dayOfWeek = resolveDayOfWeek(slot.day_of_week ?? slot.dayOfWeek)
    if (!dayOfWeek) continue

    const startTime = normalizeTimeForInput(slot.start_time ?? slot.startTime)
    const endTime = normalizeTimeForInput(slot.end_time ?? slot.endTime)
    if (startTime >= endTime) continue

    parsed.push({
      id:
        typeof slot.id === "string"
          ? slot.id
          : typeof slot.id === "number"
            ? String(slot.id)
            : crypto.randomUUID(),
      dayOfWeek,
      startTime,
      endTime,
    })
  }

  return parsed
}

function extractDoctorProfileRecord(
  response: unknown,
): Record<string, unknown> | null {
  const root = asRecord(extractPayload(response))
  if (!root) return null

  const candidates = [
    root.doctorProfile,
    root.doctor_profile,
    root.doctor,
    root.profile,
  ]

  for (const candidate of candidates) {
    const record = asRecord(candidate)
    if (record) return record
  }

  if (
    Array.isArray(root.availability) ||
    root.bio !== undefined ||
    root.specialization !== undefined
  ) {
    return root
  }

  const user = asRecord(root.user)
  if (user) {
    const nested = extractDoctorProfileRecord(user)
    if (nested) return nested
  }

  return null
}

function parseProfileDetails(
  details: unknown,
): Pick<DoctorProfileDetails, "education" | "yearsOfExperience"> {
  const record = parseJsonObject(details)

  return {
    education: readProfileString(record?.education),
    yearsOfExperience: readProfileString(
      record?.years_experience ?? record?.yearsOfExperience,
    ),
  }
}

export function parseDoctorProfileFromApi(
  response: unknown,
): DoctorProfileDetails {
  const doctor = extractDoctorProfileRecord(response)
  const profileDetails = parseProfileDetails(doctor?.profile_details)

  const avatarUrl =
    extractAvatarUrlFromProfileResponse(doctor) ??
    extractAvatarUrlFromProfileResponse(response) ??
    ""

  return {
    avatarUrl,
    bio: readProfileString(doctor?.bio),
    education: profileDetails.education,
    yearsOfExperience: profileDetails.yearsOfExperience,
    specialization: readProfileString(doctor?.specialization),
    consultationFee: readProfileString(doctor?.fee ?? doctor?.consultation_fee),
    availability: parseAvailabilityFromApi(doctor?.availability),
  }
}
