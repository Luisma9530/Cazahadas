import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useCardStore from '../CardStore';
import useTurnStore from '../TurnStore';
import { CardUnity, CardType } from '../../@types/Card';

// Mock del TurnStore
vi.mock('./TurnStore', () => ({
    default: {
        getState: vi.fn()
    }
}));

describe('useCardStore', () => {
    const mockCard1: CardUnity = {
        id: 1,
        name: 'Test Card 1',
        type: CardType.CATCH,
        text: 'A catch card',
        placedByPlayerOne: true
    };

    const mockCard2: CardUnity = {
        id: 2,
        name: 'Test Card 2',
        type: CardType.MAGIC,
        text: 'A magic card',
        operation: (x: number) => x + 5,
        placedByPlayerOne: false
    };

    const mockCard3: CardUnity = {
        id: 3,
        name: 'Test Card 3',
        type: CardType.SHIELD,
        text: 'A shield card',
        defenseCondition: (x: number) => x > 5,
        placedByPlayerOne: true
    };

    beforeEach(() => {
        const { result } = renderHook(() => useCardStore());
        act(() => {
            result.current.resetStore();
        });
        vi.clearAllMocks();
    });

    describe('Inicialización', () => {
        it('debe inicializarse con arrays vacíos', () => {
            const { result } = renderHook(() => useCardStore());

            expect(result.current.selectedCards).toEqual([]);
            expect(result.current.hoveredCard).toBeNull();
        });
    });

    describe('setHoveredCard', () => {
        it('debe establecer la carta en hover', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.setHoveredCard(mockCard1);
            });

            expect(result.current.hoveredCard).toEqual(mockCard1);
        });

        it('debe poder limpiar la carta en hover', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.setHoveredCard(mockCard1);
            });

            expect(result.current.hoveredCard).toEqual(mockCard1);

            act(() => {
                result.current.setHoveredCard(null);
            });

            expect(result.current.hoveredCard).toBeNull();
        });

        it('debe poder cambiar de una carta a otra en hover', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.setHoveredCard(mockCard1);
            });

            expect(result.current.hoveredCard).toEqual(mockCard1);

            act(() => {
                result.current.setHoveredCard(mockCard2);
            });

            expect(result.current.hoveredCard).toEqual(mockCard2);
        });
    });

    describe('setSelectedCard - en batalla', () => {
        beforeEach(() => {
            vi.mocked(useTurnStore.getState).mockReturnValue({ isBattle: true } as any);
        });

        it('debe seleccionar una sola carta en batalla', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.setSelectedCard(mockCard1);
            });

            expect(result.current.selectedCards).toEqual([mockCard1]);
        });

        it('debe reemplazar la carta seleccionada en batalla', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.setSelectedCard(mockCard1);
            });

            expect(result.current.selectedCards).toEqual([mockCard1]);

            act(() => {
                result.current.setSelectedCard(mockCard2);
            });

            expect(result.current.selectedCards).toEqual([mockCard2]);
            expect(result.current.selectedCards).toHaveLength(1);
        });

        it('debe limpiar la selección cuando se pasa null', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.setSelectedCard(mockCard1);
            });

            expect(result.current.selectedCards).toEqual([mockCard1]);

            act(() => {
                result.current.setSelectedCard(null);
            });

            expect(result.current.selectedCards).toEqual([]);
        });
    });

    describe('setSelectedCard - fuera de batalla', () => {
        beforeEach(() => {
            vi.mocked(useTurnStore.getState).mockReturnValue({ isBattle: false } as any);
        });

        it('debe seleccionar una carta fuera de batalla', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.setSelectedCard(mockCard1);
            });

            expect(result.current.selectedCards).toEqual([mockCard1]);
        });

        it('debe reemplazar la selección fuera de batalla', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.setSelectedCard(mockCard1);
            });

            act(() => {
                result.current.setSelectedCard(mockCard2);
            });

            expect(result.current.selectedCards).toEqual([mockCard2]);
        });
    });

    describe('toggleCardSelection - en batalla', () => {
        beforeEach(() => {
            vi.mocked(useTurnStore.getState).mockReturnValue({ isBattle: true } as any);
        });

        it('debe seleccionar una carta cuando no está seleccionada', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.toggleCardSelection(mockCard1);
            });

            expect(result.current.selectedCards).toEqual([mockCard1]);
        });

        it('debe deseleccionar una carta cuando ya está seleccionada', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.toggleCardSelection(mockCard1);
            });

            expect(result.current.selectedCards).toEqual([mockCard1]);

            act(() => {
                result.current.toggleCardSelection(mockCard1);
            });

            expect(result.current.selectedCards).toEqual([]);
        });

        it('debe reemplazar la carta seleccionada con otra diferente', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.toggleCardSelection(mockCard1);
            });

            expect(result.current.selectedCards).toEqual([mockCard1]);

            act(() => {
                result.current.toggleCardSelection(mockCard2);
            });

            expect(result.current.selectedCards).toEqual([mockCard2]);
            expect(result.current.selectedCards).toHaveLength(1);
        });
    });

    describe('toggleCardSelection - fuera de batalla', () => {
        beforeEach(() => {
            vi.mocked(useTurnStore.getState).mockReturnValue({ isBattle: false } as any);
        });

        it('debe permitir seleccionar múltiples cartas', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.toggleCardSelection(mockCard1);
            });

            expect(result.current.selectedCards).toEqual([mockCard1]);

            act(() => {
                result.current.toggleCardSelection(mockCard2);
            });

            expect(result.current.selectedCards).toEqual([mockCard1, mockCard2]);

            act(() => {
                result.current.toggleCardSelection(mockCard3);
            });

            expect(result.current.selectedCards).toEqual([mockCard1, mockCard2, mockCard3]);
        });

        it('debe permitir deseleccionar cartas específicas sin afectar las demás', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.toggleCardSelection(mockCard1);
                result.current.toggleCardSelection(mockCard2);
                result.current.toggleCardSelection(mockCard3);
            });

            expect(result.current.selectedCards).toHaveLength(3);

            act(() => {
                result.current.toggleCardSelection(mockCard2);
            });

            expect(result.current.selectedCards).toEqual([mockCard1, mockCard3]);
            expect(result.current.selectedCards).toHaveLength(2);
        });

        it('debe permitir reseleccionar una carta deseleccionada', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.toggleCardSelection(mockCard1);
                result.current.toggleCardSelection(mockCard2);
            });

            expect(result.current.selectedCards).toEqual([mockCard1, mockCard2]);

            act(() => {
                result.current.toggleCardSelection(mockCard1);
            });

            expect(result.current.selectedCards).toEqual([mockCard2]);

            act(() => {
                result.current.toggleCardSelection(mockCard1);
            });

            expect(result.current.selectedCards).toEqual([mockCard2, mockCard1]);
        });

        it('debe manejar toggle de la misma carta múltiples veces', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.toggleCardSelection(mockCard1);
            });
            expect(result.current.selectedCards).toEqual([mockCard1]);

            act(() => {
                result.current.toggleCardSelection(mockCard1);
            });
            expect(result.current.selectedCards).toEqual([]);

            act(() => {
                result.current.toggleCardSelection(mockCard1);
            });
            expect(result.current.selectedCards).toEqual([mockCard1]);
        });

        it('debe manejar diferentes tipos de cartas (CATCH, MAGIC, SHIELD)', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.toggleCardSelection(mockCard1); // CATCH
                result.current.toggleCardSelection(mockCard2); // MAGIC
                result.current.toggleCardSelection(mockCard3); // SHIELD
            });

            expect(result.current.selectedCards).toHaveLength(3);
            expect(result.current.selectedCards[0].type).toBe(CardType.CATCH);
            expect(result.current.selectedCards[1].type).toBe(CardType.MAGIC);
            expect(result.current.selectedCards[2].type).toBe(CardType.SHIELD);
        });
    });

    describe('isCardSelected', () => {
        beforeEach(() => {
            vi.mocked(useTurnStore.getState).mockReturnValue({ isBattle: false } as any);
        });

        it('debe retornar true si la carta está seleccionada', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.toggleCardSelection(mockCard1);
            });

            expect(result.current.isCardSelected(mockCard1)).toBe(true);
        });

        it('debe retornar false si la carta no está seleccionada', () => {
            const { result } = renderHook(() => useCardStore());

            expect(result.current.isCardSelected(mockCard1)).toBe(false);
        });

        it('debe retornar correctamente para múltiples cartas', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.toggleCardSelection(mockCard1);
                result.current.toggleCardSelection(mockCard3);
            });

            expect(result.current.isCardSelected(mockCard1)).toBe(true);
            expect(result.current.isCardSelected(mockCard2)).toBe(false);
            expect(result.current.isCardSelected(mockCard3)).toBe(true);
        });
    });

    describe('resetSelectedCards', () => {
        beforeEach(() => {
            vi.mocked(useTurnStore.getState).mockReturnValue({ isBattle: false } as any);
        });

        it('debe limpiar todas las cartas seleccionadas', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.toggleCardSelection(mockCard1);
                result.current.toggleCardSelection(mockCard2);
                result.current.toggleCardSelection(mockCard3);
            });

            expect(result.current.selectedCards).toHaveLength(3);

            act(() => {
                result.current.resetSelectedCards();
            });

            expect(result.current.selectedCards).toEqual([]);
        });

        it('no debe afectar hoveredCard', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.setHoveredCard(mockCard1);
                result.current.toggleCardSelection(mockCard2);
            });

            act(() => {
                result.current.resetSelectedCards();
            });

            expect(result.current.selectedCards).toEqual([]);
            expect(result.current.hoveredCard).toEqual(mockCard1);
        });
    });

    describe('resetStore', () => {
        beforeEach(() => {
            vi.mocked(useTurnStore.getState).mockReturnValue({ isBattle: false } as any);
        });

        it('debe resetear completamente el store', () => {
            const { result } = renderHook(() => useCardStore());

            act(() => {
                result.current.setHoveredCard(mockCard1);
                result.current.toggleCardSelection(mockCard2);
                result.current.toggleCardSelection(mockCard3);
            });

            expect(result.current.hoveredCard).toEqual(mockCard1);
            expect(result.current.selectedCards).toHaveLength(2);

            act(() => {
                result.current.resetStore();
            });

            expect(result.current.hoveredCard).toBeNull();
            expect(result.current.selectedCards).toEqual([]);
        });
    });

    describe('Cambio de contexto batalla/no batalla', () => {
        it('debe comportarse diferente según el estado de batalla', () => {
            const { result } = renderHook(() => useCardStore());

            // Fuera de batalla: selección múltiple
            vi.mocked(useTurnStore.getState).mockReturnValue({ isBattle: false } as any);

            act(() => {
                result.current.toggleCardSelection(mockCard1);
                result.current.toggleCardSelection(mockCard2);
            });

            expect(result.current.selectedCards).toHaveLength(2);

            // En batalla: selección única
            vi.mocked(useTurnStore.getState).mockReturnValue({ isBattle: true } as any);

            act(() => {
                result.current.toggleCardSelection(mockCard3);
            });

            expect(result.current.selectedCards).toEqual([mockCard3]);
            expect(result.current.selectedCards).toHaveLength(1);
        });
    });
});