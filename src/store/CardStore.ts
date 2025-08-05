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

const useCardStore = create<CardStore>((set, get) => ({
  selectedCards: [],
  hoveredCard: null,
  
  setHoveredCard: (card) => set({ hoveredCard: card }),
  
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
  
  resetSelectedCards: () => set({ selectedCards: [] }),
  
  resetStore: () => set({ selectedCards: [], hoveredCard: null }),
  
  isCardSelected: (card) => {
    const { selectedCards } = get()
    return selectedCards.some(c => c.id === card.id)
  }
}))

export default useCardStore