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

export type DoctorAppointmentStatus =
  | "Pending"
  | "Confirmed"
  | "Denied"
  | "Completed"
  | "Cancelled"

export interface DoctorAppointmentUser {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string | null
}

export interface DoctorAppointmentPatientProfile {
  id: number
  user: DoctorAppointmentUser
}

export interface DoctorAppointmentApiItem {
  id: number
  doctor_profile_id?: number
  patient_profile_id?: number
  appointment_date: string
  start_time: string
  end_time?: string
  status: string
  patient_notes?: string
  video_room_id?: string | null
  daily_room_url?: string | null
  room_link?: string | null
  meeting_link?: string | null
  patientProfile?: DoctorAppointmentPatientProfile
  patient?: {
    first_name?: string
    last_name?: string
  }
  first_name?: string
  last_name?: string
}

export interface AppointmentsListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface DoctorAppointmentsApiResponse {
  data: DoctorAppointmentApiItem[]
  meta: AppointmentsListMeta
}

export interface DoctorAppointmentItem {
  id: number
  patientName: string
  patientNotes: string
  appointmentDate: string
  startTime: string
  roomLink: string | null
  videoRoomId: string | null
  status: DoctorAppointmentStatus
}

export function formatTime24ToDisplay(time: string) {
  const [hourPart, minutePart = "00"] = time.split(":")
  const hour = Number(hourPart)
  const minute = Number(minutePart)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time

  const period = hour >= 12 ? "pm" : "am"
  const hour12 = hour % 12 || 12
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`
}

export function normalizeAppointmentStatus(
  status: string,
): DoctorAppointmentStatus {
  const normalized = status.trim().toLowerCase()

  if (normalized === "confirmed") return "Confirmed"
  if (
    normalized === "denied" ||
    normalized === "declined" ||
    normalized === "rejected" ||
    normalized === "reject"
  ) {
    return "Denied"
  }
  if (normalized === "completed") return "Completed"
  if (normalized === "cancelled" || normalized === "canceled") {
    return "Cancelled"
  }

  return "Pending"
}

function resolvePatientName(item: DoctorAppointmentApiItem): string {
  const profileUser = item.patientProfile?.user
  if (profileUser) {
    const name =
      `${profileUser.first_name ?? ""} ${profileUser.last_name ?? ""}`.trim()
    if (name) return name
  }

  if (item.patient) {
    const name =
      `${item.patient.first_name ?? ""} ${item.patient.last_name ?? ""}`.trim()
    if (name) return name
  }

  const name = `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim()
  return name || "Unknown patient"
}

function resolveRoomLink(item: DoctorAppointmentApiItem): string | null {
  return (
    item.daily_room_url ?? item.room_link ?? item.meeting_link ?? null
  )
}

export function normalizeDoctorAppointment(
  item: DoctorAppointmentApiItem,
): DoctorAppointmentItem {
  return {
    id: item.id,
    patientName: resolvePatientName(item),
    patientNotes: item.patient_notes?.trim() ?? "",
    appointmentDate: item.appointment_date,
    startTime: item.start_time,
    roomLink: resolveRoomLink(item),
    videoRoomId: item.video_room_id ?? null,
    status: normalizeAppointmentStatus(item.status),
  }
}

function extractAppointmentsFromResponse(
  payload:
    | DoctorAppointmentsApiResponse
    | DoctorAppointmentApiItem[]
    | DoctorAppointmentApiItem,
): DoctorAppointmentApiItem[] {
  if (Array.isArray(payload)) return payload
  if ("data" in payload && Array.isArray(payload.data)) return payload.data
  if ("id" in payload && "status" in payload) {
    return [payload as DoctorAppointmentApiItem]
  }
  return []
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
  doctorAppointments: DoctorAppointmentItem[]
  appointmentsMeta: AppointmentsListMeta | null
  isLoadingAppointments: boolean
  appointmentsError: string | null
  updatingAppointmentId: number | null
}

interface AppointmentStoreActions {
  fetchWeekSlots: (
    doctorId: number,
    startDate: string,
  ) => Promise<WeekSlotsResponse>
  createAppointment: (payload: CreateAppointmentPayload) => Promise<void>
  fetchDoctorAppointments: (page?: number) => Promise<DoctorAppointmentItem[]>
  confirmAppointment: (appointmentId: number) => Promise<void>
  rejectAppointment: (appointmentId: number) => Promise<void>
  clearWeekSlots: () => void
  clearSlotsError: () => void
  clearBookingError: () => void
  clearAppointmentsError: () => void
}

const useAppointmentStore = create<
  AppointmentStoreState & AppointmentStoreActions
>()((set) => ({
  weekSlots: null,
  isLoadingSlots: false,
  slotsError: null,
  isBooking: false,
  bookingError: null,
  doctorAppointments: [],
  appointmentsMeta: null,
  isLoadingAppointments: false,
  appointmentsError: null,
  updatingAppointmentId: null,

  clearBookingError: () => set({ bookingError: null }),
  clearAppointmentsError: () => set({ appointmentsError: null }),

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

  fetchDoctorAppointments: async (page = 1) => {
    set({ isLoadingAppointments: true, appointmentsError: null })
    try {
      const { data } = await api.get<
        DoctorAppointmentsApiResponse | DoctorAppointmentApiItem[]
      >("/appointments/doctor", {
        params: { page, limit: 10 },
      })

      const items = extractAppointmentsFromResponse(data)
      const doctorAppointments = items.map(normalizeDoctorAppointment)
      const appointmentsMeta =
        !Array.isArray(data) && data.meta ? data.meta : null

      set({
        doctorAppointments,
        appointmentsMeta,
        isLoadingAppointments: false,
      })
      return doctorAppointments
    } catch (err) {
      const message = getErrorMessage(err, "Failed to load appointments")
      set({ appointmentsError: message, isLoadingAppointments: false })
      throw err
    }
  },

  confirmAppointment: async (appointmentId) => {
    set({ updatingAppointmentId: appointmentId })
    try {
      const { data } = await api.patch<
        DoctorAppointmentsApiResponse | DoctorAppointmentApiItem
      >(`/appointments/${appointmentId}/status`, {
        status: "CONFIRMED",
      })

      const items = extractAppointmentsFromResponse(data)
      const confirmed = items.find((item) => item.id === appointmentId) ?? items[0]

      set((state) => ({
        updatingAppointmentId: null,
        doctorAppointments:
          items.length > 1
            ? items.map(normalizeDoctorAppointment)
            : state.doctorAppointments.map((appointment) =>
                appointment.id === appointmentId
                  ? confirmed
                    ? normalizeDoctorAppointment(confirmed)
                    : {
                        ...appointment,
                        status: "Confirmed" as const,
                      }
                  : appointment,
              ),
      }))
    } catch (err) {
      set({ updatingAppointmentId: null })
      throw new Error(getErrorMessage(err, "Failed to confirm appointment"))
    }
  },

  rejectAppointment: async (appointmentId) => {
    set({ updatingAppointmentId: appointmentId })
    try {
      const { data } = await api.patch<
        DoctorAppointmentsApiResponse | DoctorAppointmentApiItem
      >(`/appointments/${appointmentId}/reject`)

      const items = extractAppointmentsFromResponse(data)
      const rejected = items.find((item) => item.id === appointmentId) ?? items[0]

      set((state) => ({
        updatingAppointmentId: null,
        doctorAppointments:
          items.length > 1
            ? items.map(normalizeDoctorAppointment)
            : state.doctorAppointments.map((appointment) =>
                appointment.id === appointmentId
                  ? rejected
                    ? normalizeDoctorAppointment(rejected)
                    : {
                        ...appointment,
                        status: "Denied" as const,
                      }
                  : appointment,
              ),
      }))
    } catch (err) {
      set({ updatingAppointmentId: null })
      throw new Error(getErrorMessage(err, "Failed to reject appointment"))
    }
  },
}))

export default useAppointmentStore
