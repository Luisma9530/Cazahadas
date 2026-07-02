import { create } from "zustand";

interface BackgroundState {
  background: string;
  setBackground: (bg: string) => void;
  resetBackground: () => void;
}

/**
 * Store que gestiona la imagen de fondo de la aplicación.
 * Permite cambiar dinámicamente el fondo según la navegación del usuario
 * y restablecerlo a su valor inicial cuando sea necesario.
 */
const useBackgroundStore = create<BackgroundState>((set) => ({
  background: "none",

  /**
   * Establece la imagen de fondo envolviendo la ruta recibida en formato
   * CSS url() para su uso directo en la propiedad backgroundImage.
   *
   * @param {string} bg - Ruta de la imagen de fondo.
   */
  setBackground: (bg: string) => set({ background: `url(${bg})` }),

  /**
   * Restablece el fondo al valor inicial "none", eliminando cualquier
   * imagen de fondo previamente establecida.
   */
  resetBackground: () => set({ background: "none" }),
}));

export default useBackgroundStore;
