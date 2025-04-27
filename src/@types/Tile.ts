import { CardInfo } from './Card'

export type Tile =
  | {
      type: 'fairy' // Casillas con hadas
  
      card: CardInfo | null

      captured: boolean // Indica si la hada ha sido capturada o no

      marked: boolean // Indica si la hada ha sido marcada o no

      placedByPlayerOne: boolean | null // Indica si la hada fue colocada por el jugador 1 o 2
    }
  | {
      type: 'variableX' // Casilla de la variable X
      value: number
    }
  | {
      type: 'deck'| "capturedFairies" | 'discard' | 'magic'
      owner: 'playerOne' | 'playerTwo'
      cards: CardInfo[]
    }
  | {
      type: 'empty' // Casillas sin función especial
      card: CardInfo | null
    }
