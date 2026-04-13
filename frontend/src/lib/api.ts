import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      const requestUrl = String(error?.config?.url ?? "");
      const isAuthEndpoint =
        requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register");

      if (!isAuthEndpoint) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");

        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.startsWith("/login") || currentPath.startsWith("/signup");

        if (!isAuthPage) {
          window.location.assign("/login");
        }
      }
    }

    return Promise.reject(error);
  }
);
