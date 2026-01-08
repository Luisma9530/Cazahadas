import { describe, it, expect } from 'vitest';
import transformMatrix from '../transformMatrix';

describe('transformMatrix', () => {
    describe('Casos básicos', () => {
        it('debe invertir las filas de una matriz 2x2', () => {
            const matrix = [
                [1, 2],
                [3, 4]
            ];

            const result = transformMatrix(matrix);

            expect(result).toEqual([
                [2, 1],
                [4, 3]
            ]);
        });

        it('debe invertir las filas de una matriz 3x3', () => {
            const matrix = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ];

            const result = transformMatrix(matrix);

            expect(result).toEqual([
                [3, 2, 1],
                [6, 5, 4],
                [9, 8, 7]
            ]);
        });

        it('debe invertir las filas de una matriz 3x5', () => {
            const matrix = [
                [1, 2, 3, 4, 5],
                [6, 7, 8, 9, 10],
                [11, 12, 13, 14, 15]
            ];

            const result = transformMatrix(matrix);

            expect(result).toEqual([
                [5, 4, 3, 2, 1],
                [10, 9, 8, 7, 6],
                [15, 14, 13, 12, 11]
            ]);
        });
    });

    describe('Matrices de diferentes tamaños', () => {
        it('debe manejar matriz 1x1', () => {
            const matrix = [[1]];

            const result = transformMatrix(matrix);

            expect(result).toEqual([[1]]);
        });

        it('debe manejar matriz 1xN (una fila)', () => {
            const matrix = [[1, 2, 3, 4, 5]];

            const result = transformMatrix(matrix);

            expect(result).toEqual([[5, 4, 3, 2, 1]]);
        });

        it('debe manejar matriz Nx1 (una columna)', () => {
            const matrix = [
                [1],
                [2],
                [3],
                [4]
            ];

            const result = transformMatrix(matrix);

            expect(result).toEqual([
                [1],
                [2],
                [3],
                [4]
            ]);
        });

        it('debe manejar matriz rectangular 2x5', () => {
            const matrix = [
                ['a', 'b', 'c', 'd', 'e'],
                ['f', 'g', 'h', 'i', 'j']
            ];

            const result = transformMatrix(matrix);

            expect(result).toEqual([
                ['e', 'd', 'c', 'b', 'a'],
                ['j', 'i', 'h', 'g', 'f']
            ]);
        });

        it('debe manejar matriz rectangular 5x2', () => {
            const matrix = [
                [1, 2],
                [3, 4],
                [5, 6],
                [7, 8],
                [9, 10]
            ];

            const result = transformMatrix(matrix);

            expect(result).toEqual([
                [2, 1],
                [4, 3],
                [6, 5],
                [8, 7],
                [10, 9]
            ]);
        });
    });

    describe('Diferentes tipos de datos', () => {
        it('debe manejar strings', () => {
            const matrix = [
                ['a', 'b', 'c'],
                ['d', 'e', 'f']
            ];

            const result = transformMatrix(matrix);

            expect(result).toEqual([
                ['c', 'b', 'a'],
                ['f', 'e', 'd']
            ]);
        });

        it('debe manejar objetos', () => {
            const obj1 = { id: 1 };
            const obj2 = { id: 2 };
            const obj3 = { id: 3 };
            const obj4 = { id: 4 };

            const matrix = [
                [obj1, obj2],
                [obj3, obj4]
            ];

            const result = transformMatrix(matrix);

            expect(result).toEqual([
                [obj2, obj1],
                [obj4, obj3]
            ]);
        });

        it('debe manejar valores mixtos', () => {
            const matrix = [
                [1, 'a', true, null],
                [undefined, { key: 'value' }, [1, 2], 'test']
            ];

            const result = transformMatrix(matrix);

            expect(result).toEqual([
                [null, true, 'a', 1],
                ['test', [1, 2], { key: 'value' }, undefined]
            ]);
        });

        it('debe manejar booleans', () => {
            const matrix = [
                [true, false, true],
                [false, true, false]
            ];

            const result = transformMatrix(matrix);

            expect(result).toEqual([
                [true, false, true],
                [false, true, false]
            ]);
        });

        it('debe manejar null y undefined', () => {
            const matrix = [
                [null, undefined, null],
                [undefined, null, undefined]
            ];

            const result = transformMatrix(matrix);

            expect(result).toEqual([
                [null, undefined, null],
                [undefined, null, undefined]
            ]);
        });
    });

    describe('Casos edge', () => {
        it('debe manejar matriz vacía', () => {
            const matrix: any[][] = [];

            const result = transformMatrix(matrix);

            expect(result).toEqual([]);
        });

        it('debe manejar matriz con filas vacías', () => {
            const matrix = [[], [], []];

            const result = transformMatrix(matrix);

            expect(result).toEqual([[], [], []]);
        });

        it('debe manejar números negativos', () => {
            const matrix = [
                [-1, -2, -3],
                [-4, -5, -6]
            ];

            const result = transformMatrix(matrix);

            expect(result).toEqual([
                [-3, -2, -1],
                [-6, -5, -4]
            ]);
        });

        it('debe manejar números decimales', () => {
            const matrix = [
                [1.5, 2.7, 3.9],
                [4.1, 5.3, 6.8]
            ];

            const result = transformMatrix(matrix);

            expect(result).toEqual([
                [3.9, 2.7, 1.5],
                [6.8, 5.3, 4.1]
            ]);
        });

        it('debe manejar valores duplicados', () => {
            const matrix = [
                [1, 1, 1],
                [2, 2, 2]
            ];

            const result = transformMatrix(matrix);

            expect(result).toEqual([
                [1, 1, 1],
                [2, 2, 2]
            ]);
        });
    });

    describe('Inmutabilidad', () => {
        it('no debe modificar la matriz original', () => {
            const matrix = [
                [1, 2, 3],
                [4, 5, 6]
            ];

            const original = JSON.parse(JSON.stringify(matrix));
            transformMatrix(matrix);

            expect(matrix).toEqual(original);
        });

        it('debe crear una nueva matriz', () => {
            const matrix = [
                [1, 2, 3],
                [4, 5, 6]
            ];

            const result = transformMatrix(matrix);

            expect(result).not.toBe(matrix);
        });

        // IMPORTANTE: Este test muestra una limitación
        it('las filas internas son mutadas (reverse modifica in-place)', () => {
            const row1 = [1, 2, 3];
            const row2 = [4, 5, 6];
            const matrix = [row1, row2];

            transformMatrix(matrix);

            // ADVERTENCIA: reverse() muta las filas originales
            expect(row1).toEqual([3, 2, 1]);
            expect(row2).toEqual([6, 5, 4]);
        });
    });

    describe('Uso con tipos específicos del juego', () => {
        it('debe manejar matriz de tiles (simulación)', () => {
            const matrix = [
                [
                    { type: 'fairy', marked: false },
                    { type: 'variableX', value: 0 },
                    { type: 'magic', cards: [] }
                ],
                [
                    { type: 'deck', cards: [] },
                    { type: 'empty', card: null },
                    { type: 'discard', cards: [] }
                ]
            ];

            const result = transformMatrix(matrix);

            expect(result).toEqual([
                [
                    { type: 'magic', cards: [] },
                    { type: 'variableX', value: 0 },
                    { type: 'fairy', marked: false }
                ],
                [
                    { type: 'discard', cards: [] },
                    { type: 'empty', card: null },
                    { type: 'deck', cards: [] }
                ]
            ]);
        });

        it('debe manejar matriz de cartas (simulación)', () => {
            const card1 = { id: 1, name: 'Card 1', type: 'CATCH' };
            const card2 = { id: 2, name: 'Card 2', type: 'MAGIC' };
            const card3 = { id: 3, name: 'Card 3', type: 'SHIELD' };

            const matrix = [
                [card1, card2, card3]
            ];

            const result = transformMatrix(matrix);

            expect(result).toEqual([
                [card3, card2, card1]
            ]);
        });
    });

    describe('Simetría', () => {
        it('aplicar transformMatrix dos veces debe retornar a la matriz original', () => {
            const matrix = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ];

            const originalCopy = JSON.parse(JSON.stringify(matrix));
            const once = transformMatrix(JSON.parse(JSON.stringify(matrix)));
            const twice = transformMatrix(once);

            expect(twice).toEqual(originalCopy);
        });

        it('matriz simétrica se mantiene igual después de transformar', () => {
            const matrix = [
                [1, 2, 1],
                [3, 4, 3],
                [5, 6, 5]
            ];

            const result = transformMatrix(matrix);

            expect(result).toEqual(matrix);
        });

        it('matriz palindrómica (filas palindrómicas) se mantiene igual', () => {
            const matrix = [
                [1, 2, 3, 2, 1],
                [5, 4, 3, 4, 5]
            ];

            const result = transformMatrix(matrix);

            expect(result).toEqual(matrix);
        });
    });

    describe('Performance y matrices grandes', () => {
        it('debe manejar matriz grande 100x100', () => {
            const size = 100;
            const matrix = Array.from({ length: size }, (_, i) =>
                Array.from({ length: size }, (_, j) => i * size + j)
            );

            const result = transformMatrix(matrix);

            expect(result.length).toBe(size);
            expect(result[0].length).toBe(size);
            expect(result[0][0]).toBe(size - 1);
            expect(result[0][size - 1]).toBe(0);
        });
    });
});