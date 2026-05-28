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

export interface CreateAppointmentPayload {
  doctor_profile_id: number
  appointment_date: string
  start_time: string
  patient_notes: string
}

function getErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    return String(
      err.response?.data?.message ??
        err.response?.data?.error ??
        err.message ??
        fallback,
    )
  }
  return fallback
}

interface AppointmentStoreState {
  weekSlots: WeekSlotsResponse | null
  isLoadingSlots: boolean
  slotsError: string | null
  isBooking: boolean
  bookingError: string | null
}

interface AppointmentStoreActions {
  fetchWeekSlots: (
    doctorId: number,
    startDate: string,
  ) => Promise<WeekSlotsResponse>
  createAppointment: (payload: CreateAppointmentPayload) => Promise<void>
  clearWeekSlots: () => void
  clearSlotsError: () => void
  clearBookingError: () => void
}

const useAppointmentStore = create<
  AppointmentStoreState & AppointmentStoreActions
>()((set) => ({
  weekSlots: null,
  isLoadingSlots: false,
  slotsError: null,
  isBooking: false,
  bookingError: null,

  clearBookingError: () => set({ bookingError: null }),

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

  createAppointment: async (payload) => {
    set({ isBooking: true, bookingError: null })
    try {
      await api.post("/appointments", payload)
      set({ isBooking: false })
    } catch (err) {
      const message = getErrorMessage(err, "Failed to book appointment")
      set({ bookingError: message, isBooking: false })
      throw err
    }
  },
}))

export default useAppointmentStore
