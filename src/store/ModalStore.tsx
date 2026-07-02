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

/**
 * Store que controla la visibilidad de los modales de la interfaz de juego.
 * Gestiona los modales de inicio de partida, cambio de turno, inicio de
 * batalla, fin de batalla y fin de partida. El modal de turno reproduce
 * un efecto de sonido al activarse.
 */
export const useModalStore = create<useModalStoreType>((set) => ({
  gameStartModal: false,

  /**
   * Alterna la visibilidad del modal de inicio de partida.
   */
  toggleGameStartModal: () => {
    return set((state) => ({ gameStartModal: !state.gameStartModal }));
  },

  endGameModal: false,

  /**
   * Alterna la visibilidad del modal de fin de partida.
   */
  toggleEndGameModal: () =>
    set((state) => ({ endGameModal: !state.endGameModal })),

  turnModal: false,

  /**
   * Alterna la visibilidad del modal de cambio de turno.
   * Al activarse, reproduce el efecto de sonido de turno reiniciando
   * la posición de reproducción para garantizar que suene desde el inicio.
   */
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

  /**
   * Restablece todos los modales a su estado inicial ocultándolos.
   */
  resetStore: () =>
    set({ gameStartModal: false, endGameModal: false, turnModal: false, battleModal: false, battleEndModal: false }),

  battleModal: false,

  /**
   * Alterna la visibilidad del modal de inicio de batalla.
   */
  toggleBattleModal: () =>
    set((state) => ({ battleModal: !state.battleModal })),

  battleEndModal: false,

  /**
   * Alterna la visibilidad del modal de fin de batalla.
   */
  toggleBattleEndModal: () =>
    set((state) => ({ battleEndModal: !state.battleEndModal })),
}));
