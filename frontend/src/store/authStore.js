import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/axios";

export const useAuthStore = create(
  persist(
    (set) => ({
      user:  null,
      token: null,

      login: async (email, password) => {
        // 1. Obtenir le token JWT
        const tokenRes = await api.post("/auth/token/", { email, password });
        const { access } = tokenRes.data;

        // 2. Stocker le token
        localStorage.setItem("access_token", access);

        // 3. Récupérer les infos de l'utilisateur connecté
        const userRes = await api.get("/users/me/", {
          headers: { Authorization: `Bearer ${access}` },
        });

        set({ token: access, user: userRes.data });
      },

      logout: () => {
        localStorage.removeItem("access_token");
        set({ token: null, user: null });
      },

      isAuthenticated: () => !!useAuthStore.getState().token,
    }),
    { name: "auth-storage" }
  )
);