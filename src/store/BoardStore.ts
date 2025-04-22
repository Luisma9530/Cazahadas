import { create } from 'zustand'
import { Tile } from '../@types/Tile'

type BoardStore = {
  board: Tile[][]
  setBoard: (board: Tile[][]) => void
  resetStore: () => void
}

//MATRIZ 3x4 ACTUALIZADA
const initialBoard: Tile[][] = new Array(3).fill(null).map((_, rowIndex) =>
  new Array(4).fill(null).map((_, colIndex) => {
    //FILA CENTRAL: Hadas en juego y variable X
    if (rowIndex === 1) {
      if (colIndex === 0 || colIndex === 1 || colIndex === 2) {
        return { type: 'fairy', playerOnePoints: 0, playerTwoPoints: 0, playerOnePawns: 0, playerTwoPawns: 0, card: null, captured: false } // Hadas en juego
      }
      if (colIndex === 3) {
        return { type: 'variableX', value: 0 }
      }
    }

    //FILA SUPERIOR (rival): Baraja, hadas capturadas, descartes y magias
    if (rowIndex === 0) {
      if (colIndex === 0) return { type: 'deck', owner: 'playerTwo', cards: [] } // Baraja del rival
      if (colIndex === 1) return { type: 'capturedFairies', owner: 'playerTwo', cards: [] } // Hadas capturadas por el rival
      if (colIndex === 2) return { type: 'discard', owner: 'playerTwo', cards: [] } // Descartes del rival
      if (colIndex === 3) return { type: 'magic', owner: 'playerTwo', cards: [] } // Magias usadas por el rival
    }

    //FILA INFERIOR (jugador): Baraja, hadas capturadas, descartes y magias
    if (rowIndex === 2) {
      if (colIndex === 0) return { type: 'deck', owner: 'playerOne', cards: [] } // Tu baraja
      if (colIndex === 1) return { type: 'capturedFairies', owner: 'playerOne', cards: [] } // Tus hadas capturadas
      if (colIndex === 2) return { type: 'discard', owner: 'playerOne', cards: [] } // Tus descartes
      if (colIndex === 3) return { type: 'magic', owner: 'playerOne', cards: [] } // Tus magias usadas
    }

    //Casillas vacías
    return { type: 'empty', playerOnePoints: 0, playerTwoPoints: 0, playerOnePawns: 0, playerTwoPawns: 0, card: null }
  })
)

const useBoardStore = create<BoardStore>((set) => ({
  board: initialBoard,
  setBoard: (board) => set({ board }),
  resetStore: () => set({ board: initialBoard }),
}))

export default useBoardStore
