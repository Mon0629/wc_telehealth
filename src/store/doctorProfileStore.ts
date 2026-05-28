import { create } from "zustand"
import { persist } from "zustand/middleware"
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
  openProfile: () => void
  closeProfile: () => void
  setProfile: (profile: DoctorProfileDetails) => void
}

const useDoctorProfileStore = create<DoctorProfileState>()(
  persist(
    (set) => ({
      isOpen: false,
      profile: emptyProfile,
      openProfile: () => set({ isOpen: true }),
      closeProfile: () => {
        if (useAuthStore.getState().isFirstLogin) return
        set({ isOpen: false })
      },
      setProfile: (profile) => set({ profile: normalizeDoctorProfile(profile) }),
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
