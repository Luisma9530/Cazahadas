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
        <span key={index} className="text-sm font-bold whitespace-pre-line"> {/* Reducido de text-xl a text-sm */}
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
    // Configuración de estilos según el tipo de carta
    const getCardConfig = (type: CardType) => {
      switch (type) {
        case CardType.CATCH:
          return {
            gradient: 'from-pink-400 via-purple-500 to-indigo-600',
            iconBg: 'bg-white/20',
            accentColor: 'text-yellow-300',
            decorationColor: 'text-yellow-300'
          };
        case CardType.MAGIC:
          return {
            gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
            iconBg: 'bg-white/20',
            accentColor: 'text-yellow-300',
            decorationColor: 'text-white'
          };
        case CardType.SHIELD:
          return {
            gradient: 'from-amber-400 via-orange-500 to-red-500',
            iconBg: 'bg-white/20',
            accentColor: 'text-yellow-100',
            decorationColor: 'text-yellow-300'
          };
        default:
          return {
            gradient: 'from-gray-400 to-gray-600',
            iconBg: 'bg-white/20',
            accentColor: 'text-white',
            decorationColor: 'text-gray-300'
          };
      }
    };

    const config = getCardConfig(card.type);

    switch (card.type) {
      case CardType.CATCH:
        return (
          <div className={`relative h-full bg-gradient-to-br ${config.gradient} rounded-lg overflow-hidden`}>
            {/* Efecto de brillo superior */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent"></div>

            {/* Decoración superior */}
            <div className="absolute top-1 left-0 right-0 flex justify-center"> {/* Reducido el padding */}
              <div className="flex space-x-1">
                <div className={`w-1.5 h-1.5 rounded-full ${config.decorationColor.replace('text-', 'bg-')} animate-pulse`}></div> {/* Puntos más pequeños */}
                <div className={`w-1.5 h-1.5 rounded-full ${config.decorationColor.replace('text-', 'bg-')} animate-pulse`} style={{ animationDelay: '0.1s' }}></div>
                <div className={`w-1.5 h-1.5 rounded-full ${config.decorationColor.replace('text-', 'bg-')} animate-pulse`} style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center h-full p-2 relative z-10"> {/* Reducido padding */}
              {/* Ícono principal */}
              <div className={`mb-2 p-2 rounded-full ${config.iconBg} backdrop-blur-sm border border-white/30`}> {/* Reducido tamaño */}
                <div className={`w-6 h-6 ${config.accentColor} flex items-center justify-center text-lg font-bold`}> {/* Ícono más pequeño */}
                  ⭐
                </div>
              </div>

              {/* Texto de la carta */}
              <div className={`text-sm font-semibold ${config.accentColor} text-center px-1`}> {/* Reducido tamaño de fuente */}
                {renderCardText(card.text)}
              </div>
            </div>

            {/* Decoración inferior */}
            <div className="absolute bottom-1 left-0 right-0 flex justify-center"> {/* Reducido espacio */}
              <div className={`w-12 h-0.5 bg-gradient-to-r from-transparent via-${config.decorationColor.replace('text-', '').replace('-300', '-400')} to-transparent rounded-full`}></div> {/* Línea más pequeña */}
            </div>

            {/* Borde interior */}
            <div className="absolute inset-0.5 rounded-lg border border-white/20 pointer-events-none"></div> {/* Borde más fino */}
          </div>
        );

      case CardType.MAGIC:
        return (
          <div className={`relative h-full bg-gradient-to-br ${config.gradient} rounded-lg overflow-hidden`}>
            {/* Efecto de brillo superior */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent"></div>

            {/* Patrón mágico de fondo - Reducido */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 left-2 w-3 h-3 bg-white rounded-full animate-pulse"></div> {/* Elementos más pequeños */}
              <div className="absolute top-4 right-3 w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute bottom-3 left-3 w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            </div>

            <div className="flex flex-col items-center justify-center h-full p-2 relative z-10"> {/* Reducido padding */}
              {/* Ícono principal con efecto mágico */}
              <div className={`mb-2 p-2 rounded-full ${config.iconBg} backdrop-blur-sm border border-white/30 relative`}> {/* Reducido tamaño */}
                <div className={`w-6 h-6 ${config.accentColor} flex items-center justify-center text-lg font-bold`}> {/* Ícono más pequeño */}
                  ⚡
                </div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full opacity-20 animate-pulse"></div> {/* Efecto más sutil */}
              </div>

              {/* Texto de la carta */}
              <div className={`text-sm font-semibold ${config.accentColor} text-center px-1`}> {/* Reducido tamaño de fuente */}
                {renderCardText(card.text)}
              </div>
            </div>

            {/* Efecto de brillo */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-full animate-pulse"></div>

            {/* Borde interior */}
            <div className="absolute inset-0.5 rounded-lg border border-white/20 pointer-events-none"></div> {/* Borde más fino */}
          </div>
        );

      case CardType.SHIELD:
        return (
          <div className={`relative h-full bg-gradient-to-br ${config.gradient} rounded-lg overflow-hidden`}>
            {/* Efecto de brillo superior */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent"></div>

            {/* Patrón de protección - Más sutil */}
            <div className="absolute inset-1 border border-white/20 rounded-lg"></div>
            <div className="absolute inset-2 border border-white/10 rounded-lg"></div>

            <div className="flex flex-col items-center justify-center h-full p-2 relative z-10"> {/* Reducido padding */}
              {/* Ícono principal */}
              <div className={`mb-2 p-2 rounded-full ${config.iconBg} backdrop-blur-sm border border-white/30`}> {/* Reducido tamaño */}
                <div className={`w-6 h-6 ${config.accentColor} flex items-center justify-center text-lg font-bold`}> {/* Ícono más pequeño */}
                  🛡️
                </div>
              </div>

              {/* Texto de la carta */}
              <div className={`text-sm font-semibold ${config.accentColor} text-center px-1`}> {/* Reducido tamaño de fuente */}
                {renderCardText(card.text)}
              </div>
            </div>

            {/* Esquinas decorativas - Más pequeñas */}
            <div className={`absolute top-1 left-1 w-4 h-4 border-l-2 border-t-2 border-${config.decorationColor.replace('text-', '').replace('-300', '-300')}/50`}></div>
            <div className={`absolute top-1 right-1 w-4 h-4 border-r-2 border-t-2 border-${config.decorationColor.replace('text-', '').replace('-300', '-300')}/50`}></div>
            <div className={`absolute bottom-1 left-1 w-4 h-4 border-l-2 border-b-2 border-${config.decorationColor.replace('text-', '').replace('-300', '-300')}/50`}></div>
            <div className={`absolute bottom-1 right-1 w-4 h-4 border-r-2 border-b-2 border-${config.decorationColor.replace('text-', '').replace('-300', '-300')}/50`}></div>

            {/* Borde interior */}
            <div className="absolute inset-0.5 rounded-lg border border-white/20 pointer-events-none"></div> {/* Borde más fino */}
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center rounded-b-md font-bold w-full bg-black border-t-2 border-t-yellow-400 text-yellow-400 text-lg px-2 py-1"> {/* Reducido tamaño de fuente y padding */}
            {(card as CardInfo).name}
          </div>
        );
    }
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