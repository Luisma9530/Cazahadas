import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useBoardStore from '../BoardStore';
import { Tile } from '../../@types/Tile';

describe('useBoardStore', () => {
    beforeEach(() => {
        const { result } = renderHook(() => useBoardStore());
        act(() => {
            result.current.resetStore();
        });
    });

    describe('Inicialización del tablero', () => {
        it('debe crear un tablero de 3x5', () => {
            const { result } = renderHook(() => useBoardStore());

            expect(result.current.board).toHaveLength(3);
            expect(result.current.board[0]).toHaveLength(5);
            expect(result.current.board[1]).toHaveLength(5);
            expect(result.current.board[2]).toHaveLength(5);
        });

        it('debe inicializar las hadas en juego en la fila central (posiciones 0, 1, 2)', () => {
            const { result } = renderHook(() => useBoardStore());

            expect(result.current.board[1][0]).toEqual({
                type: 'fairy',
                marked: false,
                card: null,
                captured: false,
                placedByPlayerOne: null
            });
            expect(result.current.board[1][1]).toEqual({
                type: 'fairy',
                marked: false,
                card: null,
                captured: false,
                placedByPlayerOne: null
            });
            expect(result.current.board[1][2]).toEqual({
                type: 'fairy',
                marked: false,
                card: null,
                captured: false,
                placedByPlayerOne: null
            });
        });

        it('debe inicializar la variable X en [1][3] con valor 0', () => {
            const { result } = renderHook(() => useBoardStore());

            expect(result.current.board[1][3]).toEqual({
                type: 'variableX',
                value: 0
            });
        });

        it('debe inicializar la casilla de magia del rival en [1][4]', () => {
            const { result } = renderHook(() => useBoardStore());

            expect(result.current.board[1][4]).toEqual({
                type: 'magic',
                owner: 'playerOne',
                cards: []
            });
        });

        it('debe inicializar correctamente la fila superior (playerTwo)', () => {
            const { result } = renderHook(() => useBoardStore());

            // Deck del rival
            expect(result.current.board[0][0]).toEqual({
                type: 'deck',
                owner: 'playerTwo',
                cards: []
            });

            // Hadas capturadas del rival
            expect(result.current.board[0][1]).toEqual({
                type: 'capturedFairies',
                owner: 'playerTwo',
                cards: []
            });

            // Descartes del rival
            expect(result.current.board[0][2]).toEqual({
                type: 'discard',
                owner: 'playerTwo',
                cards: []
            });
        });

        it('debe inicializar correctamente la fila inferior (playerOne)', () => {
            const { result } = renderHook(() => useBoardStore());

            // Deck del jugador
            expect(result.current.board[2][0]).toEqual({
                type: 'deck',
                owner: 'playerOne',
                cards: []
            });

            // Hadas capturadas del jugador
            expect(result.current.board[2][1]).toEqual({
                type: 'capturedFairies',
                owner: 'playerOne',
                cards: []
            });

            // Descartes del jugador
            expect(result.current.board[2][2]).toEqual({
                type: 'discard',
                owner: 'playerOne',
                cards: []
            });
        });

        it('debe inicializar las casillas vacías correctamente', () => {
            const { result } = renderHook(() => useBoardStore());

            // Verificar algunas casillas vacías
            expect(result.current.board[0][3]).toEqual({
                type: 'empty',
                card: null
            });
            expect(result.current.board[0][4]).toEqual({
                type: 'empty',
                card: null
            });
            expect(result.current.board[2][3]).toEqual({
                type: 'empty',
                card: null
            });
        });
    });

    describe('setBoard', () => {
        it('debe actualizar el tablero completamente', () => {
            const { result } = renderHook(() => useBoardStore());

            const newBoard: Tile[][] = new Array(3).fill(null).map(() =>
                new Array(5).fill({ type: 'empty', card: null })
            );

            act(() => {
                result.current.setBoard(newBoard);
            });

            expect(result.current.board).toEqual(newBoard);
        });

        it('debe poder actualizar casillas específicas', () => {
            const { result } = renderHook(() => useBoardStore());

            const modifiedBoard = result.current.board.map((row, i) =>
                row.map((tile, j) => {
                    if (i === 1 && j === 0 && tile.type === 'fairy') {
                        return { ...tile, marked: true };
                    }
                    return tile;
                })
            );

            act(() => {
                result.current.setBoard(modifiedBoard);
            });

            expect(result.current.board[1][0]).toMatchObject({
                type: 'fairy',
                marked: true
            });
        });
    });

    describe('resetStore', () => {
        it('debe restaurar el tablero al estado inicial', () => {
            const { result } = renderHook(() => useBoardStore());

            // Modificar el tablero
            const modifiedBoard: Tile[][] = new Array(3).fill(null).map(() =>
                new Array(5).fill({ type: 'empty', card: null })
            );

            act(() => {
                result.current.setBoard(modifiedBoard);
            });

            expect(result.current.board).toEqual(modifiedBoard);

            // Resetear
            act(() => {
                result.current.resetStore();
            });

            // Verificar que vuelve al estado inicial
            expect(result.current.board[1][0].type).toBe('fairy');
            expect(result.current.board[1][3]).toEqual({ type: 'variableX', value: 0 });
        });
    });

    describe('clearDeckAndMagic', () => {
        it('debe limpiar todas las cartas de los decks', () => {
            const { result } = renderHook(() => useBoardStore());

            // Añadir cartas a los decks
            const boardWithCards = result.current.board.map(row =>
                row.map(tile => {
                    if (tile.type === 'deck') {
                        return { ...tile, cards: ['card1', 'card2'] as any };
                    }
                    return tile;
                })
            );

            act(() => {
                result.current.setBoard(boardWithCards);
            });

            // Verificar que hay cartas
            expect(result.current.board[0][0]).toMatchObject({
                type: 'deck',
                cards: ['card1', 'card2']
            });

            // Limpiar
            act(() => {
                result.current.clearDeckAndMagic();
            });

            // Verificar que están vacías
            expect(result.current.board[0][0]).toMatchObject({
                type: 'deck',
                cards: []
            });
            expect(result.current.board[2][0]).toMatchObject({
                type: 'deck',
                cards: []
            });
        });

        it('debe limpiar todas las cartas de las casillas magic', () => {
            const { result } = renderHook(() => useBoardStore());

            // Añadir cartas a magic
            const boardWithMagic = result.current.board.map(row =>
                row.map(tile => {
                    if (tile.type === 'magic') {
                        return { ...tile, cards: ['magic1', 'magic2'] as any };
                    }
                    return tile;
                })
            );

            act(() => {
                result.current.setBoard(boardWithMagic);
            });

            // Limpiar
            act(() => {
                result.current.clearDeckAndMagic();
            });

            // Verificar
            expect(result.current.board[1][4]).toMatchObject({
                type: 'magic',
                cards: []
            });
        });

        it('no debe afectar otras casillas', () => {
            const { result } = renderHook(() => useBoardStore());

            const initialVariableX = result.current.board[1][3];
            const initialFairy = result.current.board[1][0];

            act(() => {
                result.current.clearDeckAndMagic();
            });

            expect(result.current.board[1][3]).toEqual(initialVariableX);
            expect(result.current.board[1][0]).toEqual(initialFairy);
        });
    });

    describe('resetVariableX', () => {
        it('debe resetear la variable X a 0', () => {
            const { result } = renderHook(() => useBoardStore());

            // Modificar variable X
            const boardWithModifiedX = result.current.board.map((row, i) =>
                row.map((tile, j) => {
                    if (i === 1 && j === 3 && tile.type === 'variableX') {
                        return { ...tile, value: 10 };
                    }
                    return tile;
                })
            );

            act(() => {
                result.current.setBoard(boardWithModifiedX);
            });

            expect(result.current.board[1][3]).toEqual({
                type: 'variableX',
                value: 10
            });

            // Resetear
            act(() => {
                result.current.resetVariableX();
            });

            expect(result.current.board[1][3]).toEqual({
                type: 'variableX',
                value: 0
            });
        });

        it('no debe afectar otras casillas', () => {
            const { result } = renderHook(() => useBoardStore());

            const initialFairy = result.current.board[1][0];
            const initialDeck = result.current.board[2][0];

            act(() => {
                result.current.resetVariableX();
            });

            expect(result.current.board[1][0]).toEqual(initialFairy);
            expect(result.current.board[2][0]).toEqual(initialDeck);
        });
    });

    describe('endBattle', () => {
        it('debe limpiar decks, magic y resetear variable X simultáneamente', () => {
            const { result } = renderHook(() => useBoardStore());

            // Configurar estado con cartas y variable X modificada
            const modifiedBoard = result.current.board.map((row, i) =>
                row.map((tile, j) => {
                    if (tile.type === 'deck' || tile.type === 'magic') {
                        return { ...tile, cards: ['card1', 'card2'] as any };
                    }
                    if (i === 1 && j === 3 && tile.type === 'variableX') {
                        return { ...tile, value: 15 };
                    }
                    return tile;
                })
            );

            act(() => {
                result.current.setBoard(modifiedBoard);
            });

            // Ejecutar endBattle
            act(() => {
                result.current.endBattle();
            });

            // Verificar que todo se resetea
            expect(result.current.board[0][0]).toMatchObject({
                type: 'deck',
                cards: []
            });
            expect(result.current.board[2][0]).toMatchObject({
                type: 'deck',
                cards: []
            });
            expect(result.current.board[1][4]).toMatchObject({
                type: 'magic',
                cards: []
            });
            expect(result.current.board[1][3]).toEqual({
                type: 'variableX',
                value: 0
            });
        });

        it('debe preservar el estado de las hadas y otras casillas', () => {
            const { result } = renderHook(() => useBoardStore());

            const initialCapturedFairies = result.current.board[2][1];
            const initialFairy = result.current.board[1][0];

            act(() => {
                result.current.endBattle();
            });

            expect(result.current.board[2][1]).toEqual(initialCapturedFairies);
            expect(result.current.board[1][0]).toEqual(initialFairy);
        });
    });
});