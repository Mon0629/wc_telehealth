import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/axios";
import axios from "axios";
import { parseAuthResponse } from "@/lib/auth-response";
import { setAccessToken, setRefreshToken } from "@/lib/auth-token";
import { disconnectSocket } from "@/lib/socket";

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  phone?: string;
  emailVerified?: boolean;
  isActive?: boolean;
  firstTimeLoggedIn?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  pendingVerificationEmail: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isFirstLogin: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    confirm_password: string;
    role: "PATIENT" | "DOCTOR";
  }) => Promise<void>;
  verifyEmailOtp: (payload: { email: string; otp: string }) => Promise<void>;
  completeFirstLogin: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setPendingVerificationEmail: (email: string | null) => void;
}

const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      pendingVerificationEmail: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      isFirstLogin: false,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post("/auth/login", { email, password });
          const { user, accessToken, refreshToken, isFirstLogin } =
            parseAuthResponse(data);

          if (!accessToken) {
            throw new Error("Missing accessToken in login response.");
          }

          setAccessToken(accessToken);
          setRefreshToken(refreshToken ?? null);

          set({
            user,
            accessToken,
            refreshToken: refreshToken ?? null,
            isAuthenticated: true,
            isFirstLogin,
            isLoading: false,
          });
        } catch (err) {
          let message = "Invalid credentials. Please try again.";
          if (axios.isAxiosError(err)) {
            message =
              err.response?.data?.message ??
              err.response?.data?.error ??
              message;
          }
          set({ error: message, isLoading: false, isAuthenticated: false });
          throw err;
        }
      },

      signup: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          await api.post("/auth/register", payload);
          set({ isLoading: false, pendingVerificationEmail: payload.email });
        } catch (err) {
          let message = "Signup failed. Please try again.";
          if (axios.isAxiosError(err)) {
            message =
              err.response?.data?.message ??
              err.response?.data?.error ??
              message;
          }
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      verifyEmailOtp: async ({ email, otp }) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post("/auth/verify-email", { email, otp });
          const { user, accessToken, refreshToken, isFirstLogin } =
            parseAuthResponse(data);

          if (!accessToken) {
            throw new Error("Missing accessToken in verification response.");
          }

          setAccessToken(accessToken);
          setRefreshToken(refreshToken ?? null);

          set({
            user,
            accessToken,
            refreshToken: refreshToken ?? null,
            isAuthenticated: true,
            isFirstLogin,
            pendingVerificationEmail: null,
            isLoading: false,
          });
        } catch (err) {
          let message = "Verification failed. Please try again.";
          if (axios.isAxiosError(err)) {
            message =
              err.response?.data?.message ??
              err.response?.data?.error ??
              message;
          }
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      completeFirstLogin: async () => {
        await api.post("/auth/complete-first-login");
        set((state) => ({
          isFirstLogin: false,
          user: state.user
            ? { ...state.user, firstTimeLoggedIn: false }
            : null,
        }));
      },

      logout: () => {
        disconnectSocket();

        setAccessToken(null);
        setRefreshToken(null);
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          pendingVerificationEmail: null,
          isAuthenticated: false,
          isFirstLogin: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
      setPendingVerificationEmail: (email) =>
        set({ pendingVerificationEmail: email }),
    }),
    {
      name: "auth-storage",
      // Only persist user + token; keep transient state out of storage
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        isFirstLogin: state.isFirstLogin,
        pendingVerificationEmail: state.pendingVerificationEmail,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setAccessToken(state.accessToken);
          if (state.refreshToken) setRefreshToken(state.refreshToken);
          return;
        }
        // Stale session: flagged logged-in but no token
        if (state?.isAuthenticated) {
          useAuthStore.setState({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
          });
        }
      },
    }
  )
);

export default useAuthStore;
