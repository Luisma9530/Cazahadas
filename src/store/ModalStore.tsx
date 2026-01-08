import { create } from "zustand";
import turnSound from "../assets/sounds/turn.mp3";
const turnAudio = new Audio(turnSound);

type useModalStoreType = {
  gameStartModal: boolean;
  toggleGameStartModal: () => void;
  endGameModal: boolean;
  toggleEndGameModal: () => void;
  turnModal: boolean;
  toggleTurnModal: () => void;
  resetStore: () => void;
  battleModal: boolean;
  toggleBattleModal: () => void;
  battleEndModal: boolean;
  toggleBattleEndModal: () => void;
};

export const useModalStore = create<useModalStoreType>((set) => ({
  gameStartModal: false,
  toggleGameStartModal: () => {
    return set((state) => ({ gameStartModal: !state.gameStartModal }));
  },
  endGameModal: false,
  toggleEndGameModal: () =>
    set((state) => ({ endGameModal: !state.endGameModal })),
  turnModal: false,
  toggleTurnModal: () => {
    return set((state) => {
      if (!state.turnModal) {
        turnAudio.pause();
        turnAudio.currentTime = 0;
        turnAudio.volume = 0.4;
        turnAudio.play();
      }
      return { turnModal: !state.turnModal };
    });
  },
  resetStore: () =>
    set({ gameStartModal: false, endGameModal: false, turnModal: false, battleModal: false, battleEndModal: false }),
  battleModal: false,
  toggleBattleModal: () =>
    set((state) => ({ battleModal: !state.battleModal })),
  battleEndModal: false,
  toggleBattleEndModal: () =>
    set((state) => ({ battleEndModal: !state.battleEndModal })),
}));
