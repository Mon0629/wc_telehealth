import { create } from "zustand"
import axios from "axios"
import api from "@/lib/axios"
import { DAYS_OF_WEEK } from "@/lib/doctor-profile-payload"
import usePatientProfileStore, {
  type PatientProfileDetails,
} from "@/store/patientProfileStore"

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
  user_id?: number
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

export interface AiRecommendationMeta {
  model: string
  recommended_specializations: string[]
  raw: string
}

export interface AiRecommendationResponse {
  data: DoctorApiItem[]
  ai: AiRecommendationMeta
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

export function buildMedicalHistorySymptoms(
  profile: PatientProfileDetails
): string {
  const parts: string[] = []

  const conditions = profile.conditions.trim()
  const allergies = profile.allergies.trim()

  if (conditions) {
    try {
      const parsed = JSON.parse(conditions) as Record<string, unknown>
      if (parsed && typeof parsed === "object") {
        if (parsed.medical_conditions) {
          parts.push(String(parsed.medical_conditions))
        } else if (parsed.conditions) {
          parts.push(String(parsed.conditions))
        } else {
          parts.push(conditions)
        }
        if (parsed.allergies && !allergies) {
          parts.push(`Allergies: ${String(parsed.allergies)}`)
        }
      } else {
        parts.push(conditions)
      }
    } catch {
      parts.push(conditions)
    }
  }

  if (allergies) {
    parts.push(`Allergies: ${allergies}`)
  }

  return parts.filter(Boolean).join(". ")
}

export function resolveRecommendationSymptoms(symptomsInput: string): string {
  const trimmed = symptomsInput.trim()
  if (trimmed) return trimmed

  const profile = usePatientProfileStore.getState().profile
  return buildMedicalHistorySymptoms(profile)
}

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
  recommendedDoctor: DoctorListItem | null
  aiRecommendation: AiRecommendationMeta | null
  isLoading: boolean
  isRecommending: boolean
  error: string | null
  recommendationError: string | null
}

interface DoctorStoreActions {
  fetchDoctors: (page?: number, limit?: number) => Promise<void>
  fetchAiRecommendation: (symptomsInput: string) => Promise<DoctorListItem>
  clearAiRecommendation: () => void
  clearError: () => void
  clearRecommendationError: () => void
}

const DEFAULT_LIMIT = 10

const useDoctorStore = create<DoctorStoreState & DoctorStoreActions>()(
  (set) => ({
    doctors: [],
    pagination: null,
    recommendedDoctor: null,
    aiRecommendation: null,
    isLoading: false,
    isRecommending: false,
    error: null,
    recommendationError: null,

    clearError: () => set({ error: null }),
    clearRecommendationError: () => set({ recommendationError: null }),
    clearAiRecommendation: () =>
      set({ recommendedDoctor: null, aiRecommendation: null }),

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

    fetchAiRecommendation: async (symptomsInput) => {
      const symptoms = resolveRecommendationSymptoms(symptomsInput)

      if (!symptoms.trim()) {
        const message =
          "Please describe your symptoms or add medical conditions to your profile."
        set({ recommendationError: message })
        throw new Error(message)
      }

      set({ isRecommending: true, recommendationError: null })

      try {
        const { data } = await api.post<AiRecommendationResponse>(
          "/doctors/recommend",
          { symptoms }
        )

        const doctorApi = data.data?.[0]
        if (!doctorApi) {
          throw new Error("No doctor recommendation was returned.")
        }

        const doctor = normalizeDoctorFromApi(doctorApi)

        console.log("[AI Recommendation] Request symptoms:", symptoms)
        console.log("[AI Recommendation] Recommended doctor:", doctor)
        console.log("[AI Recommendation] AI metadata:", data.ai)

        set({
          recommendedDoctor: doctor,
          aiRecommendation: data.ai ?? null,
          isRecommending: false,
        })

        return doctor
      } catch (err) {
        let message = "Could not get an AI recommendation. Please try again."
        if (axios.isAxiosError(err)) {
          message =
            err.response?.data?.message ??
            err.response?.data?.error ??
            message
        } else if (err instanceof Error && err.message) {
          message = err.message
        }
        set({ recommendationError: message, isRecommending: false })
        throw err
      }
    },
  })
)

export default useDoctorStore
