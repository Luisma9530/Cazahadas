import socket from "../socket"
import { useGameStore } from "../store/GameStore"
import { AnimatePresence, motion } from 'framer-motion'
import useTurnStore from "../store/TurnStore"
import { useParams } from "react-router-dom"

export default function RequestDraw() {

  const [showDrawModal, showBattleModal] = useTurnStore((state) => [state.showDrawModal, state.showBattleModal])

  const [gameOver, amIP1] = useGameStore((state) => [state.gameOver, state.amIP1])

  const { id: gameId } = useParams<{ id: string }>()

  function handleRequestDraw() {
    socket.emit('request-draw', { gameId, amIP1 })
  }

  return (
    <div className="flex items-center justify-end relative pointer-events-none" style={{ width: '200px', height: '80px' }}>
      <AnimatePresence>
        {!gameOver && !showBattleModal && !showDrawModal && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`rounded-full bg-blue-50 hover:bg-blue-200 transition duration-200
                       shadow-xl cursor-pointer text-black border-4 border-blue-400
                       pointer-events-auto relative`}
            style={{
              fontSize: '20px',      // Reducido de text-4xl (36px) a algo más razonable
              padding: '8px 48px',   // py-1 px-12 → valores fijos
              marginTop: '-80px',    // -mt-20 → valor fijo
              zIndex: 101
            }}
            onClick={handleRequestDraw}
            type="button"
          >
            Request Draw
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}