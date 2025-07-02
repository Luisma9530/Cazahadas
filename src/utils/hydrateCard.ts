import { CardInfo, CardType } from "../@types/Card";
import { deckCards } from "./deck";

type CardKey = `${CardType}-${string}`;

// Mapeamos el mazo original para poder rehidratar funciones luego
const cardMap: Record<CardKey, CardInfo> = deckCards.reduce((acc, card) => {
    const key = `${card.type}-${card.name}` as CardKey;
    acc[key] = card;
    return acc;
}, {} as Record<CardKey, CardInfo>);

// Función para rehidratar una carta plana
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
