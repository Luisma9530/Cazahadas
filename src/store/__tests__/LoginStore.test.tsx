import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../LoginStore';

describe('useAuthStore', () => {
    beforeEach(() => {
        const { result } = renderHook(() => useAuthStore());
        act(() => {
            result.current.setLogedUser(null);
            result.current.setToken(null);
        });
    });

    describe('Inicialización', () => {
        it('debe inicializarse con valores null', () => {
            const { result } = renderHook(() => useAuthStore());

            expect(result.current.logedUser).toBeNull();
            expect(result.current.token).toBeNull();
        });
    });

    describe('setLogedUser', () => {
        it('debe establecer el nombre de usuario', () => {
            const { result } = renderHook(() => useAuthStore());

            act(() => {
                result.current.setLogedUser('alice123');
            });

            expect(result.current.logedUser).toBe('alice123');
        });

        it('debe actualizar el nombre de usuario', () => {
            const { result } = renderHook(() => useAuthStore());

            act(() => {
                result.current.setLogedUser('alice123');
            });

            expect(result.current.logedUser).toBe('alice123');

            act(() => {
                result.current.setLogedUser('bob456');
            });

            expect(result.current.logedUser).toBe('bob456');
        });

        it('debe poder establecer el usuario a null (logout)', () => {
            const { result } = renderHook(() => useAuthStore());

            act(() => {
                result.current.setLogedUser('alice123');
            });

            expect(result.current.logedUser).toBe('alice123');

            act(() => {
                result.current.setLogedUser(null);
            });

            expect(result.current.logedUser).toBeNull();
        });

        it('debe manejar nombres de usuario con espacios y caracteres especiales', () => {
            const { result } = renderHook(() => useAuthStore());

            act(() => {
                result.current.setLogedUser('user@example.com');
            });

            expect(result.current.logedUser).toBe('user@example.com');

            act(() => {
                result.current.setLogedUser('José María 123');
            });

            expect(result.current.logedUser).toBe('José María 123');
        });

        it('debe manejar strings vacíos', () => {
            const { result } = renderHook(() => useAuthStore());

            act(() => {
                result.current.setLogedUser('');
            });

            expect(result.current.logedUser).toBe('');
        });

        it('no debe afectar el token al cambiar el usuario', () => {
            const { result } = renderHook(() => useAuthStore());

            act(() => {
                result.current.setToken('token123');
            });

            expect(result.current.token).toBe('token123');

            act(() => {
                result.current.setLogedUser('alice123');
            });

            expect(result.current.logedUser).toBe('alice123');
            expect(result.current.token).toBe('token123');
        });
    });

    describe('setToken', () => {
        it('debe establecer el token', () => {
            const { result } = renderHook(() => useAuthStore());

            act(() => {
                result.current.setToken('abc123def456');
            });

            expect(result.current.token).toBe('abc123def456');
        });

        it('debe actualizar el token', () => {
            const { result } = renderHook(() => useAuthStore());

            act(() => {
                result.current.setToken('token1');
            });

            expect(result.current.token).toBe('token1');

            act(() => {
                result.current.setToken('token2');
            });

            expect(result.current.token).toBe('token2');
        });

        it('debe poder establecer el token a null (logout)', () => {
            const { result } = renderHook(() => useAuthStore());

            act(() => {
                result.current.setToken('abc123def456');
            });

            expect(result.current.token).toBe('abc123def456');

            act(() => {
                result.current.setToken(null);
            });

            expect(result.current.token).toBeNull();
        });

        it('debe manejar tokens JWT realistas', () => {
            const { result } = renderHook(() => useAuthStore());
            const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

            act(() => {
                result.current.setToken(jwtToken);
            });

            expect(result.current.token).toBe(jwtToken);
        });

        it('debe manejar strings vacíos', () => {
            const { result } = renderHook(() => useAuthStore());

            act(() => {
                result.current.setToken('');
            });

            expect(result.current.token).toBe('');
        });

        it('no debe afectar el usuario al cambiar el token', () => {
            const { result } = renderHook(() => useAuthStore());

            act(() => {
                result.current.setLogedUser('alice123');
            });

            expect(result.current.logedUser).toBe('alice123');

            act(() => {
                result.current.setToken('token123');
            });

            expect(result.current.token).toBe('token123');
            expect(result.current.logedUser).toBe('alice123');
        });
    });

    describe('Flujos de autenticación completos', () => {
        it('debe simular un login exitoso', () => {
            const { result } = renderHook(() => useAuthStore());

            // Estado inicial (no autenticado)
            expect(result.current.logedUser).toBeNull();
            expect(result.current.token).toBeNull();

            // Login
            act(() => {
                result.current.setLogedUser('alice123');
                result.current.setToken('jwt-token-abc123');
            });

            expect(result.current.logedUser).toBe('alice123');
            expect(result.current.token).toBe('jwt-token-abc123');
        });

        it('debe simular un logout', () => {
            const { result } = renderHook(() => useAuthStore());

            // Login primero
            act(() => {
                result.current.setLogedUser('alice123');
                result.current.setToken('jwt-token-abc123');
            });

            expect(result.current.logedUser).toBe('alice123');
            expect(result.current.token).toBe('jwt-token-abc123');

            // Logout
            act(() => {
                result.current.setLogedUser(null);
                result.current.setToken(null);
            });

            expect(result.current.logedUser).toBeNull();
            expect(result.current.token).toBeNull();
        });

        it('debe simular renovación de token', () => {
            const { result } = renderHook(() => useAuthStore());

            // Login inicial
            act(() => {
                result.current.setLogedUser('alice123');
                result.current.setToken('old-token');
            });

            expect(result.current.token).toBe('old-token');

            // Renovar token (usuario permanece igual)
            act(() => {
                result.current.setToken('new-token');
            });

            expect(result.current.logedUser).toBe('alice123');
            expect(result.current.token).toBe('new-token');
        });

        it('debe simular cambio de usuario (login con otra cuenta)', () => {
            const { result } = renderHook(() => useAuthStore());

            // Primer usuario
            act(() => {
                result.current.setLogedUser('alice123');
                result.current.setToken('token-alice');
            });

            expect(result.current.logedUser).toBe('alice123');
            expect(result.current.token).toBe('token-alice');

            // Cambiar a segundo usuario
            act(() => {
                result.current.setLogedUser('bob456');
                result.current.setToken('token-bob');
            });

            expect(result.current.logedUser).toBe('bob456');
            expect(result.current.token).toBe('token-bob');
        });

        it('debe manejar sesión expirada (limpiar solo token)', () => {
            const { result } = renderHook(() => useAuthStore());

            // Usuario logueado
            act(() => {
                result.current.setLogedUser('alice123');
                result.current.setToken('token123');
            });

            // Token expira pero usuario puede quedar para mostrar "sesión expirada"
            act(() => {
                result.current.setToken(null);
            });

            expect(result.current.logedUser).toBe('alice123');
            expect(result.current.token).toBeNull();
        });

        it('debe permitir múltiples ciclos de login/logout', () => {
            const { result } = renderHook(() => useAuthStore());

            // Primer ciclo
            act(() => {
                result.current.setLogedUser('alice');
                result.current.setToken('token1');
            });
            expect(result.current.logedUser).toBe('alice');

            act(() => {
                result.current.setLogedUser(null);
                result.current.setToken(null);
            });
            expect(result.current.logedUser).toBeNull();

            // Segundo ciclo
            act(() => {
                result.current.setLogedUser('bob');
                result.current.setToken('token2');
            });
            expect(result.current.logedUser).toBe('bob');

            act(() => {
                result.current.setLogedUser(null);
                result.current.setToken(null);
            });
            expect(result.current.logedUser).toBeNull();
        });
    });

    describe('Estados edge cases', () => {
        it('debe permitir tener usuario sin token', () => {
            const { result } = renderHook(() => useAuthStore());

            act(() => {
                result.current.setLogedUser('alice123');
            });

            expect(result.current.logedUser).toBe('alice123');
            expect(result.current.token).toBeNull();
        });

        it('debe permitir tener token sin usuario', () => {
            const { result } = renderHook(() => useAuthStore());

            act(() => {
                result.current.setToken('token123');
            });

            expect(result.current.logedUser).toBeNull();
            expect(result.current.token).toBe('token123');
        });

        it('debe manejar valores null explícitamente', () => {
            const { result } = renderHook(() => useAuthStore());

            act(() => {
                result.current.setLogedUser('alice');
                result.current.setToken('token');
            });

            act(() => {
                result.current.setLogedUser(null);
                result.current.setToken(null);
            });

            expect(result.current.logedUser).toBeNull();
            expect(result.current.token).toBeNull();
        });
    });
});