import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface DoctorProfileDetails {
  avatarUrl: string
  bio: string
  education: string
  yearsOfExperience: string
  specialization: string
  consultationFee: string
}

const emptyProfile: DoctorProfileDetails = {
  avatarUrl: "",
  bio: "",
  education: "",
  yearsOfExperience: "",
  specialization: "",
  consultationFee: "",
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
      closeProfile: () => set({ isOpen: false }),
      setProfile: (profile) => set({ profile }),
    }),
    {
      name: "doctor-profile-storage",
      partialize: (state) => ({ profile: state.profile }),
    }
  )
)

export { emptyProfile }
export default useDoctorProfileStore
