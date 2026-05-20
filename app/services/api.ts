import { QueryClient } from "@tanstack/react-query";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

interface ErrorResponseData {
  error: string;
  success: boolean;
}

export type LogoutReason = "expired" | "user" | "forced" | "unknown";

const nodeEnv = process.env.NODE_ENV;

// Base URL for API requests, determined by environment variables or defaults
// const baseURL = "https://expense-tracker-api-1-hkrb.onrender.com/api";

const baseURL =
  nodeEnv === "production"
    ? (process.env.NEXT_PUBLIC_API_BASE_URL_PROD ??
      process.env.NEXT_PUBLIC_API_BASE_URL)
    : (process.env.NEXT_PUBLIC_API_BASE_URL_LOCAL ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      "http://localhost:4000/api");

const api = axios.create({
  baseURL,
});

// track retries per request to avoid infinite loops
type ExtReq = AxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

// helper: decide when to treat 401 as final
const isFinal401 = (
  responseData?: ErrorResponseData | Record<string, unknown>,
) => {
  // If backend explicitly says "token expired" treat as final. Otherwise allow one automatic retry.
  if (!responseData) return false;
  const obj = responseData as Record<string, unknown>;
  const err = String(obj["error"] ?? obj["message"] ?? "").toLowerCase();
  return (
    err.includes("token expired") ||
    err.includes("expired") ||
    err.includes("invalid refresh")
  );
};

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponseData | Record<string, unknown>>) => {
    const originalRequest = (error.config as ExtReq) || ({} as ExtReq);
    const responseData = error?.response?.data as
      | ErrorResponseData
      | Record<string, unknown>
      | undefined;

    // If not a 401 just reject
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // If no token exists at all, emit unauthorized and reject
    const token = Cookies.get("token");
    if (!token) {
      Cookies.remove("token");
      const requestUrl = originalRequest.url ?? "";
      if (requestUrl.includes("/users/login")) {
        return Promise.reject(error);
      }
      httpLogout("expired");
      return Promise.reject(error);
    }

    // If backend explicitly says token expired, treat as final and log out
    if (isFinal401(responseData)) {
      Cookies.remove("token");
      httpLogout("expired");
      return Promise.reject(new Error("Session expired. Please login again."));
    }

    // Allow one automatic retry for transient 401s (race conditions / timing)
    originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
    if (originalRequest._retryCount <= 1 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // retry the same request once with existing token
        return api(originalRequest);
      } catch {
        // fall through to remove token below
      }
    }

    // if we get here, retry didn't resolve the issue -> remove token and emit unauthorized
    Cookies.remove("token");
    httpLogout("expired");
    return Promise.reject(new Error("Unauthorized. Redirecting to login."));
  },
);

// small registration API so the app can provide a QueryClient and a logout action
let queryClient: QueryClient | null = null;
let logoutHandler: ((reason: LogoutReason) => void) | null = null;

export const registerQueryClient = (qc: QueryClient) => {
  queryClient = qc;
};

export function registerLogoutHandler(handler: (reason: LogoutReason) => void) {
  logoutHandler = handler;
  return () => {
    if (logoutHandler === handler) logoutHandler = null;
  };
}

export function triggerLogout(reason: LogoutReason = "unknown") {
  logoutHandler?.(reason);
}

export const httpLogout = (reason: LogoutReason) => {
  // cancel ongoing queries and remove cached server state
  if (queryClient) {
    try {
      queryClient.cancelQueries();
      // remove all queries (unmounts cached data)
      queryClient.removeQueries();
      // optional: reset mutation/query state
      queryClient.resetQueries();
    } catch {
      // ignore if QueryClient methods aren't available
    }
  }

  // handling of clearing tokens, redirecting, etc. in the app query provider
  if (logoutHandler) {
    logoutHandler(reason);
    return;
  }

  // fallback: clear cookie and redirect to login
  if (typeof window !== "undefined") {
    try {
      Cookies.remove("token");
    } catch {
      // ignore if cookie.remove not available
    }
    window.location.href = "/login";
  }
};

export default api;
