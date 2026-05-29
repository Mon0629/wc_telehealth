import api from "@/lib/axios"
import { parseDoctorProfileFromApi } from "@/lib/doctor-profile-response"
import { parsePatientProfileFromApi } from "@/lib/patient-profile-response"
import type { DoctorProfileDetails } from "@/store/doctorProfileStore"
import type { PatientProfileDetails } from "@/store/patientProfileStore"

/** GET /profile/me — returns the authenticated user's profile (doctor or patient). */
export async function fetchMyProfile(): Promise<unknown> {
  const { data } = await api.get<unknown>("/profile/me")
  return data
}

/** PUT /profile/me — updates the authenticated user's profile (multipart). */
export async function updateMyProfile(formData: FormData): Promise<unknown> {
  const { data } = await api.put<unknown>("/profile/me", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}

export function parseMyDoctorProfile(response: unknown): DoctorProfileDetails {
  return parseDoctorProfileFromApi(response)
}

export function parseMyPatientProfile(response: unknown): PatientProfileDetails {
  return parsePatientProfileFromApi(response)
}
