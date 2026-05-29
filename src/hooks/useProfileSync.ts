import { useEffect } from "react"
import { waitForAuthHydration } from "@/lib/auth-hydration"
import useAuthStore from "@/store/authStore"
import useDoctorProfileStore from "@/store/doctorProfileStore"
import usePatientProfileStore from "@/store/patientProfileStore"

async function waitForProfileHydration(isDoctor: boolean): Promise<void> {
  const store = isDoctor ? useDoctorProfileStore : usePatientProfileStore

  if (store.persist.hasHydrated()) return

  await new Promise<void>((resolve) => {
    const unsub = store.persist.onFinishHydration(() => {
      unsub()
      resolve()
    })
  })
}

/**
 * Loads the current user's profile from `/profile/me` after auth + persist hydration.
 * Keeps sidebar avatar and profile modals in sync with the server.
 */
export function useProfileSync() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const role = useAuthStore((state) => state.user?.role)
  const fetchDoctorProfile = useDoctorProfileStore((state) => state.fetchProfile)
  const fetchPatientProfile = usePatientProfileStore((state) => state.fetchProfile)

  useEffect(() => {
    if (!isAuthenticated || !role) return

    const isDoctor = role === "DOCTOR"
    const fetchProfile = isDoctor ? fetchDoctorProfile : fetchPatientProfile

    let cancelled = false

    void (async () => {
      await waitForAuthHydration()
      await waitForProfileHydration(isDoctor)
      if (cancelled) return

      try {
        await fetchProfile()
      } catch {
        // Errors are stored on the profile store; UI can retry via profile modal.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, role, fetchDoctorProfile, fetchPatientProfile])
}
