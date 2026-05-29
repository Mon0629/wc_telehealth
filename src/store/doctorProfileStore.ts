import { create } from "zustand"
import { persist } from "zustand/middleware"
import axios from "axios"
import { buildDoctorProfileFormData } from "@/lib/doctor-profile-payload"
import {
  fetchMyProfile,
  parseMyDoctorProfile,
  updateMyProfile,
} from "@/lib/profile-api"
import { extractAvatarUrlFromProfileResponse } from "@/lib/profile-response"
import useAuthStore from "@/store/authStore"

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY"

export interface AvailabilitySlot {
  id: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
}

export interface DoctorProfileDetails {
  avatarUrl: string
  bio: string
  education: string
  yearsOfExperience: string
  specialization: string
  consultationFee: string
  availability: AvailabilitySlot[]
}

const emptyProfile: DoctorProfileDetails = {
  avatarUrl: "",
  bio: "",
  education: "",
  yearsOfExperience: "",
  specialization: "",
  consultationFee: "",
  availability: [],
}

function normalizeDoctorProfile(
  profile?: Partial<DoctorProfileDetails> | null
): DoctorProfileDetails {
  return {
    ...emptyProfile,
    ...profile,
    availability: Array.isArray(profile?.availability)
      ? profile.availability
      : [],
  }
}

interface DoctorProfileState {
  isOpen: boolean
  profile: DoctorProfileDetails
  isLoading: boolean
  isFetching: boolean
  error: string | null
}

interface DoctorProfileActions {
  openProfile: () => void
  closeProfile: () => void
  setProfile: (profile: DoctorProfileDetails) => void
  fetchProfile: () => Promise<DoctorProfileDetails>
  saveProfile: (
    profile: DoctorProfileDetails,
    avatarFile?: File | null
  ) => Promise<DoctorProfileDetails>
  clearError: () => void
}

const useDoctorProfileStore = create<DoctorProfileState & DoctorProfileActions>()(
  persist(
    (set) => ({
      isOpen: false,
      profile: emptyProfile,
      isLoading: false,
      isFetching: false,
      error: null,

      openProfile: () => set({ isOpen: true }),
      closeProfile: () => {
        if (useAuthStore.getState().isFirstLogin) return
        set({ isOpen: false })
      },
      setProfile: (profile) =>
        set({ profile: normalizeDoctorProfile(profile) }),
      clearError: () => set({ error: null }),

      fetchProfile: async () => {
        set({ isFetching: true, error: null })
        try {
          const data = await fetchMyProfile()
          const fetchedProfile = normalizeDoctorProfile(
            parseMyDoctorProfile(data),
          )
          set({ profile: fetchedProfile, isFetching: false })
          return fetchedProfile
        } catch (err) {
          let message = "Could not load profile. Please try again."
          if (axios.isAxiosError(err)) {
            message =
              err.response?.data?.message ??
              err.response?.data?.error ??
              message
          }
          set({ error: message, isFetching: false })
          throw err
        }
      },

      saveProfile: async (profile, avatarFile = null) => {
        set({ isLoading: true, error: null })
        try {
          const formData = buildDoctorProfileFormData(profile, avatarFile)
          const data = await updateMyProfile(formData)

          const parsed = parseMyDoctorProfile(data)
          const cloudinaryAvatarUrl =
            extractAvatarUrlFromProfileResponse(data) ??
            parsed.avatarUrl ??
            profile.avatarUrl

          const savedProfile = normalizeDoctorProfile({
            ...profile,
            ...parsed,
            avatarUrl: cloudinaryAvatarUrl || parsed.avatarUrl || profile.avatarUrl,
            availability:
              parsed.availability.length > 0
                ? parsed.availability
                : profile.availability,
          })

          set({ profile: savedProfile, isLoading: false })
          return savedProfile
        } catch (err) {
          let message = "Could not save profile. Please try again."
          if (axios.isAxiosError(err)) {
            message =
              err.response?.data?.message ??
              err.response?.data?.error ??
              message
          }
          set({ error: message, isLoading: false })
          throw err
        }
      },
    }),
    {
      name: "doctor-profile-storage",
      partialize: (state) => ({ profile: state.profile }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<DoctorProfileState> | undefined
        return {
          ...currentState,
          ...persisted,
          profile: normalizeDoctorProfile(persisted?.profile),
        }
      },
    }
  )
)

export { emptyProfile, normalizeDoctorProfile }
export default useDoctorProfileStore
