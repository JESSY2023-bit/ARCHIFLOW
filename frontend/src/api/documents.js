import api from "./axios";

// ── Documents ──────────────────────────────────────────────────────────────
export const getDocuments = (params) =>
  api.get("/documents/", { params });

export const getDocument = (id) =>
  api.get(`/documents/${id}/`);

export const createDocument = (formData) =>
  api.post("/documents/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateDocument = (id, data) =>
  api.patch(`/documents/${id}/`, data);

export const deleteDocument = (id) =>
  api.delete(`/documents/${id}/`);

// ── Versions ───────────────────────────────────────────────────────────────
export const createVersion = (id, formData) =>
  api.post(`/documents/${id}/versions/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const restoreVersion = (docId, versionId) =>
  api.post(`/documents/${docId}/versions/${versionId}/restore/`);

// ── Catégories ─────────────────────────────────────────────────────────────
export const getCategories = () =>
  api.get("/documents/categories/");

export const getActivityLogs = (limit = 10) =>
  api.get("/documents/activity/", { params: { limit } });