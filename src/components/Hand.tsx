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
  const [toggleCardSelection, isCardSelected] = useCardStore((state) => [
    state.toggleCardSelection,
    state.isCardSelected
  ])
  const [hoveredCard, setHoveredCard] = useCardStore((state) => [
    state.hoveredCard,
    state.setHoveredCard
  ])

  const handleCardClick = (card: CardUnity) => {
    toggleCardSelection(card)

    flickAudio.pause()
    flickAudio.currentTime = 0
    flickAudio.volume = 0.4
    flickAudio.play()

    // Emitir las cartas seleccionadas actualizadas
    // Necesitamos obtener el estado actualizado después del toggle
    const updatedSelectedCards = useCardStore.getState().selectedCards
    socket.emit("selected-cards", { cards: updatedSelectedCards });
  }

  const handleHoverStart = (card: CardUnity) => {
    if (!isCardSelected(card)) {
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
      style={{ height: '20vh' }}
      animate={{ transition: { staggerChildren: 0.5 } }}
    >
      <AnimatePresence>
        {
          playerCards.map((card, index) => {
            const totalCards = playerCards.length;
            const maxAngle = 120;
            const angleStep = totalCards > 1 ? maxAngle / (totalCards - 1) : 0;
            const angle = totalCards > 1 ? -maxAngle / 2 + (index * angleStep) : 0;

            const radius = window.innerHeight * 0.18; // 18% del alto del viewport

            const radian = (angle * Math.PI) / 180;
            const x = Math.sin(radian) * radius;
            const y = -Math.cos(radian) * radius + radius;

            const isSelected = isCardSelected(card)
            const isHovered = hoveredCard?.id === card.id

            return (
              <motion.li
                key={card.id}
                initial={{ opacity: 0, x: -200, y: 0 }}
                animate={{
                  x: x,
                  y: y + (isSelected ? -20 : 0),
                  opacity: 1,
                  rotate: angle,
                  transition: { duration: 0.0 }
                }}
                exit={{ opacity: 0, transition: { duration: 1 } }}
                className={`border-2 border-solid shadow-lg rounded-lg cursor-pointer absolute ${isSelected
                    ? 'border-green-400 -translate-y-5 transform z-10'
                    : 'border-black hover:scale-105 hover:duration-100 hover:border-blue-500'
                  } sm:h-[30vh] aspect-[36/44]`
                }
                style={{
                  transformOrigin: 'bottom center',
                  zIndex: (isSelected || isHovered) ? 10 : index,
                  bottom: 0,
                  transition: 'transform 0.3s ease-in-out'
                }}
                onHoverStart={() => handleHoverStart(card)}
                onHoverEnd={() => setHoveredCard(null)}
                onClick={() => handleCardClick(card)}
                whileHover={{
                  y: y - 10,
                  scale: 1.4,
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