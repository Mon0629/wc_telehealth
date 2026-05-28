import type { User } from "@/store/authStore"

type RawUser = {
  id: number
  email: string
  first_name?: string
  last_name?: string
  role?: string
  phone?: string
  email_verified?: boolean
  is_active?: boolean
  first_time_logged_in?: boolean
  created_at?: string
  updated_at?: string
}

type AuthResponse = {
  user?: RawUser
  accessToken?: string
  access_token?: string
  token?: string
  refreshToken?: string
  refresh_token?: string
  isFirstLogin?: boolean
  is_first_login?: boolean
}

export function mapUserFromApi(rawUser: RawUser): User {
  return {
    id: rawUser.id,
    email: rawUser.email,
    firstName: rawUser.first_name,
    lastName: rawUser.last_name,
    role: rawUser.role,
    phone: rawUser.phone,
    emailVerified: rawUser.email_verified,
    isActive: rawUser.is_active,
    firstTimeLoggedIn: rawUser.first_time_logged_in,
    createdAt: rawUser.created_at,
    updatedAt: rawUser.updated_at,
  }
}

export function resolveIsFirstLogin(
  data: AuthResponse,
  rawUser?: RawUser
): boolean {
  if (data.isFirstLogin === true || data.is_first_login === true) {
    return true
  }
  if (rawUser?.first_time_logged_in === true) {
    return true
  }
  return false
}

export function parseAuthResponse(data: AuthResponse) {
  const rawUser = data.user
  const user = rawUser ? mapUserFromApi(rawUser) : null
  const accessToken =
    data.accessToken ?? data.access_token ?? data.token ?? null
  const refreshToken = data.refreshToken ?? data.refresh_token ?? null
  const isFirstLogin = resolveIsFirstLogin(data, rawUser)

  return { user, accessToken, refreshToken, isFirstLogin }
}
