import { create } from "zustand";
import { CardInfo, CardUnity } from "../@types/Card";
import { deckCards } from "../utils/deck";

let index = 0;

function drawInitialHand(initialDeck: CardInfo[]) {
  const hand: CardUnity[] = [];

  for (; index < 7; index++) {
    const randomIndex = Math.floor(Math.random() * initialDeck.length);
    hand.push({ ...initialDeck[randomIndex], id: index });
    initialDeck.splice(randomIndex, 1);
  }

  return hand;
}

type HandStore = {
  deck: CardInfo[];
  opponentDeck: CardInfo[];
  opponentCards: CardUnity[];
  playerCards: CardUnity[];
  discardPile: CardUnity[];
  placeCard: (card: CardUnity) => void;
  discardCard: (card: CardUnity) => void;
  drawCard: (isBattle: boolean) => void;
  drawInitialHand: () => void;
  resetStore: () => void;
};

const useNeoHandStore = create<HandStore>((set) => ({
  deck: [...deckCards],
  playerCards: [] as CardUnity[],
  opponentDeck: [...deckCards],
  opponentCards: [] as CardUnity[],
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

      const newDeck = [...state.deck];
      const newHand = [...state.playerCards];

      while (newDeck.length > 0 && newHand.length < 7) {
        const randomIndex = Math.floor(Math.random() * newDeck.length);
        const [drawnCard] = newDeck.splice(randomIndex, 1);
        newHand.push({ ...drawnCard, id: index++ });
      }

      return {
        deck: newDeck,
        playerCards: newHand,
      };
    });
  },
  drawInitialHand: () =>
    set((state) => ({
      playerCards: drawInitialHand(state.deck),
    })),
  resetStore: () => {
    index = 0;
    return set({
      playerCards: [] as CardUnity[],
      deck: [...deckCards],
      opponentCards: [] as CardUnity[],
      opponentDeck: [...deckCards],
    });
  },
}));

export default useNeoHandStore;
