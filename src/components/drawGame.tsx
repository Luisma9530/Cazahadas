import socket from "../socket"
import { useGameStore } from "../store/GameStore"
import { AnimatePresence, motion } from 'framer-motion'
import useTurnStore from "../store/TurnStore"
import { useParams } from "react-router-dom"

export default function RequestDraw() {

  const [showDrawModal] = useTurnStore((state) => [state.showDrawModal])

  const [gameOver, amIP1] = useGameStore((state) => [state.gameOver, state.amIP1])

  const { id: gameId } = useParams<{ id: string }>()

  function handleRequestDraw() {
    socket.emit('request-draw', { gameId, amIP1 })
  }

  return (
    <div className="flex w-11/12 items-center justify-end p-2 h-20 relative z-[100] pointer-events-none">
      <AnimatePresence>
        {!gameOver && !showDrawModal && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`-mt-20 text-4xl rounded-full bg-blue-50 hover:bg-blue-200 transition duration-200
                       shadow-xl cursor-pointer text-black border-4 border-blue-400 py-1 px-12 
                       pointer-events-auto relative z-[101]`}
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