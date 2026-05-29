import { create } from "zustand"
import { persist } from "zustand/middleware"
import axios from "axios"
import { buildPatientProfileFormData } from "@/lib/patient-profile-payload"
import {
  fetchMyProfile,
  parseMyPatientProfile,
  updateMyProfile,
} from "@/lib/profile-api"
import { extractAvatarUrlFromProfileResponse } from "@/lib/profile-response"
import useAuthStore from "@/store/authStore"

export interface PatientProfileDetails {
  /** Patient profile id for `/patients/:id/...` routes (from GET /profile/me). */
  profileId: number | null
  avatarUrl: string
  birthday: string
  weightKg: string
  heightCm: string
  address: string
  phone: string
  allergies: string
  conditions: string
}

const emptyProfile: PatientProfileDetails = {
  profileId: null,
  avatarUrl: "",
  birthday: "",
  weightKg: "",
  heightCm: "",
  address: "",
  phone: "",
  allergies: "",
  conditions: "",
}

function normalizePatientProfile(
  profile?: Partial<PatientProfileDetails> | null
): PatientProfileDetails {
  return {
    ...emptyProfile,
    ...profile,
  }
}

interface PatientProfileState {
  isOpen: boolean
  profile: PatientProfileDetails
  isLoading: boolean
  isFetching: boolean
  error: string | null
}

interface PatientProfileActions {
  openProfile: () => void
  closeProfile: () => void
  setProfile: (profile: PatientProfileDetails) => void
  fetchProfile: () => Promise<PatientProfileDetails>
  saveProfile: (
    profile: PatientProfileDetails,
    avatarFile?: File | null
  ) => Promise<PatientProfileDetails>
  clearError: () => void
}

const usePatientProfileStore = create<PatientProfileState & PatientProfileActions>()(
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
        set({ profile: normalizePatientProfile(profile) }),
      clearError: () => set({ error: null }),

      fetchProfile: async () => {
        set({ isFetching: true, error: null })
        try {
          const data = await fetchMyProfile()
          const fetchedProfile = normalizePatientProfile(
            parseMyPatientProfile(data),
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
          const formData = buildPatientProfileFormData(profile, avatarFile)
          const data = await updateMyProfile(formData)

          const parsed = parseMyPatientProfile(data)
          const cloudinaryAvatarUrl =
            extractAvatarUrlFromProfileResponse(data) ??
            parsed.avatarUrl ??
            profile.avatarUrl

          const savedProfile = normalizePatientProfile({
            ...profile,
            ...parsed,
            profileId: parsed.profileId ?? profile.profileId,
            avatarUrl:
              cloudinaryAvatarUrl || parsed.avatarUrl || profile.avatarUrl,
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
      name: "patient-profile-storage",
      partialize: (state) => ({ profile: state.profile }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PatientProfileState> | undefined
        return {
          ...currentState,
          ...persisted,
          profile: normalizePatientProfile(persisted?.profile),
        }
      },
    }
  )
)

export { emptyProfile, normalizePatientProfile }
export default usePatientProfileStore
