import { motion } from "framer-motion";
import { useModalStore } from "../../store/ModalStore";
import useTurnStore from "../../store/TurnStore";

/**
 * Modal animado que notifica a cada jugador si es su turno o el del rival.
 * Muestra "Your Turn" en verde o "Opponent's Turn" en rojo según el valor
 * de isMyTurn en TurnStore. La animación de entrada y salida tiene una
 * duración de 2 segundos, tras los cuales se invoca toggleTurnModal para
 * ocultar el modal y permitir que el jugador actúe.
 *
 * No recibe props. Gestiona su visibilidad a través de ModalStore
 * y obtiene el estado del turno de TurnStore.
 */
export function TurnModal() {
  const [toggleTurnModal] = useModalStore((state) => [state.toggleTurnModal]);
  const [isMyTurn] = useTurnStore((state) => [state.isMyTurn, state.isMyFirstTurn, state.setIsMyFirstTurn])

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 51 }}>
      <motion.div
        animate={{
          opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
          scaleY: [1, 1, 1, 1, 1, 1, 0.9, 0.8, 0.7, 0.6, 0.0],
          scaleX: [0, 1, 1, 1, 1, 1, 1, 1.1, 1.2, 1.3]
        }}
        transition={{
          duration: 2,
          times: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
        }}
        onAnimationComplete={() => {
          toggleTurnModal()
        }}
        className={`border-y border-yellow-400 bg-transparent text-center bg-gradient-to-r from-transparent ${isMyTurn ? 'via-[#15803d_33%,_#15803d_66%]' : 'via-[#b91c1c_33%,_#b91c1c_66%]'
          }`}
        style={{
          width: '600px',
          padding: '24px 0'  // py-6 → valor fijo
        }}
      >
        <motion.h2
          animate={{
            opacity: [0, 0.5, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            scale: [0.8, 0.9, 1, 1, 1, 1.1, 1.2, 1.3, 1.4, 1.5]
          }}
          transition={{
            duration: 2,
            times: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
          }}
          className={`font-normal ${isMyTurn ? 'text-green-200' : 'text-red-200'}`}
          style={{ fontSize: '48px' }}  // text-5xl → valor fijo
        >
          {isMyTurn ? 'Your Turn' : "Opponent's Turn"}
        </motion.h2>
      </motion.div>
    </div>
  )
}