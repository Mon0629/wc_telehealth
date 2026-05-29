const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const AUTH_STORAGE_KEY = 'auth-storage';

/** Reads the JWT from localStorage or the persisted Zustand auth blob. */
export function getAccessToken(): string | null {
  const direct = localStorage.getItem(ACCESS_KEY);
  if (direct) return direct;

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { accessToken?: string | null } };
    return parsed.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

export function setAccessToken(token: string | null): void {
  if (token) localStorage.setItem(ACCESS_KEY, token);
  else localStorage.removeItem(ACCESS_KEY);
}

export function setRefreshToken(token: string | null): void {
  if (token) localStorage.setItem(REFRESH_KEY, token);
  else localStorage.removeItem(REFRESH_KEY);
}

/** After Zustand rehydrate, mirror tokens so axios can attach Authorization. */
export function syncTokensFromPersistedAuth(): void {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as {
      state?: { accessToken?: string | null; refreshToken?: string | null };
    };
    if (parsed.state?.accessToken) {
      localStorage.setItem(ACCESS_KEY, parsed.state.accessToken);
    }
    if (parsed.state?.refreshToken) {
      localStorage.setItem(REFRESH_KEY, parsed.state.refreshToken);
    }
  } catch {
    // ignore malformed storage
  }
}
