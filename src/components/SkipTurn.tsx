import socket from "../socket"
import useBoardStore from "../store/BoardStore"
import useCardStore from "../store/CardStore"
import { useGameStore } from "../store/GameStore"
import { AnimatePresence, motion } from 'framer-motion'
import useTurnStore from "../store/TurnStore"
import { useParams } from "react-router-dom"


export default function SkipTurn() {
  const [tiles] = useBoardStore((state) => [
    state.board,
  ])

  const [isMyTurn, playerSkippedTurn, isBattle] = useTurnStore((state) => [state.isMyTurn, state.playerSkippedTurn, state.isBattle])

  const [resetSelectedCard] = useCardStore((state) => [
    state.resetSelectedCard,
  ])

  const [gameOver] = useGameStore((state) => [state.gameOver, state.amIP1])

  const { id: gameId } = useParams<{ id: string }>()


  function handleSkipTurn() {
    resetSelectedCard()
    socket.emit('skip-turn', { tiles, gameId, isBattle })
  }

  return (
  <div className="flex w-11/12 items-center justify-end p-2 h-20 relative z-10">
    <AnimatePresence>
      {isMyTurn && !gameOver && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`-mt-20 text-4xl rounded-full bg-gray-50 hover:bg-gray-200 transition duration-200
      shadow-xl cursor-pointer text-black border-4 border-yellow-400 py-1 px-12 z-10`}
          onClick={handleSkipTurn}
        > 
        {playerSkippedTurn ? (isBattle ? 'End battle' : 'End game') : 'Skip turn'} 
        </motion.span>
      )}
    </AnimatePresence>
  </div>
)
}