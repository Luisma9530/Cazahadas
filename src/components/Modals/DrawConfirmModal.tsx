import React, { useState, useEffect } from 'react';
import { Handshake, Users } from 'lucide-react';

interface DrawConfirmModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
  playerName?: string; // Nombre del jugador que solicita el empate (opcional)
}

/**
 * Modal de confirmación que notifica a un jugador que su rival ha solicitado
 * terminar la partida en tablas. Presenta las opciones de aceptar o rechazar
 * la propuesta. Si ambos jugadores aceptan, la partida finaliza en empate;
 * si se rechaza, la partida continúa con normalidad.
 *
 * @param {boolean} isOpen - Indica si el modal está visible.
 * @param {() => void} onAccept - Callback invocado cuando el jugador acepta las tablas.
 * @param {() => void} onReject - Callback invocado cuando el jugador rechaza las tablas.
 * @param {string} [playerName="Tu oponente"] - Nombre del jugador que solicita
 *   las tablas, mostrado en el contenido del modal.
 */
const DrawConfirmModal: React.FC<DrawConfirmModalProps> = ({
  isOpen,
  onAccept,
  onReject,
  playerName = "Tu oponente"
}) => {
  const [isUnrolling, setIsUnrolling] = useState(false);
  const [showContent, setShowContent] = useState(false);

  /**
   * Efecto que controla la animación de despliegue del pergamino en función
   * del estado de visibilidad del modal. Al abrirse, activa la animación de
   * despliegue y retrasa 1200 ms la aparición del contenido interior para
   * sincronizarla con la animación. Al cerrarse, restablece ambos estados.
   */
  useEffect(() => {
    if (isOpen) {
      setIsUnrolling(true);
      setTimeout(() => setShowContent(true), 1200);
    } else {
      setShowContent(false);
      setIsUnrolling(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="relative max-w-lg w-full">
        {/* Rodillo Superior */}
        <div className="absolute -top-3 left-6 right-6 h-4 bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-800 rounded-full shadow-lg z-20 border-2 border-blue-900">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-600 to-blue-800 rounded-full opacity-60"></div>
          <div className="absolute left-1 top-0.5 w-1.5 h-3 bg-blue-900 rounded-sm"></div>
          <div className="absolute right-1 top-0.5 w-1.5 h-3 bg-blue-900 rounded-sm"></div>
        </div>

        {/* Rodillo Inferior */}
        <div className="absolute -bottom-3 left-6 right-6 h-4 bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-800 rounded-full shadow-lg z-20 border-2 border-blue-900">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-600 to-blue-800 rounded-full opacity-60"></div>
          <div className="absolute left-1 top-0.5 w-1.5 h-3 bg-blue-900 rounded-sm"></div>
          <div className="absolute right-1 top-0.5 w-1.5 h-3 bg-blue-900 rounded-sm"></div>
        </div>

        {/* Sombra del pergamino */}
        <div
          className={`absolute inset-0 bg-blue-900/20 -z-10 transition-all duration-1000 ease-out ${isUnrolling ? 'animate-unroll-shadow' : 'animate-roll-up-shadow'
            }`}
          style={{
            clipPath: 'polygon(2% 0%, 98% 1%, 99% 4%, 97% 8%, 99% 12%, 98% 96%, 95% 99%, 92% 97%, 8% 98%, 5% 96%, 1% 92%, 3% 8%, 1% 4%)',
            filter: 'blur(8px)',
            transform: 'rotate(0.5deg) translate(4px, 6px)',
            transformOrigin: 'top center'
          }}
        />

        {/* Pergamino Principal */}
        <div
          className={`
                      relative bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 shadow-2xl transform rotate-1
                      transition-all duration-1000 ease-out overflow-hidden
                      ${isUnrolling ? 'animate-unroll' : 'animate-roll-up'}
                    `}
          style={{
            clipPath: 'polygon(2% 0%, 98% 1%, 99% 4%, 97% 8%, 99% 12%, 98% 96%, 95% 99%, 92% 97%, 8% 98%, 5% 96%, 1% 92%, 3% 8%, 1% 4%)',
            filter: 'drop-shadow(0 10px 20px rgba(29, 78, 216, 0.3))',
            transformOrigin: 'top center'
          }}
        >
          {/* Textura de pergamino */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                              radial-gradient(circle at 20% 30%, rgba(29, 78, 216, 0.1) 2px, transparent 2px),
                              radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.08) 1px, transparent 1px),
                              radial-gradient(circle at 40% 80%, rgba(29, 78, 216, 0.06) 1.5px, transparent 1.5px),
                              linear-gradient(45deg, transparent 48%, rgba(29, 78, 216, 0.03) 49%, rgba(29, 78, 216, 0.03) 51%, transparent 52%)
                            `,
              backgroundSize: '50px 50px, 30px 30px, 70px 70px, 20px 20px',
            }}
          />

          {/* Bordes envejecidos */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `
                              linear-gradient(to right, rgba(29, 78, 216, 0.2) 0%, transparent 5%),
                              linear-gradient(to left, rgba(29, 78, 216, 0.2) 0%, transparent 5%),
                              linear-gradient(to bottom, rgba(29, 78, 216, 0.2) 0%, transparent 5%),
                              linear-gradient(to top, rgba(29, 78, 216, 0.2) 0%, transparent 5%)
                            `
            }}
          />

          {/* Contenido del pergamino */}
          <div className={`
                      relative p-4 md:p-5 transition-all duration-700 ease-out delay-300
                      ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                    `}>

            {/* Ornamento superior con manos estrechándose */}
            <div className="flex justify-center mb-3">
              <div className="flex items-center gap-3 text-blue-800">
                <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-blue-600 to-blue-600"></div>
                <Handshake className="w-6 h-6 text-blue-600" />
                <div className="w-8 h-0.5 bg-gradient-to-l from-transparent via-blue-600 to-blue-600"></div>
              </div>
            </div>

            {/* Título principal */}
            <h2 className="text-xl md:text-2xl font-bold text-center text-blue-800 mb-3 font-serif tracking-wide">
              Propuesta de Empate
            </h2>

            {/* Contenido principal */}
            <div className="text-blue-900 space-y-3 text-sm md:text-base leading-relaxed font-serif text-center">

              {/* Mensaje principal */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-lg">🤝</span>
                <p className="text-base font-semibold text-blue-800">
                  <span className="text-blue-700 font-bold">{playerName}</span> propone terminar la partida en empate
                </p>
                <span className="text-lg">🤝</span>
              </div>

              {/* Explicación del empate */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 shadow-inner">
                <div className="flex items-start gap-2">
                  <span className="text-lg mt-0.5">⚖️</span>
                  <div className="flex-1">
                    <p className="text-blue-800 font-semibold text-sm">
                      Si <span className="underline">aceptas</span> el empate,
                      <span className="text-blue-900 font-bold"> ambos jugadores terminarán en igualdad</span>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Consecuencias de rechazar */}
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                <div className="flex items-start gap-2">
                  <span className="text-base mt-0.5">🎮</span>
                  <div className="flex-1 text-left">
                    <p className="text-indigo-800 text-sm">
                      <span className="font-semibold">Si rechazas:</span> La partida continuará
                      normalmente hasta que haya un ganador definido.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pregunta final */}
              <div className="flex items-center justify-center gap-2 my-3">
                <Users className="w-5 h-5 text-indigo-600" />
                <p className="text-lg font-bold text-blue-900">
                  ¿Aceptas el empate?
                </p>
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-center gap-3 mt-4">
              {/* Botón Aceptar */}
              <button
                onClick={onAccept}
                className="bg-gradient-to-br from-green-400 via-green-500 to-green-600 text-white font-bold px-4 py-2 rounded-lg border-2 border-green-700 hover:scale-105 hover:shadow-lg transition-all duration-200 font-serif text-sm shadow-md hover:from-green-500 hover:to-green-700 flex items-center gap-1.5"
              >
                <Handshake className="w-4 h-4" />
                ¡Acepto!
              </button>

              {/* Botón Rechazar */}
              <button
                onClick={onReject}
                className="bg-gradient-to-br from-red-400 via-red-500 to-red-600 text-white font-bold px-4 py-2 rounded-lg border-2 border-red-700 hover:scale-105 hover:shadow-lg transition-all duration-200 font-serif text-sm shadow-md hover:from-red-500 hover:to-red-700 flex items-center gap-1.5"
              >
                <span className="text-base">⚔️</span>
                Continuar
              </button>
            </div>

            {/* Mensaje motivacional */}
            <div className="flex items-center justify-center gap-2 mt-4 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <span className="text-base">🏆</span>
              <p className="text-xs font-semibold italic text-blue-700 text-center">
                ¡El honor está en jugar limpio!
              </p>
            </div>
          </div>

          {/* Efectos de sombra interna */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 60px rgba(29, 78, 216, 0.1), inset 0 0 20px rgba(59, 130, 246, 0.1)'
            }}
          />
        </div>
      </div>

      <style>{`
                @keyframes unroll {
                  0% {
                    height: 0;
                    transform: rotate(1deg) scaleY(0);
                  }
                  50% {
                    height: 200px;
                    transform: rotate(1deg) scaleY(0.8);
                  }
                  100% {
                    height: auto;
                    transform: rotate(1deg) scaleY(1);
                  }
                }
                
                @keyframes roll-up {
                  0% {
                    height: auto;
                    transform: rotate(1deg) scaleY(1);
                  }
                  50% {
                    height: 100px;
                    transform: rotate(1deg) scaleY(0.5);
                  }
                  100% {
                    height: 0;
                    transform: rotate(1deg) scaleY(0);
                  }
                }

                @keyframes unroll-shadow {
                  0% {
                    height: 0;
                    transform: rotate(0.5deg) translate(4px, 6px) scaleY(0);
                  }
                  50% {
                    height: 200px;
                    transform: rotate(0.5deg) translate(4px, 6px) scaleY(0.8);
                  }
                  100% {
                    height: auto;
                    transform: rotate(0.5deg) translate(4px, 6px) scaleY(1);
                  }
                }
                
                @keyframes roll-up-shadow {
                  0% {
                    height: auto;
                    transform: rotate(0.5deg) translate(4px, 6px) scaleY(1);
                  }
                  50% {
                    height: 100px;
                    transform: rotate(0.5deg) translate(4px, 6px) scaleY(0.5);
                  }
                  100% {
                    height: 0;
                    transform: rotate(0.5deg) translate(4px, 6px) scaleY(0);
                  }
                }
                
                .animate-unroll {
                  animation: unroll 1s ease-out forwards;
                }
                
                .animate-roll-up {
                  animation: roll-up 0.8s ease-in forwards;
                }

                .animate-unroll-shadow {
                  animation: unroll-shadow 1s ease-out forwards;
                }
                
                .animate-roll-up-shadow {
                  animation: roll-up-shadow 0.8s ease-in forwards;
                }
            `}</style>
    </div>
  );
};

export default DrawConfirmModal;
