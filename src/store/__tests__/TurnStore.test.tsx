import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useTurnStore from '../TurnStore';

describe('useTurnStore', () => {
    beforeEach(() => {
        const { result } = renderHook(() => useTurnStore());
        act(() => {
            result.current.resetStore();
        });
    });

    describe('Inicialización', () => {
        it('debe inicializarse con valores por defecto', () => {
            const { result } = renderHook(() => useTurnStore());

            expect(result.current.isMyTurn).toBe(false);
            expect(result.current.isMyFirstTurn).toBe(true);
            expect(result.current.isBattle).toBe(false);
            expect(result.current.isMyFirstTurnBattle).toBe(false);
            expect(result.current.playerSkippedTurn).toBe(false);
            expect(result.current.showBattleModal).toBe(false);
            expect(result.current.showDrawModal).toBe(false);
        });
    });

    describe('toggleTurn', () => {
        it('debe cambiar isMyTurn de false a true', () => {
            const { result } = renderHook(() => useTurnStore());

            expect(result.current.isMyTurn).toBe(false);

            act(() => {
                result.current.toggleTurn();
            });

            expect(result.current.isMyTurn).toBe(true);
        });

        it('debe cambiar isMyTurn de true a false', () => {
            const { result } = renderHook(() => useTurnStore());

            act(() => {
                result.current.toggleTurn();
            });

            expect(result.current.isMyTurn).toBe(true);

            act(() => {
                result.current.toggleTurn();
            });

            expect(result.current.isMyTurn).toBe(false);
        });

        it('debe alternar múltiples veces', () => {
            const { result } = renderHook(() => useTurnStore());

            for (let i = 0; i < 5; i++) {
                act(() => {
                    result.current.toggleTurn();
                });
                expect(result.current.isMyTurn).toBe(i % 2 === 0);
            }
        });

        it('no debe afectar otros estados', () => {
            const { result } = renderHook(() => useTurnStore());

            act(() => {
                result.current.toggleTurn();
            });

            expect(result.current.isMyTurn).toBe(true);
            expect(result.current.isMyFirstTurn).toBe(true);
            expect(result.current.isBattle).toBe(false);
            expect(result.current.playerSkippedTurn).toBe(false);
        });
    });

    describe('setIsMyFirstTurn', () => {
        it('debe establecer isMyFirstTurn a false', () => {
            const { result } = renderHook(() => useTurnStore());

            expect(result.current.isMyFirstTurn).toBe(true);

            act(() => {
                result.current.setIsMyFirstTurn(false);
            });

            expect(result.current.isMyFirstTurn).toBe(false);
        });

        it('debe establecer isMyFirstTurn a true', () => {
            const { result } = renderHook(() => useTurnStore());

            act(() => {
                result.current.setIsMyFirstTurn(false);
            });

            expect(result.current.isMyFirstTurn).toBe(false);

            act(() => {
                result.current.setIsMyFirstTurn(true);
            });

            expect(result.current.isMyFirstTurn).toBe(true);
        });

        it('debe cambiar múltiples veces', () => {
            const { result } = renderHook(() => useTurnStore());

            act(() => {
                result.current.setIsMyFirstTurn(false);
            });
            expect(result.current.isMyFirstTurn).toBe(false);

            act(() => {
                result.current.setIsMyFirstTurn(true);
            });
            expect(result.current.isMyFirstTurn).toBe(true);

            act(() => {
                result.current.setIsMyFirstTurn(false);
            });
            expect(result.current.isMyFirstTurn).toBe(false);
        });
    });

    describe('setIsBattle', () => {
        it('debe establecer isBattle a true', () => {
            const { result } = renderHook(() => useTurnStore());

            act(() => {
                result.current.setIsBattle(true);
            });

            expect(result.current.isBattle).toBe(true);
        });

        it('debe establecer isBattle a false', () => {
            const { result } = renderHook(() => useTurnStore());

            act(() => {
                result.current.setIsBattle(true);
            });

            act(() => {
                result.current.setIsBattle(false);
            });

            expect(result.current.isBattle).toBe(false);
        });

        it('debe alternar entre batalla y no batalla', () => {
            const { result } = renderHook(() => useTurnStore());

            act(() => {
                result.current.setIsBattle(true);
            });
            expect(result.current.isBattle).toBe(true);

            act(() => {
                result.current.setIsBattle(false);
            });
            expect(result.current.isBattle).toBe(false);

            act(() => {
                result.current.setIsBattle(true);
            });
            expect(result.current.isBattle).toBe(true);
        });
    });

    describe('setIsMyFirstTurnBattle', () => {
        it('debe establecer isMyFirstTurnBattle a true', () => {
            const { result } = renderHook(() => useTurnStore());

            // El valor inicial es false
            expect(result.current.isMyFirstTurnBattle).toBe(false);

            act(() => {
                result.current.setIsMyFirstTurnBattle(true);
            });

            expect(result.current.isMyFirstTurnBattle).toBe(true);
        });

        it('debe establecer isMyFirstTurnBattle a true', () => {
            const { result } = renderHook(() => useTurnStore());

            act(() => {
                result.current.setIsMyFirstTurnBattle(false);
            });

            act(() => {
                result.current.setIsMyFirstTurnBattle(true);
            });

            expect(result.current.isMyFirstTurnBattle).toBe(true);
        });
    });

    describe('setPlayerSkippedTurn', () => {
        it('debe establecer playerSkippedTurn a true', () => {
            const { result } = renderHook(() => useTurnStore());

            act(() => {
                result.current.setPlayerSkippedTurn(true);
            });

            expect(result.current.playerSkippedTurn).toBe(true);
        });

        it('debe establecer playerSkippedTurn a false', () => {
            const { result } = renderHook(() => useTurnStore());

            act(() => {
                result.current.setPlayerSkippedTurn(true);
            });

            act(() => {
                result.current.setPlayerSkippedTurn(false);
            });

            expect(result.current.playerSkippedTurn).toBe(false);
        });

        it('debe alternar múltiples veces', () => {
            const { result } = renderHook(() => useTurnStore());

            act(() => {
                result.current.setPlayerSkippedTurn(true);
            });
            expect(result.current.playerSkippedTurn).toBe(true);

            act(() => {
                result.current.setPlayerSkippedTurn(false);
            });
            expect(result.current.playerSkippedTurn).toBe(false);

            act(() => {
                result.current.setPlayerSkippedTurn(true);
            });
            expect(result.current.playerSkippedTurn).toBe(true);
        });
    });

    describe('setShowBattleModal', () => {
        it('debe establecer showBattleModal a true', () => {
            const { result } = renderHook(() => useTurnStore());

            act(() => {
                result.current.setShowBattleModal(true);
            });

            expect(result.current.showBattleModal).toBe(true);
        });

        it('debe establecer showBattleModal a false', () => {
            const { result } = renderHook(() => useTurnStore());

            act(() => {
                result.current.setShowBattleModal(true);
            });

            act(() => {
                result.current.setShowBattleModal(false);
            });

            expect(result.current.showBattleModal).toBe(false);
        });
    });

    describe('setShowDrawModal', () => {
        it('debe establecer showDrawModal a true', () => {
            const { result } = renderHook(() => useTurnStore());

            act(() => {
                result.current.setShowDrawModal(true);
            });

            expect(result.current.showDrawModal).toBe(true);
        });

        it('debe establecer showDrawModal a false', () => {
            const { result } = renderHook(() => useTurnStore());

            act(() => {
                result.current.setShowDrawModal(true);
            });

            act(() => {
                result.current.setShowDrawModal(false);
            });

            expect(result.current.showDrawModal).toBe(false);
        });
    });

    describe('resetStore', () => {
        it('debe resetear todos los valores al estado inicial', () => {
            const { result } = renderHook(() => useTurnStore());

            // Modificar todos los valores
            act(() => {
                result.current.toggleTurn(); // isMyTurn = true
                result.current.setIsMyFirstTurn(false);
                result.current.setIsBattle(true);
                result.current.setIsMyFirstTurnBattle(false);
                result.current.setPlayerSkippedTurn(true);
                result.current.setShowBattleModal(true);
                result.current.setShowDrawModal(true);
            });

            // Verificar que están modificados
            expect(result.current.isMyTurn).toBe(true);
            expect(result.current.isMyFirstTurn).toBe(false);
            expect(result.current.isBattle).toBe(true);
            expect(result.current.isMyFirstTurnBattle).toBe(false);
            expect(result.current.playerSkippedTurn).toBe(true);
            expect(result.current.showBattleModal).toBe(true);
            expect(result.current.showDrawModal).toBe(true);

            // Resetear
            act(() => {
                result.current.resetStore();
            });

            // Verificar que todo vuelve al estado inicial
            expect(result.current.isMyTurn).toBe(false);
            expect(result.current.isMyFirstTurn).toBe(true);
            expect(result.current.isBattle).toBe(false);
            expect(result.current.isMyFirstTurnBattle).toBe(false); // Nota: según el código, resetea a false
            expect(result.current.playerSkippedTurn).toBe(false);
            expect(result.current.showBattleModal).toBe(false);
            expect(result.current.showDrawModal).toBe(false);
        });

        it('debe permitir modificar valores después del reset', () => {
            const { result } = renderHook(() => useTurnStore());

            act(() => {
                result.current.toggleTurn();
                result.current.resetStore();
            });

            expect(result.current.isMyTurn).toBe(false);

            act(() => {
                result.current.toggleTurn();
            });

            expect(result.current.isMyTurn).toBe(true);
        });

        it('debe poder resetear múltiples veces', () => {
            const { result } = renderHook(() => useTurnStore());

            act(() => {
                result.current.toggleTurn();
                result.current.resetStore();
            });

            expect(result.current.isMyTurn).toBe(false);

            act(() => {
                result.current.setIsBattle(true);
                result.current.resetStore();
            });

            expect(result.current.isBattle).toBe(false);
        });
    });

    describe('Flujos de juego completos', () => {
        it('debe simular el primer turno del jugador', () => {
            const { result } = renderHook(() => useTurnStore());

            // Estado inicial
            expect(result.current.isMyTurn).toBe(false);
            expect(result.current.isMyFirstTurn).toBe(true);

            // Empieza mi turno
            act(() => {
                result.current.toggleTurn();
            });

            expect(result.current.isMyTurn).toBe(true);
            expect(result.current.isMyFirstTurn).toBe(true);

            // Finaliza el primer turno
            act(() => {
                result.current.setIsMyFirstTurn(false);
                result.current.toggleTurn();
            });

            expect(result.current.isMyTurn).toBe(false);
            expect(result.current.isMyFirstTurn).toBe(false);
        });

        it('debe simular alternancia de turnos entre jugadores', () => {
            const { result } = renderHook(() => useTurnStore());

            // Turno 1: mi turno
            act(() => {
                result.current.toggleTurn();
            });
            expect(result.current.isMyTurn).toBe(true);

            // Turno 2: turno del oponente
            act(() => {
                result.current.toggleTurn();
            });
            expect(result.current.isMyTurn).toBe(false);

            // Turno 3: mi turno otra vez
            act(() => {
                result.current.toggleTurn();
            });
            expect(result.current.isMyTurn).toBe(true);
        });

        it('debe simular jugador saltando turno', () => {
            const { result } = renderHook(() => useTurnStore());

            // Es mi turno
            act(() => {
                result.current.toggleTurn();
            });

            expect(result.current.isMyTurn).toBe(true);

            // Salto el turno
            act(() => {
                result.current.setPlayerSkippedTurn(true);
                result.current.toggleTurn();
            });

            expect(result.current.isMyTurn).toBe(false);
            expect(result.current.playerSkippedTurn).toBe(true);

            // Siguiente turno, resetear skip
            act(() => {
                result.current.setPlayerSkippedTurn(false);
            });

            expect(result.current.playerSkippedTurn).toBe(false);
        });

        it('debe simular entrada y salida de batalla', () => {
            const { result } = renderHook(() => useTurnStore());

            // Fase normal
            expect(result.current.isBattle).toBe(false);
            expect(result.current.isMyFirstTurnBattle).toBe(false);

            // Entrar en batalla
            act(() => {
                result.current.setIsBattle(true);
                result.current.setShowBattleModal(true);
                result.current.setIsMyFirstTurnBattle(true);
            });

            expect(result.current.isBattle).toBe(true);
            expect(result.current.showBattleModal).toBe(true);
            expect(result.current.isMyFirstTurnBattle).toBe(true);

            // Cerrar modal de batalla
            act(() => {
                result.current.setShowBattleModal(false);
            });

            expect(result.current.showBattleModal).toBe(false);

            // Primer turno de batalla termina
            act(() => {
                result.current.setIsMyFirstTurnBattle(false);
            });

            expect(result.current.isMyFirstTurnBattle).toBe(false);

            // Salir de batalla
            act(() => {
                result.current.setIsBattle(false);
            });

            expect(result.current.isBattle).toBe(false);
        });

        it('debe simular mostrar modal de empate', () => {
            const { result } = renderHook(() => useTurnStore());

            // Batalla termina en empate
            act(() => {
                result.current.setIsBattle(true);
            });

            act(() => {
                result.current.setShowDrawModal(true);
            });

            expect(result.current.showDrawModal).toBe(true);
            expect(result.current.isBattle).toBe(true);

            // Cerrar modal y salir de batalla
            act(() => {
                result.current.setShowDrawModal(false);
                result.current.setIsBattle(false);
            });

            expect(result.current.showDrawModal).toBe(false);
            expect(result.current.isBattle).toBe(false);
        });

        it('debe simular una partida completa con reset', () => {
            const { result } = renderHook(() => useTurnStore());

            // Jugar algunos turnos
            act(() => {
                result.current.toggleTurn();
                result.current.setIsMyFirstTurn(false);
                result.current.toggleTurn();
            });

            // Entrar en batalla
            act(() => {
                result.current.setIsBattle(true);
                result.current.setIsMyFirstTurnBattle(false);
            });

            // Saltar turno
            act(() => {
                result.current.setPlayerSkippedTurn(true);
            });

            // Verificar estado
            expect(result.current.isMyFirstTurn).toBe(false);
            expect(result.current.isBattle).toBe(true);
            expect(result.current.isMyFirstTurnBattle).toBe(false);
            expect(result.current.playerSkippedTurn).toBe(true);

            // Nueva partida
            act(() => {
                result.current.resetStore();
            });

            // Todo debe estar reseteado
            expect(result.current.isMyTurn).toBe(false);
            expect(result.current.isMyFirstTurn).toBe(true);
            expect(result.current.isBattle).toBe(false);
            expect(result.current.isMyFirstTurnBattle).toBe(false);
            expect(result.current.playerSkippedTurn).toBe(false);
        });
    });

    describe('Independencia de propiedades', () => {
        it('debe modificar isMyTurn sin afectar isBattle', () => {
            const { result } = renderHook(() => useTurnStore());

            act(() => {
                result.current.setIsBattle(true);
            });

            act(() => {
                result.current.toggleTurn();
            });

            expect(result.current.isMyTurn).toBe(true);
            expect(result.current.isBattle).toBe(true);
        });

        it('debe modificar modales sin afectar turnos', () => {
            const { result } = renderHook(() => useTurnStore());

            act(() => {
                result.current.toggleTurn();
                result.current.setShowBattleModal(true);
            });

            expect(result.current.isMyTurn).toBe(true);
            expect(result.current.showBattleModal).toBe(true);

            act(() => {
                result.current.setShowBattleModal(false);
            });

            expect(result.current.isMyTurn).toBe(true);
        });
    });
});