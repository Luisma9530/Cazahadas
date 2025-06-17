import { create } from 'zustand'
import { CardUnity } from '../@types/Card'

type CardStore = {
  selectedCard: CardUnity | null
  hoveredCard: CardUnity | null
  setSelectedCard: (card: CardUnity | null) => void
  setHoveredCard: (card: CardUnity | null) => void
  resetSelectedCard: () => void
}

const useCardStore = create<CardStore>((set) => ({
  selectedCard: null,
  hoveredCard: null,
  setHoveredCard: (card) => set({ hoveredCard: card }),
  setSelectedCard: (card) => set({ selectedCard: card }),
  resetSelectedCard: () => set({ selectedCard: null }),
  resetStore: () => set({ selectedCard: null }),  
}))

export default useCardStore
