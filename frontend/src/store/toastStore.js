import { create } from "zustand";

export const useToastStore = create((set) => ({
  toasts: [],

  toast: (message, type = "info", duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));
  },

  success: (message) => useToastStore.getState().toast(message, "success"),
  error:   (message) => useToastStore.getState().toast(message, "error"),
  info:    (message) => useToastStore.getState().toast(message, "info"),
  warning: (message) => useToastStore.getState().toast(message, "warning"),

  remove: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));