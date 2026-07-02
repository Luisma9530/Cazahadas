import { create } from "zustand";

/**
 * Enumeración de los posibles resultados de una partida.
 *
 * @enum {string}
 * @property {string} PLAYER1WIN - Victoria del Jugador 1.
 * @property {string} PLAYER2WIN - Victoria del Jugador 2.
 * @property {string} DRAW - Empate entre ambos jugadores.
 * @property {string} NONE - Sin resultado, partida en curso o no iniciada.
 */
export enum Result {
  PLAYER1WIN = "player1win",
  PLAYER2WIN = "player2win",
  DRAW = "draw",
  NONE = "none",
}

type GameStore = {
  amIP1: boolean;
  setAmIP1: (value: boolean) => void;
  gameOver: boolean;
  setGameOver: (value: boolean) => void;
  gameResult: Result;
  setGameResult: (value: Result) => void;
  playerOneName: string;
  setPlayerOneName: (value: string) => void;
  playerTwoName: string;
  setPlayerTwoName: (value: string) => void;
  playerDisconnected: boolean;
  setPlayerDisconnected: (value: boolean) => void;
  resetStore: () => void;
};

/**
 * Store que gestiona el estado general de la partida y la información
 * de los jugadores. Mantiene la identidad del jugador local, el resultado
 * de la partida, los nombres de ambos jugadores y el estado de desconexión.
 */
export const useGameStore = create<GameStore>((set) => ({
  amIP1: false,
  setAmIP1: (value) => set({ amIP1: value }),
  gameOver: false,
  setGameOver: (value) => set({ gameOver: value }),
  gameResult: Result.NONE,
  setGameResult: (value) => set({ gameResult: value }),
  playerOneName: "",
  setPlayerOneName: (value) => set({ playerOneName: value }),
  playerTwoName: "",
  setPlayerTwoName: (value) => set({ playerTwoName: value }),
  playerDisconnected: false,
  setPlayerDisconnected: (value) => set({ playerDisconnected: value }),

  /**
   * Restablece el store al estado inicial, preparando el sistema para
   * una nueva partida. Conserva únicamente la estructura del store sin
   * modificar datos de sesión gestionados por LoginStore.
   */
  resetStore: () =>
    set({
      gameOver: false,
      amIP1: false,
      gameResult: Result.NONE,
      playerOneName: "",
      playerTwoName: "",
      playerDisconnected: false,
    }),
}));
