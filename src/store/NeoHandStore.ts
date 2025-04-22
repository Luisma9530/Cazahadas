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
  drawCard: () => void;
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
  drawCard: () => {
    set((state) => {
      const randomIndex = Math.floor(Math.random() * state.deck.length);
      const [drawnCard] = state.deck.splice(randomIndex, 1);
      return {
        playerCards: [...state.playerCards, { ...drawnCard, id: index++ }],
      };
    });
  },
  drawInitialHand: () =>
    set((state) => ({ 
      playerCards: drawInitialHand(state.deck),
      opponentCards: drawInitialHand(state.opponentDeck),
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
