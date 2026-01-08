import { describe, it, expect } from 'vitest';
import { deckCards } from '../deck';
import { CardType } from '../../@types/Card';

describe('deck', () => {
    describe('Estructura del deck', () => {
        it('debe contener 25 cartas en total', () => {
            expect(deckCards).toHaveLength(25);
        });

        it('debe contener 2 cartas de tipo CATCH', () => {
            const catchCards = deckCards.filter(card => card.type === CardType.CATCH);
            expect(catchCards).toHaveLength(2);
        });

        it('debe contener 15 cartas de tipo MAGIC', () => {
            const magicCards = deckCards.filter(card => card.type === CardType.MAGIC);
            expect(magicCards).toHaveLength(15);
        });

        it('debe contener 8 cartas de tipo SHIELD', () => {
            const shieldCards = deckCards.filter(card => card.type === CardType.SHIELD);
            expect(shieldCards).toHaveLength(8);
        });
    });

    describe('Cartas CATCH', () => {
        it('todas las cartas CATCH deben tener las propiedades correctas', () => {
            const catchCards = deckCards.filter(card => card.type === CardType.CATCH);

            catchCards.forEach(card => {
                expect(card.name).toBe('Catch');
                expect(card.text).toBe('Atrapar');
                expect(card.image).toBe('/cartasPNG/Hatrapahadas.png');
                expect(card.type).toBe(CardType.CATCH);
            });
        });
    });

    describe('Cartas MAGIC', () => {
        it('todas las cartas MAGIC deben tener una función operation', () => {
            const magicCards = deckCards.filter(card => card.type === CardType.MAGIC);

            magicCards.forEach(card => {
                if (card.type === CardType.MAGIC) {
                    expect(typeof card.operation).toBe('function');
                }
            });
        });

        describe('Operaciones aritméticas simples', () => {
            it('cartas "+=1" deben sumar 1', () => {
                const plusOneCards = deckCards.filter(
                    card => card.type === CardType.MAGIC && card.name === '+=1'
                );

                expect(plusOneCards).toHaveLength(2);

                plusOneCards.forEach(card => {
                    if (card.type === CardType.MAGIC) {
                        expect(card.operation(5)).toBe(6);
                        expect(card.operation(0)).toBe(1);
                        expect(card.operation(-3)).toBe(-2);
                    }
                });
            });

            it('cartas "-=1" deben restar 1', () => {
                const minusOneCards = deckCards.filter(
                    card => card.type === CardType.MAGIC && card.name === '-=1'
                );

                expect(minusOneCards).toHaveLength(2);

                minusOneCards.forEach(card => {
                    if (card.type === CardType.MAGIC) {
                        expect(card.operation(5)).toBe(4);
                        expect(card.operation(0)).toBe(-1);
                        expect(card.operation(-3)).toBe(-4);
                    }
                });
            });

            it('carta "*=-1" debe multiplicar por -1', () => {
                const timesMinusOneCard = deckCards.find(
                    card => card.type === CardType.MAGIC && card.name === '*=-1'
                );

                expect(timesMinusOneCard).toBeDefined();

                if (timesMinusOneCard && timesMinusOneCard.type === CardType.MAGIC) {
                    expect(timesMinusOneCard.operation(5)).toBe(-5);
                    expect(timesMinusOneCard.operation(-3)).toBe(3);
                    expect(timesMinusOneCard.operation(0)).toBe(0);
                }
            });

            it('cartas "+=2" deben sumar 2', () => {
                const plusTwoCards = deckCards.filter(
                    card => card.type === CardType.MAGIC && card.name === '+=2'
                );

                expect(plusTwoCards).toHaveLength(2);

                plusTwoCards.forEach(card => {
                    if (card.type === CardType.MAGIC) {
                        expect(card.operation(5)).toBe(7);
                        expect(card.operation(0)).toBe(2);
                        expect(card.operation(-3)).toBe(-1);
                    }
                });
            });

            it('cartas "-=2" deben restar 2', () => {
                const minusTwoCards = deckCards.filter(
                    card => card.type === CardType.MAGIC && card.name === '-=2'
                );

                expect(minusTwoCards).toHaveLength(2);

                minusTwoCards.forEach(card => {
                    if (card.type === CardType.MAGIC) {
                        expect(card.operation(5)).toBe(3);
                        expect(card.operation(0)).toBe(-2);
                        expect(card.operation(-3)).toBe(-5);
                    }
                });
            });
        });

        describe('Operaciones de bucle for', () => {
            it('carta "endfor+=1" debe ejecutar bucle descendente incrementando', () => {
                const forCard = deckCards.find(
                    card => card.type === CardType.MAGIC && card.name === 'endfor+=1'
                );

                expect(forCard).toBeDefined();

                if (forCard && forCard.type === CardType.MAGIC) {
                    // Para x=0: end=1, bucle de i=1 hasta i>=1 (1 iteración), resultado: 1
                    expect(forCard.operation(0)).toBe(1);

                    // Para x=1: end=2, bucle de i=1 hasta i>=2 (2 iteraciones), resultado: 3
                    expect(forCard.operation(1)).toBe(3);

                    // Para x=2: end=3, bucle de i=1 hasta i>=3 (3 iteraciones), resultado: 5
                    expect(forCard.operation(2)).toBe(5);

                    // Para x=-1: end=0, bucle de i=1 hasta i>=0 (0 iteraciones), resultado: -1
                    expect(forCard.operation(-1)).toBe(-1);
                }
            });

            it('carta "endfor-=1" debe ejecutar bucle ascendente decrementando', () => {
                const forCard = deckCards.find(
                    card => card.type === CardType.MAGIC && card.name === 'endfor-=1'
                );

                expect(forCard).toBeDefined();

                if (forCard && forCard.type === CardType.MAGIC) {
                    // Para x=0: end=1, bucle de i=1 hasta i<=1 (1 iteración), resultado: -1
                    expect(forCard.operation(0)).toBe(-1);

                    // Para x=1: end=2, bucle de i=1 hasta i<=2 (2 iteraciones), resultado: -1
                    expect(forCard.operation(1)).toBe(-1);

                    // Para x=2: end=3, bucle de i=1 hasta i<=3 (3 iteraciones), resultado: -1
                    expect(forCard.operation(2)).toBe(-1);

                    // Para x=-1: end=0, bucle no se ejecuta (0 iteraciones), resultado: -1
                    expect(forCard.operation(-1)).toBe(-1);
                }
            });
        });

        describe('Operaciones de bucle do-until', () => {
            it('carta "until>0" debe incrementar hasta que x>0', () => {
                const doCard = deckCards.find(
                    card => card.type === CardType.MAGIC && card.name === 'until>0'
                );

                expect(doCard).toBeDefined();

                if (doCard && doCard.type === CardType.MAGIC) {
                    // x=-3: incrementa hasta llegar a 1
                    expect(doCard.operation(-3)).toBe(1);

                    // x=0: incrementa una vez a 1
                    expect(doCard.operation(0)).toBe(1);

                    // x=1: ya es >0, pero do-until ejecuta al menos una vez, resultado: 2
                    expect(doCard.operation(1)).toBe(2);

                    // x=5: ejecuta una vez, resultado: 6
                    expect(doCard.operation(5)).toBe(6);
                }
            });

            it('carta "until<0" debe decrementar hasta que x<0', () => {
                const doCard = deckCards.find(
                    card => card.type === CardType.MAGIC && card.name === 'until<0'
                );

                expect(doCard).toBeDefined();

                if (doCard && doCard.type === CardType.MAGIC) {
                    // x=3: decrementa hasta llegar a -1
                    expect(doCard.operation(3)).toBe(-1);

                    // x=0: decrementa una vez a -1
                    expect(doCard.operation(0)).toBe(-1);

                    // x=-1: ya es <0, pero do-until ejecuta al menos una vez, resultado: -2
                    expect(doCard.operation(-1)).toBe(-2);

                    // x=-5: ejecuta una vez, resultado: -6
                    expect(doCard.operation(-5)).toBe(-6);
                }
            });
        });

        describe('Operaciones de bucle while', () => {
            it('carta "endwhilex<=0" debe incrementar mientras x<=0', () => {
                const whileCard = deckCards.find(
                    card => card.type === CardType.MAGIC && card.name === 'endwhilex<=0'
                );

                expect(whileCard).toBeDefined();

                if (whileCard && whileCard.type === CardType.MAGIC) {
                    // x=-3: incrementa hasta llegar a 1
                    expect(whileCard.operation(-3)).toBe(1);

                    // x=0: incrementa una vez a 1
                    expect(whileCard.operation(0)).toBe(1);

                    // x=1: no entra en el bucle, resultado: 1
                    expect(whileCard.operation(1)).toBe(1);

                    // x=5: no entra en el bucle, resultado: 5
                    expect(whileCard.operation(5)).toBe(5);
                }
            });

            it('carta "endwhilex>=0" debe decrementar mientras x>=0', () => {
                const whileCard = deckCards.find(
                    card => card.type === CardType.MAGIC && card.name === 'endwhilex>=0'
                );

                expect(whileCard).toBeDefined();

                if (whileCard && whileCard.type === CardType.MAGIC) {
                    // x=3: decrementa hasta llegar a -1
                    expect(whileCard.operation(3)).toBe(-1);

                    // x=0: decrementa una vez a -1
                    expect(whileCard.operation(0)).toBe(-1);

                    // x=-1: no entra en el bucle, resultado: -1
                    expect(whileCard.operation(-1)).toBe(-1);

                    // x=-5: no entra en el bucle, resultado: -5
                    expect(whileCard.operation(-5)).toBe(-5);
                }
            });
        });

        describe('Diferencias entre while y do-until', () => {
            it('while no ejecuta si la condición es falsa inicialmente', () => {
                const whileCard = deckCards.find(
                    card => card.type === CardType.MAGIC && card.name === 'endwhilex<=0'
                );

                if (whileCard && whileCard.type === CardType.MAGIC) {
                    // x=5 no cumple x<=0, no se ejecuta
                    expect(whileCard.operation(5)).toBe(5);
                }
            });

            it('do-until ejecuta al menos una vez aunque la condición sea falsa', () => {
                const doCard = deckCards.find(
                    card => card.type === CardType.MAGIC && card.name === 'until>0'
                );

                if (doCard && doCard.type === CardType.MAGIC) {
                    // x=5 ya es >0, pero do-until ejecuta una vez
                    expect(doCard.operation(5)).toBe(6);
                }
            });
        });
    });

    describe('Cartas SHIELD', () => {
        it('todas las cartas SHIELD deben tener una función defenseCondition', () => {
            const shieldCards = deckCards.filter(card => card.type === CardType.SHIELD);

            shieldCards.forEach(card => {
                if (card.type === CardType.SHIELD) {
                    expect(typeof card.defenseCondition).toBe('function');
                }
            });
        });

        it('debe haber 3 cartas "x>=0"', () => {
            const cards = deckCards.filter(
                card => card.type === CardType.SHIELD && card.name === 'x>=0'
            );

            expect(cards).toHaveLength(3);

            cards.forEach(card => {
                if (card.type === CardType.SHIELD) {
                    expect(card.defenseCondition(0)).toBe(true);
                    expect(card.defenseCondition(1)).toBe(true);
                    expect(card.defenseCondition(5)).toBe(true);
                    expect(card.defenseCondition(-1)).toBe(false);
                    expect(card.defenseCondition(-5)).toBe(false);
                }
            });
        });

        it('debe haber 3 cartas "x<=0"', () => {
            const cards = deckCards.filter(
                card => card.type === CardType.SHIELD && card.name === 'x<=0'
            );

            expect(cards).toHaveLength(3);

            cards.forEach(card => {
                if (card.type === CardType.SHIELD) {
                    expect(card.defenseCondition(0)).toBe(true);
                    expect(card.defenseCondition(-1)).toBe(true);
                    expect(card.defenseCondition(-5)).toBe(true);
                    expect(card.defenseCondition(1)).toBe(false);
                    expect(card.defenseCondition(5)).toBe(false);
                }
            });
        });

        it('debe haber 1 carta "x>=1"', () => {
            const cards = deckCards.filter(
                card => card.type === CardType.SHIELD && card.name === 'x>=1'
            );

            expect(cards).toHaveLength(1);

            cards.forEach(card => {
                if (card.type === CardType.SHIELD) {
                    expect(card.defenseCondition(1)).toBe(true);
                    expect(card.defenseCondition(5)).toBe(true);
                    expect(card.defenseCondition(0)).toBe(false);
                    expect(card.defenseCondition(-1)).toBe(false);
                }
            });
        });

        it('debe haber 1 carta "x<=1"', () => {
            const cards = deckCards.filter(
                card => card.type === CardType.SHIELD && card.name === 'x<=1'
            );

            expect(cards).toHaveLength(1);

            cards.forEach(card => {
                if (card.type === CardType.SHIELD) {
                    expect(card.defenseCondition(1)).toBe(true);
                    expect(card.defenseCondition(0)).toBe(true);
                    expect(card.defenseCondition(-5)).toBe(true);
                    expect(card.defenseCondition(2)).toBe(false);
                    expect(card.defenseCondition(5)).toBe(false);
                }
            });
        });
    });

    describe('Propiedades de las cartas', () => {
        it('todas las cartas deben tener name, type y text', () => {
            deckCards.forEach(card => {
                expect(card.name).toBeDefined();
                expect(card.type).toBeDefined();
                expect(card.text).toBeDefined();
                expect(typeof card.name).toBe('string');
                expect(typeof card.text).toBe('string');
            });
        });

        it('todas las cartas deben tener una imagen', () => {
            deckCards.forEach(card => {
                expect(card.image).toBeDefined();
                expect(typeof card.image).toBe('string');
                expect(card.image).toMatch(/^\/cartasPNG\/.+\.png$/);
            });
        });

        it('las cartas MAGIC deben tener text descriptivo del código', () => {
            const magicCards = deckCards.filter(card => card.type === CardType.MAGIC);

            magicCards.forEach(card => {
                expect(card.text.length).toBeGreaterThan(0);
                // Las cartas con bucles deben contener palabras clave
                if (card.name.includes('for') || card.name.includes('while') || card.name.includes('until')) {
                    expect(
                        card.text.includes('for') ||
                        card.text.includes('while') ||
                        card.text.includes('until') ||
                        card.text.includes('do')
                    ).toBe(true);
                }
            });
        });

        it('las cartas SHIELD deben tener text con estructura if-endif', () => {
            const shieldCards = deckCards.filter(card => card.type === CardType.SHIELD);

            shieldCards.forEach(card => {
                expect(card.text).toContain('if');
                expect(card.text).toContain('endif');
            });
        });
    });

    describe('Balance del deck', () => {
        it('debe tener más cartas MAGIC que otros tipos', () => {
            const magicCount = deckCards.filter(card => card.type === CardType.MAGIC).length;
            const catchCount = deckCards.filter(card => card.type === CardType.CATCH).length;
            const shieldCount = deckCards.filter(card => card.type === CardType.SHIELD).length;

            expect(magicCount).toBeGreaterThan(catchCount);
            expect(magicCount).toBeGreaterThan(shieldCount);
        });

        it('debe tener más cartas SHIELD que CATCH', () => {
            const catchCount = deckCards.filter(card => card.type === CardType.CATCH).length;
            const shieldCount = deckCards.filter(card => card.type === CardType.SHIELD).length;

            expect(shieldCount).toBeGreaterThan(catchCount);
        });
    });
});