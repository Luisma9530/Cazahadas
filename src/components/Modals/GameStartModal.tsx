import { motion } from "framer-motion";
import { useModalStore } from "../../store/ModalStore";

/**
 * Modal animado que notifica a ambos jugadores el inicio de la partida.
 * Muestra el texto "Draw Blood!" con una animación de aparición y desvanecimiento
 * basada en Framer Motion durante 3 segundos. Al completarse la animación,
 * cierra el modal de inicio e invoca el modal de turno con un retardo de 100 ms
 * para evitar conflictos entre transiciones.
 *
 * No recibe props. Gestiona su visibilidad a través de ModalStore.
 */
export function GameStartModal() {
  const [toggleGameStartModal, toggleTurnModal] = useModalStore((state) => [
    state.toggleGameStartModal,
    state.toggleTurnModal
  ]);

  return (
    <motion.div
      animate={{ opacity: [0, 1, 1, 0] }}
      key="game-start-modal"
      transition={{ duration: 3, times: [0.0, 0.1, 0.9, 1.0] }}
      onAnimationComplete={() => {
        toggleGameStartModal()
        setTimeout(() => {
          toggleTurnModal()
        }, 100)
      }}
      className="w-[600px] max-w-[90vw] border-y border-yellow-400 bg-transparent text-center py-6 bg-gradient-to-r from-transparent via-[#854d0e_33%,_#854d0e_66%]"
    >
      <h2 className="text-5xl font-normal text-yellow-300">Draw Blood!</h2>
    </motion.div>
  )
}