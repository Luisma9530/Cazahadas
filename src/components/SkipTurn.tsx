import socket from "../socket"
import useBoardStore from "../store/BoardStore"
import useCardStore from "../store/CardStore"
import { useGameStore } from "../store/GameStore"
import { AnimatePresence, motion } from 'framer-motion'
import useTurnStore from "../store/TurnStore"
import { useParams } from "react-router-dom"

/**
 * Componente que muestra el botón para saltar turno o finalizar batalla.
 * El botón solo es visible cuando es el turno del jugador local, la partida
 * no ha finalizado, y no hay ningún modal de batalla o de tablas activo.
 * El texto del botón varía según el contexto: muestra "End battle" cuando
 * el jugador rival ya ha saltado turno en batalla o cuando es el primer turno
 * de batalla del defensor, y "Skip turn" en el resto de casos.
 * Al pulsarlo, emite el evento Socket.IO "skip-turn" con el estado actual
 * del tablero para que el servidor gestione la lógica correspondiente.
 *
 * No recibe props. Obtiene el estado del tablero de BoardStore, el estado
 * del turno de TurnStore, y el estado del juego de GameStore.
 */
export default function SkipTurn() {
  const [tiles] = useBoardStore((state) => [
    state.board,
  ])

  const [isMyTurn, playerSkippedTurn, isBattle, isMyFirstTurnBattle, showBattleModal, showDrawModal] = useTurnStore((state) => [state.isMyTurn, state.playerSkippedTurn, state.isBattle, state.isMyFirstTurnBattle, state.showBattleModal, state.showDrawModal])

  const [resetSelectedCard] = useCardStore((state) => [
    state.resetSelectedCards,
  ])

  const [gameOver, amIP1] = useGameStore((state) => [state.gameOver, state.amIP1])

  const { id: gameId } = useParams<{ id: string }>()

  /**
   * Gestiona la acción de saltar turno o finalizar batalla.
   * Limpia las cartas seleccionadas en CardStore y emite el evento Socket.IO
   * "skip-turn" al servidor con el estado actual del tablero, el identificador
   * de sala, el estado de batalla y la identidad del jugador local.
   */
  function handleSkipTurn() {
    resetSelectedCard()
    socket.emit('skip-turn', { tiles, gameId, isBattle, isMyFirstTurnBattle, amIP1 })
  }

  return (
    <div className="flex items-center justify-end relative pointer-events-none" style={{ width: '200px', height: '80px' }}>
      <AnimatePresence>
        {isMyTurn && !gameOver && !showBattleModal && !showDrawModal && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`rounded-full bg-gray-50 hover:bg-gray-200 transition duration-200
                       shadow-xl cursor-pointer text-black border-4 border-yellow-400
                       pointer-events-auto relative`}
            style={{
              fontSize: '20px',      // Reducido de text-4xl (36px)
              padding: '8px 48px',   // py-1 px-12 → valores fijos
              marginTop: '-80px',    // -mt-20 → valor fijo
              zIndex: 101
            }}
            onClick={handleSkipTurn}
            type="button"
          >
            {((playerSkippedTurn && isBattle) || isMyFirstTurnBattle) ? 'End battle' : 'Skip turn'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}