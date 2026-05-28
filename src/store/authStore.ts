import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/axios";
import axios from "axios";

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  phone?: string;
  emailVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
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
  logout: () => void;
  clearError: () => void;
}

const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post("/auth/login", { email, password });

          const accessToken: string | undefined =
            data.accessToken ?? data.access_token ?? data.token;
          const refreshToken: string | undefined =
            data.refreshToken ?? data.refresh_token;

          const rawUser = data.user;
          const user: User | null = rawUser
            ? {
                id: rawUser.id,
                email: rawUser.email,
                firstName: rawUser.first_name,
                lastName: rawUser.last_name,
                role: rawUser.role,
                phone: rawUser.phone,
                emailVerified: rawUser.email_verified,
                isActive: rawUser.is_active,
                createdAt: rawUser.created_at,
                updatedAt: rawUser.updated_at,
              }
            : null;

          if (!accessToken) {
            throw new Error("Missing accessToken in login response.");
          }

          // Sync to localStorage so the axios interceptor can read it
          localStorage.setItem("accessToken", accessToken);
          if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

          set({
            user,
            accessToken,
            refreshToken: refreshToken ?? null,
            isAuthenticated: true,
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
          set({ isLoading: false });
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

      logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      // Only persist user + token; keep transient state out of storage
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
