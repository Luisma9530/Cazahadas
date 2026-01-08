import { renderHook, act } from '@testing-library/react';
import useBackgroundStore from '../BackgroundStore';

describe('useBackgroundStore', () => {
    beforeEach(() => {
        // Resetear el store antes de cada test
        const { result } = renderHook(() => useBackgroundStore());
        act(() => {
            result.current.resetBackground();
        });
    });

    it('debe inicializarse con background "none"', () => {
        const { result } = renderHook(() => useBackgroundStore());

        expect(result.current.background).toBe('none');
    });

    it('debe establecer el background con formato url()', () => {
        const { result } = renderHook(() => useBackgroundStore());
        const testUrl = '/images/background.jpg';

        act(() => {
            result.current.setBackground(testUrl);
        });

        expect(result.current.background).toBe(`url(${testUrl})`);
    });

    it('debe resetear el background a "none"', () => {
        const { result } = renderHook(() => useBackgroundStore());

        // Primero establecemos un background
        act(() => {
            result.current.setBackground('/images/test.jpg');
        });

        expect(result.current.background).toBe('url(/images/test.jpg)');

        // Luego lo reseteamos
        act(() => {
            result.current.resetBackground();
        });

        expect(result.current.background).toBe('none');
    });

    it('debe actualizar el background múltiples veces', () => {
        const { result } = renderHook(() => useBackgroundStore());

        act(() => {
            result.current.setBackground('/bg1.jpg');
        });
        expect(result.current.background).toBe('url(/bg1.jpg)');

        act(() => {
            result.current.setBackground('/bg2.jpg');
        });
        expect(result.current.background).toBe('url(/bg2.jpg)');

        act(() => {
            result.current.setBackground('/bg3.jpg');
        });
        expect(result.current.background).toBe('url(/bg3.jpg)');
    });

    it('debe manejar URLs con caracteres especiales', () => {
        const { result } = renderHook(() => useBackgroundStore());
        const complexUrl = 'https://example.com/images/bg%20image.jpg?v=123';

        act(() => {
            result.current.setBackground(complexUrl);
        });

        expect(result.current.background).toBe(`url(${complexUrl})`);
    });
});