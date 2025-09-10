import React, { useState, useEffect } from 'react';
import { Swords, Sparkles } from 'lucide-react';

interface BattleConfirmModalProps {
    isOpen: boolean;
    onAccept: () => void;
    onReject: () => void;
    fairyName?: string; // Nombre del hada en disputa (opcional)
}

const BattleConfirmModal: React.FC<BattleConfirmModalProps> = ({
    isOpen,
    onAccept,
    onReject,
    fairyName = "Hada Encantada"
}) => {
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="relative max-w-lg w-full">
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
                    className={`absolute inset-0 bg-amber-900/20 -z-10 transition-all duration-1000 ease-out ${
                        isUnrolling ? 'animate-unroll-shadow' : 'animate-roll-up-shadow'
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
                      relative p-4 md:p-5 transition-all duration-700 ease-out delay-300
                      ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                    `}>

                        {/* Ornamento superior con espadas cruzadas */}
                        <div className="flex justify-center mb-3">
                            <div className="flex items-center gap-3 text-amber-800">
                                <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-red-600 to-red-600"></div>
                                <Swords className="w-6 h-6 text-red-600" />
                                <div className="w-8 h-0.5 bg-gradient-to-l from-transparent via-red-600 to-red-600"></div>
                            </div>
                        </div>

                        {/* Título principal */}
                        <h2 className="text-xl md:text-2xl font-bold text-center text-red-800 mb-3 font-serif tracking-wide">
                            ¡Desafío de Batalla!
                        </h2>

                        {/* Contenido principal */}
                        <div className="text-amber-900 space-y-3 text-sm md:text-base leading-relaxed font-serif text-center">

                            {/* Mensaje principal */}
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <span className="text-lg">🧚‍♀️</span>
                                <p className="text-base font-semibold text-amber-800">
                                    Tu oponente desea disputar el <span className="text-red-700 font-bold">{fairyName}</span>
                                </p>
                                <span className="text-lg">🧚‍♀️</span>
                            </div>

                            {/* Advertencia sobre las consecuencias */}
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200 shadow-inner">
                                <div className="flex items-start gap-2">
                                    <span className="text-lg mt-0.5">⚠️</span>
                                    <div className="flex-1">
                                        <p className="text-red-800 font-semibold text-sm">
                                            Si <span className="underline">rechazas</span> este duelo,
                                            <span className="text-red-900 font-bold"> cederás automáticamente el hada</span>.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Explicación de la batalla */}
                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                                <div className="flex items-start gap-2">
                                    <span className="text-base mt-0.5">⚔️</span>
                                    <div className="flex-1 text-left">
                                        <p className="text-amber-800 text-sm">
                                            <span className="font-semibold">Si aceptas:</span> Podrás usar tus cartas de magia
                                            para modificar la variable X y cumplir las condiciones de captura.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Pregunta final */}
                            <div className="flex items-center justify-center gap-2 my-3">
                                <Sparkles className="w-5 h-5 text-amber-600" />
                                <p className="text-lg font-bold text-amber-900">
                                    ¿Aceptas el desafío?
                                </p>
                                <Sparkles className="w-5 h-5 text-amber-600" />
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex justify-center gap-3 mt-4">
                            {/* Botón Aceptar */}
                            <button
                                onClick={onAccept}
                                className="bg-gradient-to-br from-green-400 via-green-500 to-green-600 text-white font-bold px-4 py-2 rounded-lg border-2 border-green-700 hover:scale-105 hover:shadow-lg transition-all duration-200 font-serif text-sm shadow-md hover:from-green-500 hover:to-green-700 flex items-center gap-1.5"
                            >
                                <Swords className="w-4 h-4" />
                                ¡Acepto!
                            </button>

                            {/* Botón Rechazar */}
                            <button
                                onClick={onReject}
                                className="bg-gradient-to-br from-red-400 via-red-500 to-red-600 text-white font-bold px-4 py-2 rounded-lg border-2 border-red-700 hover:scale-105 hover:shadow-lg transition-all duration-200 font-serif text-sm shadow-md hover:from-red-500 hover:to-red-700 flex items-center gap-1.5"
                            >
                                <span className="text-base">🏃‍♂️</span>
                                Ceder
                            </button>
                        </div>

                        {/* Mensaje motivacional */}
                        <div className="flex items-center justify-center gap-2 mt-4 p-2 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                            <span className="text-base">🎯</span>
                            <p className="text-xs font-semibold italic text-amber-700 text-center">
                                ¡La valentía será recompensada!
                            </p>
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

export default BattleConfirmModal;