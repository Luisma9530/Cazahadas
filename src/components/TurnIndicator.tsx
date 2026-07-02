import { motion } from 'framer-motion'
import useTurnStore from "../store/TurnStore"
import { useGameStore } from "../store/GameStore"

/**
 * Indicador visual del turno activo que muestra si es el turno del jugador
 * local o del rival. Presenta un orbe circular animado en verde cuando es
 * el turno del jugador local y en rojo cuando es el turno del rival.
 * Incluye animaciones continuas de pulso, brillo interno, partículas flotantes
 * y anillo externo cuando es el turno del jugador local. El componente no
 * se renderiza cuando la partida ha finalizado.
 *
 * No recibe props. Obtiene el estado del turno de TurnStore y el estado
 * de fin de partida de GameStore.
 */
export default function TurnIndicator() {
  const [isMyTurn] = useTurnStore((state) => [state.isMyTurn])
  const [gameOver] = useGameStore((state) => [state.gameOver])

  if (gameOver) return null

  return (
    <div className="relative"> {/* Cambiado de fixed a relative */}
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
        <div
          className={`
            rounded-full relative overflow-hidden
            ${isMyTurn
              ? 'bg-gradient-to-br from-green-300 via-emerald-400 to-green-600 shadow-green-400/50'
              : 'bg-gradient-to-br from-red-400 via-rose-500 to-red-600 shadow-red-400/50'
            }
            shadow-2xl border-2 
            ${isMyTurn ? 'border-green-200' : 'border-red-300'}
          `}
          style={{
            width: '112px',  // Valor fijo (equivalente a md:w-28)
            height: '112px'  // Valor fijo (equivalente a md:h-28)
          }}
        >

          {/* Brillo interno */}
          <motion.div
            className={`absolute rounded-full ${isMyTurn
                ? 'bg-gradient-to-tr from-green-200/40 to-transparent'
                : 'bg-gradient-to-tr from-red-300/30 to-transparent'
              }`}
            style={{
              inset: '8px'  // Equivalente a inset-2
            }}
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
                  className="absolute bg-green-200 rounded-full"
                  style={{
                    width: '4px',    // Valor fijo para w-1
                    height: '4px',   // Valor fijo para h-1
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
              className={`font-bold text-center leading-tight ${isMyTurn ? 'text-green-900' : 'text-red-100'
                }`}
              style={{
                fontSize: '14px'  // Valor fijo (equivalente a sm:text-sm)
              }}
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
          className={`absolute rounded-full blur-xl ${isMyTurn ? 'bg-green-400/30' : 'bg-red-400/30'
            }`}
          style={{
            inset: '-16px'  // Equivalente a -inset-4
          }}
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