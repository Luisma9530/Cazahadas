import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GameRulesModal: React.FC<GameRulesModalProps> = ({ isOpen, onClose }) => {
  const [isUnrolling, setIsUnrolling] = useState(false);
  const [showContent, setShowContent] = useState(false);

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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="text-center">
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative max-w-xl w-full max-h-[85vh]">

              {/* Rodillo Superior */}
              <div className="absolute -top-3 left-6 right-6 h-4 bg-gradient-to-r from-amber-800 via-yellow-700 to-amber-800 rounded-full shadow-lg z-20 border-2 border-amber-900">
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-600 to-amber-800 rounded-full opacity-60"></div>
                <div className="absolute left-1 top-0.5 w-1.5 h-3 bg-amber-900 rounded-sm"></div>
                <div className="absolute right-1 top-0.5 w-1.5 h-3 bg-amber-900 rounded-sm"></div>
              </div>

              {/* Rodillo Inferior */}
              <div className="absolute -bottom-3 left-6 right-6 h-4 bg-gradient-to-r from-amber-800 via-yellow-700 to-amber-800 rounded-full shadow-lg z-20 border-2 border-amber-900">
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-600 to-amber-800 rounded-full opacity-60"></div>
                <div className="absolute left-1 top-0.5 w-1.5 h-3 bg-amber-900 rounded-sm"></div>
                <div className="absolute right-1 top-0.5 w-1.5 h-3 bg-amber-900 rounded-sm"></div>
              </div>

              {/* Sombra del pergamino */}
              <div
                className={`absolute inset-0 bg-amber-900/20 -z-10 transition-all duration-1000 ease-out ${isUnrolling ? 'animate-unroll-shadow' : 'animate-roll-up-shadow'
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
                  relative bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 shadow-2xl transform rotate-1
                  transition-all duration-1000 ease-out overflow-hidden
                  ${isUnrolling ? 'animate-unroll' : 'animate-roll-up'}
                `}
                style={{
                  clipPath: 'polygon(2% 0%, 98% 1%, 99% 4%, 97% 8%, 99% 12%, 98% 96%, 95% 99%, 92% 97%, 8% 98%, 5% 96%, 1% 92%, 3% 8%, 1% 4%)',
                  filter: 'drop-shadow(0 10px 20px rgba(139, 69, 19, 0.3))',
                  transformOrigin: 'top center'
                }}
              >
                {/* Textura de pergamino */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 20% 30%, rgba(139, 69, 19, 0.1) 2px, transparent 2px),
                      radial-gradient(circle at 80% 70%, rgba(160, 82, 45, 0.08) 1px, transparent 1px),
                      radial-gradient(circle at 40% 80%, rgba(139, 69, 19, 0.06) 1.5px, transparent 1.5px),
                      linear-gradient(45deg, transparent 48%, rgba(139, 69, 19, 0.03) 49%, rgba(139, 69, 19, 0.03) 51%, transparent 52%)
                    `,
                    backgroundSize: '50px 50px, 30px 30px, 70px 70px, 20px 20px',
                  }}
                />

                {/* Bordes quemados/envejecidos */}
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: `
                      linear-gradient(to right, rgba(139, 69, 19, 0.2) 0%, transparent 5%),
                      linear-gradient(to left, rgba(139, 69, 19, 0.2) 0%, transparent 5%),
                      linear-gradient(to bottom, rgba(139, 69, 19, 0.2) 0%, transparent 5%),
                      linear-gradient(to top, rgba(139, 69, 19, 0.2) 0%, transparent 5%)
                    `
                  }}
                />

                {/* Contenido del pergamino */}
                <div className={`
                  relative p-6 md:p-8 transition-all duration-700 ease-out delay-300 max-h-[70vh] overflow-y-auto
                  ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                `}>
                  {/* Botón cerrar en esquina */}
                  <button
                    onClick={onClose}
                    className="sticky top-0 float-right w-8 h-8 rounded-full bg-amber-200/80 border-2 border-amber-600 text-amber-800 font-bold hover:scale-110 hover:bg-amber-300/80 transition-all duration-200 shadow-md z-10 mb-4"
                    title="Cerrar pergamino"
                  >
                    ×
                  </button>

                  {/* Ornamento superior */}
                  <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-3 text-amber-800">
                      <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-amber-600"></div>
                      <Sparkles className="w-8 h-8 text-amber-600" />
                      <div className="w-16 h-0.5 bg-gradient-to-l from-transparent via-amber-600 to-amber-600"></div>
                    </div>
                  </div>

                  {/* Título principal */}
                  <h2 className="text-2xl md:text-3xl font-bold text-center text-amber-900 mb-6 font-serif tracking-wide">
                    Reglas de Cazahadas
                  </h2>

                  {/* Ornamento divisor */}
                  <div className="flex justify-center mb-6">
                    <div className="text-amber-600 text-xl">❦ ❦ ❦</div>
                  </div>

                  {/* Contenido de las reglas */}
                  <div className="text-amber-900 space-y-5 text-base md:text-lg leading-relaxed font-serif">
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-1">🧚</span>
                      <p className="flex-1">
                        <span className="font-semibold text-amber-800">Bienvenido, buscador de hadas. </span>
                        Aquí se revelan las reglas del juego encantado que han sido escritas en los anales del tiempo.
                      </p>
                    </div>

                    {/* Objetivo del juego */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-amber-800 border-b border-amber-400 pb-2">1. Objetivo del juego</h3>
                      <div className="flex items-start gap-3">
                        <span className="text-amber-600 text-lg">⚡</span>
                        <p>En CazaHadas participan dos jugadores. En el centro del tablero hay tres casillas con hadas
                          y una casilla de la <span className="font-semibold text-amber-800">variable X</span>, que comienza en 0. El objetivo es <span className="font-semibold text-amber-800">capturar más hadas</span> que el oponente. El jugador que,
                          al final de la partida, tenga más hadas capturadas, ¡gana!</p>
                      </div>
                    </div>

                    {/* Preparación */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-amber-800 border-b border-amber-400 pb-2">2. Preparación</h3>
                      <div className="flex items-start gap-3">
                        <span className="text-amber-600 font-bold">1</span>
                        <p>Cada jugador recibe una <span className="font-semibold">baraja</span> de cartas.</p>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="text-amber-600 font-bold">2</span>
                        <p>Se forma el <span className="font-semibold">tablero</span> de 3 filas x 4 columnas:</p>
                      </div>
                      <div className="ml-6 space-y-2">
                        <div className="flex items-start gap-3">
                          <span className="text-amber-600 font-bold">•</span>
                          <p><span className="font-semibold">Fila superior:</span> Defensas, Hadas capturadas, Descartes, Zona de magias jugadas.</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-amber-600 font-bold">•</span>
                          <p><span className="font-semibold">Fila central:</span> 3 casillas con hadas y la casilla de la variable X.</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-amber-600 font-bold">•</span>
                          <p><span className="font-semibold">Fila inferior:</span> Defensas, Hadas capturadas, Descartes, Zona de magias jugadas.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="text-amber-600 font-bold">3</span>
                        <p>Cada jugador roba <span className="font-semibold">7 cartas</span> de su baraja para formar su <span className="font-semibold">mano inicial</span>.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-amber-600 font-bold">4</span>
                        <p>La variable X se sitúa en la casilla central con valor inicial <span className="font-semibold">0</span>.</p>
                      </div>
                    </div>

                    {/* Componentes del juego */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-amber-800 border-b border-amber-400 pb-2">3. Componentes del juego</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600">📚</span>
                          <p><span className="font-semibold">Baraja:</span> Conjunto de cartas no robadas.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600">🎴</span>
                          <p><span className="font-semibold">Mano:</span> Cartas que cada jugador tiene disponibles.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600">🗂️</span>
                          <p><span className="font-semibold">Pila de descartes:</span> Cartas usadas.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600">✨</span>
                          <p><span className="font-semibold">Zona de Magias:</span> Donde se colocan las cartas Magic.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600">🧚</span>
                          <p><span className="font-semibold">Casillas de Hadas:</span> Tres casillas con hadas a capturar.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600">❌</span>
                          <p><span className="font-semibold">Variable X:</span> Valor numérico modificable con Magic.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600">🎯</span>
                          <p><span className="font-semibold">Cartas Catch:</span> Para intentar capturar hadas.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600">🔮</span>
                          <p><span className="font-semibold">Cartas Magic:</span> Modifican el valor de X.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600">🛡️</span>
                          <p><span className="font-semibold">Cartas Shield:</span> Evitan capturas adversarias.</p>
                        </div>
                      </div>
                    </div>

                    {/* Desarrollo de la partida */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-amber-800 border-b border-amber-400 pb-2">4. Desarrollo de la partida</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="text-amber-600 text-lg">🎲</span>
                          <p>Cada jugador comienza con una mano de <span className="font-semibold">7 cartas</span>.</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-amber-600 text-lg">🔄</span>
                          <p>Cada turno <span className="font-semibold">jugará una carta</span>.</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-amber-600 text-lg">📤</span>
                          <p>Al comienzo del siguiente turno <span className="font-semibold">robará una carta</span>, a menos que se encuentre en una <span className="font-semibold">batalla</span>.</p>
                        </div>

                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                          <h4 className="font-bold text-amber-800 mb-2">⚔️ Batalla</h4>
                          <div className="space-y-2 text-sm">
                            <p>Para <span className="font-semibold">iniciar una batalla</span>, un jugador debe colocar una <span className="font-semibold">carta de tipo Catch</span> sobre un hada.</p>
                            <p>Durante la batalla <span className="font-semibold">no se robarán cartas</span>.</p>
                            <p>Las <span className="font-semibold">magias</span> solo se pueden jugar en la <span className="font-semibold">Zona de Magias</span> durante las batallas.</p>
                            <p>Para <span className="font-semibold">concluir una batalla</span>, <span className="font-semibold">los dos jugadores deben saltar el turno</span>.</p>
                          </div>
                        </div>

                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                          <h4 className="font-bold text-amber-800 mb-2">🎯 Durante la batalla:</h4>
                          <div className="space-y-2 text-sm">
                            <p>• El jugador que ha colocado la carta Catch deberá usar sus cartas de magia para que el valor de <span className="font-semibold">X</span> cumpla con la <span className="font-semibold">condición de captura</span>.</p>
                            <p>• La condición de captura la impondrá el jugador que <span className="font-semibold">NO</span> ha usado la carta Catch, utilizando la <span className="font-semibold">última carta</span> situada en la casilla de defensa.</p>
                            <p>• El jugador que defiende también podrá <span className="font-semibold">modificar el valor de X</span> durante la batalla.</p>
                            <p>• Fuera de la batalla <span className="font-semibold">no se puede usar magia</span> para modificar <span className="font-semibold">X</span>.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fin de la partida */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-amber-800 border-b border-amber-400 pb-2">5. Fin de la partida</h3>
                      <div className="flex items-start gap-3">
                        <span className="text-amber-600 text-lg">🏆</span>
                        <p>La partida termina cuando un jugador haya capturado a la <span className="font-semibold text-amber-800">mayoría de las hadas</span>.</p>
                      </div>
                    </div>

                    {/* Consejos y estrategias */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-amber-800 border-b border-amber-400 pb-2">6. Consejos y estrategias</h3>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <span className="text-amber-600">⚖️</span>
                          <p><span className="font-semibold">Equilibra tu X:</span> Ajusta la variable X para preparar capturas clave.</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-amber-600">🎯</span>
                          <p><span className="font-semibold">Prioriza cartas Catch:</span> Asegúrate de tener siempre al menos una carta Catch para no perder oportunidades.</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-amber-600">👁️</span>
                          <p><span className="font-semibold">Observa al rival:</span> Controla cuántas magias juega tu oponente para anticipar el valor de X.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 mt-8 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200">
                      <span className="text-2xl mt-1">🎉</span>
                      <p className="flex-1 font-semibold italic text-amber-800">
                        ¡Que empiece la caza de hadas! ¡Buena suerte y que captures muchas hadas!
                      </p>
                    </div>
                  </div>

                  {/* Ornamento inferior */}
                  <div className="flex justify-center my-6">
                    <div className="text-amber-600 text-lg">❦</div>
                  </div>

                  {/* Botón de cerrar estilizado */}
                  <div className="flex justify-center">
                    <button
                      onClick={onClose}
                      className="bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-amber-900 font-bold px-8 py-3 rounded-lg border-2 border-amber-600 hover:scale-105 hover:shadow-lg transition-all duration-200 font-serif text-lg shadow-md hover:from-amber-400 hover:to-amber-600"
                    >
                      Que así sea ✨
                    </button>
                  </div>
                </div>

                {/* Efectos de sombra interna */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow: 'inset 0 0 60px rgba(139, 69, 19, 0.1), inset 0 0 20px rgba(160, 82, 45, 0.1)'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes unroll {
          0% {
            height: 0;
            transform: rotate(1deg) scaleY(0);
          }
          50% {
            height: 400px;
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
            height: 200px;
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
            height: 400px;
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
            height: 200px;
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

export default GameRulesModal;