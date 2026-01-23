import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor  } from '@testing-library/react';
import GameWrapper from '../GameWrapper';

describe('GameWrapper', () => {
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;

    // Helper para simular tamaño de ventana
    const setWindowSize = (width: number, height: number) => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width,
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: height,
        });
    };

    // Helper para mockear el clientWidth/clientHeight del contenedor
    const mockContainerSize = (width: number, height: number) => {
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
            configurable: true,
            get() {
                if (this.id === 'game-container') {
                    return width;
                }
                return 0;
            },
        });
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
            configurable: true,
            get() {
                if (this.id === 'game-container') {
                    return height;
                }
                return 0;
            },
        });
    };

    beforeEach(() => {
        // Resetear tamaño de ventana
        setWindowSize(1920, 1080);
        mockContainerSize(1920, 1080);
    });

    afterEach(() => {
        // Restaurar tamaño original
        setWindowSize(originalInnerWidth, originalInnerHeight);
        vi.clearAllMocks();
    });

    describe('Renderizado básico', () => {
        it('debe renderizar los children', () => {
            render(
                <GameWrapper>
                    <div data-testid="test-child">Test Content</div>
                </GameWrapper>
            );

            expect(screen.getByTestId('test-child')).toBeInTheDocument();
            expect(screen.getByText('Test Content')).toBeInTheDocument();
        });

        it('debe tener la estructura de clases correcta', () => {
            const { container } = render(
                <GameWrapper>
                    <div>Content</div>
                </GameWrapper>
            );

            const wrapper = container.firstChild as HTMLElement;
            expect(wrapper).toHaveClass('relative', 'w-full', 'h-full', 'overflow-hidden');
        });

        it('debe tener dimensiones base de 1920x1080', () => {
            const { container } = render(
                <GameWrapper>
                    <div>Content</div>
                </GameWrapper>
            );

            const innerDiv = container.querySelector('.absolute') as HTMLElement;
            expect(innerDiv.style.width).toBe('1920px');
            expect(innerDiv.style.height).toBe('1080px');
        });
    });

    describe('Escalado en pantalla completa (1920x1080)', () => {
        it('debe tener escala 1 y offset 0 en resolución base', () => {
            mockContainerSize(1920, 1080);

            const { container } = render(
                <GameWrapper>
                    <div>Content</div>
                </GameWrapper>
            );

            const innerDiv = container.querySelector('.absolute') as HTMLElement;
            expect(innerDiv.style.transform).toContain('scale(1)');
            expect(innerDiv.style.transform).toContain('translate(0px, 0px)');
        });
    });

    describe('Escalado en resoluciones diferentes', () => {
        it('debe escalar correctamente en 960x540 (mitad de tamaño)', () => {
            mockContainerSize(960, 540);

            const { container } = render(
                <GameWrapper>
                    <div>Content</div>
                </GameWrapper>
            );

            const innerDiv = container.querySelector('.absolute') as HTMLElement;
            // Scale debe ser 0.5 (960/1920 = 0.5, 540/1080 = 0.5)
            expect(innerDiv.style.transform).toContain('scale(0.5)');
            expect(innerDiv.style.transform).toContain('translate(0px, 0px)');
        });

        it('debe escalar correctamente en 3840x2160 (4K)', () => {
            mockContainerSize(3840, 2160);

            const { container } = render(
                <GameWrapper>
                    <div>Content</div>
                </GameWrapper>
            );

            const innerDiv = container.querySelector('.absolute') as HTMLElement;
            // Scale debe ser 2 (3840/1920 = 2, 2160/1080 = 2)
            expect(innerDiv.style.transform).toContain('scale(2)');
            expect(innerDiv.style.transform).toContain('translate(0px, 0px)');
        });
    });

    describe('Manejo de aspect ratio diferente (letterboxing/pillarboxing)', () => {
        it('debe añadir barras negras verticales en pantallas ultrawide', () => {
            // Pantalla ultrawide: 2560x1080 (21:9)
            mockContainerSize(2560, 1080);

            const { container } = render(
                <GameWrapper>
                    <div>Content</div>
                </GameWrapper>
            );

            const innerDiv = container.querySelector('.absolute') as HTMLElement;

            // Scale será min(2560/1920, 1080/1080) = min(1.333, 1) = 1
            // scaledWidth = 1920 * 1 = 1920
            // offsetX = (2560 - 1920) / 2 = 320
            expect(innerDiv.style.transform).toContain('scale(1)');
            expect(innerDiv.style.transform).toContain('translate(320px, 0px)');
        });

        it('debe añadir barras negras horizontales en pantallas verticales', () => {
            // Pantalla vertical: 1080x1920 (portrait)
            mockContainerSize(1080, 1920);

            const { container } = render(
                <GameWrapper>
                    <div>Content</div>
                </GameWrapper>
            );

            const innerDiv = container.querySelector('.absolute') as HTMLElement;

            // Scale será min(1080/1920, 1920/1080) = min(0.5625, 1.777) = 0.5625
            // scaledHeight = 1080 * 0.5625 = 607.5
            // offsetY = (1920 - 607.5) / 2 = 656.25
            const transform = innerDiv.style.transform;
            expect(transform).toContain('scale(0.5625)');
            expect(transform).toMatch(/translate\(0px, 656\.25px\)/);
        });

        it('debe manejar pantalla cuadrada (1:1)', () => {
            mockContainerSize(1000, 1000);

            const { container } = render(
                <GameWrapper>
                    <div>Content</div>
                </GameWrapper>
            );

            const innerDiv = container.querySelector('.absolute') as HTMLElement;

            // Scale será min(1000/1920, 1000/1080) = min(0.5208, 0.9259) = 0.5208
            // scaledWidth = 1920 * 0.5208 = 1000
            // scaledHeight = 1080 * 0.5208 = 562.5
            // offsetY = (1000 - 562.5) / 2 = 218.75
            const transform = innerDiv.style.transform;

            expect(transform).toMatch(/scale\(0\.52083\d*\)/);
        });
    });

    describe('Responsive - cambios de tamaño', () => {
        it('debe actualizar escala cuando cambia el tamaño de ventana', async () => {
            mockContainerSize(1920, 1080);

            const { container } = render(
                <GameWrapper>
                    <div>Content</div>
                </GameWrapper>
            );

            let innerDiv = container.querySelector('.absolute') as HTMLElement;
            expect(innerDiv.style.transform).toContain('scale(1)');

            // Cambiar tamaño
            mockContainerSize(960, 540);
            window.dispatchEvent(new Event('resize'));

            // Esperar a que React actualice el DOM
            await waitFor(() => {
                innerDiv = container.querySelector('.absolute') as HTMLElement;
                expect(innerDiv.style.transform).toContain('scale(0.5)');
            });
        });

        it('debe limpiar el event listener al desmontar', () => {
            const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

            const { unmount } = render(
                <GameWrapper>
                    <div>Content</div>
                </GameWrapper>
            );

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
        });
    });

    describe('Casos edge', () => {
        it('debe manejar ventanas muy pequeñas', () => {
            mockContainerSize(320, 180);

            const { container } = render(
                <GameWrapper>
                    <div>Content</div>
                </GameWrapper>
            );

            const innerDiv = container.querySelector('.absolute') as HTMLElement;

            // Scale será min(320/1920, 180/1080) = min(0.1666, 0.1666) = 0.1666
            const transform = innerDiv.style.transform;
            expect(transform).toMatch(/scale\(0\.16666+\)/);
        });

        it('debe manejar ventanas muy grandes', () => {
            mockContainerSize(7680, 4320); // 8K

            const { container } = render(
                <GameWrapper>
                    <div>Content</div>
                </GameWrapper>
            );

            const innerDiv = container.querySelector('.absolute') as HTMLElement;

            // Scale será min(7680/1920, 4320/1080) = min(4, 4) = 4
            expect(innerDiv.style.transform).toContain('scale(4)');
        });

        it('debe manejar proporciones extremas (muy ancho)', () => {
            mockContainerSize(5760, 1080); // 32:6 aprox

            const { container } = render(
                <GameWrapper>
                    <div>Content</div>
                </GameWrapper>
            );

            const innerDiv = container.querySelector('.absolute') as HTMLElement;

            // Scale será min(5760/1920, 1080/1080) = min(3, 1) = 1
            // offsetX = (5760 - 1920) / 2 = 1920
            expect(innerDiv.style.transform).toContain('scale(1)');
            expect(innerDiv.style.transform).toContain('translate(1920px, 0px)');
        });

        it('debe manejar proporciones extremas (muy alto)', () => {
            mockContainerSize(1920, 3240); // 16:27 aprox

            const { container } = render(
                <GameWrapper>
                    <div>Content</div>
                </GameWrapper>
            );

            const innerDiv = container.querySelector('.absolute') as HTMLElement;

            // Scale será min(1920/1920, 3240/1080) = min(1, 3) = 1
            // offsetY = (3240 - 1080) / 2 = 1080
            expect(innerDiv.style.transform).toContain('scale(1)');
            expect(innerDiv.style.transform).toContain('translate(0px, 1080px)');
        });
    });

    describe('Propiedades de estilo', () => {
        it('debe tener background transparent', () => {
            const { container } = render(
                <GameWrapper>
                    <div>Content</div>
                </GameWrapper>
            );

            const innerDiv = container.querySelector('.absolute') as HTMLElement;
            expect(innerDiv.style.background).toBe('transparent');
        });

        it('debe tener origin-top-left', () => {
            const { container } = render(
                <GameWrapper>
                    <div>Content</div>
                </GameWrapper>
            );

            const innerDiv = container.querySelector('.absolute') as HTMLElement;
            expect(innerDiv).toHaveClass('origin-top-left');
        });
    });

    describe('Children rendering', () => {
        it('debe renderizar múltiples children', () => {
            render(
                <GameWrapper>
                    <div data-testid="child-1">Child 1</div>
                    <div data-testid="child-2">Child 2</div>
                    <div data-testid="child-3">Child 3</div>
                </GameWrapper>
            );

            expect(screen.getByTestId('child-1')).toBeInTheDocument();
            expect(screen.getByTestId('child-2')).toBeInTheDocument();
            expect(screen.getByTestId('child-3')).toBeInTheDocument();
        });

        it('debe renderizar children complejos', () => {
            render(
                <GameWrapper>
                    <div>
                        <h1>Title</h1>
                        <p>Paragraph</p>
                        <button>Button</button>
                    </div>
                </GameWrapper>
            );

            expect(screen.getByText('Title')).toBeInTheDocument();
            expect(screen.getByText('Paragraph')).toBeInTheDocument();
            expect(screen.getByText('Button')).toBeInTheDocument();
        });
    });
});