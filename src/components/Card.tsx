import { CardInfo } from '../@types/Card'

type CardProps = {
  card: CardInfo | null
  placed?: boolean
  amIP1?: boolean
}

/**
 * Componente que renderiza una carta del juego de forma visual.
 * Cuando la carta está colocada en el tablero, aplica un color de fondo
 * diferenciado según si fue colocada por el jugador local o por el rival:
 * verde para las propias y rojo para las del rival. Si la carta tiene imagen
 * asociada, la muestra a tamaño completo; en caso contrario, muestra el
 * nombre de la carta como texto de fallback.
 *
 * @param {CardInfo | null} card - Datos de la carta a renderizar.
 *   Si es null, el componente no renderiza nada.
 * @param {boolean} [placed=false] - Indica si la carta está colocada en el
 *   tablero. Activa el color de fondo diferenciado y el borde.
 * @param {boolean} [amIP1] - Indica si el jugador local es el Jugador 1.
 *   Se utiliza junto con placedByPlayerOne para determinar el color de fondo.
 */
export default function Card({ card, placed = false, amIP1 }: CardProps) {
  if (!card) return null

  /**
   * Determina el color de fondo de la carta en función de quién la colocó
   * y de la identidad del jugador local. Las cartas propias se muestran en
   * verde y las del rival en rojo. Si la carta no está colocada en el tablero,
   * el fondo es blanco.
   */
  const backgroundColor = placed
    ? amIP1
      ? card.placedByPlayerOne
        ? 'bg-green-400'
        : 'bg-red-400'
      : card.placedByPlayerOne
        ? 'bg-red-400'
        : 'bg-green-400'
    : 'bg-white'

  /**
   * Renderiza el contenido visual de la carta.
   * Si la carta tiene una imagen asociada, la muestra ocupando todo el espacio
   * disponible. Si la imagen no carga correctamente, la oculta y registra el
   * error en consola. Si no hay imagen, renderiza el nombre de la carta como
   * texto de fallback sobre fondo negro.
   *
   * @returns {JSX.Element} Elemento visual con la imagen de la carta o el
   *   texto de fallback.
   */
  const renderContent = () => {
    // Si la carta tiene una imagen, la usamos
    if (card.image) {
      return (
        <div className="relative h-full w-full rounded-lg overflow-hidden bg-gray-200">
          <img
            src={card.image}
            alt={card.name || 'Card'}
            className="w-full h-full object-fill"
            onError={(e) => {
              console.error('Error al cargar imagen:', card.image);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      );
    }

    // Fallback al renderizado por defecto si no hay imagen
    return (
      <div className="flex items-center justify-center rounded-b-md font-bold w-full bg-black border-t-2 border-t-yellow-400 text-yellow-400 text-lg px-2 py-1">
        {card.name}
      </div>
    );
  };

  // Renderizamos la carta con su contenido y estilos.
  return (
    <div
      className={`flex flex-col justify-between ${placed ? 'border border-gray-400' : ''} w-full h-full ${backgroundColor} rounded-lg`}
    >
      {renderContent()}
    </div>
  )
}