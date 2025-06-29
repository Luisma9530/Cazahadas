// src/store/authStore.ts
import { create } from 'zustand';

type Notification = { type: 'success' | 'error'; message: string };

interface AuthState {
    logedUser: string | null;
    password: string | null;

    // Setters
    setLogedUser: (username: string | null) => void;
    setPassword: (password: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    logedUser: null,
    password: null,


    setLogedUser: (username) => set({ logedUser: username }),
    setPassword: (password) => set({
        password
    })
}));
