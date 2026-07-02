import { useEffect, useState } from "react";
import Board from "../../components/Board";
import socket from "../../socket";
import { Tile } from "../../@types/Tile";
import useBoardStore from "../../store/BoardStore";
import { Result, useGameStore } from "../../store/GameStore";
import SkipTurn from "../../components/SkipTurn";
import TurnIndicator from "../../components/TurnIndicator.tsx";
import { useModalStore } from "../../store/ModalStore";
import { GameStartModal } from "../../components/Modals/GameStartModal";
import { TurnModal } from "../../components/Modals/TurnModal";
import { BattleModal } from "../../components/Modals/BattleModal";
import { BattleEndModal } from "../../components/Modals/BattleEndModal";
import useTurnStore from "../../store/TurnStore";
import { EndGameModal } from "../../components/Modals/EndGameModal";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-regular-svg-icons";
import { CardUnity } from "../../@types/Card";
import BattleConfirmModal from "../../components/Modals/BattleStartModal.tsx";
import DrawConfirmModal from "../../components/Modals/DrawConfirmModal.tsx";
import RequestDraw from "../../components/drawGame.tsx";
import GameWrapper from "../../utils/GameWrapper.tsx";
import SurrenderButton from "../../components/SurrenderButton.tsx";

/**
 * Página principal de juego que coordina todos los elementos visuales
 * y la comunicación con el servidor durante una partida activa.
 * Gestiona el ciclo de vida de la partida mediante listeners Socket.IO,
 * controla la visibilidad de los modales de juego, y adapta la interfaz
 * según la orientación del dispositivo y el estado de pantalla completa.
 * Mientras espera al segundo jugador, muestra el código de sala con un
 * botón de copia. Una vez iniciada la partida, renderiza el tablero dentro
 * de GameWrapper junto con los controles de turno, rendición y tablas.
 *
 * No recibe props. Obtiene el identificador de sala de los parámetros
 * de la URL y el estado de la partida de BoardStore, GameStore, TurnStore
 * y ModalStore.
 */
export default function Game() {
  const [loading, setLoading] = useState(true)
  const [gameBusy, setGameBusy] = useState(false)
  const [isCopied, setIsCopied] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false); // CAMBIO: ahora solo trackea el estado


  const [isMyTurn, toggleTurn, setPlayerSkippedTurn, setIsBattle, isBattle, setIsMyFirstTurnBattle, showBattleModal, setShowBattleModal, showDrawModal, setShowDrawModal, isMyFirstTurn] = useTurnStore((state) => [state.isMyTurn, state.toggleTurn, state.setPlayerSkippedTurn, state.setIsBattle, state.isBattle, state.setIsMyFirstTurnBattle, state.showBattleModal, state.setShowBattleModal, state.showDrawModal, state.setShowDrawModal, state.isMyFirstTurn]);
  const [setBoard, board, clearDeckAndMagic] = useBoardStore((state) => [state.setBoard, state.board, state.clearDeckAndMagic]);
  const [amIP1, setAmIP1, gameOver, setGameOver, setPlayerOneName, setPlayerTwoName, setPlayerDisconnected, setGameResult, gameResult] = useGameStore((state) => [state.amIP1, state.setAmIP1, state.gameOver, state.setGameOver, state.setPlayerOneName, state.setPlayerTwoName, state.setPlayerDisconnected, state.setGameResult, state.gameResult])

  const { id: gameId } = useParams<{ id: string }>()

  const [gameStartModal, toggleGameStartModal, turnModal, toggleTurnModal, battleModal, toggleBattleModal, battleEndModal, toggleBattleEndModal] = useModalStore((state) => [state.gameStartModal, state.toggleGameStartModal, state.turnModal, state.toggleTurnModal, state.battleModal, state.toggleBattleModal, state.battleEndModal, state.toggleBattleEndModal]);

  /**
   * Efecto de inicialización que gestiona la detección de orientación del
   * dispositivo y el estado de pantalla completa. Registra listeners para
   * los eventos "resize" y "orientationchange" para detectar si el dispositivo
   * está en modo vertical, y para "fullscreenchange" y "webkitfullscreenchange"
   * para sincronizar el estado isFullscreen cuando el usuario sale de pantalla
   * completa mediante la tecla ESC. Limpia todos los listeners al desmontar.
   */
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 768;
      const isPortraitMode = window.innerHeight > window.innerWidth;
      setIsPortrait(isMobile && isPortraitMode);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    // Listener para sincronizar el estado cuando el usuario salga de fullscreen con ESC
    const handleFullscreenChange = () => {
      const isInFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement
      );
      setIsFullscreen(isInFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  /**
   * Alterna el modo de pantalla completa del navegador de forma compatible
   * con los principales navegadores mediante las APIs estándar y sus
   * variantes con prefijo de proveedor (webkit, moz, ms). Si el navegador
   * está en pantalla completa, sale de ella; en caso contrario, entra en
   * pantalla completa usando el elemento raíz del documento.
   * Actualiza el estado isFullscreen según el resultado de la operación.
   */
  const toggleFullscreen = async () => {
    try {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (isCurrentlyFullscreen) {
        // Salir de fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      } else {
        // Entrar en fullscreen
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).mozRequestFullScreen) {
          await (elem as any).mozRequestFullScreen();
        } else if ((elem as any).msRequestFullscreen) {
          await (elem as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      }
    } catch (err) {
      console.log('Error con fullscreen:', err);
    }
  };

  /**
   * Efecto que registra los listeners Socket.IO principales para el flujo
   * de la partida. Se ejecuta cuando cambian isMyTurn o amIP1 para evitar
   * closures obsoletos. Gestiona los siguientes eventos:
   * - "player-connected": establece la identidad del jugador local (amIP1).
   * - "game-start": inicia la partida, activa el modal de inicio y el turno
   *   del Jugador 1 si corresponde.
   * - "new-turn": actualiza el tablero, el estado de batalla y alterna el turno.
   * - "game-end": determina el resultado de la partida según la razón de
   *   finalización (captura de dos hadas, rendición, tablas, o desconexión)
   *   y activa el modal de fin de partida.
   * - "game-busy": indica que la sala está completa y no se puede unir.
   * Limpia todos los listeners al desmontar o cuando cambian las dependencias.
   */
  useEffect(() => {
    socket.on('player-connected', (data: { firstPlayer: boolean }) => {
      setAmIP1(data.firstPlayer)
    })

    socket.on('game-start', (data) => {
      setLoading(false)
      toggleGameStartModal()
      if (amIP1) {
        toggleTurn()
      }
      setPlayerOneName(data[0])
      setPlayerTwoName(data[1])
    })

    socket.on('new-turn', (data: { tiles: Tile[][], playerSkippedTurn: boolean, endBattle: boolean, selectedCard: CardUnity }) => {
      if (isBattle && data.endBattle) { // Si es una batalla y se terminó, se reinicia el estado de batalla
        setPlayerSkippedTurn(false)
        setIsBattle(false)
        setIsMyFirstTurnBattle(false);
      } else { // Si no es una batalla o no se terminó, se actualiza el estado de si el jugador saltó su turno
        setPlayerSkippedTurn(data.playerSkippedTurn)
      }
      toggleTurnModal()
      setBoard(data.tiles);
      toggleTurn()
    })

    socket.on('game-end', (data: { tiles: Tile[][], playerDisconnected: boolean, winner: boolean, reason: string }) => {
      setPlayerSkippedTurn(false)

      if (data?.reason === 'captured-two-fairies') {
        if (data.winner) {
          setGameResult(Result.PLAYER1WIN)
        } else {
          setGameResult(Result.PLAYER2WIN)
        }
      }

      if (data?.reason === 'player-skipped-turn') {
        var player1Fairies = 0
        var player2Fairies = 0
        if (data.tiles[0][1].type === 'capturedFairies' && data.tiles[0][1].cards && data.tiles[2][1].type === 'capturedFairies' && data.tiles[2][1].cards) {
          player1Fairies = data.tiles[2][1].cards.length
          player2Fairies = data.tiles[0][1].cards.length
        }

        if (player1Fairies > player2Fairies) {
          setGameResult(Result.PLAYER1WIN)
        } else if (player1Fairies < player2Fairies) {
          setGameResult(Result.PLAYER2WIN)
        } else {
          setGameResult(Result.DRAW)
        }
      }

      if (data?.reason === 'surrender') {
        if (data.winner) {
          setGameResult(Result.PLAYER1WIN)
        } else {
          setGameResult(Result.PLAYER2WIN)
        }
      }

      if (data?.reason === 'draw-request') {
        setGameResult(Result.DRAW)
      }
      console.log("Player Result:", gameResult);

      if (data?.playerDisconnected) {
        setPlayerDisconnected(true)
        console.log("El oponente se ha desconectado.");

        // Solo establecer victoria por desconexión si no hay resultado previo
        if (gameResult === Result.NONE) {
          if (amIP1) {
            setGameResult(Result.PLAYER1WIN)
          } else {
            setGameResult(Result.PLAYER2WIN)
          }
        }
      }

      setGameOver(true)
    })

    socket.on('game-busy', () => {
      setLoading(false)
      setGameBusy(true)
    })

    return () => {
      socket.off('player-connected');
      socket.off('game-start');
      socket.off('new-turn');
      socket.off('game-end');
      socket.off('game-busy');
    }
  }, [isMyTurn, amIP1]);

  /**
   * Copia el código de sala al portapapeles del usuario.
   * Utiliza la API Clipboard moderna cuando está disponible, con un fallback
   * a document.execCommand para navegadores que no soportan HTTPS o versiones
   * antiguas. Actualiza el estado isCopied para reflejar visualmente la acción.
   *
   * @param {string} [gameId] - Identificador de sala a copiar. Si no se
   *   proporciona, la función no realiza ninguna acción.
   */
  const handleGameIdClick = (gameId?: string) => {
    if (!gameId) return;

    const textArea = document.createElement("textarea");
    textArea.value = gameId;
    document.body.appendChild(textArea);
    textArea.select();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(gameId)
        .then(() => setIsCopied(true))
        .catch(err => console.error("Error al copiar:", err));
    } else {
      // Fallback en navegadores antiguos o sin HTTPS
      try {
        document.execCommand("copy");
        setIsCopied(true);
      } catch (err) {
        console.error("No se pudo copiar usando execCommand:", err);
      }
    }

    document.body.removeChild(textArea);
  };

  const shouldShowBoard = !loading && !gameBusy

  // Pantalla de orientación
  if (isPortrait) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br p-4">
        <div className="text-center flex flex-col items-center gap-6">
          {/* Icono de rotación animado */}
          <div className="relative w-24 h-24">
            <svg
              className="w-full h-full animate-pulse"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 2V8H20"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 18V12"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 15L12 12L15 15"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-16 h-16 animate-spin"
                style={{ animationDuration: '3s' }}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>
          </div>

          {/* Texto principal */}
          <div className="space-y-2">
            <h1 className="text-white text-2xl font-bold">
              Gira tu dispositivo
            </h1>
            <p className="text-gray-300 text-lg">
              Por favor, usa tu teléfono en modo horizontal
            </p>
          </div>

          {/* Indicador visual adicional */}
          <div className="flex items-center gap-4 text-white opacity-70">
            <div className="w-12 h-16 border-2 border-white rounded"></div>
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
            <div className="w-16 h-12 border-2 border-white rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full overflow-hidden ${gameOver ? 'pointer-events-none' : ''}`}>

      {!isPortrait && (
        <button
          onClick={toggleFullscreen}
          className="fixed top-15 left-1 z-[70] text-white px-4 py-2 rounded-lg shadow-lg transition-all flex items-center gap-2 text-sm font-semibold"
          title={isFullscreen ? "Salir de pantalla completa" : "Activar pantalla completa"}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isFullscreen ? (
              // Icono para salir de fullscreen
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
              />
            ) : (
              // Icono para entrar en fullscreen
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            )}
          </svg>
          {isFullscreen ? "Salir" : "Pantalla completa"}
        </button>
      )}

      {/* Loading State - FUERA del GameWrapper */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-full gap-4 sm:gap-6 px-4">
          <p className="text-center text-white text-base sm:text-lg md:text-xl">
            Waiting for another player...
          </p>
          <div className="flex flex-col items-center gap-3 sm:gap-4 w-full max-w-sm"
            title={`${isCopied ? 'Copied!' : 'Copy'}`}>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white font-bold break-all text-center">
              {gameId}
            </h1>
            <button
              className="cursor-pointer text-white hover:text-gray-300 transition-colors p-2 z-[55]"
              onClick={() => handleGameIdClick(gameId)}
            >
              <FontAwesomeIcon icon={faCopy} size={"lg"} />
            </button>
          </div>
        </div>
      )}

      {/* MODALES DE CONFIRMACIÓN - FUERA del GameWrapper pero dentro del juego */}
      {showDrawModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <DrawConfirmModal
            isOpen={showDrawModal}
            onAccept={() => {
              socket.emit('draw-game', { gameId: gameId });
              setShowDrawModal(false);
            }}
            onReject={() => {
              setShowDrawModal(false);
            }}
          />
        </div>
      )}

      {showBattleModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <BattleConfirmModal
            isOpen={showBattleModal}
            onAccept={() => {
              console.log("Battle confirmed");
              setShowBattleModal(false);
            }}
            onReject={() => {
              console.log("Battle rejected");
              socket.emit("end-battle", { gameId: gameId, tiles: board });
              clearDeckAndMagic();
              setShowBattleModal(false);
            }}
          />
        </div>
      )}

      {/* GAMEWRAPPER - Solo contiene el board y elementos que DEBEN escalar */}
      {shouldShowBoard && (
        <GameWrapper>
          {/* Board centrado en el espacio de 1920x1080 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Board amIP1={amIP1} />
          </div>

          {/* TurnIndicator - dentro del wrapper para que escale */}
          <div className="absolute top-8 right-12">
            <TurnIndicator />
          </div>

          {/* Botones - dentro del wrapper para que escalen */}
          <div className="absolute right-0" style={{ top: '200px' }}>
            <RequestDraw />
          </div>

          <div className="absolute right-0" style={{ top: '300px' }}>
            <SkipTurn />
          </div>

          <div className="absolute right-0" style={{ top: '50px', right: '650px' }}>
            <SurrenderButton />
          </div>
        </GameWrapper>
      )}

      {/* Game Busy - FUERA del GameWrapper */}
      {gameBusy && (
        <div className="flex items-center justify-center h-full">
          <h1 className="text-center text-white px-4 text-lg">
            Game is busy. Please try again later.
          </h1>
        </div>
      )}

      {/* TODOS LOS MODALES - FUERA del GameWrapper */}
      {gameStartModal && !gameOver && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <GameStartModal />
        </div>
      )}

      {turnModal && !gameOver && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <TurnModal />
        </div>
      )}

      {battleModal && !gameOver && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <BattleModal />
        </div>
      )}

      {battleEndModal && !gameOver && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <BattleEndModal />
        </div>
      )}

      {gameOver && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <EndGameModal amIP1={amIP1} winner={gameResult} />
        </div>
      )}
    </div>
  )
}