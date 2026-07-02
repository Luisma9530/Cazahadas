import { create } from 'zustand'
import { CardUnity } from '../@types/Card'
import useTurnStore from './TurnStore' // Ajusta la ruta según tu estructura

type CardStore = {
  selectedCards: CardUnity[]
  hoveredCard: CardUnity | null
  setSelectedCard: (card: CardUnity | null) => void
  setHoveredCard: (card: CardUnity | null) => void
  toggleCardSelection: (card: CardUnity) => void
  resetSelectedCards: () => void
  resetStore: () => void
  isCardSelected: (card: CardUnity) => boolean
}

/**
 * Store que gestiona la selección de cartas de la mano del jugador.
 * Mantiene la lista de cartas seleccionadas y la carta sobre la que
 * se encuentra el cursor. El comportamiento de selección varía según
 * el estado de batalla: en batalla solo se permite una carta seleccionada,
 * fuera de batalla se permite selección múltiple.
 */
const useCardStore = create<CardStore>((set, get) => ({
  selectedCards: [],
  hoveredCard: null,

  /**
   * Establece la carta sobre la que se encuentra el cursor.
   *
   * @param {CardUnity | null} card - Carta en hover o null al salir.
   */
  setHoveredCard: (card) => set({ hoveredCard: card }),

  /**
   * Establece una única carta como seleccionada, independientemente del
   * estado de batalla. Reemplaza cualquier selección previa.
   *
   * @param {CardUnity | null} card - Carta a seleccionar o null para limpiar.
   */
  setSelectedCard: (card) => {
    const { isBattle } = useTurnStore.getState()

    if (isBattle) {
      // En batalla: solo una carta seleccionada (comportamiento original)
      set({ selectedCards: card ? [card] : [] })
    } else {
      // Fuera de batalla: múltiples cartas (usar toggleCardSelection en su lugar)
      set({ selectedCards: card ? [card] : [] })
    }
  },

  /**
   * Alterna el estado de selección de una carta.
   * En estado de batalla aplica selección única: deselecciona si ya estaba
   * seleccionada, selecciona si no lo estaba. Fuera de batalla aplica
   * selección múltiple: añade la carta a la selección si no estaba, o la
   * elimina si ya estaba seleccionada.
   *
   * @param {CardUnity} card - Carta cuyo estado de selección se alterna.
   */
  toggleCardSelection: (card) => {
    const { selectedCards } = get()
    const { isBattle } = useTurnStore.getState()

    if (isBattle) {
      // En batalla: comportamiento de selección única
      const isCurrentlySelected = selectedCards.some(c => c.id === card.id)
      set({ selectedCards: isCurrentlySelected ? [] : [card] })
    } else {
      // Fuera de batalla: comportamiento de selección múltiple
      const isSelected = selectedCards.some(c => c.id === card.id)

      if (isSelected) {
        // Quitar la carta de la selección
        set({
          selectedCards: selectedCards.filter(c => c.id !== card.id)
        })
      } else {
        // Agregar la carta a la selección
        set({
          selectedCards: [...selectedCards, card]
        })
      }
    }
  },

  /**
   * Elimina todas las cartas de la selección actual.
   */
  resetSelectedCards: () => set({ selectedCards: [] }),

  /**
   * Restablece el store a su estado inicial, vaciando tanto la selección
   * de cartas como la carta en hover.
   */
  resetStore: () => set({ selectedCards: [], hoveredCard: null }),

  /**
   * Comprueba si una carta está actualmente seleccionada comparando por id.
   *
   * @param {CardUnity} card - Carta cuyo estado de selección se consulta.
   * @returns {boolean} True si la carta está seleccionada, false en caso contrario.
   */
  isCardSelected: (card) => {
    const { selectedCards } = get()
    return selectedCards.some(c => c.id === card.id)
  }
}))

export default useCardStore