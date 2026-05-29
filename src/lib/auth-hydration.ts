import useAuthStore from "@/store/authStore"

/** Resolves once Zustand has restored auth from localStorage (tokens available for API calls). */
export function waitForAuthHydration(): Promise<void> {
  if (useAuthStore.persist.hasHydrated()) return Promise.resolve()

  return new Promise((resolve) => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      unsub()
      resolve()
    })
  })
}
