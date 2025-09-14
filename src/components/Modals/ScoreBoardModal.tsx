import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Medal, Star, Zap } from 'lucide-react';

interface ScoreboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  scores?: Array<{
    username: string;
    score: number;
  }>;
}

const ScoreboardModal: React.FC<ScoreboardModalProps> = ({
  isOpen,
  onClose,
  scores,
}) => {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [glitchEffect, setGlitchEffect] = useState(false);

  // Procesar scores para añadir rankings automáticamente
  const processedScores = scores?.map((score, index) => ({
    ...score,
    rank: index + 1,
    date: new Date().toISOString().split('T')[0] // Fecha actual por defecto
  }));

  useEffect(() => {
    if (isOpen && !hasAnimated) {
      setHasAnimated(true);
      setTimeout(() => setShowContent(true), 800);
      // Efecto glitch ocasional
      const glitchInterval = setInterval(() => {
        if (Math.random() < 0.3) {
          setGlitchEffect(true);
          setTimeout(() => setGlitchEffect(false), 100);
        }
      }, 3000);
      return () => clearInterval(glitchInterval);
    } else if (isOpen && hasAnimated) {
      setShowContent(true);
      // Solo efecto glitch si ya se animó
      const glitchInterval = setInterval(() => {
        if (Math.random() < 0.3) {
          setGlitchEffect(true);
          setTimeout(() => setGlitchEffect(false), 100);
        }
      }, 3000);
      return () => clearInterval(glitchInterval);
    } else if (!isOpen) {
      setShowContent(false);
      setHasAnimated(false);
      setGlitchEffect(false);
    }
  }, [isOpen, hasAnimated]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-300" />;
      case 2: return <Medal className="w-6 h-6 text-gray-300" />;
      case 3: return <Trophy className="w-6 h-6 text-orange-400" />;
      default: return <Star className="w-5 h-5 text-blue-300" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "from-yellow-400 via-yellow-300 to-yellow-500 text-yellow-900";
      case 2: return "from-gray-300 via-gray-200 to-gray-400 text-gray-800";
      case 3: return "from-orange-400 via-orange-300 to-orange-500 text-orange-900";
      default: return "from-blue-400 via-blue-300 to-blue-500 text-blue-900";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="relative max-w-2xl w-full max-h-[90vh]">

        {/* Efecto de escanlines retro */}
        <div className="absolute inset-0 pointer-events-none z-30 opacity-20 scanlines">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)',
              backfaceVisibility: 'hidden',
              transform: 'translateZ(0)',
            }}
          />
        </div>

        {/* Pantalla CRT principal */}
        <div
          className={`
            relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl
            border-8 border-gray-700 shadow-2xl overflow-hidden
            transition-all duration-800 ease-out
            ${!hasAnimated ? 'animate-screen-boot' : ''}
            ${glitchEffect ? 'animate-glitch' : ''}
          `}
          style={{
            boxShadow: `
              0 0 50px rgba(0, 255, 0, 0.3),
              inset 0 0 100px rgba(0, 255, 0, 0.1),
              0 20px 40px rgba(0, 0, 0, 0.8)
            `,
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
            willChange: 'transform',
          }}
        >
          {/* Marco de la pantalla CRT */}
          <div className="absolute inset-4 border-2 border-green-500/30 rounded-lg" />

          {/* Contenido de la pantalla */}
          <div className={`
          relative p-8 transition-all duration-700 ease-out delay-300 max-h-[80vh] overflow-y-auto
          ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}>

            {/* Botón cerrar estilo retro */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-red-600 hover:bg-red-500 border-2 border-red-400 rounded text-white font-bold text-xl transition-all duration-200 hover:scale-110 z-10"
              title="SALIR"
            >
              ×
            </button>

            {/* Header del scoreboard */}
            <div className="text-center mb-8">
              <div className="mb-4">
                <h1 className="text-4xl md:text-5xl font-bold text-green-400 mb-2 font-mono tracking-wider animate-pulse">
                  ◊ SALÓN DE LA FAMA ◊
                </h1>
                <div className="text-green-300 text-lg font-mono font-semibold">
                  ═══════════════════════════════
                </div>
              </div>

              {/* Indicadores estilo arcade */}
              <div className="flex justify-center gap-4 mb-6">
                <div className="flex items-center gap-2 bg-green-900/50 px-4 py-2 rounded border border-green-500">
                  <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
                  <span className="text-green-300 font-mono text-sm">TOP PLAYERS</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-900/50 px-4 py-2 rounded border border-blue-500">
                  <Trophy className="w-5 h-5 text-blue-300" />
                  <span className="text-blue-300 font-mono text-sm">HIGH SCORES</span>
                </div>
              </div>
            </div>

            {/* Headers de la tabla */}
            <div className="grid grid-cols-12 gap-2 mb-4 px-4 py-2 bg-green-900/30 border border-green-500 rounded font-mono text-green-300 text-sm font-bold">
              <div className="col-span-2 text-center font-extrabold">RNK</div>
              <div className="col-span-6 font-extrabold">NOMBRE DEL JUGADOR</div>
              <div className="col-span-4 text-center font-extrabold">HADAS CAPTURADAS</div>
            </div>

            {/* Lista de puntuaciones */}
            <div className="space-y-2">
              {processedScores?.map((score, index) => (
                <div
                  key={index}
                  className={`
                    grid grid-cols-12 gap-2 p-3 rounded border-2 transition-all duration-300 hover:scale-[1.02]
                    ${score.rank <= 3
                      ? `bg-gradient-to-r ${getRankColor(score.rank)} border-current shadow-lg`
                      : 'bg-gray-800/50 border-green-500/50 text-green-300 hover:bg-gray-700/50'
                    }
                  `}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    animation: showContent ? 'slideInFromRight 0.5s ease-out forwards' : 'none'
                  }}
                >
                  {/* Rank con icono */}
                  <div className="col-span-2 flex items-center justify-center font-mono font-extrabold">
                    <div className="flex flex-col items-center">
                      {getRankIcon(score.rank)}
                      <span className="text-sm mt-1 font-bold">#{score.rank}</span>
                    </div>
                  </div>

                  {/* Nombre del jugador */}
                  <div className="col-span-6 flex items-center font-mono font-extrabold text-base">
                    <span className="truncate">{score.username}</span>
                  </div>

                  {/* Hadas capturadas */}
                  <div className="col-span-4 flex items-center justify-center">
                    <div className="text-center">
                      <div className="font-mono font-extrabold text-xl">{score.score}</div>
                      <div className="text-sm opacity-90 emoji">🧚</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer retro */}
            <div className="mt-8 text-center">
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-black font-bold px-8 py-3 rounded-lg border-2 border-green-400 hover:scale-105 hover:shadow-lg transition-all duration-200 font-mono text-lg shadow-md hover:from-green-500 hover:to-green-500 animate-pulse"
              >
                [VOLVER AL JUEGO]
              </button>
            </div>

            {/* Efectos de sombra interna */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: 'inset 0 0 60px rgba(0, 255, 0, 0.1), inset 0 0 20px rgba(0, 255, 0, 0.05)'
              }}
            />
          </div>

          {/* Efecto de brillo CRT */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,255,0,0.05) 100%)',
            }}
          />
        </div>
      </div>

      <style>{`
        /* Optimizaciones de renderizado */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        @keyframes screen-boot {
          0% {
            transform: scaleY(0.01) scaleX(1) translateZ(0);
            opacity: 0;
          }
          50% {
            transform: scaleY(0.01) scaleX(1) translateZ(0);
            opacity: 1;
          }
          70% {
            transform: scaleY(0.5) scaleX(1) translateZ(0);
          }
          100% {
            transform: scaleY(1) scaleX(1) translateZ(0);
            opacity: 1;
          }
        }
        
        @keyframes screen-shutdown {
          0% {
            transform: scaleY(1) scaleX(1) translateZ(0);
            opacity: 1;
          }
          30% {
            transform: scaleY(0.5) scaleX(1) translateZ(0);
          }
          50% {
            transform: scaleY(0.01) scaleX(1) translateZ(0);
            opacity: 1;
          }
          100% {
            transform: scaleY(0.01) scaleX(1) translateZ(0);
            opacity: 0;
          }
        }

        @keyframes glitch {
          0%, 100% { 
            transform: translate(0) translateZ(0);
            filter: hue-rotate(0deg);
          }
          10% { 
            transform: translate(-2px, 2px) translateZ(0);
            filter: hue-rotate(5deg);
          }
          20% { 
            transform: translate(-1px, -2px) translateZ(0);
            filter: hue-rotate(-5deg);
          }
          30% { 
            transform: translate(1px, 2px) translateZ(0);
            filter: hue-rotate(10deg);
          }
          40% { 
            transform: translate(-1px, -1px) translateZ(0);
            filter: hue-rotate(-10deg);
          }
          50% { 
            transform: translate(2px, -1px) translateZ(0);
            filter: hue-rotate(0deg);
          }
          60% { 
            transform: translate(-2px, 1px) translateZ(0);
            filter: hue-rotate(5deg);
          }
          70% { 
            transform: translate(2px, 1px) translateZ(0);
            filter: hue-rotate(-5deg);
          }
          80% { 
            transform: translate(-1px, -1px) translateZ(0);
            filter: hue-rotate(10deg);
          }
          90% { 
            transform: translate(1px, 2px) translateZ(0);
            filter: hue-rotate(-10deg);
          }
        }

        @keyframes slideInFromRight {
          0% {
            transform: translateX(100px) translateZ(0);
            opacity: 0;
          }
          100% {
            transform: translateX(0) translateZ(0);
            opacity: 1;
          }
        }
        
        .animate-screen-boot {
          animation: screen-boot 0.8s ease-out forwards;
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }
        
        .animate-screen-shutdown {
          animation: screen-shutdown 0.6s ease-in forwards;
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }

        .animate-glitch {
          animation: glitch 0.1s ease-in-out;
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }

        /* Efecto de tipografía pixelada mejorado */
        .font-mono {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'Courier New', monospace;
          text-shadow: 0 0 3px currentColor, 0 1px 0 rgba(0,0,0,0.8);
          font-feature-settings: 'liga' off;
          font-kerning: auto;
          text-rendering: optimizeLegibility;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        /* Mejoras específicas de legibilidad */
        .text-green-400 {
          color: #4ade80 !important;
          text-shadow: 0 0 8px rgba(74, 222, 128, 0.5), 0 1px 0 rgba(0,0,0,0.9);
        }

        .text-green-300 {
          color: #86efac !important;
          text-shadow: 0 0 4px rgba(134, 239, 172, 0.3), 0 1px 0 rgba(0,0,0,0.7);
        }

        .text-blue-300 {
          color: #93c5fd !important;
          text-shadow: 0 0 4px rgba(147, 197, 253, 0.3), 0 1px 0 rgba(0,0,0,0.7);
        }

        .text-yellow-300 {
          color: #fde047 !important;
          text-shadow: 0 0 6px rgba(253, 224, 71, 0.4), 0 1px 0 rgba(0,0,0,0.8);
        }

        .text-gray-300 {
          color: #d1d5db !important;
          text-shadow: 0 0 4px rgba(209, 213, 219, 0.3), 0 1px 0 rgba(0,0,0,0.7);
        }

        .text-orange-400 {
          color: #fb923c !important;
          text-shadow: 0 0 6px rgba(251, 146, 60, 0.4), 0 1px 0 rgba(0,0,0,0.8);
        }

        /* Mejoras para títulos grandes */
        .text-4xl, .text-5xl {
          font-weight: 700;
          letter-spacing: 1px;
        }

        /* Mejoras para texto pequeño */
        .text-sm, .text-xs {
          font-weight: 600;
          letter-spacing: 0.3px;
        }

        /* Contraste mejorado para backgrounds */
        .bg-green-900\\/30 {
          background-color: rgba(20, 83, 45, 0.6) !important;
          backdrop-filter: blur(1px);
        }

        .bg-gray-800\\/50 {
          background-color: rgba(31, 41, 55, 0.8) !important;
          backdrop-filter: blur(1px);
        }

        /* Optimizaciones de elementos interactivos */
        button, .hover\\:scale-110:hover, .hover\\:scale-105:hover, .hover\\:scale-\\[1\\.02\\]:hover {
          backface-visibility: hidden;
          transform-style: preserve-3d;
          will-change: transform;
        }

        /* Optimizaciones de gradientes */
        .bg-gradient-to-r, .bg-gradient-to-br {
          background-attachment: fixed;
        }

        /* Scroll personalizado mejorado */
        .overflow-y-auto {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }

        .overflow-y-auto::-webkit-scrollbar {
          width: 12px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 6px;
          border: 2px solid #1f2937;
          transition: background 0.2s ease;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }

        /* Optimizaciones para elementos con escanlines */
        .scanlines {
          pointer-events: none;
          backface-visibility: hidden;
          transform: translateZ(0);
        }

        /* Optimizaciones para efectos de sombra */
        [style*="box-shadow"] {
          backface-visibility: hidden;
          transform: translateZ(0);
        }

        /* Mejoras de performance para elementos animados */
        .animate-pulse {
          will-change: opacity;
          backface-visibility: hidden;
        }

        /* Optimizaciones para imágenes y emojis */
        .emoji {
          font-family: 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif;
          font-feature-settings: 'liga' on;
        }
      `}</style>
    </div>
  );
};

export default ScoreboardModal;