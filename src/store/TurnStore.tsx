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

/**
 * Store que gestiona el estado del turno y la fase de batalla de la partida.
 * Controla si es el turno del jugador local, el estado de batalla activo,
 * el primer turno de batalla del defensor, y la visibilidad de los modales
 * de confirmación de batalla y tablas.
 */
const useTurnStore = create<useTurnStore>((set) => ({
  isMyTurn: false,
  isMyFirstTurn: true,
  isBattle: false,
  showBattleModal: false,
  showDrawModal: false,

  /**
   * Activa o desactiva el estado de batalla de la partida.
   *
   * @param {boolean} isBattle - True para activar el estado de batalla,
   *   false para desactivarlo.
   */
  setIsBattle: (isBattle: boolean) => set({ isBattle }),

  /**
   * Alterna el turno activo entre el jugador local y el rival.
   */
  toggleTurn: () => set((state) => ({ isMyTurn: !state.isMyTurn })),

  /**
   * Establece si es el primer turno general de la partida para el jugador local.
   *
   * @param {boolean} value - True si es el primer turno, false en caso contrario.
   */
  setIsMyFirstTurn: (value) => set({ isMyFirstTurn: value }),

  playerSkippedTurn: false,

  /**
   * Actualiza la bandera que indica si el jugador rival saltó su turno
   * en el turno anterior, utilizada para detectar el doble salto consecutivo.
   *
   * @param {boolean} playerSkippedTurn - True si el rival saltó turno.
   */
  setPlayerSkippedTurn: (playerSkippedTurn: boolean) =>
    set(() => ({ playerSkippedTurn: playerSkippedTurn })),

  /**
   * Restablece el store al estado inicial, preparando el sistema para
   * una nueva partida. Desactiva el turno, la batalla, los modales y
   * todas las banderas de estado.
   */
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

  isMyFirstTurnBattle: false,

  /**
   * Establece si es el primer turno de batalla del defensor.
   * Se utiliza para aplicar la regla especial de rendición automática
   * si el defensor salta su primer turno de combate.
   *
   * @param {boolean} value - True si es el primer turno de batalla.
   */
  setIsMyFirstTurnBattle: (value: boolean) => set({ isMyFirstTurnBattle: value }),

  /**
   * Controla la visibilidad del modal de confirmación de batalla
   * que se muestra al defensor cuando el rival intenta capturar un hada.
   *
   * @param {boolean} value - True para mostrar el modal, false para ocultarlo.
   */
  setShowBattleModal: (value: boolean) => set({ showBattleModal: value }),

  /**
   * Controla la visibilidad del modal de confirmación de tablas
   * que se muestra cuando el rival solicita terminar la partida en empate.
   *
   * @param {boolean} value - True para mostrar el modal, false para ocultarlo.
   */
  setShowDrawModal: (value: boolean) => set({ showDrawModal: value }),
}));

export default useTurnStore;
