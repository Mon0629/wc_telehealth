import axios from "axios";
import {
  clearStoredTokens,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/lib/auth-token";
import { initBeams, clearBeams } from "@/lib/pusherBeams";
import { disconnectSocket, updateSocketAuth } from "@/lib/socket";
import useAuthStore from "@/store/authStore";

type RefreshTokenResponse = {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
};

function parseRefreshResponse(data: RefreshTokenResponse) {
  const accessToken = data.accessToken ?? data.access_token ?? null;
  const refreshToken = data.refreshToken ?? data.refresh_token ?? null;
  return { accessToken, refreshToken };
}

/** Persists new tokens and reconnects realtime clients that use the access token. */
export function applyAuthTokens(
  accessToken: string,
  refreshToken: string | null,
): void {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);

  useAuthStore.setState({
    accessToken,
    refreshToken: refreshToken ?? useAuthStore.getState().refreshToken,
    isAuthenticated: true,
  });

  updateSocketAuth(accessToken);

  const userId = useAuthStore.getState().user?.id;
  if (userId) {
    void initBeams(accessToken, userId);
  }
}

let refreshPromise: Promise<string> | null = null;

/** Calls POST /auth/refresh and returns the new access token. */
export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available.");
    }

    const baseURL = import.meta.env.VITE_BASE_URL;
    const { data } = await axios.post<RefreshTokenResponse>(
      `${baseURL}/auth/refresh`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } },
    );

    const { accessToken, refreshToken: nextRefreshToken } =
      parseRefreshResponse(data);

    if (!accessToken) {
      throw new Error("Refresh response did not include an access token.");
    }

    applyAuthTokens(accessToken, nextRefreshToken ?? refreshToken);
    return accessToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/** Clears client auth state and sends the user to login (no server logout call). */
export async function clearAuthSession(): Promise<void> {
  await clearBeams();
  disconnectSocket();
  clearStoredTokens();

  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    pendingVerificationEmail: null,
    isAuthenticated: false,
    isFirstLogin: false,
    error: null,
    isLoading: false,
  });

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}
