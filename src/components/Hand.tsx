import { CardUnity } from '../@types/Card'
import useCardStore from '../store/CardStore'
import Card from './Card'
import socket from "../socket";
import useNeoHandStore from '../store/NeoHandStore'
import { AnimatePresence, motion } from 'framer-motion'
import hoverSound from '../assets/sounds/hover.wav'
import flickSound from '../assets/sounds/cardflick.mp3'

type Hand = {
  cards: CardUnity[]
}

const flickAudio = new Audio(flickSound)
const hoverAudio = new Audio(hoverSound)

export default function Hand() {
  const [playerCards] = useNeoHandStore((state) => [
    state.playerCards
  ])
  const [selectedCard, setSelectedCard] = useCardStore((state) => [
    state.selectedCard,
    state.setSelectedCard,
  ])
  const [hoveredCard, setHoveredCard] = useCardStore((state) => [
    state.hoveredCard,
    state.setHoveredCard
  ])

  const handleCardClick = (card: CardUnity) => {
    if (selectedCard?.id === card.id) {
      setSelectedCard(null)
      return;
    }

    setSelectedCard(card)
    flickAudio.pause()
    flickAudio.currentTime = 0
    flickAudio.volume = 0.4
    flickAudio.play()
    socket.emit("selected-card", { card });
  }

  const handleHoverStart = (card: CardUnity) => {
    if (selectedCard?.id !== card.id) {
      setHoveredCard(card)
      hoverAudio.pause()
      hoverAudio.currentTime = 0
      hoverAudio.volume = 0.2
      hoverAudio.play()
    }
  }

  return (
    <motion.ul
      className="flex items-end justify-center w-full pt-2 pb-3 px-8 relative"
      style={{ height: '160px' }} // Altura reducida significativamente
      animate={{ transition: { staggerChildren: 0.5 } }}
    >
      <AnimatePresence>
        {
          playerCards.map((card, index) => {
            const totalCards = playerCards.length;
            const maxAngle = 120;
            const angleStep = totalCards > 1 ? maxAngle / (totalCards - 1) : 0;
            const angle = totalCards > 1 ? -maxAngle / 2 + (index * angleStep) : 0;

            // Radio reducido para menor espacio
            const radius = 140; // Reducido de 250 a 140

            // Calcular posición basada en el ángulo para formar un verdadero abanico
            const radian = (angle * Math.PI) / 180;
            const x = Math.sin(radian) * radius;
            const y = -Math.cos(radian) * radius + radius; // Crear curva de abanico real

            return (
              <motion.li
                key={card.id}
                initial={{ opacity: 0, x: -200, y: 0 }}
                animate={{
                  x: x,
                  y: y + (selectedCard?.id === card?.id ? -20 : 0), // Reducido el movimiento de selección
                  opacity: 1,
                  rotate: angle,
                  transition: { duration: 0.0 }
                }}
                exit={{ opacity: 0, transition: { duration: 1 } }}
                className={`border-2 border-solid shadow-lg rounded-lg cursor-pointer absolute ${selectedCard?.id === card?.id
                  ? 'border-green-400 -translate-y-5 transform z-10' // Reducido el translate
                  : 'border-black hover:scale-105 hover:duration-100 hover:border-blue-500'
                  } h-44 w-36` // Cartas más pequeñas: de h-60 w-52 a h-44 w-36
                }
                style={{
                  transformOrigin: 'bottom center',
                  zIndex: (selectedCard?.id === card?.id || hoveredCard?.id === card?.id) ? 10 : index,
                  bottom: 0,
                  transition: 'transform 0.3s ease-in-out' // Transición suave
                }}
                onHoverStart={() => handleHoverStart(card)}
                onHoverEnd={() => setHoveredCard(null)}
                onClick={() => handleCardClick(card)}
                whileHover={{ 
                  y: y - 20, // Hover más sutil
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
              >
                <Card card={card} />
              </motion.li>
            );
          })
        }
      </AnimatePresence>
    </motion.ul>
  )
}