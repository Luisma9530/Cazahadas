// src/store/authStore.ts
import { create } from 'zustand';
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


    setLogedUser: (username) => set({ logedUser: username }),
    setToken: (token) => set({
        token
    })
}));
