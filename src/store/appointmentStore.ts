import { create } from "zustand"
import axios from "axios"
import api from "@/lib/axios"

export interface AppointmentDaySlots {
  date: string
  slots: string[]
}

export interface WeekSlotsResponse {
  doctor_profile_id: number
  start_date: string
  days: AppointmentDaySlots[]
}

export function getSlotsForDate(
  response: WeekSlotsResponse,
  date: string,
): string[] {
  return response.days.find((day) => day.date === date)?.slots ?? []
}

interface AppointmentStoreState {
  weekSlots: WeekSlotsResponse | null
  isLoadingSlots: boolean
  slotsError: string | null
}

interface AppointmentStoreActions {
  fetchWeekSlots: (
    doctorId: number,
    startDate: string,
  ) => Promise<WeekSlotsResponse>
  clearWeekSlots: () => void
  clearSlotsError: () => void
}

const useAppointmentStore = create<
  AppointmentStoreState & AppointmentStoreActions
>()((set) => ({
  weekSlots: null,
  isLoadingSlots: false,
  slotsError: null,

  clearWeekSlots: () =>
    set((state) => {
      if (state.weekSlots === null && state.slotsError === null) {
        return state
      }
      return { weekSlots: null, slotsError: null }
    }),
  clearSlotsError: () => set({ slotsError: null }),

  fetchWeekSlots: async (doctorId, startDate) => {
    set({ isLoadingSlots: true, slotsError: null })
    try {
      const { data } = await api.get<WeekSlotsResponse>(
        "/appointments/slots/week",
        {
          params: {
            doctor_id: doctorId,
            start_date: startDate,
          },
        },
      )
      set({ weekSlots: data, isLoadingSlots: false })
      return data
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message ??
          err.response?.data?.error ??
          err.message)
        : "Failed to load time slots"
      set({ slotsError: String(message), isLoadingSlots: false })
      throw err
    }
  },
}))

export default useAppointmentStore
