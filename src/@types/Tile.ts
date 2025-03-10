import { CardInfo } from './Card'

export type Tile =
  | {
      type: 'fairy' // Casillas con hadas
      playerOnePoints: number
      playerTwoPoints: number
      card: CardInfo | null
    }
  | {
      type: 'variableX' // Casilla de la variable X
      value: number
    }
  | {
      type: 'deck'| "capturedFairies" | 'discard' | 'magic'  // Baraja, descartes y magias
      owner: 'playerOne' | 'playerTwo'
      cards: CardInfo[]
    }
  | {
      type: 'empty' // Casillas sin función especial
      playerOnePoints: number
      playerTwoPoints: number
      playerOnePawns: number
      playerTwoPawns: number
      card: CardInfo | null
    }
