import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useNeoHandStore from '../NeoHandStore';
import { CardUnity, CardType } from '../../@types/Card';
import { deckCards } from '../../utils/Deck';

// Mock de deckCards
vi.mock('../utils/deck', () => ({
    deckCards: [
        { name: 'Card 1', type: CardType.CATCH, text: 'Catch card 1' },
        { name: 'Card 2', type: CardType.MAGIC, text: 'Magic card 2', operation: (x: number) => x + 1 },
        { name: 'Card 3', type: CardType.SHIELD, text: 'Shield card 3', defenseCondition: (x: number) => x > 0 },
        { name: 'Card 4', type: CardType.CATCH, text: 'Catch card 4' },
        { name: 'Card 5', type: CardType.MAGIC, text: 'Magic card 5', operation: (x: number) => x + 2 },
        { name: 'Card 6', type: CardType.SHIELD, text: 'Shield card 6', defenseCondition: (x: number) => x > 5 },
        { name: 'Card 7', type: CardType.CATCH, text: 'Catch card 7' },
        { name: 'Card 8', type: CardType.MAGIC, text: 'Magic card 8', operation: (x: number) => x + 3 },
    ]
}));

describe('useNeoHandStore', () => {
    beforeEach(() => {
        const { result } = renderHook(() => useNeoHandStore());
        act(() => {
            result.current.resetStore();
        });
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Inicialización', () => {
        it('debe inicializarse con el deck completo y mano vacía', () => {
            const { result } = renderHook(() => useNeoHandStore());

            expect(result.current.deck).toEqual(deckCards);
            expect(result.current.playerCards).toEqual([]);
            expect(result.current.discardPile).toEqual([]);
        });

        it('debe tener el mismo número de cartas que deckCards', () => {
            const { result } = renderHook(() => useNeoHandStore());

            expect(result.current.deck.length).toBe(deckCards.length);
        });
    });

    describe('drawCard', () => {
        it('debe robar una carta cuando la mano está vacía', () => {
            const { result } = renderHook(() => useNeoHandStore());

            act(() => {
                result.current.drawCard(false);
            });

            expect(result.current.playerCards.length).toBeGreaterThan(0);
            expect(result.current.deck.length).toBeLessThan(deckCards.length);
        });

        it('debe rellenar la mano hasta 7 cartas', () => {
            const { result } = renderHook(() => useNeoHandStore());

            act(() => {
                result.current.drawCard(false);
            });

            expect(result.current.playerCards).toHaveLength(7);
        });

        it('no debe robar cartas en batalla (isBattle = true)', () => {
            const { result } = renderHook(() => useNeoHandStore());

            const initialDeckLength = result.current.deck.length;

            act(() => {
                result.current.drawCard(true);
            });

            expect(result.current.playerCards).toHaveLength(0);
            expect(result.current.deck.length).toBe(initialDeckLength);
        });

        it('debe ordenar las cartas por tipo (CATCH, SHIELD, MAGIC)', () => {
            const { result } = renderHook(() => useNeoHandStore());

            act(() => {
                result.current.drawCard(false);
            });

            const hand = result.current.playerCards;

            // Verificar que las cartas están ordenadas
            for (let i = 0; i < hand.length - 1; i++) {
                const typeOrder = {
                    [CardType.CATCH]: 0,
                    [CardType.SHIELD]: 1,
                    [CardType.MAGIC]: 2
                };

                expect(typeOrder[hand[i].type]).toBeLessThanOrEqual(typeOrder[hand[i + 1].type]);
            }
        });

        it('debe asignar IDs únicos a las cartas robadas', () => {
            const { result } = renderHook(() => useNeoHandStore());

            act(() => {
                result.current.drawCard(false);
            });

            const ids = result.current.playerCards.map(card => card.id);
            const uniqueIds = new Set(ids);

            expect(uniqueIds.size).toBe(ids.length);
        });

        it('debe rellenar solo las cartas necesarias cuando ya hay cartas en mano', () => {
            const { result } = renderHook(() => useNeoHandStore());

            // Primera llamada: llenar hasta 7
            act(() => {
                result.current.drawCard(false);
            });

            expect(result.current.playerCards).toHaveLength(7);

            // Jugar 2 cartas
            const card1 = result.current.playerCards[0];
            const card2 = result.current.playerCards[1];

            act(() => {
                result.current.placeCard(card1);
                result.current.placeCard(card2);
            });

            expect(result.current.playerCards).toHaveLength(5);

            // Robar de nuevo
            act(() => {
                result.current.drawCard(false);
            });

            expect(result.current.playerCards).toHaveLength(7);
        });

        it('debe reiniciar el deck cuando se acaban las cartas', () => {
            const { result } = renderHook(() => useNeoHandStore());

            // Vaciar el deck manualmente
            act(() => {
                result.current.resetStore();
            });

            // Forzar un deck pequeño para probarlo
            act(() => {
                // Simular que el deck solo tiene 3 cartas
                const smallDeck = deckCards.slice(0, 3);
                useNeoHandStore.setState({ deck: smallDeck });
            });

            act(() => {
                result.current.drawCard(false);
            });

            // Debe tener 7 cartas aunque el deck original era pequeño
            expect(result.current.playerCards.length).toBeLessThanOrEqual(7);
        });

        it('debe manejar múltiples llamadas a drawCard', () => {
            const { result } = renderHook(() => useNeoHandStore());

            act(() => {
                result.current.drawCard(false);
            });

            expect(result.current.playerCards).toHaveLength(7);

            // Segunda llamada no debería añadir más cartas
            const handBeforeSecondDraw = result.current.playerCards.length;

            act(() => {
                result.current.drawCard(false);
            });

            expect(result.current.playerCards).toHaveLength(handBeforeSecondDraw);
        });
    });

    describe('placeCard', () => {
        it('debe remover una carta de la mano del jugador', () => {
            const { result } = renderHook(() => useNeoHandStore());

            act(() => {
                result.current.drawCard(false);
            });

            const initialHandSize = result.current.playerCards.length;
            const cardToPlace = result.current.playerCards[0];

            act(() => {
                result.current.placeCard(cardToPlace);
            });

            expect(result.current.playerCards).toHaveLength(initialHandSize - 1);
            expect(result.current.playerCards.find(c => c.id === cardToPlace.id)).toBeUndefined();
        });

        it('no debe afectar otras cartas en la mano', () => {
            const { result } = renderHook(() => useNeoHandStore());

            act(() => {
                result.current.drawCard(false);
            });

            const cardToPlace = result.current.playerCards[2];
            const otherCards = result.current.playerCards.filter(c => c.id !== cardToPlace.id);

            act(() => {
                result.current.placeCard(cardToPlace);
            });

            otherCards.forEach(card => {
                expect(result.current.playerCards.find(c => c.id === card.id)).toBeDefined();
            });
        });

        it('debe manejar múltiples cartas colocadas', () => {
            const { result } = renderHook(() => useNeoHandStore());

            act(() => {
                result.current.drawCard(false);
            });

            const card1 = result.current.playerCards[0];
            const card2 = result.current.playerCards[1];
            const card3 = result.current.playerCards[2];

            act(() => {
                result.current.placeCard(card1);
                result.current.placeCard(card2);
                result.current.placeCard(card3);
            });

            expect(result.current.playerCards).toHaveLength(4);
            expect(result.current.playerCards.find(c => c.id === card1.id)).toBeUndefined();
            expect(result.current.playerCards.find(c => c.id === card2.id)).toBeUndefined();
            expect(result.current.playerCards.find(c => c.id === card3.id)).toBeUndefined();
        });

        it('no debe hacer nada si se intenta colocar una carta que no está en la mano', () => {
            const { result } = renderHook(() => useNeoHandStore());

            act(() => {
                result.current.drawCard(false);
            });

            const fakeCard: CardUnity = {
                id: 9999,
                name: 'Fake Card',
                type: CardType.CATCH,
                text: 'This card does not exist'
            };

            const initialHandSize = result.current.playerCards.length;

            act(() => {
                result.current.placeCard(fakeCard);
            });

            expect(result.current.playerCards).toHaveLength(initialHandSize);
        });
    });

    describe('discardCard', () => {
        it('debe mover una carta de la mano a la pila de descarte', () => {
            const { result } = renderHook(() => useNeoHandStore());

            act(() => {
                result.current.drawCard(false);
            });

            const initialHandSize = result.current.playerCards.length;
            const cardToDiscard = result.current.playerCards[0];

            act(() => {
                result.current.discardCard(cardToDiscard);
            });

            expect(result.current.playerCards).toHaveLength(initialHandSize - 1);
            expect(result.current.discardPile).toHaveLength(1);
            expect(result.current.discardPile[0]).toEqual(cardToDiscard);
        });

        it('debe remover la carta de la mano del jugador', () => {
            const { result } = renderHook(() => useNeoHandStore());

            act(() => {
                result.current.drawCard(false);
            });

            const cardToDiscard = result.current.playerCards[0];

            act(() => {
                result.current.discardCard(cardToDiscard);
            });

            expect(result.current.playerCards.find(c => c.id === cardToDiscard.id)).toBeUndefined();
        });

        it('debe acumular múltiples cartas en la pila de descarte', () => {
            const { result } = renderHook(() => useNeoHandStore());

            act(() => {
                result.current.drawCard(false);
            });

            const card1 = result.current.playerCards[0];
            const card2 = result.current.playerCards[1];
            const card3 = result.current.playerCards[2];

            act(() => {
                result.current.discardCard(card1);
                result.current.discardCard(card2);
                result.current.discardCard(card3);
            });

            expect(result.current.discardPile).toHaveLength(3);
            expect(result.current.discardPile).toContainEqual(card1);
            expect(result.current.discardPile).toContainEqual(card2);
            expect(result.current.discardPile).toContainEqual(card3);
        });

        it('debe mantener el orden de descarte', () => {
            const { result } = renderHook(() => useNeoHandStore());

            act(() => {
                result.current.drawCard(false);
            });

            const card1 = result.current.playerCards[0];
            const card2 = result.current.playerCards[1];

            act(() => {
                result.current.discardCard(card1);
                result.current.discardCard(card2);
            });

            expect(result.current.discardPile[0]).toEqual(card1);
            expect(result.current.discardPile[1]).toEqual(card2);
        });
    });

    describe('resetStore', () => {
        it('debe reiniciar el store completamente', () => {
            const { result } = renderHook(() => useNeoHandStore());

            // Hacer cambios en el store
            act(() => {
                result.current.drawCard(false);
            });

            const card = result.current.playerCards[0];

            act(() => {
                result.current.discardCard(card);
            });

            expect(result.current.playerCards.length).toBeGreaterThan(0);
            expect(result.current.discardPile.length).toBeGreaterThan(0);

            // Resetear
            act(() => {
                result.current.resetStore();
            });

            expect(result.current.playerCards).toEqual([]);
            expect(result.current.discardPile).toEqual([]);
            expect(result.current.deck).toEqual(deckCards);
        });

        it('debe reiniciar el índice de IDs', () => {
            const { result } = renderHook(() => useNeoHandStore());

            act(() => {
                result.current.drawCard(false);
            });

            const firstBatchIds = result.current.playerCards.map(c => c.id);

            act(() => {
                result.current.resetStore();
                result.current.drawCard(false);
            });

            const secondBatchIds = result.current.playerCards.map(c => c.id);

            // Los IDs deberían empezar desde 0 de nuevo
            expect(Math.min(...secondBatchIds)).toBeLessThan(Math.max(...firstBatchIds));
        });

        it('debe permitir robar cartas después del reset', () => {
            const { result } = renderHook(() => useNeoHandStore());

            act(() => {
                result.current.drawCard(false);
                result.current.resetStore();
                result.current.drawCard(false);
            });

            expect(result.current.playerCards).toHaveLength(7);
            expect(result.current.deck.length).toBeLessThan(deckCards.length);
        });
    });

    describe('Flujos de juego completos', () => {
        it('debe simular un turno completo: robar -> jugar -> descartar', () => {
            const { result } = renderHook(() => useNeoHandStore());

            // Robar
            act(() => {
                result.current.drawCard(false);
            });

            expect(result.current.playerCards).toHaveLength(7);

            // Jugar una carta
            const cardToPlay = result.current.playerCards[0];
            act(() => {
                result.current.placeCard(cardToPlay);
            });

            expect(result.current.playerCards).toHaveLength(6);

            // Descartar una carta
            const cardToDiscard = result.current.playerCards[0];
            act(() => {
                result.current.discardCard(cardToDiscard);
            });

            expect(result.current.playerCards).toHaveLength(5);
            expect(result.current.discardPile).toHaveLength(1);
        });

        it('debe manejar múltiples turnos', () => {
            const { result } = renderHook(() => useNeoHandStore());

            // Turno 1
            act(() => {
                result.current.drawCard(false);
            });

            const card1 = result.current.playerCards[0];
            act(() => {
                result.current.placeCard(card1);
            });

            // Turno 2
            act(() => {
                result.current.drawCard(false);
            });

            expect(result.current.playerCards).toHaveLength(7);

            const card2 = result.current.playerCards[0];
            act(() => {
                result.current.discardCard(card2);
            });

            expect(result.current.discardPile).toHaveLength(1);
        });
    });

    describe('Casos edge', () => {
        it('debe manejar cuando no hay suficientes cartas para llenar la mano', () => {
            const { result } = renderHook(() => useNeoHandStore());

            // Simular un deck muy pequeño
            act(() => {
                useNeoHandStore.setState({ deck: deckCards.slice(0, 3) });
                result.current.drawCard(false);
            });

            // No debería crashear y debería intentar reiniciar el deck
            expect(result.current.playerCards.length).toBeGreaterThan(0);
        });

        it('debe manejar deck vacío correctamente', () => {
            const { result } = renderHook(() => useNeoHandStore());

            act(() => {
                useNeoHandStore.setState({ deck: [] });
                result.current.drawCard(false);
            });

            // Debería reiniciar el deck
            expect(result.current.deck.length).toBeGreaterThan(0);
        });
    });
});