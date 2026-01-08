import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameStore, Result } from '../GameStore';

describe('useGameStore', () => {
    beforeEach(() => {
        const { result } = renderHook(() => useGameStore());
        act(() => {
            result.current.resetStore();
        });
    });

    describe('Inicialización', () => {
        it('debe inicializarse con valores por defecto', () => {
            const { result } = renderHook(() => useGameStore());

            expect(result.current.amIP1).toBe(false);
            expect(result.current.gameOver).toBe(false);
            expect(result.current.gameResult).toBe(Result.NONE);
            expect(result.current.playerOneName).toBe('');
            expect(result.current.playerTwoName).toBe('');
            expect(result.current.playerDisconnected).toBe(false);
        });
    });

    describe('setAmIP1', () => {
        it('debe establecer amIP1 a true', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setAmIP1(true);
            });

            expect(result.current.amIP1).toBe(true);
        });

        it('debe establecer amIP1 a false', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setAmIP1(true);
            });

            expect(result.current.amIP1).toBe(true);

            act(() => {
                result.current.setAmIP1(false);
            });

            expect(result.current.amIP1).toBe(false);
        });

        it('debe poder cambiar amIP1 múltiples veces', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setAmIP1(true);
            });
            expect(result.current.amIP1).toBe(true);

            act(() => {
                result.current.setAmIP1(false);
            });
            expect(result.current.amIP1).toBe(false);

            act(() => {
                result.current.setAmIP1(true);
            });
            expect(result.current.amIP1).toBe(true);
        });
    });

    describe('setGameOver', () => {
        it('debe establecer gameOver a true', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setGameOver(true);
            });

            expect(result.current.gameOver).toBe(true);
        });

        it('debe establecer gameOver a false', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setGameOver(true);
            });

            act(() => {
                result.current.setGameOver(false);
            });

            expect(result.current.gameOver).toBe(false);
        });
    });

    describe('setGameResult', () => {
        it('debe establecer el resultado como PLAYER1WIN', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setGameResult(Result.PLAYER1WIN);
            });

            expect(result.current.gameResult).toBe(Result.PLAYER1WIN);
        });

        it('debe establecer el resultado como PLAYER2WIN', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setGameResult(Result.PLAYER2WIN);
            });

            expect(result.current.gameResult).toBe(Result.PLAYER2WIN);
        });

        it('debe establecer el resultado como DRAW', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setGameResult(Result.DRAW);
            });

            expect(result.current.gameResult).toBe(Result.DRAW);
        });

        it('debe establecer el resultado como NONE', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setGameResult(Result.PLAYER1WIN);
            });

            act(() => {
                result.current.setGameResult(Result.NONE);
            });

            expect(result.current.gameResult).toBe(Result.NONE);
        });

        it('debe poder cambiar entre diferentes resultados', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setGameResult(Result.PLAYER1WIN);
            });
            expect(result.current.gameResult).toBe(Result.PLAYER1WIN);

            act(() => {
                result.current.setGameResult(Result.DRAW);
            });
            expect(result.current.gameResult).toBe(Result.DRAW);

            act(() => {
                result.current.setGameResult(Result.PLAYER2WIN);
            });
            expect(result.current.gameResult).toBe(Result.PLAYER2WIN);
        });
    });

    describe('setPlayerOneName', () => {
        it('debe establecer el nombre del jugador 1', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setPlayerOneName('Alice');
            });

            expect(result.current.playerOneName).toBe('Alice');
        });

        it('debe actualizar el nombre del jugador 1', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setPlayerOneName('Alice');
            });

            expect(result.current.playerOneName).toBe('Alice');

            act(() => {
                result.current.setPlayerOneName('Bob');
            });

            expect(result.current.playerOneName).toBe('Bob');
        });

        it('debe manejar strings vacíos', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setPlayerOneName('Alice');
            });

            act(() => {
                result.current.setPlayerOneName('');
            });

            expect(result.current.playerOneName).toBe('');
        });

        it('debe manejar nombres con espacios y caracteres especiales', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setPlayerOneName('José María 123');
            });

            expect(result.current.playerOneName).toBe('José María 123');
        });
    });

    describe('setPlayerTwoName', () => {
        it('debe establecer el nombre del jugador 2', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setPlayerTwoName('Charlie');
            });

            expect(result.current.playerTwoName).toBe('Charlie');
        });

        it('debe actualizar el nombre del jugador 2', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setPlayerTwoName('Charlie');
            });

            act(() => {
                result.current.setPlayerTwoName('Diana');
            });

            expect(result.current.playerTwoName).toBe('Diana');
        });

        it('debe poder establecer nombres diferentes para ambos jugadores', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setPlayerOneName('Alice');
                result.current.setPlayerTwoName('Bob');
            });

            expect(result.current.playerOneName).toBe('Alice');
            expect(result.current.playerTwoName).toBe('Bob');
        });
    });

    describe('setPlayerDisconnected', () => {
        it('debe establecer playerDisconnected a true', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setPlayerDisconnected(true);
            });

            expect(result.current.playerDisconnected).toBe(true);
        });

        it('debe establecer playerDisconnected a false', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setPlayerDisconnected(true);
            });

            act(() => {
                result.current.setPlayerDisconnected(false);
            });

            expect(result.current.playerDisconnected).toBe(false);
        });
    });

    describe('resetStore', () => {
        it('debe resetear todos los valores al estado inicial', () => {
            const { result } = renderHook(() => useGameStore());

            // Modificar todos los valores
            act(() => {
                result.current.setAmIP1(true);
                result.current.setGameOver(true);
                result.current.setGameResult(Result.PLAYER1WIN);
                result.current.setPlayerOneName('Alice');
                result.current.setPlayerTwoName('Bob');
                result.current.setPlayerDisconnected(true);
            });

            // Verificar que están modificados
            expect(result.current.amIP1).toBe(true);
            expect(result.current.gameOver).toBe(true);
            expect(result.current.gameResult).toBe(Result.PLAYER1WIN);
            expect(result.current.playerOneName).toBe('Alice');
            expect(result.current.playerTwoName).toBe('Bob');
            expect(result.current.playerDisconnected).toBe(true);

            // Resetear
            act(() => {
                result.current.resetStore();
            });

            // Verificar que todo vuelve al estado inicial
            expect(result.current.amIP1).toBe(false);
            expect(result.current.gameOver).toBe(false);
            expect(result.current.gameResult).toBe(Result.NONE);
            expect(result.current.playerOneName).toBe('');
            expect(result.current.playerTwoName).toBe('');
            expect(result.current.playerDisconnected).toBe(false);
        });

        it('debe poder resetear múltiples veces', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setPlayerOneName('Test');
                result.current.resetStore();
            });

            expect(result.current.playerOneName).toBe('');

            act(() => {
                result.current.setPlayerOneName('Another Test');
                result.current.resetStore();
            });

            expect(result.current.playerOneName).toBe('');
        });
    });

    describe('Escenarios de juego completos', () => {
        it('debe simular una partida completa donde gana el jugador 1', () => {
            const { result } = renderHook(() => useGameStore());

            // Configurar jugadores
            act(() => {
                result.current.setAmIP1(true);
                result.current.setPlayerOneName('Alice');
                result.current.setPlayerTwoName('Bob');
            });

            expect(result.current.gameOver).toBe(false);
            expect(result.current.gameResult).toBe(Result.NONE);

            // Finalizar juego
            act(() => {
                result.current.setGameOver(true);
                result.current.setGameResult(Result.PLAYER1WIN);
            });

            expect(result.current.gameOver).toBe(true);
            expect(result.current.gameResult).toBe(Result.PLAYER1WIN);
            expect(result.current.amIP1).toBe(true);
        });

        it('debe simular una desconexión de jugador', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setPlayerOneName('Alice');
                result.current.setPlayerTwoName('Bob');
            });

            // Simular desconexión
            act(() => {
                result.current.setPlayerDisconnected(true);
                result.current.setGameOver(true);
            });

            expect(result.current.playerDisconnected).toBe(true);
            expect(result.current.gameOver).toBe(true);
        });

        it('debe simular un empate', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setPlayerOneName('Alice');
                result.current.setPlayerTwoName('Bob');
                result.current.setGameOver(true);
                result.current.setGameResult(Result.DRAW);
            });

            expect(result.current.gameResult).toBe(Result.DRAW);
            expect(result.current.gameOver).toBe(true);
        });

        it('debe permitir reiniciar después de una partida', () => {
            const { result } = renderHook(() => useGameStore());

            // Partida completa
            act(() => {
                result.current.setAmIP1(true);
                result.current.setPlayerOneName('Alice');
                result.current.setPlayerTwoName('Bob');
                result.current.setGameOver(true);
                result.current.setGameResult(Result.PLAYER2WIN);
            });

            // Reiniciar
            act(() => {
                result.current.resetStore();
            });

            // Verificar que se puede iniciar nueva partida
            expect(result.current.gameOver).toBe(false);
            expect(result.current.gameResult).toBe(Result.NONE);

            act(() => {
                result.current.setPlayerOneName('Charlie');
                result.current.setPlayerTwoName('Diana');
            });

            expect(result.current.playerOneName).toBe('Charlie');
            expect(result.current.playerTwoName).toBe('Diana');
        });
    });

    describe('Independencia de propiedades', () => {
        it('debe modificar propiedades independientemente sin afectar otras', () => {
            const { result } = renderHook(() => useGameStore());

            act(() => {
                result.current.setPlayerOneName('Alice');
            });

            expect(result.current.playerOneName).toBe('Alice');
            expect(result.current.gameOver).toBe(false);
            expect(result.current.gameResult).toBe(Result.NONE);

            act(() => {
                result.current.setGameOver(true);
            });

            expect(result.current.playerOneName).toBe('Alice');
            expect(result.current.gameOver).toBe(true);
            expect(result.current.gameResult).toBe(Result.NONE);
        });
    });
});