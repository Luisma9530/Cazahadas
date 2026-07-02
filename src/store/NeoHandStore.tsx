import { create } from "zustand";
import { CardInfo, CardUnity, CardType } from "../@types/Card";
import { deckCards } from "../utils/Deck";

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

/**
 * Store que gestiona la mano de cartas del jugador local.
 * Mantiene el mazo disponible, las cartas en mano y la pila de descarte.
 * Implementa la lógica de robo aleatorio de cartas, ordenación por tipo,
 * reinicio del mazo cuando se agota, y asignación de identificadores únicos
 * a cada instancia de carta para permitir su trazabilidad individual.
 */
const useNeoHandStore = create<HandStore>((set) => ({
  deck: [...deckCards],
  playerCards: [] as CardUnity[],

  /**
   * Elimina una carta de la mano del jugador al ser colocada en el tablero.
   *
   * @param {CardUnity} card - Carta a eliminar de la mano, identificada por su id.
   */
  placeCard: (card) => {
    set((state) => ({
      playerCards: state.playerCards.filter((c) => c.id !== card.id),
    }));
    return;
  },
  discardPile: [] as CardUnity[],

  /**
   * Mueve una carta de la mano a la pila de descarte.
   *
   * @param {CardUnity} card - Carta a descartar, identificada por su id.
   */
  discardCard: (card) => {
    set((state) => ({
      playerCards: state.playerCards.filter((c) => c.id !== card.id),
      discardPile: [...state.discardPile, card],
    }))
  },

  /**
   * Roba cartas del mazo aleatoriamente hasta completar 7 en la mano.
   * Si el mazo se agota durante el robo, se reinicia desde el mazo original.
   * En estado de batalla no roba cartas y devuelve la mano sin cambios.
   * Las cartas robadas reciben un identificador único incremental y la mano
   * resultante se ordena por tipo: captura, defensa y magia.
   *
   * @param {boolean} isBattle - Indica si la partida está en estado de batalla.
   *   Si es true, la función no realiza ninguna acción.
   */
  drawCard: (isBattle: boolean) => {
    set((state) => {
      if (isBattle) return { playerCards: state.playerCards };

      let newDeck = [...state.deck];
      const newHand = [...state.playerCards];

      // Rellenar la mano hasta 7 cartas
      while (newHand.length < 7) {
        // Si el mazo está vacío, reiniciarlo
        if (newDeck.length === 0) {
          newDeck = [...deckCards];
        }

        // Si después de reiniciar sigue vacío (no hay cartas disponibles), salir
        if (newDeck.length === 0) break;

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

  /**
   * Restablece el store a su estado inicial, vaciando la mano y la pila
   * de descarte, restaurando el mazo completo y reiniciando el contador
   * de identificadores de carta a 0.
   */
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
