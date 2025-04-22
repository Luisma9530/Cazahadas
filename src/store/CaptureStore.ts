import { create } from "zustand";

type PendingCapture = {
  fairyIndex: number;
  placedByPlayerOne: boolean;
};

type CaptureStore = {
  pendingCapture: PendingCapture | null;
  setPendingCapture: (capture: PendingCapture) => void;
  clearPendingCapture: () => void;
};

const useCaptureStore = create<CaptureStore>((set) => ({
  pendingCapture: null,
  setPendingCapture: (capture) => set({ pendingCapture: capture }),
  clearPendingCapture: () => set({ pendingCapture: null }),
}));

export default useCaptureStore;
