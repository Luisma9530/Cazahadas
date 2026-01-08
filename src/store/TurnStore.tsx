import { create } from "zustand";

type useTurnStore = {
  isMyTurn: boolean;
  isMyFirstTurn: boolean;
  toggleTurn: () => void;
  setIsMyFirstTurn: (value: boolean) => void;
  playerSkippedTurn: boolean;
  setPlayerSkippedTurn: (playerSkippedTurn: boolean) => void;
  resetStore: () => void;
  isBattle: boolean;
  isMyFirstTurnBattle: boolean;
  setIsBattle: (isBattle: boolean) => void;
  setIsMyFirstTurnBattle: (value: boolean) => void;
  showBattleModal: boolean;
  setShowBattleModal: (value: boolean) => void;
  showDrawModal: boolean;
  setShowDrawModal: (value: boolean) => void;
};

const useTurnStore = create<useTurnStore>((set) => ({
  isMyTurn: false,
  isMyFirstTurn: true,
  isBattle: false,
  showBattleModal: false,
  showDrawModal: false,
  setIsBattle: (isBattle: boolean) => set({ isBattle }),
  toggleTurn: () => set((state) => ({ isMyTurn: !state.isMyTurn })),
  setIsMyFirstTurn: (value) => set({ isMyFirstTurn: value }),
  playerSkippedTurn: false,
  setPlayerSkippedTurn: (playerSkippedTurn: boolean) =>
    set(() => ({ playerSkippedTurn: playerSkippedTurn })),
  resetStore: () =>
    set({
      isMyTurn: false,
      isMyFirstTurn: true,
      playerSkippedTurn: false,
      isBattle: false,
      showBattleModal: false,
      showDrawModal: false,
      isMyFirstTurnBattle: false
    }),
  isMyFirstTurnBattle: true,
  setIsMyFirstTurnBattle: (value: boolean) => set({ isMyFirstTurnBattle: value }),
  setShowBattleModal: (value: boolean) => set({ showBattleModal: value }),
  setShowDrawModal: (value: boolean) => set({ showDrawModal: value }),
}));

export default useTurnStore;
