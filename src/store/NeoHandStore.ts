import { create } from "zustand";
import { CardInfo, CardUnity, CardType } from "../@types/Card";
import { deckCards } from "../utils/deck";

let index = 0;

type HandStore = {
  deck: CardInfo[];
  playerCards: CardUnity[];
  discardPile: CardUnity[];
  placeCard: (card: CardUnity) => void;
  discardCard: (card: CardUnity) => void;
  drawCard: (isBattle: boolean) => void;
  resetStore: () => void;
};

const useNeoHandStore = create<HandStore>((set) => ({
  deck: [...deckCards],
  playerCards: [] as CardUnity[],
  placeCard: (card) => {
    set((state) => ({
      playerCards: state.playerCards.filter((c) => c.id !== card.id),
    }));
    return;
  },
  discardPile: [] as CardUnity[],
  discardCard: (card) => {
    set((state) => ({
      playerCards: state.playerCards.filter((c) => c.id !== card.id),
      discardPile: [...state.discardPile, card],
    }))
  },
  drawCard: (isBattle: boolean) => { // Esta función se encarga de robar una carta del mazo y agregarla a la mano del jugador
    set((state) => {
      if (isBattle) return { playerCards: state.playerCards }; // No robar si es batalla

      let newDeck = [...state.deck];
      const newHand = [...state.playerCards];

      if (newDeck.length === 0 && newHand.length === 0) {
        newDeck = [...deckCards]; // Reiniciar mazo al estado inicial
      }

      while (newDeck.length > 0 && newHand.length < 7) {
        const randomIndex = Math.floor(Math.random() * newDeck.length);
        const [drawnCard] = newDeck.splice(randomIndex, 1);
        newHand.push({ ...drawnCard, id: index++ });
      }

      const sortedHand = newHand.sort((a, b) => {
        const typeOrder = {
          [CardType.CATCH]: 0,
          [CardType.SHIELD]: 1,
          [CardType.MAGIC]: 2
        };

        return typeOrder[a.type] - typeOrder[b.type];
      });

      return {
        deck: newDeck,
        playerCards: sortedHand,
      };
    });
  },
  resetStore: () => {
    index = 0;
    return set({
      playerCards: [] as CardUnity[],
      deck: [...deckCards],
      discardPile: [] as CardUnity[],
    });
  },
}));

export default useNeoHandStore;
