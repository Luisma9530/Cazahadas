import { create } from "zustand";

interface BackgroundState {
  background: string;
  setBackground: (bg: string) => void;
  resetBackground: () => void;
}

const useBackgroundStore = create<BackgroundState>((set) => ({
  background: "none",
  setBackground: (bg: string) => set({ background: `url(${bg})` }),
  resetBackground: () => set({ background: "none" }),
}));

export default useBackgroundStore;
