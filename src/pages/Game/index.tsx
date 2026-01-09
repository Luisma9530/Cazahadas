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

export default function Game() {
  const [loading, setLoading] = useState(true)
  const [gameBusy, setGameBusy] = useState(false)
  const [isCopied, setIsCopied] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  const [isMyTurn, toggleTurn, setPlayerSkippedTurn, setIsBattle, isBattle, setIsMyFirstTurnBattle, showBattleModal, setShowBattleModal, showDrawModal, setShowDrawModal, isMyFirstTurn] = useTurnStore((state) => [state.isMyTurn, state.toggleTurn, state.setPlayerSkippedTurn, state.setIsBattle, state.isBattle, state.setIsMyFirstTurnBattle, state.showBattleModal, state.setShowBattleModal, state.showDrawModal, state.setShowDrawModal, state.isMyFirstTurn]);
  const [setBoard, board, clearDeckAndMagic] = useBoardStore((state) => [state.setBoard, state.board, state.clearDeckAndMagic]);
  const [amIP1, setAmIP1, gameOver, setGameOver, setPlayerOneName, setPlayerTwoName, setPlayerDisconnected, setGameResult, gameResult] = useGameStore((state) => [state.amIP1, state.setAmIP1, state.gameOver, state.setGameOver, state.setPlayerOneName, state.setPlayerTwoName, state.setPlayerDisconnected, state.setGameResult, state.gameResult])

  const { id: gameId } = useParams<{ id: string }>()

  const [gameStartModal, toggleGameStartModal, turnModal, toggleTurnModal, battleModal, toggleBattleModal, battleEndModal, toggleBattleEndModal] = useModalStore((state) => [state.gameStartModal, state.toggleGameStartModal, state.turnModal, state.toggleTurnModal, state.battleModal, state.toggleBattleModal, state.battleEndModal, state.toggleBattleEndModal]);

  useEffect(() => {
    if (isBattle) {
      toggleBattleModal()
    } else if (!isBattle && !isMyFirstTurn) {
      toggleBattleEndModal()
    }
  }, [isBattle]);

  // Detectar orientación del dispositivo
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 768;
      const isPortraitMode = window.innerHeight > window.innerWidth;
      setIsPortrait(isMobile && isPortraitMode);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  function mirrorBoard(tiles: Tile[][]): Tile[][] {
    // Cambia filas: 0 <-> 2, mantiene columnas
    return [
      tiles[2].map((col) => ({ ...col })), // fila 0 <- antes fila 2
      tiles[1].map((col) => ({ ...col })), // fila 1 igual
      tiles[0].map((col) => ({ ...col })), // fila 2 <- antes fila 0
    ];
  }

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