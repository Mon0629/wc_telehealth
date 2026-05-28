import { create } from "zustand"
import axios from "axios"
import api from "@/lib/axios"
import { DAYS_OF_WEEK } from "@/lib/doctor-profile-payload"

export interface DoctorAvailability {
  day_of_week: number
  start_time: string | null
  end_time: string | null
  is_available: boolean
}

export interface DoctorProfileDetailsApi {
  education: string
  years_experience: number
}

export interface DoctorApiItem {
  id: number
  bio: string
  specialization: string
  fee: string
  profile_picture_url: string
  profile_details: DoctorProfileDetailsApi
  availability: DoctorAvailability[]
  first_name: string
  last_name: string
}

export interface DoctorsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface DoctorsApiResponse {
  data: DoctorApiItem[]
  pagination: DoctorsPagination
}

export interface DoctorListItem {
  id: number
  name: string
  specialization: string
  fee: string
  bio: string
  education: string
  yearsExperience: number
  avatar: string
  available: boolean
  availabilitySlots: string[]
}

const DAY_LABEL_BY_NUMBER = Object.fromEntries(
  DAYS_OF_WEEK.map((day) => [day.apiNumber, day.label])
) as Record<number, string>

export function normalizeDoctorFromApi(doctor: DoctorApiItem): DoctorListItem {
  const availabilitySlots = doctor.availability
    .filter((slot) => slot.is_available && slot.start_time && slot.end_time)
    .map((slot) => {
      const day = DAY_LABEL_BY_NUMBER[slot.day_of_week] ?? "Unknown"
      return `${day}: ${slot.start_time} – ${slot.end_time}`
    })

  return {
    id: doctor.id,
    name: `Dr. ${doctor.first_name} ${doctor.last_name}`.trim(),
    specialization: doctor.specialization ?? "",
    fee: doctor.fee ?? "0",
    bio: doctor.bio ?? "",
    education: doctor.profile_details?.education ?? "",
    yearsExperience: doctor.profile_details?.years_experience ?? 0,
    avatar: doctor.profile_picture_url ?? "",
    available: doctor.availability.some((slot) => slot.is_available),
    availabilitySlots,
  }
}

interface DoctorStoreState {
  doctors: DoctorListItem[]
  pagination: DoctorsPagination | null
  isLoading: boolean
  error: string | null
}

interface DoctorStoreActions {
  fetchDoctors: (page?: number, limit?: number) => Promise<void>
  clearError: () => void
}

const DEFAULT_LIMIT = 10

const useDoctorStore = create<DoctorStoreState & DoctorStoreActions>()(
  (set) => ({
    doctors: [],
    pagination: null,
    isLoading: false,
    error: null,

    clearError: () => set({ error: null }),

    fetchDoctors: async (page = 1, limit = DEFAULT_LIMIT) => {
      set({ isLoading: true, error: null })
      try {
        const { data } = await api.get<DoctorsApiResponse>("/doctors", {
          params: { page, limit },
        })

        set({
          doctors: (data.data ?? []).map(normalizeDoctorFromApi),
          pagination: data.pagination ?? null,
          isLoading: false,
        })
      } catch (err) {
        let message = "Could not load doctors. Please try again."
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
  })
)

export default useDoctorStore
