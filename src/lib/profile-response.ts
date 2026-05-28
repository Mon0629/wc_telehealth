/**
 * Extracts the Cloudinary (or other hosted) avatar URL from a profile API response.
 * Supports common root/nested field names from the backend.
 */
export function extractAvatarUrlFromProfileResponse(
  data: unknown
): string | null {
  if (!data || typeof data !== "object") return null

  const root = data as Record<string, unknown>

  const candidates: unknown[] = [
    root.avatar_url,
    root.avatarUrl,
    root.profile_picture,
    root.profilePicture,
  ]

  const profile = root.profile
  if (profile && typeof profile === "object") {
    const p = profile as Record<string, unknown>
    candidates.push(p.avatar_url, p.avatarUrl, p.profile_picture, p.profilePicture)
  }

  const user = root.user
  if (user && typeof user === "object") {
    const u = user as Record<string, unknown>
    candidates.push(u.avatar_url, u.avatarUrl, u.profile_picture, u.profilePicture)
  }

  const doctor = root.doctor
  if (doctor && typeof doctor === "object") {
    const d = doctor as Record<string, unknown>
    candidates.push(d.avatar_url, d.avatarUrl, d.profile_picture, d.profilePicture)
  }

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }

  return null
}
