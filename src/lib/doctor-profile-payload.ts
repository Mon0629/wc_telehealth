import type {
  AvailabilitySlot,
  DayOfWeek,
  DoctorProfileDetails,
} from "@/store/doctorProfileStore"

export const DAYS_OF_WEEK: {
  value: DayOfWeek
  label: string
  apiNumber: number
}[] = [
  { value: "MONDAY", label: "Monday", apiNumber: 1 },
  { value: "TUESDAY", label: "Tuesday", apiNumber: 2 },
  { value: "WEDNESDAY", label: "Wednesday", apiNumber: 3 },
  { value: "THURSDAY", label: "Thursday", apiNumber: 4 },
  { value: "FRIDAY", label: "Friday", apiNumber: 5 },
  { value: "SATURDAY", label: "Saturday", apiNumber: 6 },
  { value: "SUNDAY", label: "Sunday", apiNumber: 7 },
]

export function buildAvailabilityPayload(slots: AvailabilitySlot[]) {
  const byDay = new Map(slots.map((s) => [s.dayOfWeek, s]))
  return DAYS_OF_WEEK.map(({ value, apiNumber }) => {
    const slot = byDay.get(value)
    return slot
      ? {
          day_of_week: apiNumber,
          is_available: true,
          start_time: slot.startTime,
          end_time: slot.endTime,
        }
      : {
          day_of_week: apiNumber,
          is_available: false,
          start_time: null,
          end_time: null,
        }
  })
}

export function buildDoctorProfileFormData(
  profile: DoctorProfileDetails,
  avatarFile?: File | null
): FormData {
  const formData = new FormData()

  if (avatarFile) {
    formData.append("profile_picture", avatarFile)
  }

  formData.append("bio", profile.bio)
  formData.append("specialization", profile.specialization)
  formData.append("fee", profile.consultationFee)
  formData.append(
    "profile_details",
    JSON.stringify({
      education: profile.education,
      years_experience: Number(profile.yearsOfExperience) || 0,
    })
  )
  formData.append(
    "availability",
    JSON.stringify(buildAvailabilityPayload(profile.availability ?? []))
  )

  return formData
}
