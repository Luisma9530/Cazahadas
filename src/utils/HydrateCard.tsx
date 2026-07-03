import { CardInfo, CardType } from "../@types/Card";
import { deckCards } from "./Deck";

type CardKey = `${CardType}-${string}`;

/**
 * Mapa de cartas del mazo indexado por una clave compuesta de tipo y nombre.
 * Se construye una única vez al cargar el módulo a partir de deckCards y
 * se utiliza en hydrateCard para recuperar las funciones originales de cada
 * carta tras la deserialización desde un evento Socket.IO.
 */
const cardMap: Record<CardKey, CardInfo> = deckCards.reduce((acc, card) => {
    const key = `${card.type}-${card.name}` as CardKey;
    acc[key] = card;
    return acc;
}, {} as Record<CardKey, CardInfo>);

/**
 * Restaura las funciones de una carta tras su deserialización desde un
 * evento Socket.IO. Las funciones JavaScript no se preservan al serializar
 * objetos a JSON, por lo que las cartas recibidas del servidor llegan sin
 * sus funciones operation ni defenseCondition. Esta función recupera la
 * función defenseCondition para cartas de tipo SHIELD buscando la carta
 * original en cardMap mediante la clave tipo-nombre. Las cartas mágicas
 * no requieren rehidratación porque su función operation se calcula en el
 * cliente antes de emitir el evento al servidor. Las cartas de captura
 * tampoco requieren rehidratación ya que no tienen funciones asociadas.
 *
 * @param {Partial<CardInfo>} card - Carta deserializada recibida del servidor,
 *   sin funciones. Si el objeto está vacío, se devuelve tal cual.
 * @returns {CardInfo} Carta con la función defenseCondition restaurada si es
 *   de tipo SHIELD y existe en el mapa, o la carta original sin modificaciones
 *   en cualquier otro caso.
 */
export function hydrateCard(card: Partial<CardInfo>): CardInfo {
    if (Object.keys(card).length === 0) {
        return {} as CardInfo;
    }

    const key = `${card.type}-${card.name}` as CardKey;
    const original = cardMap[key];

    if (!original) {
        return card as CardInfo;
    }

    // Solo rehidratamos funciones si es de tipo SHIELD
    if (original.type === CardType.SHIELD) {
        return {
            ...card,
            defenseCondition: original.defenseCondition,
        } as CardInfo;
    }

    return card as CardInfo;
}
