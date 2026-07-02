// src/store/authStore.ts
import { create } from 'zustand';

/**
 * Store de autenticación que gestiona el estado de sesión del usuario.
 * Almacena el nombre de usuario autenticado y el token JWT recibido tras
 * el login. Ambos valores se inicializan a null y se eliminan al cerrar sesión.
 */
interface AuthState {
    logedUser: string | null;
    token: string | null;

    // Setters
    setLogedUser: (username: string | null) => void;
    setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    logedUser: null,
    token: null,

    /**
     * Establece el nombre de usuario autenticado en el store.
     * Recibe null para eliminar el usuario al cerrar sesión.
     *
     * @param {string | null} username - Nombre de usuario o null para logout.
     */
    setLogedUser: (username) => set({ logedUser: username }),

    /**
     * Establece el token JWT de autenticación en el store.
     * Recibe null para eliminar el token al cerrar sesión.
     *
     * @param {string | null} token - Token JWT o null para logout.
     */
    setToken: (token) => set({
        token
    })
}));
