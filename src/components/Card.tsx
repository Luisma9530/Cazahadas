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
      // Removemos los marcadores [[ ]]
      const specialText = part.slice(2, -2);
      return (
        <span key={index} className="text-xl font-bold whitespace-pre-line">
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

  // Renderizado distinto según el tipo de carta.
  const renderContent = () => {
    switch (card.type) {
      case CardType.CATCH:
        // Para cartas de atrapar, mostramos solo un ícono y el nombre.
        return (
          <>
            <div className="flex justify-center items-center p-4">
              <div className="p-4">
                {renderCardText(card.text)}
              </div>
            </div>
          </>
        )
      case CardType.MAGIC:
        // Para cartas mágicas, mostramos una etiqueta que indica la operación.
        return (
          <>
            <div className="flex flex-col items-center justify-center p-4">
              <div className="p-4">
                {renderCardText(card.text)}
              </div>
            </div>
          </>
        )
      case CardType.SHIELD:
        // Para cartas de escudo, mostramos una etiqueta con la condición.
        return (
          <>
            <div className="flex flex-col items-center justify-center p-4">
              <div className="p-4">
                {renderCardText(card.text)}
              </div>
            </div>
          </>
        )
      default:
        return (
          <div className="flex items-center justify-center rounded-b-md font-bold w-full bg-black border-t-2 border-t-yellow-400 text-yellow-400 text-xl px-4 py-2">
            {(card as CardInfo).name}
          </div>
        )
    }
  }

  return (
    <div
      className={`flex flex-col justify-between ${placed ? 'border border-gray-400' : ''} w-full h-full ${backgroundColor} rounded-lg`}
    >
      {renderContent()}
    </div>
  )
}
