import { motion } from "framer-motion";
import { Fireworks } from '@fireworks-js/react'
import type { FireworksHandlers } from '@fireworks-js/react'
import { Result } from "../../store/GameStore";
import { useRef } from "react";
import explosion0 from "../../assets/sounds/explosion0.mp3";
import explosion1 from "../../assets/sounds/explosion1.mp3";
import explosion2 from "../../assets/sounds/explosion2.mp3";

export function EndGameModal({ amIP1, winner }: { amIP1: boolean, winner: Result }) {

  const ref = useRef<FireworksHandlers>(null)

  // Si soy el jugador 1 y el resultado es PLAYER1WIN, entonces soy el ganador
  // Si soy el jugador 2 y el resultado es PLAYER2WIN, entonces soy el ganador
  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-[2px] pointer-events-none" style={{ zIndex: 50 }}>
      {((winner === Result.PLAYER1WIN && amIP1) ||
        (winner === Result.PLAYER2WIN && !amIP1)) &&
        <>
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 60 }}>
            <motion.h2
              initial={{
                opacity: 0,
                translateY: -100,
              }}
              animate={{
                opacity: 1,
                translateY: 0,
              }}
              className="font-medium text-yellow-300 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]"
              style={{ 
                fontSize: '96px',  // text-8xl → valor fijo
                padding: '48px 80px'  // py-12 px-20 → valores fijos
              }}
            >
              You Win!
            </motion.h2>
          </div>

          <Fireworks
            ref={ref}
            options={{ 
              opacity: 0.5, 
              acceleration: 1.0, 
              intensity: 20, 
              particles: 100, 
              sound: { 
                enabled: true, 
                files: [explosion0, explosion1, explosion2], 
                volume: { min: 0, max: 4 } 
              } 
            }}
            style={{
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              position: 'fixed',
              zIndex: 55,
            }}
          />
        </>
      }
      {((winner === Result.PLAYER1WIN && !amIP1) ||
        (winner === Result.PLAYER2WIN && amIP1)) &&
        <div className="relative pointer-events-none" style={{ zIndex: 60 }}>
          <h2 
            className="font-semibold text-red-500 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]"
            style={{ 
              fontSize: '96px',  // text-8xl → valor fijo
              padding: '48px 80px'  // py-12 px-20 → valores fijos
            }}
          >
            You Lose!
          </h2>
        </div>
      }
      {winner === Result.DRAW &&
        <div className="relative pointer-events-none" style={{ zIndex: 60 }}>
          <h2 
            className="font-semibold bg-gradient-to-t text-transparent bg-clip-text from-blue-600 via-blue-500 to-white inline-block"
            style={{ 
              fontSize: '96px',  // text-8xl → valor fijo
              padding: '48px 80px'  // py-12 px-20 → valores fijos
            }}
          >
            It's a Draw!
          </h2>
        </div>
      }
    </div>
  )
}