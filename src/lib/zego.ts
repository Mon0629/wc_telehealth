import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt"
import api from "@/lib/axios"

export interface AppointmentJoinTokenResponse {
  appointment_id: number
  app_id: number
  room_id: string
  user_id: string
  token: string
}

export async function fetchAppointmentJoinToken(appointmentId: number) {
  const { data } = await api.get<AppointmentJoinTokenResponse>(
    `/appointments/${appointmentId}/join-token`,
  )
  return data
}

export function buildKitToken(
  join: AppointmentJoinTokenResponse,
  userName: string,
): string {
  return ZegoUIKitPrebuilt.generateKitTokenForProduction(
    join.app_id,
    join.token,
    join.room_id,
    join.user_id,
    userName,
  )
}
