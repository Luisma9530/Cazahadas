import { motion } from 'framer-motion'
import useTurnStore from "../store/TurnStore"
import { useGameStore } from "../store/GameStore"

export default function TurnIndicator() {
  const [isMyTurn] = useTurnStore((state) => [state.isMyTurn])
  const [gameOver] = useGameStore((state) => [state.gameOver])

  if (gameOver) return null

  return (
    <div className="fixed top-16 sm:top-20 md:top-24 right-6 z-20">
      <motion.div
        className="relative"
        animate={{ 
          scale: [1, 1.05, 1],
          rotateY: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Orbe principal */}
        <div className={`
          w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full relative overflow-hidden
          ${isMyTurn 
            ? 'bg-gradient-to-br from-green-300 via-emerald-400 to-green-600 shadow-green-400/50' 
            : 'bg-gradient-to-br from-red-400 via-rose-500 to-red-600 shadow-red-400/50'
          }
          shadow-2xl border-2 
          ${isMyTurn ? 'border-green-200' : 'border-red-300'}
        `}>
          
          {/* Brillo interno */}
          <motion.div
            className={`absolute inset-2 rounded-full ${
              isMyTurn 
                ? 'bg-gradient-to-tr from-green-200/40 to-transparent' 
                : 'bg-gradient-to-tr from-red-300/30 to-transparent'
            }`}
            animate={{ 
              opacity: isMyTurn ? [0.3, 0.7, 0.3] : [0.2, 0.5, 0.2]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Partículas flotantes */}
          {isMyTurn && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-green-200 rounded-full"
                  style={{
                    left: `${20 + i * 12}%`,
                    top: `${30 + (i % 2) * 40}%`,
                  }}
                  animate={{
                    y: [-2, -8, -2],
                    opacity: [0.4, 1, 0.4],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{
                    duration: 1.5 + i * 0.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.3
                  }}
                />
              ))}
            </>
          )}

          {/* Texto del turno */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className={`text-xs sm:text-sm font-bold text-center leading-tight ${
                isMyTurn ? 'text-green-900' : 'text-red-100'
              }`}
              animate={{ 
                scale: isMyTurn ? [1, 1.1, 1] : 1
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {isMyTurn ? 'YOUR\nTURN' : 'RIVAL\nTURN'}
            </motion.span>
          </div>
        </div>

        {/* Anillo externo animado */}
        {isMyTurn && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-green-300/60"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.6, 0.2, 0.6]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        )}

        {/* Sombra mágica */}
        <motion.div
          className={`absolute -inset-4 rounded-full blur-xl ${
            isMyTurn ? 'bg-green-400/30' : 'bg-red-400/30'
          }`}
          animate={{ 
            opacity: isMyTurn ? [0.2, 0.4, 0.2] : [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    </div>
  )
}