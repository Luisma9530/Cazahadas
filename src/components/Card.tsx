import { CardInfo, CardType } from '../@types/Card'

type CardProps = {
  card: CardInfo | null
  placed?: boolean
  amIP1?: boolean
}

function renderCardText(text: string) {
  const parts = text.split(/(\[\[.*?\]\])/);
  return parts.map((part, index) => {
    if (part.startsWith("[[") && part.endsWith("]]")) {
      const specialText = part.slice(2, -2);
      return (
        <span key={index} className="text-sm font-bold whitespace-pre-line">
          {specialText}
        </span>
      );
    }
    return (
      <span key={index} className="whitespace-pre-line">
        {part}
      </span>
    );
  });
}

export default function Card({ card, placed = false, amIP1 }: CardProps) {
  if (!card) return null

  // Función para determinar estilos de fondo según quién colocó la carta.
  const backgroundColor = placed
    ? amIP1
      ? card.placedByPlayerOne
        ? 'bg-green-400'
        : 'bg-red-400'
      : card.placedByPlayerOne
        ? 'bg-red-400'
        : 'bg-green-400'
    : 'bg-white'

  // Renderizado usando la imagen de la carta
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