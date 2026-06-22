export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const resolveMediaUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${MEDIA_BASE_URL}${path}`;
};
