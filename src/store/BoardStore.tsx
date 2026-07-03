import { create } from 'zustand'
import { Tile } from '../@types/Tile'

type BoardStore = {
  board: Tile[][]
  setBoard: (board: Tile[][]) => void
  resetStore: () => void
  clearDeckAndMagic: () => void
  resetVariableX: () => void
  endBattle: () => void
}

//MATRIZ 3x4 ACTUALIZADA
const initialBoard: Tile[][] = new Array(3).fill(null).map((_, rowIndex) =>
  new Array(5).fill(null).map((_, colIndex) => {
    //FILA CENTRAL: Hadas en juego y variable X
    if (rowIndex === 1) {
      if (colIndex === 0 || colIndex === 1 || colIndex === 2) {
        return { type: 'fairy', marked: false, card: null, captured: false, placedByPlayerOne: null } // Hadas en juego
      }
      if (colIndex === 3) {
        return { type: 'variableX', value: 0 }
      }
      if (colIndex === 4) return { type: 'magic', owner: 'playerOne', cards: [] } // Magias usadas por el rival
    }

    //FILA SUPERIOR (rival): Baraja, hadas capturadas, descartes y magias
    if (rowIndex === 0) {
      if (colIndex === 0) return { type: 'deck', owner: 'playerTwo', cards: [] } // Baraja del rival
      if (colIndex === 1) return { type: 'capturedFairies', owner: 'playerTwo', cards: [] } // Hadas capturadas por el rival
      if (colIndex === 2) return { type: 'discard', owner: 'playerTwo', cards: [] } // Descartes del rival
    }

    //FILA INFERIOR (jugador): Baraja, hadas capturadas, descartes y magias
    if (rowIndex === 2) {
      if (colIndex === 0) return { type: 'deck', owner: 'playerOne', cards: [] } // Tu baraja
      if (colIndex === 1) return { type: 'capturedFairies', owner: 'playerOne', cards: [] } // Tus hadas capturadas
      if (colIndex === 2) return { type: 'discard', owner: 'playerOne', cards: [] } // Tus descartes
    }

    //Casillas vacías
    return { type: 'empty', card: null }
  })
)

/**
 * Store que mantiene el estado del tablero de juego.
 * Gestiona la matriz 3x5 de casillas que representa el tablero completo,
 * incluyendo las hadas, la variable X, las zonas de magia, defensa,
 * captura y descarte de ambos jugadores.
 */
const useBoardStore = create<BoardStore>((set, get) => ({
  board: initialBoard,

  /**
   * Reemplaza el estado completo del tablero con el valor recibido.
   *
   * @param {Tile[][]} board - Nuevo estado del tablero.
   */
  setBoard: (board) => set({ board }),

  /**
   * Restablece el tablero a su estado inicial, eliminando todas las cartas
   * colocadas y restaurando los valores por defecto de todas las casillas.
   */
  resetStore: () => set({ board: initialBoard }),

  /**
   * Vacía las cartas de todas las casillas de tipo deck y magic del tablero.
   * Se invoca al finalizar una batalla para limpiar las cartas defensivas
   * y mágicas jugadas durante el combate.
   */
  clearDeckAndMagic: () => {
    const currentBoard = get().board
    const updatedBoard = currentBoard.map(row =>
      row.map(tile => {
        if (tile.type === 'deck' || tile.type === 'magic') {
          return { ...tile, cards: [] }
        }
        return tile
      })
    )
    set({ board: updatedBoard })
  },

  /**
   * Restablece el valor de la variable X a 0.
   * Se invoca al finalizar una batalla para preparar el tablero para
   * el siguiente combate.
   */
  resetVariableX: () => {
    const currentBoard = get().board
    const updatedBoard = currentBoard.map((row, rowIndex) =>
      row.map((tile, colIndex) => {
        if (rowIndex === 1 && colIndex === 3 && tile.type === 'variableX') {
          return { ...tile, value: 0 }
        }
        return tile
      })
    )
    set({ board: updatedBoard })
  },

  /**
   * Combina las operaciones de clearDeckAndMagic y resetVariableX en una
   * única acción atómica. Vacía las casillas de deck y magic y restablece
   * la variable X a 0 en una sola actualización del store.
   */
  endBattle: () => {
    const currentBoard = get().board
    const updatedBoard = currentBoard.map((row, rowIndex) =>
      row.map((tile, colIndex) => {
        // Limpiar deck y magic
        if (tile.type === 'deck' || tile.type === 'magic') {
          return { ...tile, cards: [] }
        }
        // Resetear variable X
        if (rowIndex === 1 && colIndex === 3 && tile.type === 'variableX') {
          return { ...tile, value: 0 }
        }
        return tile
      })
    )
    set({ board: updatedBoard })
  },
}))

export default useBoardStore