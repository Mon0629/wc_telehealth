import axios from "axios";

type ApiErrorBody = {
  message?: string;
  error?: string;
  detail?: string;
  errors?: Array<{ message?: string; msg?: string } | string>;
};

/** Extracts a user-facing message from a failed API response. */
export function getApiErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorBody | string | undefined;

    if (typeof data === "string" && data.trim()) {
      return data.trim();
    }

    if (data && typeof data === "object") {
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message.trim();
      }
      if (typeof data.error === "string" && data.error.trim()) {
        return data.error.trim();
      }
      if (typeof data.detail === "string" && data.detail.trim()) {
        return data.detail.trim();
      }
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const first = data.errors[0];
        if (typeof first === "string" && first.trim()) return first.trim();
        if (first && typeof first === "object") {
          const nested = first.message ?? first.msg;
          if (typeof nested === "string" && nested.trim()) return nested.trim();
        }
      }
    }
  }

  if (err instanceof Error && err.message.trim()) {
    return err.message.trim();
  }

  return fallback;
}
