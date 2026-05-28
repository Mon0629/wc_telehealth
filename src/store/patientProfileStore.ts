import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface PatientProfileDetails {
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
  avatarUrl: "",
  birthday: "",
  weightKg: "",
  heightCm: "",
  address: "",
  phone: "",
  allergies: "",
  conditions: "",
}

interface PatientProfileState {
  isOpen: boolean
  profile: PatientProfileDetails
  openProfile: () => void
  closeProfile: () => void
  setProfile: (profile: PatientProfileDetails) => void
}

const usePatientProfileStore = create<PatientProfileState>()(
  persist(
    (set) => ({
      isOpen: false,
      profile: emptyProfile,
      openProfile: () => set({ isOpen: true }),
      closeProfile: () => set({ isOpen: false }),
      setProfile: (profile) => set({ profile }),
    }),
    {
      name: "patient-profile-storage",
      partialize: (state) => ({ profile: state.profile }),
    }
  )
)

export { emptyProfile }
export default usePatientProfileStore
