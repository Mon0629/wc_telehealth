/**
 * Extracts the Cloudinary (or other hosted) avatar URL from a profile API response.
 * Supports common root/nested field names from the backend.
 */
export function extractAvatarUrlFromProfileResponse(
  data: unknown,
): string | null {
  const candidates: unknown[] = []
  collectAvatarCandidates(data, candidates, 0)

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }

  return null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function collectAvatarCandidates(
  value: unknown,
  candidates: unknown[],
  depth: number,
): void {
  if (depth > 6 || value == null) return

  if (typeof value === "string") {
    candidates.push(value)
    return
  }

  const record = asRecord(value)
  if (!record) return

  if ("data" in record) {
    collectAvatarCandidates(record.data, candidates, depth + 1)
  }

  candidates.push(
    record.avatar_url,
    record.avatarUrl,
    record.profile_picture,
    record.profilePicture,
    record.profile_picture_url,
    record.profilePictureUrl,
  )

  const nestedKeys = [
    "profile",
    "user",
    "doctor",
    "patient",
    "doctorProfile",
    "doctor_profile",
    "patientProfile",
    "patient_profile",
  ] as const

  for (const key of nestedKeys) {
    if (key in record) {
      collectAvatarCandidates(record[key], candidates, depth + 1)
    }
  }
}

export function extractPayload<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

export function asProfileRecord(
  value: unknown,
): Record<string, unknown> | null {
  return asRecord(value)
}

export function readProfileString(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return ""
}

export function parseJsonObject(value: unknown): Record<string, unknown> | null {
  let record = asRecord(value)

  if (typeof value === "string" && value.trim()) {
    try {
      record = asRecord(JSON.parse(value))
    } catch {
      return null
    }
  }

  return record
}

/** Normalizes API date strings to `YYYY-MM-DD` for `<input type="date">`. */
export function normalizeDateForInput(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return ""

  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return trimmed.slice(0, 10)

  return parsed.toISOString().slice(0, 10)
}
