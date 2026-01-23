import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModalStore } from '../ModalStore';

describe('useModalStore', () => {
    beforeEach(() => {
        const { result } = renderHook(() => useModalStore());
        act(() => {
            result.current.resetStore();
        });
        vi.clearAllMocks();
    });

    describe('Inicialización', () => {
        it('debe inicializarse con todos los modales cerrados', () => {
            const { result } = renderHook(() => useModalStore());

            expect(result.current.gameStartModal).toBe(false);
            expect(result.current.endGameModal).toBe(false);
            expect(result.current.turnModal).toBe(false);
            expect(result.current.battleModal).toBe(false);
            expect(result.current.battleEndModal).toBe(false);
        });
    });

    describe('toggleGameStartModal', () => {
        it('debe abrir el modal de inicio de juego', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleGameStartModal();
            });

            expect(result.current.gameStartModal).toBe(true);
        });

        it('debe cerrar el modal de inicio de juego', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleGameStartModal();
            });

            expect(result.current.gameStartModal).toBe(true);

            act(() => {
                result.current.toggleGameStartModal();
            });

            expect(result.current.gameStartModal).toBe(false);
        });

        it('debe alternar el modal múltiples veces', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleGameStartModal();
            });
            expect(result.current.gameStartModal).toBe(true);

            act(() => {
                result.current.toggleGameStartModal();
            });
            expect(result.current.gameStartModal).toBe(false);

            act(() => {
                result.current.toggleGameStartModal();
            });
            expect(result.current.gameStartModal).toBe(true);
        });

        it('no debe afectar otros modales', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleGameStartModal();
            });

            expect(result.current.gameStartModal).toBe(true);
            expect(result.current.endGameModal).toBe(false);
            expect(result.current.turnModal).toBe(false);
            expect(result.current.battleModal).toBe(false);
            expect(result.current.battleEndModal).toBe(false);
        });
    });

    describe('toggleEndGameModal', () => {
        it('debe abrir el modal de fin de juego', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleEndGameModal();
            });

            expect(result.current.endGameModal).toBe(true);
        });

        it('debe cerrar el modal de fin de juego', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleEndGameModal();
            });

            act(() => {
                result.current.toggleEndGameModal();
            });

            expect(result.current.endGameModal).toBe(false);
        });

        it('debe alternar el modal múltiples veces', () => {
            const { result } = renderHook(() => useModalStore());

            for (let i = 0; i < 4; i++) {
                act(() => {
                    result.current.toggleEndGameModal();
                });
                expect(result.current.endGameModal).toBe(i % 2 === 0);
            }
        });

        it('no debe afectar otros modales', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleEndGameModal();
            });

            expect(result.current.endGameModal).toBe(true);
            expect(result.current.gameStartModal).toBe(false);
            expect(result.current.turnModal).toBe(false);
            expect(result.current.battleModal).toBe(false);
            expect(result.current.battleEndModal).toBe(false);
        });
    });

    describe('toggleTurnModal', () => {
        it('debe abrir el modal de turno', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleTurnModal();
            });

            expect(result.current.turnModal).toBe(true);
        });

        it('debe cerrar el modal de turno', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleTurnModal();
            });

            act(() => {
                result.current.toggleTurnModal();
            });

            expect(result.current.turnModal).toBe(false);
        });

        it('no debe afectar otros modales', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleTurnModal();
            });

            expect(result.current.turnModal).toBe(true);
            expect(result.current.gameStartModal).toBe(false);
            expect(result.current.endGameModal).toBe(false);
            expect(result.current.battleModal).toBe(false);
            expect(result.current.battleEndModal).toBe(false);
        });
    });

    describe('toggleBattleModal', () => {
        it('debe abrir el modal de batalla', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleBattleModal();
            });

            expect(result.current.battleModal).toBe(true);
        });

        it('debe cerrar el modal de batalla', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleBattleModal();
            });

            act(() => {
                result.current.toggleBattleModal();
            });

            expect(result.current.battleModal).toBe(false);
        });

        it('no debe afectar otros modales', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleBattleModal();
            });

            expect(result.current.battleModal).toBe(true);
            expect(result.current.gameStartModal).toBe(false);
            expect(result.current.endGameModal).toBe(false);
            expect(result.current.turnModal).toBe(false);
            expect(result.current.battleEndModal).toBe(false);
        });
    });

    describe('toggleBattleEndModal', () => {
        it('debe abrir el modal de fin de batalla', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleBattleEndModal();
            });

            expect(result.current.battleEndModal).toBe(true);
        });

        it('debe cerrar el modal de fin de batalla', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleBattleEndModal();
            });

            act(() => {
                result.current.toggleBattleEndModal();
            });

            expect(result.current.battleEndModal).toBe(false);
        });

        it('no debe afectar otros modales', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleBattleEndModal();
            });

            expect(result.current.battleEndModal).toBe(true);
            expect(result.current.gameStartModal).toBe(false);
            expect(result.current.endGameModal).toBe(false);
            expect(result.current.turnModal).toBe(false);
            expect(result.current.battleModal).toBe(false);
        });
    });

    describe('resetStore', () => {
        it('debe cerrar todos los modales', () => {
            const { result } = renderHook(() => useModalStore());

            // Abrir todos los modales
            act(() => {
                result.current.toggleGameStartModal();
                result.current.toggleEndGameModal();
                result.current.toggleTurnModal();
                result.current.toggleBattleModal();
                result.current.toggleBattleEndModal();
            });

            expect(result.current.gameStartModal).toBe(true);
            expect(result.current.endGameModal).toBe(true);
            expect(result.current.turnModal).toBe(true);
            expect(result.current.battleModal).toBe(true);
            expect(result.current.battleEndModal).toBe(true);

            // Resetear
            act(() => {
                result.current.resetStore();
            });

            expect(result.current.gameStartModal).toBe(false);
            expect(result.current.endGameModal).toBe(false);
            expect(result.current.turnModal).toBe(false);
            expect(result.current.battleModal).toBe(false);
            expect(result.current.battleEndModal).toBe(false);
        });

        it('debe funcionar incluso si algunos modales ya están cerrados', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleGameStartModal();
                result.current.toggleBattleModal();
            });

            expect(result.current.gameStartModal).toBe(true);
            expect(result.current.battleModal).toBe(true);
            expect(result.current.endGameModal).toBe(false);

            act(() => {
                result.current.resetStore();
            });

            expect(result.current.gameStartModal).toBe(false);
            expect(result.current.endGameModal).toBe(false);
            expect(result.current.turnModal).toBe(false);
            expect(result.current.battleModal).toBe(false);
            expect(result.current.battleEndModal).toBe(false);
        });

        it('debe permitir abrir modales después del reset', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleGameStartModal();
                result.current.resetStore();
            });

            expect(result.current.gameStartModal).toBe(false);

            act(() => {
                result.current.toggleEndGameModal();
            });

            expect(result.current.endGameModal).toBe(true);
        });
    });

    describe('Múltiples modales abiertos simultáneamente', () => {
        it('debe permitir tener múltiples modales abiertos a la vez', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleGameStartModal();
                result.current.toggleBattleModal();
                result.current.toggleTurnModal();
            });

            expect(result.current.gameStartModal).toBe(true);
            expect(result.current.battleModal).toBe(true);
            expect(result.current.turnModal).toBe(true);
            expect(result.current.endGameModal).toBe(false);
            expect(result.current.battleEndModal).toBe(false);
        });

        it('debe permitir cerrar modales individualmente', () => {
            const { result } = renderHook(() => useModalStore());

            act(() => {
                result.current.toggleGameStartModal();
                result.current.toggleBattleModal();
                result.current.toggleEndGameModal();
            });

            act(() => {
                result.current.toggleBattleModal();
            });

            expect(result.current.gameStartModal).toBe(true);
            expect(result.current.battleModal).toBe(false);
            expect(result.current.endGameModal).toBe(true);
        });
    });

    describe('Escenarios de flujo de juego', () => {
        it('debe simular el flujo: inicio -> turno -> batalla -> fin de batalla -> fin de juego', () => {
            const { result } = renderHook(() => useModalStore());

            // Inicio
            act(() => {
                result.current.toggleGameStartModal();
            });
            expect(result.current.gameStartModal).toBe(true);

            act(() => {
                result.current.toggleGameStartModal();
            });
            expect(result.current.gameStartModal).toBe(false);

            // Turno
            act(() => {
                result.current.toggleTurnModal();
            });
            expect(result.current.turnModal).toBe(true);

            act(() => {
                result.current.toggleTurnModal();
            });

            // Batalla
            act(() => {
                result.current.toggleBattleModal();
            });
            expect(result.current.battleModal).toBe(true);

            act(() => {
                result.current.toggleBattleModal();
            });

            // Fin de batalla
            act(() => {
                result.current.toggleBattleEndModal();
            });
            expect(result.current.battleEndModal).toBe(true);

            act(() => {
                result.current.toggleBattleEndModal();
            });

            // Fin de juego
            act(() => {
                result.current.toggleEndGameModal();
            });
            expect(result.current.endGameModal).toBe(true);
        });
    });
});