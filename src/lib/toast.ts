import { create } from "zustand";

type Toast = { id: number; message: string; kind: "error" | "info" };

type ToastState = {
  toast: Toast | null;
  show: (message: string, kind: Toast["kind"]) => void;
  hide: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (message, kind) => set({ toast: { id: Date.now(), message, kind } }),
  hide: () => set({ toast: null }),
}));

export const toast = {
  error: (message: string) => useToastStore.getState().show(message, "error"),
  info: (message: string) => useToastStore.getState().show(message, "info"),
};
