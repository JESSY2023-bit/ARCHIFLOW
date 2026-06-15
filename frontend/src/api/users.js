import api from "./axios";

export const getUsers = (params) => api.get("/users/", { params });
export const getUser  = (id)         => api.get(`/users/${id}/`);
export const createUser = (data)     => api.post("/users/", data);
export const updateUser = (id, data) => api.patch(`/users/${id}/`, data);
export const deleteUser = (id)       => api.delete(`/users/${id}/`);
export const getMe      = ()         => api.get("/users/me/");
export const inviteUser     = (data)  => api.post("/users/invite/", data);
export const setPassword    = (data)  => api.post("/users/set-password/", data);
export const validateToken  = (token) => api.get(`/users/validate-token/${token}/`);
export const getInvitations = ()      => api.get("/users/invitations/");