import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fmsp_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("fmsp_token");
      localStorage.removeItem("fmsp_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Separate instance for /uploads/* (protected media), which lives at the
// API origin but outside the /api prefix. This sends the normal
// Authorization header (so no token ever needs to sit in a URL for the
// primary in-page image/video previews), but deliberately does NOT
// auto-redirect to /login on a 401/403 - a single failed thumbnail
// shouldn't log the whole session out; ProtectedMedia just shows a
// broken-media state instead.
export const mediaApi = axios.create({ baseURL: API_ORIGIN });
mediaApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("fmsp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
