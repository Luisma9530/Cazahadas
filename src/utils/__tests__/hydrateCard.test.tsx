import { describe, it, expect } from 'vitest';
import { hydrateCard } from '../hydrateCard';
import { CardType, CardInfo } from '../../@types/Card';

describe('hydrateCard', () => {
    describe('Casos básicos', () => {
        it('debe retornar un objeto vacío cuando recibe un objeto vacío', () => {
            const result = hydrateCard({});

            expect(result).toEqual({});
        });

        it('debe retornar la carta sin cambios si no existe en el cardMap', () => {
            const unknownCard: Partial<CardInfo> = {
                name: 'Unknown Card',
                type: CardType.CATCH,
                text: 'This card does not exist'
            };

            const result = hydrateCard(unknownCard);

            expect(result).toEqual(unknownCard);
        });
    });

    describe('Rehidratación de cartas CATCH', () => {
        it('debe retornar carta CATCH sin rehidratar funciones', () => {
            const catchCard: Partial<CardInfo> = {
                name: 'Catch',
                type: CardType.CATCH,
                text: 'Atrapar',
                image: '/cartasPNG/Hatrapahadas.png'
            };

            const result = hydrateCard(catchCard);

            expect(result).toEqual(catchCard);
            expect(result.type).toBe(CardType.CATCH);
        });

        it('no debe añadir propiedades adicionales a cartas CATCH', () => {
            const catchCard: Partial<CardInfo> = {
                name: 'Catch',
                type: CardType.CATCH,
                text: 'Atrapar'
            };

            const result = hydrateCard(catchCard);

            expect(result).not.toHaveProperty('operation');
            expect(result).not.toHaveProperty('defenseCondition');
        });
    });

    describe('Rehidratación de cartas MAGIC', () => {
        it('debe retornar carta MAGIC sin rehidratar funciones', () => {
            const magicCard: Partial<CardInfo> = {
                name: '+=1',
                type: CardType.MAGIC,
                text: '+=1',
                image: '/cartasPNG/ataque1.png'
            };

            const result = hydrateCard(magicCard);

            expect(result).toEqual(magicCard);
            expect(result.type).toBe(CardType.MAGIC);
        });

        it('debe preservar la función operation si ya existe en la carta', () => {
            const operation = (x: number) => x + 1;
            const magicCard: Partial<CardInfo> = {
                name: '+=1',
                type: CardType.MAGIC,
                text: '+=1',
                operation
            };

            const result = hydrateCard(magicCard);

            expect(result).toEqual(magicCard);
            if (result.type === CardType.MAGIC) {
                expect(result.operation).toBe(operation);
            }
        });

        it('no debe añadir defenseCondition a cartas MAGIC', () => {
            const magicCard: Partial<CardInfo> = {
                name: '+=1',
                type: CardType.MAGIC,
                text: '+=1'
            };

            const result = hydrateCard(magicCard);

            expect(result).not.toHaveProperty('defenseCondition');
        });
    });

    describe('Rehidratación de cartas SHIELD', () => {
        it('debe rehidratar la función defenseCondition de carta SHIELD "x>=0"', () => {
            const shieldCard: Partial<CardInfo> = {
                name: 'x>=0',
                type: CardType.SHIELD,
                text: 'if x>=0\n[[no consigue el\nhada]]\nendif',
                image: '/cartasPNG/escudo1.png'
            };

            const result = hydrateCard(shieldCard);

            expect(result.type).toBe(CardType.SHIELD);

            if (result.type === CardType.SHIELD) {
                expect(typeof result.defenseCondition).toBe('function');

                // Verificar que la función funciona correctamente
                expect(result.defenseCondition(0)).toBe(true);
                expect(result.defenseCondition(5)).toBe(true);
                expect(result.defenseCondition(-1)).toBe(false);
            }
        });

        it('debe rehidratar la función defenseCondition de carta SHIELD "x<=0"', () => {
            const shieldCard: Partial<CardInfo> = {
                name: 'x<=0',
                type: CardType.SHIELD,
                text: 'if x<=0\n[[no consigue el\nhada]]\nendif',
                image: '/cartasPNG/escudo4.png'
            };

            const result = hydrateCard(shieldCard);

            if (result.type === CardType.SHIELD) {
                expect(typeof result.defenseCondition).toBe('function');

                expect(result.defenseCondition(0)).toBe(true);
                expect(result.defenseCondition(-5)).toBe(true);
                expect(result.defenseCondition(1)).toBe(false);
            }
        });

        it('debe rehidratar la función defenseCondition de carta SHIELD "x>=1"', () => {
            const shieldCard: Partial<CardInfo> = {
                name: 'x>=1',
                type: CardType.SHIELD,
                text: 'if x>=1\n[[no consigue el\nhada]]\nendif',
                image: '/cartasPNG/escudo2.png'
            };

            const result = hydrateCard(shieldCard);

            if (result.type === CardType.SHIELD) {
                expect(typeof result.defenseCondition).toBe('function');

                expect(result.defenseCondition(1)).toBe(true);
                expect(result.defenseCondition(5)).toBe(true);
                expect(result.defenseCondition(0)).toBe(false);
                expect(result.defenseCondition(-1)).toBe(false);
            }
        });

        it('debe rehidratar la función defenseCondition de carta SHIELD "x<=1"', () => {
            const shieldCard: Partial<CardInfo> = {
                name: 'x<=1',
                type: CardType.SHIELD,
                text: 'if x<=1\n[[no consigue el\nhada]]\nendif',
                image: '/cartasPNG/escudo3.png'
            };

            const result = hydrateCard(shieldCard);

            if (result.type === CardType.SHIELD) {
                expect(typeof result.defenseCondition).toBe('function');

                expect(result.defenseCondition(1)).toBe(true);
                expect(result.defenseCondition(0)).toBe(true);
                expect(result.defenseCondition(-5)).toBe(true);
                expect(result.defenseCondition(2)).toBe(false);
            }
        });

        it('debe preservar todas las propiedades originales al rehidratar SHIELD', () => {
            const shieldCard: Partial<CardInfo> = {
                name: 'x>=0',
                type: CardType.SHIELD,
                text: 'if x>=0\n[[no consigue el\nhada]]\nendif',
                image: '/cartasPNG/escudo1.png',
                placedByPlayerOne: true
            };

            const result = hydrateCard(shieldCard);

            expect(result.name).toBe('x>=0');
            expect(result.type).toBe(CardType.SHIELD);
            expect(result.text).toBe('if x>=0\n[[no consigue el\nhada]]\nendif');
            expect(result.image).toBe('/cartasPNG/escudo1.png');
            expect(result.placedByPlayerOne).toBe(true);

            if (result.type === CardType.SHIELD) {
                expect(typeof result.defenseCondition).toBe('function');
            }
        });

        it('debe sobrescribir defenseCondition existente con la del cardMap', () => {
            const fakeFn = (x: number) => x > 100;
            const shieldCard: Partial<CardInfo> = {
                name: 'x>=0',
                type: CardType.SHIELD,
                text: 'if x>=0\n[[no consigue el\nhada]]\nendif',
                defenseCondition: fakeFn as any
            };

            const result = hydrateCard(shieldCard);

            if (result.type === CardType.SHIELD) {
                // La función debe ser la original, no la fake
                expect(result.defenseCondition).not.toBe(fakeFn);
                expect(result.defenseCondition(0)).toBe(true);
                expect(result.defenseCondition(-1)).toBe(false);
            }
        });
    });

    describe('Casos edge con propiedades adicionales', () => {
        it('debe preservar propiedades adicionales como placedByPlayerOne', () => {
            const card: Partial<CardInfo> = {
                name: 'Catch',
                type: CardType.CATCH,
                text: 'Atrapar',
                placedByPlayerOne: true
            };

            const result = hydrateCard(card);

            expect(result.placedByPlayerOne).toBe(true);
        });

        it('debe manejar cartas con propiedades opcionales undefined', () => {
            const card: Partial<CardInfo> = {
                name: 'Catch',
                type: CardType.CATCH,
                text: 'Atrapar',
                image: undefined
            };

            const result = hydrateCard(card);

            expect(result.name).toBe('Catch');
            expect(result.type).toBe(CardType.CATCH);
        });
    });

    describe('Integración con todas las cartas del deck', () => {
        it('debe poder rehidratar todas las cartas SHIELD del deck', () => {
            const shieldCards = [
                { name: 'x>=0', type: CardType.SHIELD, text: 'test' },
                { name: 'x<=0', type: CardType.SHIELD, text: 'test' },
                { name: 'x>=1', type: CardType.SHIELD, text: 'test' },
                { name: 'x<=1', type: CardType.SHIELD, text: 'test' }
            ];

            shieldCards.forEach(card => {
                const result = hydrateCard(card);

                if (result.type === CardType.SHIELD) {
                    expect(typeof result.defenseCondition).toBe('function');
                }
            });
        });

        it('debe manejar cartas CATCH sin errores', () => {
            const catchCard = {
                name: 'Catch',
                type: CardType.CATCH,
                text: 'Atrapar'
            };

            const result = hydrateCard(catchCard);

            expect(result).toEqual(catchCard);
        });

        it('debe manejar todas las cartas MAGIC sin errores', () => {
            const magicCards = [
                { name: '+=1', type: CardType.MAGIC, text: '+=1' },
                { name: '-=1', type: CardType.MAGIC, text: '-=1' },
                { name: '*=-1', type: CardType.MAGIC, text: '*=-1' },
                { name: '+=2', type: CardType.MAGIC, text: '+=2' },
                { name: '-=2', type: CardType.MAGIC, text: '-=2' },
                { name: 'endfor+=1', type: CardType.MAGIC, text: 'for...' },
                { name: 'endfor-=1', type: CardType.MAGIC, text: 'for...' },
                { name: 'until>0', type: CardType.MAGIC, text: 'do...' },
                { name: 'until<0', type: CardType.MAGIC, text: 'do...' },
                { name: 'endwhilex<=0', type: CardType.MAGIC, text: 'while...' },
                { name: 'endwhilex>=0', type: CardType.MAGIC, text: 'while...' }
            ];

            magicCards.forEach(card => {
                const result = hydrateCard(card);
                expect(result.type).toBe(CardType.MAGIC);
            });
        });
    });

    describe('Comportamiento del cardMap', () => {
        it('debe usar la key correcta format (type-name)', () => {
            const shieldCard: Partial<CardInfo> = {
                name: 'x>=0',
                type: CardType.SHIELD,
                text: 'test'
            };

            const result = hydrateCard(shieldCard);

            // Si encuentra la carta en cardMap, debe rehidratar
            if (result.type === CardType.SHIELD) {
                expect(result.defenseCondition).toBeDefined();
            }
        });

        it('no debe encontrar carta con nombre incorrecto', () => {
            const card: Partial<CardInfo> = {
                name: 'NonExistent',
                type: CardType.SHIELD,
                text: 'test'
            };

            const result = hydrateCard(card);

            // No debe rehidratar porque no existe en cardMap
            expect(result).toEqual(card);
        });

        it('no debe encontrar carta con tipo incorrecto', () => {
            const card: Partial<CardInfo> = {
                name: 'x>=0',
                type: CardType.CATCH, // tipo incorrecto
                text: 'test'
            };

            const result = hydrateCard(card);

            // No debe rehidratar porque la key no coincide
            expect(result).toEqual(card);
        });
    });

    describe('Type safety', () => {
        it('debe mantener type guards correctos después de rehidratar', () => {
            const shieldCard: Partial<CardInfo> = {
                name: 'x>=0',
                type: CardType.SHIELD,
                text: 'test'
            };

            const result = hydrateCard(shieldCard);

            // TypeScript debe permitir este type guard
            if (result.type === CardType.SHIELD) {
                expect(result.defenseCondition).toBeDefined();
                const conditionResult = result.defenseCondition(5);
                expect(typeof conditionResult).toBe('boolean');
            }
        });

        it('debe funcionar con type narrowing de MAGIC', () => {
            const magicCard: Partial<CardInfo> = {
                name: '+=1',
                type: CardType.MAGIC,
                text: '+=1'
            };

            const result = hydrateCard(magicCard);

            if (result.type === CardType.MAGIC) {
                // MAGIC cards no tienen defenseCondition rehidratado
                expect(result).not.toHaveProperty('defenseCondition');
            }
        });
    });
});